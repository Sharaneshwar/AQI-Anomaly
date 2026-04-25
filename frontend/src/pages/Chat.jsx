import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  Copy,
  MessageSquarePlus,
  PanelLeft,
  Send,
  Sparkles,
  Trash2,
  User,
  Wind,
} from "lucide-react";
import { toast, Toaster } from "sonner";

import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Message from "@/components/chat/Message";

const STARTER_PROMPTS = [
  {
    title: "Which Kolkata site had the highest PM2.5 last week?",
    icon: "📈",
    desc: "Top-K query with date filter.",
  },
  {
    title: "7-day rolling PM2.5 at site_5129 in May 2022",
    icon: "📊",
    desc: "Rolling-window aggregation.",
  },
  {
    title: "Compare PM10 percentiles across all Kolkata sites in 2024",
    icon: "🧪",
    desc: "Cross-site distribution.",
  },
  {
    title: "Show me anomalous spikes in PM2.5 over the last month",
    icon: "⚠️",
    desc: "Severity-filtered events.",
  },
];

function timeGroup(iso) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d.getTime() >= today.getTime()) return "Today";
  const yesterday = today.getTime() - 86400_000;
  if (d.getTime() >= yesterday) return "Yesterday";
  if (diff < 7 * 86400) return "Last 7 days";
  if (diff < 30 * 86400) return "Last 30 days";
  return "Older";
}

const formatRelative = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};

export default function Chat() {
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [currentId, setCurrentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const esRef = useRef(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/sessions?limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Couldn't load past sessions", { description: err.message });
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    return () => esRef.current?.close();
  }, [fetchSessions]);

  const updateLastMessage = useCallback((mut) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const next = prev.slice();
      const last = { ...next[next.length - 1] };
      mut(last);
      next[next.length - 1] = last;
      return next;
    });
  }, []);

  const handleNew = useCallback(async () => {
    if (streaming) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { session_id } = await res.json();
      setCurrentId(session_id);
      setMessages([]);
      fetchSessions();
    } catch (err) {
      toast.error("Couldn't start a chat", { description: err.message });
    }
  }, [streaming, fetchSessions]);

  const handleSelect = useCallback(
    async (id) => {
      if (streaming || id === currentId) return;
      setCurrentId(id);
      setTranscriptLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/chat/sessions/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { turns } = await res.json();
        const reconstructed = [];
        for (const t of turns ?? []) {
          reconstructed.push({ role: "user", text: t.prompt });
          reconstructed.push({
            role: "assistant",
            text: t.response ?? "",
            toolEvents: (t.observations ?? [])
              .filter((o) =>
                ["tool_start", "tool_end", "table"].includes(o.kind),
              )
              .map((o) => ({ kind: o.kind, ...(o.payload ?? {}) })),
            tables: (t.observations ?? [])
              .filter((o) => o.kind === "table")
              .reduce((acc, o) => {
                const p = o.payload ?? {};
                if (p.name) {
                  acc[p.name] = {
                    rows: p.rows ?? [],
                    columns: p.columns ?? [],
                    source_tool: p.source_tool,
                  };
                }
                return acc;
              }, {}),
            status: t.status,
            error: t.error,
            latency_ms: t.latency_ms,
          });
        }
        setMessages(reconstructed);
      } catch (err) {
        toast.error("Couldn't load session", { description: err.message });
      } finally {
        setTranscriptLoading(false);
      }
    },
    [streaming, currentId],
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await fetch(`${API_BASE_URL}/chat/conversations/${id}`, {
          method: "DELETE",
        });
        if (id === currentId) {
          setCurrentId(null);
          setMessages([]);
        }
        fetchSessions();
      } catch (err) {
        toast.error("Couldn't delete session", { description: err.message });
      }
    },
    [currentId, fetchSessions],
  );

  const handleSend = useCallback(
    (text) => {
      if (streaming) return;
      const sendNow = (sid) => {
        setMessages((prev) => [
          ...prev,
          { role: "user", text },
          { role: "assistant", text: "", toolEvents: [], tables: {} },
        ]);
        setStreaming(true);

        const url =
          `${API_BASE_URL}/chat/stream?session_id=${encodeURIComponent(sid)}` +
          `&prompt=${encodeURIComponent(text)}`;
        const es = new EventSource(url);
        esRef.current = es;

        const close = () => {
          setStreaming(false);
          es.close();
          esRef.current = null;
          fetchSessions();
        };

        es.addEventListener("text_delta", (e) => {
          const data = JSON.parse(e.data);
          updateLastMessage((m) => {
            m.text = (m.text || "") + (data.content || "");
          });
        });

        const pushTool = (kind) => (e) => {
          const data = JSON.parse(e.data);
          updateLastMessage((m) => {
            m.toolEvents = [...(m.toolEvents || []), { kind, ...data }];
          });
        };
        es.addEventListener("tool_start", pushTool("tool_start"));
        es.addEventListener("tool_end", pushTool("tool_end"));

        es.addEventListener("table", (e) => {
          const data = JSON.parse(e.data);
          updateLastMessage((m) => {
            m.toolEvents = [...(m.toolEvents || []), { kind: "table", ...data }];
            m.tables = {
              ...(m.tables || {}),
              [data.name]: {
                rows: data.rows,
                columns: data.columns,
                source_tool: data.source_tool,
              },
            };
          });
        });

        es.addEventListener("run_completed", () => close());
        es.addEventListener("agent_error", (e) => {
          try {
            const { error } = JSON.parse(e.data);
            toast.error("Agent error", { description: error });
          } catch {
            toast.error("Agent error");
          }
          close();
        });
        es.onerror = () => {
          if (es.readyState === EventSource.CLOSED) return;
          toast.error("Connection lost");
          close();
        };
      };

      if (currentId) return sendNow(currentId);
      // Auto-create a session if user clicks a starter prompt before clicking "New"
      (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/chat/conversations`, {
            method: "POST",
          });
          const { session_id } = await res.json();
          setCurrentId(session_id);
          fetchSessions();
          sendNow(session_id);
        } catch (err) {
          toast.error("Couldn't start a chat", { description: err.message });
        }
      })();
    },
    [currentId, streaming, fetchSessions, updateLastMessage],
  );

  const sidebar = (
    <SidebarPanel
      sessions={sessions}
      sessionsLoading={sessionsLoading}
      currentId={currentId}
      onNew={handleNew}
      onSelect={handleSelect}
      onDelete={handleDelete}
      streaming={streaming}
    />
  );

  return (
    <div className="flex h-[calc(100vh-72px)] bg-background text-foreground">
      <Toaster theme="dark" position="top-right" richColors />

      <aside className="hidden md:flex md:w-72 lg:w-[300px] border-r border-border bg-sidebar/40 backdrop-blur">
        {sidebar}
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/60 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <PanelLeft className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="p-0 w-80 bg-sidebar border-r border-border"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Past chats</SheetTitle>
                </SheetHeader>
                {sidebar}
              </SheetContent>
            </Sheet>
            <Wind className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-base font-semibold truncate">AtmosIQ Chat</h1>
            {currentId && (
              <span className="ml-2 hidden md:inline font-mono text-[11px] text-muted-foreground">
                · {currentId.slice(0, 8)}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNew}
            disabled={streaming}
          >
            <MessageSquarePlus className="h-4 w-4" />
            New
          </Button>
        </header>

        <ChatBody
          currentId={currentId}
          messages={messages}
          streaming={streaming}
          transcriptLoading={transcriptLoading}
          onSend={handleSend}
          onNew={handleNew}
        />
      </main>
    </div>
  );
}

function SidebarPanel({
  sessions,
  sessionsLoading,
  currentId,
  onNew,
  onSelect,
  onDelete,
  streaming,
}) {
  const grouped = useMemo(() => {
    const out = {};
    for (const s of sessions) {
      const g = timeGroup(s.updated_at ?? s.created_at);
      if (!out[g]) out[g] = [];
      out[g].push(s);
    }
    const order = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Older"];
    return order.filter((k) => out[k]).map((k) => ({ key: k, items: out[k] }));
  }, [sessions]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="p-3 border-b border-border">
        <Button
          onClick={onNew}
          disabled={streaming}
          className="w-full shadow-sm"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sessionsLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-6 text-center">
              No conversations yet.
            </p>
          ) : (
            grouped.map((g) => (
              <div key={g.key} className="mb-3">
                <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
                  {g.key}
                </div>
                <div className="space-y-0.5">
                  {g.items.map((s) => (
                    <SessionItem
                      key={s.id}
                      session={s}
                      active={s.id === currentId}
                      onSelect={() => onSelect(s.id)}
                      onDelete={() => onDelete(s.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function SessionItem({ session, active, onSelect, onDelete }) {
  return (
    <div
      className={cn(
        "group relative flex items-start gap-2 rounded-md px-2.5 py-2 cursor-pointer text-sm transition-colors",
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
      )}
      onClick={onSelect}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
      )}
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium leading-tight">
          {session.title || "Untitled"}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <span>{formatRelative(session.updated_at)}</span>
          {session.message_count > 0 && (
            <>
              <span>·</span>
              <span>{session.message_count}</span>
            </>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("Delete this conversation?")) onDelete();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function ChatBody({
  currentId,
  messages,
  streaming,
  transcriptLoading,
  onSend,
  onNew,
}) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  if (transcriptLoading) {
    return (
      <div className="flex-1 p-6 space-y-4 max-w-3xl mx-auto w-full">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-2/3" />
      </div>
    );
  }

  const showWelcome = messages.length === 0;

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
          {showWelcome ? (
            <Welcome onPrompt={onSend} sessionExists={!!currentId} onNew={onNew} />
          ) : (
            messages.map((m, i) => (
              <ChatRow
                key={i}
                message={m}
                streaming={
                  streaming &&
                  m.role === "assistant" &&
                  i === messages.length - 1
                }
              />
            ))
          )}
          {streaming &&
            messages[messages.length - 1]?.role === "assistant" &&
            !messages[messages.length - 1].text && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pl-12">
                <ThinkingDots />
                thinking
              </div>
            )}
        </div>
      </div>
      <Composer onSend={onSend} disabled={streaming} />
    </>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
    </span>
  );
}

function ChatRow({ message, streaming }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className={cn("group flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar
        className={cn(
          "h-8 w-8 shrink-0 ring-1 ring-border",
          isUser
            ? "bg-primary/15"
            : "bg-gradient-to-br from-primary/30 to-primary/5",
        )}
      >
        <AvatarFallback className="bg-transparent">
          {isUser ? (
            <User className="h-4 w-4 text-primary" />
          ) : (
            <Bot className="h-4 w-4 text-primary" />
          )}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex-1 min-w-0 relative",
          isUser && "flex justify-end",
        )}
      >
        <div
          className={cn(
            "rounded-lg",
            isUser
              ? "bg-primary/15 text-foreground px-4 py-2.5 max-w-[80%]"
              : "bg-card border border-border px-4 py-3 w-full",
          )}
        >
          <Message message={message} streaming={streaming} />
        </div>
        {!isUser && message.text && (
          <div className="mt-1.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={copy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </Button>
            {message.latency_ms && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {message.latency_ms}ms
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Composer({ onSend, disabled }) {
  const [draft, setDraft] = useState("");
  const taRef = useRef(null);

  const submit = (e) => {
    e?.preventDefault?.();
    const t = draft.trim();
    if (!t || disabled) return;
    onSend(t);
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const onChange = (e) => {
    setDraft(e.target.value);
    const ta = taRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border-t border-border bg-card/50 backdrop-blur"
    >
      <div className="max-w-3xl mx-auto w-full p-3 md:p-4">
        <div className="flex gap-2 items-end rounded-xl border border-border bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all px-3 py-2">
          <Textarea
            ref={taRef}
            value={draft}
            onChange={onChange}
            rows={1}
            disabled={disabled}
            placeholder={disabled ? "streaming…" : "Message AtmosIQ Chat…"}
            className="resize-none min-h-[36px] max-h-[220px] flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 px-0 py-1.5 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={disabled || !draft.trim()}
            className="h-9 w-9 rounded-lg shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground text-center">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </form>
  );
}

function Welcome({ onPrompt, sessionExists, onNew }) {
  return (
    <div className="text-center py-10 md:py-16">
      <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-gradient-to-br from-primary/40 to-primary/5 ring-1 ring-primary/30 flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
        How can I help with your AQI data?
      </h2>
      <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
        Ask about historical readings, rolling averages, percentiles, or
        anomalies. The agent reads directly from Postgres and can call AQICN
        live or web search.
      </p>

      {!sessionExists && (
        <Button onClick={onNew} className="mt-6">
          <MessageSquarePlus className="h-4 w-4" />
          Start a new chat
        </Button>
      )}

      <div className="mt-10 grid sm:grid-cols-2 gap-3 text-left">
        {STARTER_PROMPTS.map((p) => (
          <button
            key={p.title}
            onClick={() => onPrompt(p.title)}
            className="group rounded-lg border border-border bg-card/40 p-4 hover:border-primary/40 hover:bg-card/70 transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
              <div className="min-w-0">
                <div className="font-medium text-foreground text-sm leading-snug">
                  {p.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {p.desc}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

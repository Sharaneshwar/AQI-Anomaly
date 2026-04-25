import { useEffect, useRef } from "react";
import { ChevronDown, Wrench } from "lucide-react";
import { findTokens, renderMarkdown, stripTokens } from "./chatUtils";
import ChatTable from "./ChatTable";
import ChatChart from "./ChatChart";

function ToolAccordion({ events, expanded }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.open = expanded;
  }, [expanded]);

  if (!events || events.length === 0) return null;
  const toolStarts = events.filter((e) => e.kind === "tool_start").length;

  return (
    <details
      ref={ref}
      className="group mb-3 rounded-md border border-border bg-background/60 text-xs font-mono"
    >
      <summary className="cursor-pointer px-3 py-1.5 text-muted-foreground hover:text-foreground flex items-center gap-2 select-none">
        <Wrench className="h-3.5 w-3.5" />
        tools <span className="text-muted-foreground">({toolStarts})</span>
        <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="border-t border-border px-3 py-2 space-y-1.5">
        {events.map((ev, i) => {
          if (ev.kind === "tool_start") {
            return (
              <li key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-primary">→</span>
                  <span className="text-foreground">{ev.name}</span>
                  <span className="text-muted-foreground">iter {ev.iteration}</span>
                </div>
                <pre className="ml-5 px-2 py-1 rounded bg-secondary/40 text-muted-foreground text-[11px] whitespace-pre-wrap break-words">
                  {typeof ev.args === "string" ? ev.args : JSON.stringify(ev.args)}
                </pre>
              </li>
            );
          }
          if (ev.kind === "tool_end") {
            return (
              <li key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">←</span>
                  <span className="text-foreground">{ev.name}</span>
                  <span className="text-muted-foreground">iter {ev.iteration}</span>
                </div>
                <pre className="ml-5 px-2 py-1 rounded bg-secondary/40 text-muted-foreground text-[11px] whitespace-pre-wrap break-words">
                  {ev.summary}
                </pre>
              </li>
            );
          }
          if (ev.kind === "table") {
            return (
              <li key={i} className="flex items-center gap-2">
                <span className="text-amber-400">▦</span>
                <span className="text-foreground">{ev.name}</span>
                <span className="text-muted-foreground">
                  {ev.rows?.length ?? 0} rows from {ev.source_tool}
                </span>
              </li>
            );
          }
          return null;
        })}
      </ul>
    </details>
  );
}

export default function Message({ message, streaming }) {
  if (message.role === "user") {
    return (
      <div className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
        {message.text}
      </div>
    );
  }

  const tokens = findTokens(message.text);
  const stripped = stripTokens(message.text);

  return (
    <div className="text-sm leading-relaxed">
      <ToolAccordion events={message.toolEvents} expanded={streaming} />
      {stripped && (
        <div
          className="markdown-body prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(stripped) }}
        />
      )}
      {tokens.length > 0 && (
        <div className="mt-3 space-y-3">
          {tokens.map((t, i) => {
            const td = message.tables?.[t.name];
            if (!td) {
              return (
                <div
                  key={i}
                  className="rounded-md border border-dashed border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground italic"
                >
                  (table {t.name} not found)
                </div>
              );
            }
            return (
              <div
                key={i}
                className="rounded-md border border-border bg-background/60 p-3"
              >
                <div className="font-mono text-[11px] text-muted-foreground mb-2">
                  {t.kind === "chart" ? "📈" : "▦"} {t.name}
                  {td.source_tool && (
                    <span className="ml-2 text-muted-foreground/60">
                      from {td.source_tool}
                    </span>
                  )}
                </div>
                {t.kind === "chart" ? (
                  <ChatChart rows={td.rows} columns={td.columns} />
                ) : (
                  <ChatTable rows={td.rows} columns={td.columns} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

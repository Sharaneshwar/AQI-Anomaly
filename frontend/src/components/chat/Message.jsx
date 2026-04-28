import { useMemo, useState } from "react";
import {
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Wrench,
} from "lucide-react";
import {
  findTokens,
  renderMarkdown,
  resolveChartType,
  stripTokens,
} from "./chatUtils";
import ChatTable from "./ChatTable";
import ChartDispatcher from "./charts/ChartDispatcher";

function inferPollutant(name) {
  if (!name) return null;
  if (name.includes("pm25")) return "pm25";
  if (name.includes("pm10")) return "pm10";
  return null;
}

const TYPE_LABEL = {
  line: "line", area: "area", bar: "bar", hbar: "horizontal bar",
  grouped_bar: "grouped bar", stacked_bar: "stacked bar", scatter: "scatter",
  doughnut: "doughnut", pie: "pie", histogram: "histogram", radar: "radar",
  bubble: "bubble", boxplot: "box plot", heatmap: "heatmap",
};

function formatArgs(args) {
  if (args == null) return "";
  if (typeof args === "string") return args;
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
}

// Pair tool_start / tool_end / table events into a single ordered list of
// "steps". Pairing is FIFO per tool name — when the agent calls the same
// tool twice in one iteration (e.g. get_historical_data for pm25 and pm10
// simultaneously), both tool_starts share name+iteration but each tool_end
// pops the oldest unmatched start. Without this, one step would stay
// "in-flight" forever and keep its spinner on.
function groupToolEvents(events) {
  const steps = [];
  const unmatched = new Map(); // name -> queue of step indices awaiting tool_end

  for (const ev of events || []) {
    if (ev.kind === "tool_start") {
      const step = {
        kind: "tool",
        name: ev.name,
        iteration: ev.iteration,
        args: ev.args,
        ended: false,
        summary: null,
        tables: [],
      };
      steps.push(step);
      let q = unmatched.get(ev.name);
      if (!q) {
        q = [];
        unmatched.set(ev.name, q);
      }
      q.push(steps.length - 1);
    } else if (ev.kind === "tool_end") {
      const q = unmatched.get(ev.name);
      if (q && q.length) {
        const idx = q.shift();
        steps[idx].ended = true;
        steps[idx].summary = ev.summary;
      } else {
        steps.push({
          kind: "tool",
          name: ev.name,
          iteration: ev.iteration,
          args: null,
          ended: true,
          summary: ev.summary,
          tables: [],
        });
      }
    } else if (ev.kind === "table") {
      // Attach to the most recent matching tool step (last one with this
      // source_tool wins). Cosmetic only — full data lives in message.tables.
      const last = [...steps].reverse().find(
        (s) => s.kind === "tool" && s.name === ev.source_tool,
      );
      if (last) {
        last.tables.push({ name: ev.name, rows: ev.rows?.length ?? 0 });
      } else {
        steps.push({
          kind: "table",
          name: ev.name,
          rows: ev.rows?.length ?? 0,
          source_tool: ev.source_tool,
        });
      }
    }
  }

  for (const s of steps) {
    if (s.kind === "tool" && !s.ended) s.inFlight = true;
  }
  return steps;
}

function ToolStep({ step }) {
  if (step.kind === "table") {
    return (
      <li className="flex items-center gap-2 px-3 py-1 text-[11px] font-mono">
        <span className="text-amber-400">▦</span>
        <span className="text-foreground">{step.name}</span>
        <span className="text-muted-foreground">
          {step.rows} rows from {step.source_tool}
        </span>
      </li>
    );
  }
  return (
    <li className="px-3 py-1.5">
      <div className="flex items-center gap-2 text-[12px]">
        {step.inFlight ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        )}
        <span className="font-mono text-foreground">{step.name}</span>
        <span className="font-mono text-muted-foreground text-[11px]">
          iter {step.iteration}
        </span>
        {step.tables.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {step.tables.map((t) => `${t.name} (${t.rows})`).join(", ")}
          </span>
        )}
      </div>
      {step.args != null && step.args !== "" && (
        <pre className="ml-5 mt-1 px-2 py-1 rounded bg-secondary/40 text-muted-foreground font-mono text-[11px] whitespace-pre-wrap break-words">
          {formatArgs(step.args)}
        </pre>
      )}
      {step.ended && step.summary && (
        <pre className="ml-5 mt-1 px-2 py-1 rounded bg-secondary/30 text-muted-foreground/80 font-mono text-[11px] whitespace-pre-wrap break-words">
          ↳ {step.summary}
        </pre>
      )}
    </li>
  );
}

function AgenticAccordion({ reasoning, steps, streaming, hasContent }) {
  // While streaming, force-open. After streaming the user can collapse.
  const [userOpen, setUserOpen] = useState(true);
  const open = streaming ? true : userOpen;
  if (!hasContent) return null;
  const toolCount = steps.filter((s) => s.kind === "tool").length;
  const inFlightCount = steps.filter((s) => s.kind === "tool" && s.inFlight).length;

  return (
    <div className="mb-3 rounded-md border border-border bg-background/60">
      <button
        type="button"
        onClick={() => !streaming && setUserOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground select-none"
      >
        {inFlightCount > 0 ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          <Wrench className="h-3.5 w-3.5" />
        )}
        <span>
          {streaming && inFlightCount > 0
            ? "thinking…"
            : `tools (${toolCount})`}
        </span>
        <ChevronDown
          className={
            "ml-auto h-3.5 w-3.5 transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>
      {open && (
        <div className="border-t border-border">
          {reasoning && (
            <div className="px-3 py-2 border-b border-border/50 flex gap-2">
              <Brain className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <div
                className="markdown-body prose prose-invert prose-sm max-w-none text-[13px] leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(reasoning) }}
              />
            </div>
          )}
          {steps.length > 0 && (
            <ul className="py-1 space-y-0.5">
              {steps.map((s, i) => (
                <ToolStep
                  key={`${s.kind}:${s.name}:${s.iteration ?? i}`}
                  step={s}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ChartCard({ token, tableMeta }) {
  const isChart = token.kind === "chart";
  const effectiveType = isChart ? resolveChartType(token, tableMeta) : null;
  const renderAsTable = !isChart || effectiveType === "table";
  const pollutant = inferPollutant(token.name);
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 shadow-lg shadow-black/20">
      <div className="font-mono text-[11px] text-muted-foreground mb-3 flex items-center gap-2">
        {renderAsTable ? (
          <span className="text-amber-400">▦</span>
        ) : (
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
        )}
        <span className="text-foreground">{token.name}</span>
        {!renderAsTable && (
          <span className="rounded-full border border-border bg-background/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {TYPE_LABEL[effectiveType] || effectiveType}
          </span>
        )}
        {tableMeta.source_tool && (
          <span className="ml-auto text-muted-foreground/60">
            from {tableMeta.source_tool}
          </span>
        )}
      </div>
      {renderAsTable ? (
        <ChatTable rows={tableMeta.rows} columns={tableMeta.columns} />
      ) : (
        <div style={{ height: 380 }}>
          <ChartDispatcher
            type={effectiveType}
            rows={tableMeta.rows}
            columns={tableMeta.columns}
            pollutant={pollutant}
          />
        </div>
      )}
    </div>
  );
}

function PendingChartCard({ token, streaming }) {
  // Two states: still streaming → "loading"; stream done → "not found".
  if (streaming) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/20 p-6 flex items-center gap-3 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>
          Loading {token.kind === "chart" ? "chart" : "table"}{" "}
          <span className="font-mono">{token.name}</span>…
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-dashed border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground italic">
      ({token.kind} {token.name} not found)
    </div>
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

  const tokens = useMemo(() => findTokens(message.text), [message.text]);
  const stripped = useMemo(() => stripTokens(message.text), [message.text]);
  const html = useMemo(() => renderMarkdown(stripped), [stripped]);
  const steps = useMemo(
    () => groupToolEvents(message.toolEvents),
    [message.toolEvents],
  );
  const hasAccordion =
    (message.reasoning && message.reasoning.length > 0) || steps.length > 0;

  return (
    <div className="text-sm leading-relaxed">
      <AgenticAccordion
        reasoning={message.reasoning}
        steps={steps}
        streaming={streaming}
        hasContent={hasAccordion}
      />
      {stripped && (
        <div
          className="markdown-body prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {tokens.length > 0 && (
        <div className="mt-3 space-y-4">
          {tokens.map((t, i) => {
            const td = message.tables?.[t.name];
            if (!td) {
              return (
                <PendingChartCard
                  key={`${t.name}-${i}`}
                  token={t}
                  streaming={streaming}
                />
              );
            }
            return <ChartCard key={`${t.name}-${i}`} token={t} tableMeta={td} />;
          })}
        </div>
      )}
    </div>
  );
}

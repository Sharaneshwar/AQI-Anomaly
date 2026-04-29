// CSS-only mini-map mockup used inside the AgenticAccordion ToolStep
// while find_neighbours is still in flight. Pure Tailwind, no map lib.

const SATELLITES = [
  { left: "20%", top: "30%", delay: "0ms" },
  { left: "75%", top: "20%", delay: "200ms" },
  { left: "82%", top: "65%", delay: "400ms" },
  { left: "30%", top: "75%", delay: "600ms" },
  { left: "60%", top: "85%", delay: "800ms" },
];

export default function MiniMapSonar() {
  return (
    <div className="mx-auto mt-3 mb-2 relative h-32 w-80 rounded-md border border-border bg-secondary/30 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(0deg, transparent 23px, rgba(255,255,255,0.06) 24px), linear-gradient(90deg, transparent 23px, rgba(255,255,255,0.06) 24px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 -m-5 rounded-full border-2 border-primary/70 animate-ping" />
        <span
          className="absolute inset-0 -m-9 rounded-full border-2 border-primary/40 animate-ping"
          style={{ animationDelay: "350ms" }}
        />
        <span
          className="absolute inset-0 -m-14 rounded-full border border-primary/20 animate-ping"
          style={{ animationDelay: "700ms" }}
        />
        <span className="relative block h-4 w-4 rounded-full bg-primary shadow-[0_0_18px_rgba(59,130,246,0.9)]" />
      </div>
      {SATELLITES.map((s, i) => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-full bg-primary/80 animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.6)]"
          style={{
            left: s.left,
            top: s.top,
            animationDelay: s.delay,
            animationDuration: "1.6s",
          }}
        />
      ))}
      <div className="absolute bottom-1.5 right-2 font-mono text-[10px] text-muted-foreground">
        scanning…
      </div>
    </div>
  );
}

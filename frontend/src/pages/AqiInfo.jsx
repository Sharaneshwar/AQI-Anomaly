import { Activity, AlertTriangle, Cloud, Droplets, Heart, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";

const AQI_BANDS = [
  { range: "0-50",     label: "Good",       color: "#00E400", text: "#0b1020", desc: "Air quality is satisfactory; air pollution poses little or no risk." },
  { range: "51-100",   label: "Moderate",   color: "#FFFF00", text: "#0b1020", desc: "Acceptable, but there may be some risk for unusually sensitive people." },
  { range: "101-150",  label: "USG",        color: "#FF7E00", text: "#0b1020", desc: "Unhealthy for sensitive groups (children, elderly, asthma)." },
  { range: "151-200",  label: "Unhealthy",  color: "#FF0000", text: "#FFFFFF", desc: "Everyone may experience health effects; sensitive groups feel it more." },
  { range: "201-300",  label: "Very Unhealthy", color: "#8F3F97", text: "#FFFFFF", desc: "Health alert: the risk of effects is increased for everyone." },
  { range: "301+",     label: "Hazardous",  color: "#7E0023", text: "#FFFFFF", desc: "Health warnings of emergency conditions; entire population is affected." },
];

const POLLUTANTS = [
  { icon: Wind,  name: "PM2.5", short: "Fine particulate matter, <=2.5 um",
    desc: "Tiny airborne particles from combustion (vehicles, biomass burning, industrial). Penetrates deep into the lungs and bloodstream.",
    sources: ["Vehicle exhaust", "Coal combustion", "Wood smoke", "Construction dust"] },
  { icon: Cloud, name: "PM10",  short: "Inhalable particles, <=10 um",
    desc: "Coarser particles from road dust, pollen, and fine debris. Affects the upper respiratory system primarily.",
    sources: ["Road dust", "Industrial grinding", "Crop residue burning", "Sea spray"] },
];

const HEALTH_EFFECTS = [
  { icon: Heart,         label: "Cardiovascular", desc: "Long-term exposure raises risk of heart attack and stroke." },
  { icon: Activity,      label: "Respiratory",    desc: "Triggers asthma, bronchitis, and reduces lung function." },
  { icon: AlertTriangle, label: "Sensitive groups", desc: "Children, elderly, and people with chronic conditions are most affected." },
  { icon: Droplets,      label: "Long-term",      desc: "Chronic exposure shortens life expectancy and is linked to cancer." },
];

export default function AQI_info() {
  return (
    <div className="bg-background">
      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-12 md:pt-16 pb-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Wind className="h-3.5 w-3.5" />
            Air Quality, demystified
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            What is the <span className="text-primary">Air Quality Index</span>?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            The AQI translates pollutant concentrations (PM2.5, PM10, NO2, O3,
            CO, SO2) into a single 0-500 number with a colour band that signals
            how clean - or dangerous - the air is to breathe right now.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            The AQI scale
          </h2>
          <span className="text-xs text-muted-foreground hidden md:inline">Lower is better.</span>
        </div>

        <Card className="overflow-hidden border-border bg-card/60 p-0">
          <div className="grid grid-cols-1 md:grid-cols-6">
            {AQI_BANDS.map((b) => (
              <div key={b.range}
                className="px-4 py-5 md:py-6 flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2"
                style={{ backgroundColor: b.color, color: b.text }}>
                <div className="text-xs font-mono uppercase tracking-wider opacity-80">{b.range}</div>
                <div className="text-base font-semibold">{b.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-border">
            {AQI_BANDS.map((b) => (
              <p key={b.range} className="text-xs text-muted-foreground p-4 leading-relaxed">{b.desc}</p>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
          The pollutants we track
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {POLLUTANTS.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.name} className="border-border bg-card/60 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.short}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Common sources</div>
                  <div className="flex flex-wrap gap-2">
                    {p.sources.map((s) => (
                      <span key={s} className="rounded-full border border-border bg-background/40 px-2.5 py-0.5 text-xs text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 pb-20">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">Why it matters</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HEALTH_EFFECTS.map((h) => {
            const Icon = h.icon;
            return (
              <Card key={h.label} className="border-border bg-card/60 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-foreground">{h.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import {
  Activity,
  ArrowRight,
  Brain,
  Database,
  Eye,
  Globe2,
  LineChart,
  MapPin,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const STATS = [
  { value: "26M+", label: "Readings ingested", icon: Database },
  { value: "95", label: "Stations across 5 cities", icon: MapPin },
  { value: "4", label: "Years of historical data", icon: LineChart },
  { value: "190", label: "Trained per-site models", icon: Brain },
];

const STEPS = [
  {
    icon: Database,
    title: "Ingest",
    desc: "Continuous pulls from Respirer Living Sciences land in Postgres with sub-15-min cadence per site.",
  },
  {
    icon: Brain,
    title: "Detect",
    desc: "An ensemble of statistical and ML detectors flags anomalies with severity, ensemble score, and timing.",
  },
  {
    icon: MessageCircle,
    title: "Explore",
    desc: "Ask the agent in plain English. It writes the SQL, calls live APIs, and renders charts inline.",
  },
];

function pm25Band(v) {
  if (v == null) return { color: "bg-muted text-muted-foreground", label: "—" };
  if (v <= 30) return { color: "bg-emerald-500/20 text-emerald-300", label: "Good" };
  if (v <= 60) return { color: "bg-yellow-500/20 text-yellow-300", label: "Moderate" };
  if (v <= 90) return { color: "bg-orange-500/20 text-orange-300", label: "USG" };
  if (v <= 120) return { color: "bg-rose-500/20 text-rose-300", label: "Unhealthy" };
  if (v <= 250) return { color: "bg-purple-500/20 text-purple-300", label: "Very Unhealthy" };
  return { color: "bg-red-700/30 text-red-300", label: "Hazardous" };
}

function KolkataSnapshot() {
  const [sites, setSites] = useState([]);
  const [latest, setLatest] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/aqi/sites`);
        const json = await res.json();
        if (cancelled) return;
        const ss = json.sites ?? [];
        setSites(ss);
        const results = await Promise.all(
          ss.map(async (s) => {
            try {
              const r = await fetch(
                `${API_BASE_URL}/aqi/anomalies?site_id=${s.site_id}&limit=1`,
              );
              const j = await r.json();
              return [s.site_id, j.records?.[0] ?? null];
            } catch {
              return [s.site_id, null];
            }
          }),
        );
        if (!cancelled) setLatest(Object.fromEntries(results));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const center = useMemo(() => [22.555, 88.36], []);
  const featuredSite = sites[0];
  const featuredReading = featuredSite ? latest[featuredSite.site_id] : null;
  const featuredBand = pm25Band(featuredReading?.pm25);

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Zap className="h-3.5 w-3.5" />
            Live Kolkata snapshot
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            All 5 cities ingested · per-site models scored on every tick.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Showing the Kolkata cluster live below — Delhi, Mumbai, Bengaluru
            and Hyderabad share the same pipeline.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/anomaly">
            Open anomaly view <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <Card className="border-border bg-card/60 p-0 overflow-hidden">
          <div className="h-[420px] relative">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <MapContainer
                center={center}
                zoom={11}
                className="h-full w-full"
                scrollWheelZoom={false}
                zoomControl={false}
              >
                <TileLayer
                  attribution='© OpenStreetMap'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {sites.map((s) => {
                  const reading = latest[s.site_id];
                  const band = pm25Band(reading?.pm25);
                  const colorMap = {
                    "Good": "#22c55e", "Moderate": "#eab308", "USG": "#f97316",
                    "Unhealthy": "#ef4444", "Very Unhealthy": "#a855f7",
                    "Hazardous": "#7e0023", "—": "#94a3b8",
                  };
                  const c = colorMap[band.label] ?? "#94a3b8";
                  return (
                    <CircleMarker
                      key={s.site_id}
                      center={[s.lat, s.lon]}
                      radius={11}
                      pathOptions={{
                        color: c, fillColor: c, fillOpacity: 0.55, weight: 2,
                      }}
                    />
                  );
                })}
              </MapContainer>
            )}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
              {["Good", "Moderate", "USG", "Unhealthy"].map((label) => {
                const colors = {
                  Good: "#22c55e", Moderate: "#eab308",
                  USG: "#f97316", Unhealthy: "#ef4444",
                };
                return (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur border border-border px-2 py-0.5 text-[11px] text-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: colors[label] }} />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card/60 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Latest readings</h3>
          </div>
          {loading ? (
            <div className="space-y-2 mt-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : featuredReading ? (
            <>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mt-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Featured · {featuredSite?.name}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-foreground">
                    {featuredReading.pm25 ?? "—"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    µg/m³ PM2.5
                  </span>
                  <Badge className={cn("ml-auto", featuredBand.color, "border-0")}>
                    {featuredBand.label}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-2 font-mono">
                  {new Date(featuredReading.timestamp).toLocaleString("en-IN", {
                    hour: "2-digit", minute: "2-digit", day: "numeric", month: "short"
                  })}
                </div>
              </div>
              <div className="mt-3 space-y-1 max-h-[260px] overflow-y-auto pr-1">
                {sites.slice(1).map((s) => {
                  const r = latest[s.site_id];
                  const b = pm25Band(r?.pm25);
                  return (
                    <div key={s.site_id} className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2.5 py-2 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate text-muted-foreground">{s.name?.split(",")[0]}</span>
                      <span className="ml-auto font-mono text-foreground">{r?.pm25 ?? "—"}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", b.color)}>
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No reading data yet.
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

function CityCard({ city, active, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative w-full rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary/50 bg-primary/10"
          : "border-border bg-card/40 hover:border-primary/30 hover:bg-card/70",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">{city.city}</span>
        <Globe2
          className={cn(
            "h-4 w-4 transition-colors",
            active ? "text-primary" : "text-muted-foreground group-hover:text-primary/80",
          )}
        />
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground">
        {city.sites_count} monitoring stations
      </div>
    </button>
  );
}

function SiteRow({ site }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5 hover:bg-card/40 transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
        <MapPin className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-sm text-foreground">
          {site.name}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {site.site_id} · {site.lat?.toFixed(3)}, {site.lon?.toFixed(3)}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/cities`);
        const json = await res.json();
        const cs = json.cities ?? [];
        setCities(cs);
        setSelectedCity(cs[0]?.city ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedCity) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/sites?city=${encodeURIComponent(selectedCity)}`,
        );
        const json = await res.json();
        setSites(json.sites ?? []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [selectedCity]);

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => b.sites_count - a.sites_count),
    [cities],
  );

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 500px at 80% -20%, oklch(0.71 0.16 165 / 0.18), transparent 60%), radial-gradient(700px 400px at 0% 0%, oklch(0.55 0.20 240 / 0.16), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-16 md:pt-24 pb-20 md:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Live anomaly detection + natural-language query engine
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-foreground">
              Air quality, <span className="text-primary">explained</span>{" "}
              <span className="bg-linear-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
                in your words
              </span>
              .
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              AtmosIQ is an intelligent air-quality platform across Delhi,
              Mumbai, Bengaluru, Hyderabad and Kolkata: ingest every 15 minutes,
              detect anomalies with a per-site ML ensemble, and explore four
              years of pollution data through a conversational analyst.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/chat">
                  <MessageCircle className="h-4 w-4" />
                  Talk to the analyst
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/anomaly">
                  <Eye className="h-4 w-4" />
                  See live anomalies
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats band */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <Card
                  key={s.label}
                  className="bg-card/60 backdrop-blur border-border p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                        {s.value}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {s.label}
                      </div>
                    </div>
                    <Icon className="h-5 w-5 text-primary/80" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Kolkata Live Snapshot */}
      <KolkataSnapshot />

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            From sensor to insight in one continuous loop.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every step lives in a single place: a Postgres database, an ensemble
            anomaly detector, and a conversational agent that already knows your
            schema.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.title}
                className="bg-card/60 border-border p-6 relative overflow-hidden"
              >
                <div className="absolute right-4 top-4 text-xs font-mono text-muted-foreground/50">
                  0{i + 1}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Live cities + sites */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Live coverage across{" "}
              <span className="text-primary">{cities.length || "—"}</span>{" "}
              Indian cities.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Each station reports PM2.5 + PM10 every 15 minutes. Pick a city to
              see its monitoring footprint.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/raw-data">
              View full dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid lg:grid-cols-[280px_1fr] gap-4">
          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              sortedCities.map((c) => (
                <CityCard
                  key={c.city}
                  city={c}
                  active={c.city === selectedCity}
                  onSelect={() => setSelectedCity(c.city)}
                />
              ))
            )}
          </div>

          <Card className="bg-card/60 border-border p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold text-foreground">
                {selectedCity || "—"}
              </h3>
              <span className="text-xs text-muted-foreground">
                {sites.length} stations
              </span>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-2 max-h-[440px] overflow-y-auto pr-1">
              {sites.length === 0 && !loading ? (
                <div className="col-span-full text-sm text-muted-foreground italic">
                  No sites loaded.
                </div>
              ) : (
                sites.map((s) => <SiteRow key={s.site_id} site={s} />)
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-20">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/10 p-8 md:p-12">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
              Ready to dig into the data?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Open the chat and ask anything — from rolling averages to
              site-level anomaly summaries. The agent reads from the same
              Postgres your pipeline writes to.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/chat">
                  <MessageCircle className="h-4 w-4" />
                  Start a conversation
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/aqi-info">Learn about AQI</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

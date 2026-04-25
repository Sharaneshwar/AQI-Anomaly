import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast, Toaster } from "sonner";

import { API_BASE_URL } from "@/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const SEVERITY_COLOR = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#facc15",
  low: "#a3e635",
  normal: "#22c55e",
  unknown: "#94a3b8",
};

const RANGE_OPTIONS = [
  { id: "24h", label: "Last 24h", limit: 96 },
  { id: "7d", label: "Last 7 days", limit: 672 },
  { id: "30d", label: "Last 30 days", limit: 2880 },
  { id: "all", label: "All recent", limit: 10000 },
];

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

function StatCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <Card className="border-border bg-card/60 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-1.5 text-2xl font-semibold text-foreground">
            {value}
          </div>
          {hint && (
            <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            accent ?? "bg-primary/15 text-primary ring-1 ring-primary/30",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card/95 backdrop-blur p-3 text-xs shadow-lg">
      <div className="font-mono text-muted-foreground mb-1.5">
        {formatTime(d.timestamp)}
      </div>
      {d.pm25 != null && (
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          PM2.5: <span className="text-foreground font-medium">{d.pm25}</span>
          {d.pm25Severity && d.pm25Severity !== "normal" && (
            <Badge variant="outline" className="ml-1 text-[10px] uppercase">
              {d.pm25Severity}
            </Badge>
          )}
        </div>
      )}
      {d.pm10 != null && (
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
          PM10: <span className="text-foreground font-medium">{d.pm10}</span>
          {d.pm10Severity && d.pm10Severity !== "normal" && (
            <Badge variant="outline" className="ml-1 text-[10px] uppercase">
              {d.pm10Severity}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default function Anomaly() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState(null);
  const [range, setRange] = useState("7d");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Kolkata sites
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/aqi/sites`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setSites(json.sites ?? []);
        setSiteId(json.sites?.[0]?.site_id ?? null);
      } catch (err) {
        toast.error("Couldn't load sites", { description: err.message });
      }
    })();
  }, []);

  const fetchAnomalies = useMemo(
    () => async (sid, rg) => {
      if (!sid) return;
      setLoading(true);
      try {
        const opt = RANGE_OPTIONS.find((r) => r.id === rg) ?? RANGE_OPTIONS[1];
        const res = await fetch(
          `${API_BASE_URL}/aqi/anomalies?site_id=${sid}&limit=${opt.limit}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.records ?? []);
      } catch (err) {
        toast.error("Couldn't load anomalies", { description: err.message });
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (siteId) fetchAnomalies(siteId, range);
  }, [siteId, range, fetchAnomalies]);

  const series = useMemo(() => {
    return (data ?? []).map((r) => ({
      timestamp: r.timestamp,
      ts: new Date(r.timestamp).getTime(),
      pm25: r.pm25 ?? null,
      pm10: r.pm10 ?? null,
      pm25Anomaly: r.pm25Anomaly === true,
      pm10Anomaly: r.pm10Anomaly === true,
      pm25Severity: r.pm25Severity ?? "normal",
      pm10Severity: r.pm10Severity ?? "normal",
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (!series.length) return null;
    const pm25 = series.filter((r) => r.pm25 != null);
    const pm10 = series.filter((r) => r.pm10 != null);
    const pm25Anom = pm25.filter((r) => r.pm25Anomaly).length;
    const pm10Anom = pm10.filter((r) => r.pm10Anomaly).length;
    const avg = (xs) =>
      xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "—";
    const max = (xs) => (xs.length ? Math.max(...xs).toFixed(0) : "—");
    return {
      total: series.length,
      pm25Anom,
      pm10Anom,
      avgPM25: avg(pm25.map((r) => r.pm25)),
      avgPM10: avg(pm10.map((r) => r.pm10)),
      maxPM25: max(pm25.map((r) => r.pm25)),
      maxPM10: max(pm10.map((r) => r.pm10)),
      anomalyRate: pm25.length
        ? `${((pm25Anom / pm25.length) * 100).toFixed(1)}%`
        : "—",
    };
  }, [series]);

  const pm25AnomalyPoints = useMemo(
    () =>
      series
        .filter((r) => r.pm25Anomaly && r.pm25 != null)
        .map((r) => ({ ts: r.ts, value: r.pm25 })),
    [series],
  );
  const pm10AnomalyPoints = useMemo(
    () =>
      series
        .filter((r) => r.pm10Anomaly && r.pm10 != null)
        .map((r) => ({ ts: r.ts, value: r.pm10 })),
    [series],
  );

  const anomalyEvents = useMemo(() => {
    const evs = [];
    for (const r of series) {
      if (r.pm25Anomaly) {
        evs.push({
          ts: r.timestamp,
          pollutant: "PM2.5",
          value: r.pm25,
          severity: r.pm25Severity,
        });
      }
      if (r.pm10Anomaly) {
        evs.push({
          ts: r.timestamp,
          pollutant: "PM10",
          value: r.pm10,
          severity: r.pm10Severity,
        });
      }
    }
    return evs.sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 50);
  }, [series]);

  const currentSite = sites.find((s) => s.site_id === siteId);

  return (
    <div className="bg-background">
      <Toaster theme="dark" position="top-right" richColors />

      {/* Page header */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-10 md:pt-14 pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Live anomaly view · Kolkata
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Anomaly explorer
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Pick a Kolkata site to see PM2.5 and PM10 readings with the
              detector's severity overlay. Anomalous samples are marked on the
              series and listed below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={siteId ?? ""} onValueChange={setSiteId}>
              <SelectTrigger className="w-[260px] bg-card/60 border-border">
                <SelectValue placeholder="Pick a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.site_id} value={s.site_id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchAnomalies(siteId, range)}
              disabled={loading || !siteId}
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <StatCard
                icon={Activity}
                label="Samples"
                value={stats?.total ?? "—"}
                hint={currentSite?.name ?? ""}
              />
              <StatCard
                icon={AlertTriangle}
                label="Anomaly rate"
                value={stats?.anomalyRate ?? "—"}
                hint={`${stats?.pm25Anom ?? 0} PM2.5 · ${stats?.pm10Anom ?? 0} PM10`}
                accent="bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
              />
              <StatCard
                icon={ArrowUpRight}
                label="PM2.5 peak / avg"
                value={`${stats?.maxPM25 ?? "—"} / ${stats?.avgPM25 ?? "—"}`}
                hint="µg/m³"
              />
              <StatCard
                icon={ArrowUpRight}
                label="PM10 peak / avg"
                value={`${stats?.maxPM10 ?? "—"} / ${stats?.avgPM10 ?? "—"}`}
                hint="µg/m³"
              />
            </>
          )}
        </div>
      </section>

      {/* Range tabs + chart */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-12">
        <Card className="border-border bg-card/60 p-4 md:p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Time series with anomaly markers
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Solid lines are raw measurements. Dots are flagged anomalies.
              </p>
            </div>
            <Tabs value={range} onValueChange={setRange}>
              <TabsList className="bg-background/40">
                {RANGE_OPTIONS.map((r) => (
                  <TabsTrigger key={r.id} value={r.id}>
                    {r.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="h-[420px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : series.length === 0 ? (
              <EmptySeries />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={series}
                  margin={{ top: 5, right: 12, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="g25" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g10" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(t) => formatTime(new Date(t).toISOString())}
                    stroke="#94a3b8"
                    fontSize={11}
                    minTickGap={70}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pm25"
                    stroke="#34d399"
                    strokeWidth={1.6}
                    dot={false}
                    name="PM2.5"
                  />
                  <Line
                    type="monotone"
                    dataKey="pm10"
                    stroke="#60a5fa"
                    strokeWidth={1.6}
                    dot={false}
                    name="PM10"
                  />
                  <Scatter
                    data={pm25AnomalyPoints}
                    dataKey="value"
                    fill="#fb7185"
                    name="PM2.5 anomalies"
                  />
                  <Scatter
                    data={pm10AnomalyPoints}
                    dataKey="value"
                    fill="#f97316"
                    name="PM10 anomalies"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </section>

      {/* Recent anomalies table */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-20">
        <Card className="border-border bg-card/60 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Recent anomaly events
            </h2>
            <span className="text-xs text-muted-foreground">
              {anomalyEvents.length} of latest 50
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : anomalyEvents.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              No anomalies detected in this range — all readings within
              expected range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium py-2">Time</th>
                    <th className="text-left font-medium py-2">Pollutant</th>
                    <th className="text-left font-medium py-2">Value</th>
                    <th className="text-left font-medium py-2">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {anomalyEvents.map((ev, i) => (
                    <tr key={i} className="hover:bg-card/40">
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">
                        {formatTime(ev.ts)}
                      </td>
                      <td className="py-2.5">
                        <Badge variant="outline" className="font-mono">
                          {ev.pollutant}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-foreground font-medium">
                        {ev.value} µg/m³
                      </td>
                      <td className="py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor:
                              (SEVERITY_COLOR[ev.severity] ?? "#94a3b8") + "26",
                            color: SEVERITY_COLOR[ev.severity] ?? "#94a3b8",
                          }}
                        >
                          {ev.severity ?? "unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function EmptySeries() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No data for this range. Try a wider window.
    </div>
  );
}

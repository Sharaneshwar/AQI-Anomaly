import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Navigation,
  TriangleAlert,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { API_BASE_URL } from "@/config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Fitter({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds?.isValid?.()) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch {
        /* noop */
      }
    }
  }, [map, bounds]);
  return null;
}

export default function SitePage() {
  const { siteId } = useParams();
  const [meta, setMeta] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);
  const [historyMissing, setHistoryMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMeta(null);
    setHistory(null);
    setError(null);
    setHistoryMissing(false);

    (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/aqi/site/${siteId}`);
        if (!r.ok) throw new Error(`site ${r.status}`);
        const data = await r.json();
        if (!cancelled) setMeta(data);
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      }
    })();

    (async () => {
      try {
        const r = await fetch(
          `${API_BASE_URL}/aqi/history?site_id=${siteId}&pollutant=both&limit=2000`,
        );
        if (r.status === 404) {
          if (!cancelled) setHistoryMissing(true);
          return;
        }
        if (!r.ok) throw new Error(`history ${r.status}`);
        const data = await r.json();
        if (!cancelled) setHistory(data);
      } catch {
        if (!cancelled) setHistoryMissing(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  const bounds = useMemo(() => {
    if (!meta) return null;
    const points = [[meta.lat, meta.lon]];
    for (const n of meta.neighbours || []) points.push([n.lat, n.lon]);
    return L.latLngBounds(points);
  }, [meta]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-2 text-destructive">
          <TriangleAlert className="h-5 w-5" />
          <span>Couldn't load site: {error}</span>
        </div>
        <Link to="/chat" className="text-primary underline mt-3 inline-block">
          ← Back to chat
        </Link>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        loading site…
      </div>
    );
  }

  const series = history?.records || [];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/chat" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            back
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {meta.site_id}
            <span>·</span>
            <span>{meta.city || "—"}</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground truncate">
            {meta.name}
          </h1>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            {meta.lat.toFixed(4)}, {meta.lon.toFixed(4)}
          </div>
        </div>
      </div>

      <Card className="bg-card/40 border-border overflow-hidden">
        <MapContainer
          bounds={bounds}
          scrollWheelZoom={false}
          style={{ height: 320, width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OSM &copy; CARTO'
            subdomains="abcd"
          />
          <CircleMarker
            center={[meta.lat, meta.lon]}
            radius={9}
            pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 1, weight: 2 }}
          >
            <Popup>
              <div className="text-xs font-semibold">{meta.name}</div>
            </Popup>
          </CircleMarker>
          {(meta.neighbours || []).map((n) => (
            <CircleMarker
              key={n.site_id}
              center={[n.lat, n.lon]}
              radius={6}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.85,
                weight: 1,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-semibold">{n.name}</div>
                  <div className="text-muted-foreground">
                    {n.distance_km} km · {n.city}
                  </div>
                  <Link
                    to={`/sites/${n.site_id}`}
                    className="text-primary underline"
                  >
                    Open site →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          <Fitter bounds={bounds} />
        </MapContainer>
      </Card>

      {meta.neighbours?.length > 0 && (
        <Card className="bg-card/40 border-border p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
            <Navigation className="h-3.5 w-3.5 text-primary" />
            nearest sites
          </div>
          <div className="flex flex-wrap gap-2">
            {meta.neighbours.map((n) => (
              <Link
                key={n.site_id}
                to={`/sites/${n.site_id}`}
                className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs hover:border-primary hover:text-primary transition-colors"
              >
                {n.name}{" "}
                <span className="text-muted-foreground">
                  · {n.distance_km} km
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card className="bg-card/40 border-border p-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
          recent readings
        </div>
        {historyMissing ? (
          <div className="text-xs text-muted-foreground italic">
            recent data is only cached for Kolkata sites in this build.
          </div>
        ) : !history ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            loading…
          </div>
        ) : series.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">no readings.</div>
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => v.slice(5, 16).replace("T", " ")}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pm25"
                  stroke="#f97316"
                  dot={false}
                  strokeWidth={1.5}
                  name="PM2.5"
                />
                <Line
                  type="monotone"
                  dataKey="pm10"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={1.5}
                  name="PM10"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Database,
  Factory,
  Flame,
  Gauge,
  Map as MapIcon,
  RefreshCw,
} from "lucide-react";
import { Toaster, toast } from "sonner";

import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapFitter({ bounds, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (bounds?.isValid?.()) {
      try {
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch (e) {
        // ignore
      }
    } else if (center) {
      map.setView(center, zoom || 12);
    }
  }, [map, bounds, center, zoom]);
  return null;
}

function StatRow({ icon: Icon, label, value, hint, accent }) {
  return (
    <Card className="border-border bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-xl font-semibold text-foreground">
            {value}
          </div>
          {hint && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {hint}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            accent ?? "bg-primary/15 text-primary ring-1 ring-primary/30",
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("map");
  const [citiesData, setCitiesData] = useState(null);
  const [sitesData, setSitesData] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(false);

  const [useRealData, setUseRealData] = useState(false);
  const [startDate, setStartDate] = useState("2024-03-10T00:00");
  const [endDate, setEndDate] = useState("2024-03-15T23:59");
  const mapRef = useRef();

  // Cities once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cities`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setCitiesData(json);
        setSelectedCity((prev) => prev ?? json?.cities?.[0]?.city ?? null);
      } catch (err) {
        toast.error("Couldn't load cities", { description: err.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchSites = async () => {
    if (!selectedCity) return;
    setSitesLoading(true);
    try {
      let url;
      if (useRealData) {
        url = `${API_BASE_URL}/city-data?city=${encodeURIComponent(
          selectedCity,
        )}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(
          endDate,
        )}`;
      } else {
        url = `${API_BASE_URL}/sites?city=${encodeURIComponent(selectedCity)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (useRealData) {
        setSitesData({
          city: json.city,
          sites:
            json.sites_included?.map((siteName) => ({
              name: siteName,
              pm2_5:
                json.pm25_aggregated?.length > 0
                  ? json.pm25_aggregated[json.pm25_aggregated.length - 1]?.mean
                  : null,
              pm10:
                json.pm10_aggregated?.length > 0
                  ? json.pm10_aggregated[json.pm10_aggregated.length - 1]?.mean
                  : null,
            })) || [],
        });
      } else {
        setSitesData(json);
      }
    } catch (err) {
      toast.error("Couldn't load sites", { description: err.message });
    } finally {
      setSitesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCity) fetchSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, useRealData]);

  const allSites = useMemo(() => {
    const arr = [];
    if (citiesData?.cities) {
      for (const c of citiesData.cities) {
        for (const s of c.sites || []) {
          arr.push({
            city: c.city,
            ...s,
            lat: s.coordinates?.lat ?? s.lat,
            lon: s.coordinates?.lon ?? s.lon,
          });
        }
      }
    }
    return arr;
  }, [citiesData]);

  const mapBounds = useMemo(() => {
    if (!allSites.length) return null;
    return L.latLngBounds(allSites.map((s) => [s.lat || 0, s.lon || 0]));
  }, [allSites]);

  const cityCentroids = useMemo(() => {
    if (!citiesData?.cities) return [];
    return citiesData.cities.map((c) => {
      const pts = (c.sites || []).map((s) => [
        s.coordinates?.lat ?? s.lat,
        s.coordinates?.lon ?? s.lon,
      ]);
      let lat = 0;
      let lon = 0;
      if (pts.length) {
        pts.forEach((p) => {
          lat += p[0];
          lon += p[1];
        });
        lat /= pts.length;
        lon /= pts.length;
      }
      return {
        city: c.city,
        lat,
        lon,
        sites_count: c.sites_count ?? c.sites?.length ?? 0,
      };
    });
  }, [citiesData]);

  const focusOnCity = (cityName) => {
    setSelectedCity(cityName);
    const c = cityCentroids.find((x) => x.city === cityName);
    if (!c?.lat || !c.lon) return;
    if (mapRef.current?.flyTo) {
      mapRef.current.flyTo([c.lat, c.lon], 12, { duration: 0.8 });
    }
  };

  const chartData = useMemo(() => {
    if (!sitesData?.sites) return [];
    return sitesData.sites.map((s) => ({
      name: s.name?.split(",")[0] ?? s.name,
      pm2_5: s.pm2_5 ?? s.pm25 ?? null,
      pm10: s.pm10 ?? null,
    }));
  }, [sitesData]);

  const averages = useMemo(() => {
    if (!sitesData?.sites?.length) return { pm2_5: null, pm10: null };
    let sum25 = 0;
    let sum10 = 0;
    let count = 0;
    sitesData.sites.forEach((s) => {
      if (typeof (s.pm2_5 ?? s.pm25) === "number") sum25 += s.pm2_5 ?? s.pm25;
      if (typeof s.pm10 === "number") sum10 += s.pm10;
      count++;
    });
    return {
      pm2_5: count ? +(sum25 / count).toFixed(1) : null,
      pm10: count ? +(sum10 / count).toFixed(1) : null,
    };
  }, [sitesData]);

  const totalSites = citiesData?.total_sites ?? 0;
  const totalCities = citiesData?.total_cities ?? citiesData?.cities?.length ?? 0;

  return (
    <div className="bg-background">
      <Toaster theme="dark" position="top-right" richColors />

      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-10 md:pt-14 pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
              <Gauge className="h-3.5 w-3.5" />
              Operational dashboard
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Raw data dashboard
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Monitor coverage across cities, drill into individual sites, and
              compare snapshot vs live data from the Respirer API.
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-card/60 border border-border">
              <TabsTrigger value="map">
                <MapIcon className="h-4 w-4" />
                Map
              </TabsTrigger>
              <TabsTrigger value="sites">
                <Factory className="h-4 w-4" />
                Sites
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Quick stats */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatRow
            icon={MapIcon}
            label="Cities tracked"
            value={loading ? "…" : totalCities}
          />
          <StatRow
            icon={Factory}
            label="Total sites"
            value={loading ? "…" : totalSites}
          />
          <StatRow
            icon={Flame}
            label={`${selectedCity ?? "—"} · avg PM2.5`}
            value={averages.pm2_5 ?? "—"}
            hint="µg/m³"
            accent="bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
          />
          <StatRow
            icon={Database}
            label={`${selectedCity ?? "—"} · avg PM10`}
            value={averages.pm10 ?? "—"}
            hint="µg/m³"
            accent="bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30"
          />
        </div>
      </section>

      {/* Filters bar */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-2">
        <Card className="border-border bg-card/60 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedCity ?? ""}
              onValueChange={(v) => focusOnCity(v)}
            >
              <SelectTrigger className="w-[200px] bg-background border-border">
                <SelectValue placeholder="Pick a city" />
              </SelectTrigger>
              <SelectContent>
                {cityCentroids.map((c) => (
                  <SelectItem key={c.city} value={c.city}>
                    {c.city} · {c.sites_count} sites
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRealData}
                  onChange={(e) => setUseRealData(e.target.checked)}
                  className="accent-primary"
                />
                Use live Respirer data
              </label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!useRealData}
                className="w-[200px] bg-background border-border"
              />
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!useRealData}
                className="w-[200px] bg-background border-border"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={fetchSites}
                disabled={sitesLoading}
                title="Refresh"
              >
                <RefreshCw
                  className={cn("h-4 w-4", sitesLoading && "animate-spin")}
                />
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-6 pb-20">
        {tab === "map" ? (
          <Card className="border-border bg-card/60 p-0 overflow-hidden">
            <div className="h-[560px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <MapContainer
                  bounds={mapBounds || undefined}
                  zoom={5}
                  center={[20.5937, 78.9629]}
                  className="h-full w-full"
                  whenCreated={(map) => (mapRef.current = map)}
                  scrollWheelZoom
                >
                  <MapFitter bounds={mapBounds} />
                  <TileLayer
                    attribution='© OpenStreetMap contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  {cityCentroids.map(
                    (c) =>
                      c.lat &&
                      c.lon && (
                        <CircleMarker
                          key={c.city}
                          center={[c.lat, c.lon]}
                          radius={Math.max(8, Math.min(22, c.sites_count))}
                          pathOptions={{
                            color: "#01C38D",
                            fillColor: "#01C38D",
                            fillOpacity: 0.25,
                            weight: 2,
                          }}
                          eventHandlers={{
                            click: () => focusOnCity(c.city),
                          }}
                        >
                          <Popup>
                            <strong>{c.city}</strong>
                            <br />
                            {c.sites_count} sites
                          </Popup>
                        </CircleMarker>
                      ),
                  )}
                  {allSites.map(
                    (s) =>
                      s.lat &&
                      s.lon && (
                        <Marker
                          key={s.site_id ?? `${s.city}-${s.name}`}
                          position={[s.lat, s.lon]}
                        >
                          <Popup>
                            <strong>{s.name}</strong>
                            <br />
                            {s.city}
                          </Popup>
                        </Marker>
                      ),
                  )}
                </MapContainer>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-[2fr_3fr] gap-4">
            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">
                  Sites in {selectedCity ?? "—"}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {sitesData?.sites?.length ?? 0} stations
                </span>
              </div>
              {sitesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto pr-1 space-y-1.5">
                  {(sitesData?.sites ?? []).map((s) => (
                    <div
                      key={s.site_id ?? s.name}
                      className="rounded-md border border-border bg-background/40 p-3 hover:bg-card/40 transition-colors"
                    >
                      <div className="text-sm font-medium text-foreground truncate">
                        {s.name}
                      </div>
                      <div className="mt-1.5 flex gap-3 text-xs">
                        <span className="text-emerald-400">
                          PM2.5: {s.pm2_5 ?? s.pm25 ?? "—"}
                        </span>
                        <span className="text-blue-400">
                          PM10: {s.pm10 ?? "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <h3 className="font-semibold text-foreground mb-3">
                PM2.5 vs PM10 by station
              </h3>
              <div className="h-[500px]">
                {sitesLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : chartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No site data.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 12, left: -12, bottom: 60 }}
                    >
                      <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={10}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#132D46",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                      <Bar dataKey="pm2_5" fill="#34d399" name="PM2.5" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="pm10" fill="#60a5fa" name="PM10" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { MapPin } from "lucide-react";

import { getAllSites } from "@/lib/sites";

function Fitter({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds?.isValid?.()) {
      try {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
      } catch {
        /* noop */
      }
    }
  }, [map, bounds]);
  return null;
}

const COLOR_BY_CITY = {
  Delhi: "#f97316",
  Mumbai: "#06b6d4",
  Bengaluru: "#22c55e",
  Hyderabad: "#a855f7",
  Kolkata: "#eab308",
};

export default function ChatMap({ siteIds }) {
  const [allSites, setAllSites] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getAllSites()
      .then((rows) => {
        if (!cancelled) setAllSites(rows);
      })
      .catch(() => {
        if (!cancelled) setAllSites([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolved = useMemo(() => {
    if (!allSites) return [];
    const byId = new Map(allSites.map((r) => [r.id, r]));
    const out = [];
    for (const id of siteIds) {
      const r = byId.get(id);
      if (r && typeof r.lat === "number" && typeof r.lon === "number") {
        out.push(r);
      }
    }
    return out;
  }, [allSites, siteIds]);

  const bounds = useMemo(() => {
    if (!resolved.length) return null;
    return L.latLngBounds(resolved.map((r) => [r.lat, r.lon]));
  }, [resolved]);

  if (!siteIds || !siteIds.length) return null;

  if (!resolved.length) {
    // sites.json hasn't loaded yet OR none of the IDs match
    if (allSites === null) {
      return (
        <div className="mt-4 h-40 rounded-xl border border-border bg-card/40 flex items-center justify-center text-xs text-muted-foreground">
          loading map…
        </div>
      );
    }
    return null;
  }

  const center =
    resolved.length === 1 ? [resolved[0].lat, resolved[0].lon] : undefined;

  return (
    <div className="mt-4 rounded-xl border border-border bg-card/40 overflow-hidden shadow-lg shadow-black/20">
      <div className="font-mono text-[11px] text-muted-foreground px-3 py-2 flex items-center gap-2 border-b border-border">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span className="text-foreground">map</span>
        <span>· {resolved.length} site{resolved.length === 1 ? "" : "s"}</span>
        <span className="ml-auto text-muted-foreground/60">
          click a pin to open
        </span>
      </div>
      <MapContainer
        bounds={bounds}
        center={center}
        zoom={center ? 12 : undefined}
        scrollWheelZoom={false}
        style={{ height: 320, width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        {resolved.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lon]}
            radius={7}
            pathOptions={{
              color: COLOR_BY_CITY[s.city] || "#3b82f6",
              fillColor: COLOR_BY_CITY[s.city] || "#3b82f6",
              fillOpacity: 0.85,
              weight: 2,
            }}
            eventHandlers={{
              click: () => navigate(`/sites/${s.id}`),
            }}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-muted-foreground">
                  {s.city} · {s.id}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/sites/${s.id}`)}
                  className="text-primary underline mt-1"
                >
                  Open site →
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        <Fitter bounds={bounds} />
      </MapContainer>
    </div>
  );
}

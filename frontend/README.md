# AtmosIQ Frontend

React + Vite SPA. Deployed on Vercel at **`https://atmos-iq.vercel.app`**.
Calls the FastAPI backend at **`https://aqi-anomaly.onrender.com`**.

## Local development

```bash
cd AQI-Anomaly/frontend
npm install
npm run dev                 # http://localhost:5173 → connects to http://localhost:8000
```

No env file needed for local dev — `src/config.js` defaults to
`http://localhost:8000`.

## Routes

| Path | Component | Backend it hits |
|---|---|---|
| `/`            | `Home`      | `/api/cities`, `/api/sites`, `/api/aqi/sites`, `/api/aqi/anomalies` (live Kolkata snapshot) |
| `/raw-data`    | `Dashboard` | `/api/cities`, `/api/sites`, `/api/city-data` (Respirer proxy) |
| `/anomaly`     | `Anomaly`   | `/api/aqi/sites`, `/api/aqi/anomalies` (Postgres-backed) |
| `/aqi-info`    | `AqiInfo`   | static AQI reference |
| `/chat`        | `Chat`      | `/api/chat/{conversations,sessions,stream}` (SSE) |

## Stack

- **React 19 + Vite 7 + Tailwind v4** with CSS variables.
- **shadcn/ui** components under `src/components/ui/` (Button, Card, Input,
  Textarea, Select, Tabs, Badge, ScrollArea, Avatar, Skeleton, Tooltip, Sheet,
  DropdownMenu, Sonner toasts).
- **Lucide React** icons, **Recharts** for time-series, **Leaflet** + dark
  CartoCDN tiles for the map. **Chart.js** is used by the in-chat
  `[[CHART:name]]` renderer.
- Theme tokens live in `src/index.css` (oklch values tinted to AtmosIQ palette
  `#191E29` / `#132D46` / `#01C38D`). Always-dark — no light-mode toggle.

## Configuration

`src/config.js` reads `VITE_BACKEND_URL` and exports `API_BASE_URL`. If unset,
falls back to `http://localhost:8000` for local dev.

Set on Vercel:
- Project settings → Environment Variables → `VITE_BACKEND_URL` =
  `https://aqi-anomaly.onrender.com` (production).
- Add for preview environments too if you want preview URLs to hit prod (or a
  staging backend).

## Deployment (Vercel)

Connected to the `AQI-Anomaly` GitHub repo with `frontend` as the root
directory. Push to `main` → Vercel auto-deploys. Preview URLs follow the
`atmos-iq-*.vercel.app` pattern; backend CORS already whitelists those.

## Chat page

ChatGPT/Claude-style layout with a left sidebar listing past sessions
(grouped by Today / Yesterday / Last 7 days / Last 30 days / Older), a main
message pane with an animated thinking indicator and copy-on-hover, and an
auto-resize composer.

| File | Purpose |
|---|---|
| `src/pages/Chat.jsx` | sidebar + welcome + composer + SSE wiring |
| `src/components/chat/Message.jsx` | bubble body + tool accordion + token embed |
| `src/components/chat/ChatTable.jsx` | renders `[[TABLE:name]]` tokens |
| `src/components/chat/ChatChart.jsx` | renders `[[CHART:name]]` tokens via Chart.js |
| `src/components/chat/chatUtils.js` | markdown rendering + token parsing |

Hits these backend endpoints:
- `POST /api/chat/conversations` — create a fresh session
- `GET /api/chat/sessions` — sidebar list
- `GET /api/chat/sessions/{id}` — replay full transcript when user reopens
- `GET /api/chat/stream?session_id=&prompt=` — SSE
- `DELETE /api/chat/conversations/{id}` — cascade delete

Backend SSE event names handled: `trace_started`, `run_started`, `iteration`,
`tool_start`, `tool_end`, `table`, `text_delta`, `run_completed`,
`agent_error`.

# Traffic Intelligence

**AI-Powered Smart-City Traffic Monitoring, Analytics & Spatiotemporal Forecasting Platform.**

Traffic Intelligence is a production-quality Next.js application for traffic operations
centres: a cinematic dark geospatial workspace for monitoring congestion, predicting
future traffic conditions, inspecting road networks, managing incidents, and auditing
the ML models behind the forecasts.

It is designed as a **frontend companion to the LibCity repository**. The UI never
imports or modifies Python model code — it talks to a typed API layer that a FastAPI
service can implement in front of the LibCity forecasting models (METR-LA dataset).

---

## Truthfulness guarantees

This is a demonstration deployment. It is deliberately explicit about what it does:

| Area | Behaviour |
| --- | --- |
| Traffic conditions | **Deterministic simulations** unless a live backend is configured *and* healthy. Every page badges the active data source. |
| AI predictions | **Not** trained-model inference. Demo forecasts come from a seeded simulation engine with realistic spatial/temporal structure. The UI states this on the Predictions page. |
| Model metrics | Published **LibCity / METR-LA benchmark references** for DCRNN, Graph WaveNet, STGCN and AGCRN. They are never presented as measurements from this deployment. |
| Feature importance | **Not shown at all** in simulation mode, because it would require a loaded checkpoint. The page explains exactly what the backend must return to enable it. |
| Incidents | Stored in **browser localStorage only**. Nothing is sent to a real traffic authority or emergency service. |
| AI summary | A deterministic rule-based summary engine, labelled as such. There is no fake chatbot. |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + custom glassmorphism design tokens |
| Icons | Lucide React |
| Charts | Recharts |
| Map | React Leaflet + Leaflet, CARTO Dark Matter / OpenStreetMap tiles, SVG schematic fallback |
| Validation | Zod (user input, API responses, LibCity atomic files) |
| Fonts | Inter (UI) + JetBrains Mono (metrics) via `next/font` |

No unnecessary dependencies. No hardcoded secrets.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) configure a backend
cp .env.example .env.local

# 3. Run the dev server
npm run dev            # http://localhost:3000

# 4. Production build
npm run build && npm start

# 5. Type checking
npm run typecheck
```

The application is fully functional with **zero configuration** — it starts in
deterministic simulation mode.

---

## Environment variables

All optional. See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_TRAFFIC_API_URL` | Base URL of a traffic data service (`/health`, `/segments`, `/observations/current`, `/analytics`, `/incidents`). |
| `NEXT_PUBLIC_LIBCITY_MODEL_ENDPOINT` | Base URL of the LibCity forecasting inference service (`POST /predict`). |

Both values can also be set at runtime from the **Settings** page; the runtime value
overrides the environment default and is persisted in `localStorage`.

---

## Application structure

```
src/
├── app/                         # App Router routes (one folder per page)
│   ├── page.tsx                 # Overview — operational dashboard
│   ├── live-traffic/page.tsx    # Interactive geospatial operations
│   ├── predictions/page.tsx     # LibCity forecasting studio
│   ├── analytics/page.tsx       # Historical analytics + CSV export
│   ├── incidents/page.tsx       # Incident management workspace
│   ├── model-insights/page.tsx  # ML transparency / METR-LA schema
│   ├── settings/page.tsx        # Backend, map and demo configuration
│   ├── layout.tsx               # Root shell + providers
│   ├── not-found.tsx            # 404
│   └── globals.css              # Design tokens + Leaflet theming
├── components/
│   ├── layout/                  # AppShell, Sidebar, Topbar
│   ├── map/                     # map-config (Leaflet-free), Leaflet canvas, fallback, legend
│   ├── charts/                  # Recharts wrappers + custom heatmaps
│   ├── traffic/                 # Segment table, detail panel, incident UI
│   ├── ui/                      # Panel, Badge, Button, Modal, states, controls
│   └── providers/               # Toast + Settings context providers
├── data/                        # METR-LA seed data (segments, incidents, models)
├── hooks/                       # useTrafficData, useAnalytics, useForecast
├── lib/
│   ├── api-client.ts            # Typed API layer + simulation fallback
│   ├── libcity-adapter.ts       # Atomic-file parsing + forecast engine
│   ├── navigation.ts            # Route registry
│   └── utils.ts                 # Formatting, CSV, congestion helpers
└── types/traffic.ts             # Domain types + Zod schemas
```

Dataset parsing and prediction logic live in `src/lib/`, **never** inside UI
components.

---

## Connecting a backend

The API layer in `src/lib/api-client.ts` is the single integration point. A FastAPI
service wrapping the LibCity models should expose:

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/health` | `200 OK` |
| `GET` | `/segments` | `RoadSegment[]` |
| `GET` | `/observations/current` | network snapshot |
| `GET` | `/analytics?corridor=` | analytics dataset |
| `GET` | `/incidents` | `TrafficIncident[]` |
| `POST` | `/incidents` | created incident |
| `POST` | `/predict` | LibCity forecast tensor payload |

Responses are validated with Zod before entering the UI. Any failure — network,
non-200, or schema mismatch — degrades gracefully to simulation mode with a visible
notice, so the operator is never shown a blank screen or an unlabelled error.

### LibCity / METR-LA integration

`src/lib/libcity-adapter.ts` contains pure functions for the real dataset schema:

- `parseLibCityGeoRows` — `METR_LA.geo` (`geo_id`, `type`, `coordinates`)
- `parseLibCityRelRows` — `METR_LA.rel` (`origin_id`, `destination_id`, `weight`)
- `parseLibCityDynaRows` — `METR_LA.dyna` (`time`, `entity_id`, `traffic_speed`)
- `parseLibCityConfig` — `config.json` (split ratios, normalizer, windows)
- `buildAdjacencyMatrix` — Gaussian-kernel adjacency from `.rel` edges

These run entirely in TypeScript and share the Zod schemas used for backend
validation, so the UI and the Python service agree on the contract.



---

## Design system

- Deep navy / near-black layered backdrops with radial illumination and a faint grid.
- Glassmorphic panels: translucent fills, `backdrop-blur`, hairline borders, soft depth.
- Restrained cyan (`#06B6D4`) and electric blue (`#3B82F6`) accents for live data and
  selected states; semantic congestion colours (emerald → amber → orange → rose).
- Lucide icons throughout — no emoji as interface icons.
- Reduced-motion support via `prefers-reduced-motion` and a Settings toggle.
- Responsive from mobile through ultra-wide, with a collapsible sidebar and a mobile
  navigation drawer.

---

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `footer`, `aside`).
- `aria-label` / `aria-checked` / `aria-expanded` on all interactive controls.
- Visible `focus-visible` rings on every focusable element.
- `role="status"` / `aria-live` toast region.
- Keyboard-dismissible popovers and modal (`Escape`), with scroll locking while open.
- Table headers, `dl`/`dt`/`dd` for metric pairs, `role="img"` with labels on charts.

---

## Deployment

### Vercel

Import the repository and deploy — no custom build settings are required. The app is a
standard Next.js project at the repository root. Add the two optional environment
variables in the Vercel dashboard to point at a live backend.

### Anywhere else

```bash
npm ci
npm run build
npm start
```

---

## License

MIT — see [LICENSE](./LICENSE).

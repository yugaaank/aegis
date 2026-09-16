# AEGIS — Space Debris Collision Risk Estimator

Real-time Keplerian orbit propagation and closest-approach detection between satellites and debris objects. Built for the ISRO PS09 hackathon.

**Live demo:** [your-deployed-url.vercel.app](https://your-deployed-url.vercel.app)

## What it does

1. Takes simplified orbital elements (6 classical: a, e, i, Ω, ω, M₀) for a satellite and debris set
2. Propagates Keplerian orbits over a configurable time window (1h–7d)
3. Detects closest approaches using a two-pass algorithm (coarse grid + scipy refinement)
4. Scores and classifies collision risk (CRITICAL / HIGH / MODERATE / LOW)
5. Visualizes everything in a 3D viewport with animated orbit paths

## Quick start

### Backend

```bash
uv sync
uv run uvicorn backend.main:app --port 8000
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

Open http://localhost:5173

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, NumPy, SciPy |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| 3D | Three.js, React Three Fiber, @react-three/drei |
| Charts | Recharts |
| State | Zustand |
| Packages | `uv` (Python), `bun` (JS/TS) |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/objects` | Load 50 demo debris objects |
| POST | `/api/validate` | Validate orbital elements |
| POST | `/api/simulate` | Run full simulation |

## Project structure

```
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── orbital_engine/         # Keplerian propagator + ECI transforms
│   ├── risk_engine/            # Closest approach + risk scoring
│   ├── api/                    # Routes + Pydantic schemas
│   ├── simulation/             # Orchestrator
│   ├── data/                   # Sample dataset (50 debris objects)
│   └── tests/                  # 48 unit tests
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── three/          # 3D scene (Earth, orbits, markers)
│       │   ├── dashboard/      # KPI cards, charts
│       │   ├── risk/           # Risk table
│       │   └── layout/         # Nav, sidebar
│       └── pages/              # 5 pages
└── PRODUCT.md / DESIGN.md
```

## Methodology

All outputs are **approximate**. This tool uses simplified two-body Keplerian propagation. Full perturbation models (J2, atmospheric drag, solar radiation pressure) are not included. Do not use for operational collision avoidance.

See `/methodology` in the app for formulas and known limitations.

## Tests

```bash
uv run pytest backend/tests/ -v
```

## License

MIT

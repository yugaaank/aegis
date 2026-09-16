# Orbital Shield — Product Context

## What it is
Space Debris Collision Risk Estimator. Python/FastAPI backend with orbital mechanics engine, React/Three.js 3D frontend.

## Target users
Hackathon judges, satellite operators (conceptual).

## Core value
Fast, approximate close-approach detection between a satellite and known debris objects. No full perturbation modeling needed.

## Key surfaces
- **Landing page** — hero with 3D Earth, CTA to launch simulation
- **Simulation page** — 3D viewport (main), collapsible sidebar with controls, playback bar, KPI cards
- **Risk Analysis page** — sortable table, donut chart, timeline chart
- **Objects page** — debris browser, CSV upload
- **Methodology page** — formulas, assumptions, disclaimer

## Design direction (user-approved)
- **Theme:** "Orbital Command" — deep navy + cyan neon, glassmorphism panels, holographic HUD
- **Animation:** Maximum — everything animates. Particle backgrounds, neon glows, dramatic transitions
- **Layout:** Top nav + collapsible sidebar, 3D gets maximum space
- **Typography:** Space Grotesk (headings), Inter (body), JetBrains Mono (data)
- **Colors:** Near-black bg, cyan accent, red/orange/yellow/green risk scale

## Tech stack
React 18, TypeScript, Vite, Tailwind CSS, React Three Fiber, drei, Recharts, Zustand, Axios, React Router v6

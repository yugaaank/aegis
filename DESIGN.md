# DESIGN.md — Orbital Shield

## Direction: Orbital Command

**Thesis:** Space operations command center aesthetic. Deep navy backgrounds, cyan neon accents, glassmorphism panels, holographic HUD elements. The 3D viewport is the hero; everything else orbits it.

**Mode:** Operate — users configure simulations, read risk data, interact with 3D visualization.

**World:** Near-black ground (#030712), glass panels with backdrop-blur, cyan (#06b6d4) as primary accent, neon glow on interaction states. Risk scale: red → orange → yellow → green. Monospace data display for orbital elements and scores.

---

## Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-deep` | `#030712` | Main background |
| `--bg-surface` | `#0a0f1e` | Card/panel backgrounds |
| `--bg-elevated` | `#111827` | Hover states, elevated panels |
| `--border` | `#1e293b` | Subtle borders |
| `--border-glow` | `#06b6d4` | Cyan glow on focus/hover |
| `--text-primary` | `#f1f5f9` | Main text |
| `--text-secondary` | `#94a3b8` | Muted text |
| `--text-muted` | `#475569` | Very muted |
| `--accent-cyan` | `#06b6d4` | Primary accent |
| `--accent-blue` | `#3b82f6` | Secondary accent |
| `--accent-purple` | `#8b5cf6` | Tertiary |
| `--accent-green` | `#10b981` | Success |
| `--accent-amber` | `#f59e0b` | Warning |
| `--risk-critical` | `#ef4444` | CRITICAL level |
| `--risk-high` | `#f97316` | HIGH level |
| `--risk-moderate` | `#eab308` | MODERATE level |
| `--risk-low` | `#22c55e` | LOW level |

---

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | Space Grotesk | 700 | 3rem–4.5rem |
| Heading | Space Grotesk | 600 | 1.5rem–2rem |
| Body | Inter | 400–500 | 0.875rem–1rem |
| Data/Mono | JetBrains Mono | 400 | 0.8125rem–0.875rem |
| Label | Inter | 500 | 0.75rem–0.8125rem |

---

## Components

### Glass Panel
- Background: `rgba(10, 15, 30, 0.7)`
- Backdrop-filter: `blur(12px)`
- Border: `1px solid rgba(6, 182, 212, 0.15)`
- Border-radius: `12px`
- Hover: border brightens to `rgba(6, 182, 212, 0.3)`

### Neon Button
- Background: gradient from `#06b6d4` to `#3b82f6`
- Box-shadow: `0 0 20px rgba(6, 182, 212, 0.3)`
- Hover: shadow expands, brightness increases
- Active: scale(0.98)

### Risk Badge
- pill shape, 2px radius
- Background tinted with risk color at 15% opacity
- Text in risk color
- Subtle glow matching risk color

### Data Table
- Rows slide in from right with stagger
- Hover: row background lightens
- Risk level cell: colored dot + text
- Monospace for numeric columns

---

## Animations

| Effect | Implementation |
|--------|---------------|
| Neon glow pulse | `box-shadow` keyframe, 2s infinite |
| Slide-in rows | `transform: translateX(20px) → 0` + opacity, stagger 50ms |
| Number count-up | requestAnimationFrame counter from 0 to value |
| Chart segment | Recharts built-in animation |
| Star particles | CSS keyframe translate on positioned dots |
| Scanline overlay | Repeating-linear-gradient, subtle opacity |
| Page transition | `opacity: 0 → 1` + `translateY(8px → 0)` |
| Border glow | `border-color` transition on hover |
| Risk pulse | `opacity` keyframe on critical debris markers |
| 3D atmosphere | Custom shader or emissive material with intensity animation |

---

## Layout

```
┌─────────────────────────────────────────┐
│  Top Navbar (h-14)                      │
│  Logo    Simulation  Risk  Objects  ... │
├────────┬────────────────────────────────┤
│ Sidebar│                                │
│ (w-72) │     Main Content / 3D View     │
│ collaps│                                │
│ -ible  │                                │
│        │                                │
│ Sat    │                                │
│ Config │                                │
│ Debris │                                │
│ List   │                                │
│ Sim    │                                │
│ Ctrl   │                                │
├────────┴────────────────────────────────┤
│  Playback Bar / KPI Cards              │
└─────────────────────────────────────────┘
```

Sidebar: 288px expanded, 0px collapsed. Toggle button in navbar.
3D viewport fills remaining space. KPI cards overlay bottom of 3D scene.

---

## Responsive

- Desktop (≥1024px): full layout with sidebar
- Tablet (768–1023px): sidebar collapsed by default, overlays on toggle
- Mobile (<768px): sidebar hidden, bottom nav, simplified 3D

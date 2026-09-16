import { useEffect, useState } from 'react'
import type { SimulationResponse, RiskLevel } from '../../types'
import { RISK_COLORS } from '../../types'

export default function KpiCards({ result }: { result: SimulationResponse }) {
  const critical = result.approaches.filter((a) => a.risk_level === 'CRITICAL').length
  const high = result.approaches.filter((a) => a.risk_level === 'HIGH').length
  const nearest = result.approaches.length > 0
    ? Math.min(...result.approaches.map((a) => a.min_distance_km))
    : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Total Pairs"
        value={result.approaches.length}
        suffix=""
        color="#06b6d4"
        delay={0}
      />
      <KpiCard
        label="Critical"
        value={critical}
        suffix=""
        color={RISK_COLORS.CRITICAL}
        delay={100}
        pulse={critical > 0}
      />
      <KpiCard
        label="High Risk"
        value={high}
        suffix=""
        color={RISK_COLORS.HIGH}
        delay={200}
      />
      <KpiCard
        label="Nearest Approach"
        value={nearest}
        suffix=" km"
        color="#06b6d4"
        delay={300}
        decimals={1}
      />
    </div>
  )
}

function KpiCard({
  label, value, suffix, color, delay, decimals = 0, pulse = false,
}: {
  label: string
  value: number
  suffix: string
  color: string
  delay: number
  decimals?: number
  pulse?: boolean
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 800
    const from = 0
    const to = value

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }

    const timer = setTimeout(() => requestAnimationFrame(tick), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <div
      className="glass-panel p-4 relative overflow-hidden group"
      style={{ opacity: 0, animation: `fade-up 0.5s ease-out ${delay}ms forwards` }}
    >
      <div
        className="absolute top-0 left-0 w-full h-0.5 opacity-60"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="font-display font-bold text-2xl" style={{ color }}>
        <span className="data-value">
          {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
        </span>
        {suffix && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
      </div>
      {pulse && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="absolute inset-0 rounded-full animate-risk-pulse" style={{ background: color, opacity: 0.6 }} />
          <div className="absolute inset-0.5 rounded-full" style={{ background: color }} />
        </div>
      )}
    </div>
  )
}

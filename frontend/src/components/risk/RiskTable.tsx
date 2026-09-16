import { useState } from 'react'
import type { ClosestApproachResult } from '../../types'
import { RISK_COLORS, RISK_BG } from '../../types'

type SortKey = 'min_distance_km' | 'time_to_closest_s' | 'relative_velocity_km_s' | 'risk_score'

export default function RiskTable({ approaches }: { approaches: ClosestApproachResult[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('risk_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<string>('ALL')

  const filtered = filter === 'ALL'
    ? approaches
    : approaches.filter((a) => a.risk_level === filter)

  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    return (a[sortKey] - b[sortKey]) * mul
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'risk_score' ? 'desc' : 'asc')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              filter === level
                ? level === 'ALL'
                  ? 'bg-primary/10 text-primary'
                  : 'text-primary'
                : 'bg-white/5 text-on-dark/60 hover:bg-white/10'
            }`}
            style={filter === level && level !== 'ALL' ? { background: RISK_BG[level as keyof typeof RISK_BG] } : undefined}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-on-dark/60 uppercase tracking-wider border-b border-border-subtle">
              <th className="pb-2 pr-4 font-medium">Object</th>
              <th className="pb-2 pr-4 font-medium">Min Distance</th>
              <th className="pb-2 pr-4 font-medium">Time to Closest</th>
              <th className="pb-2 pr-4 font-medium">Rel. Velocity</th>
              <th className="pb-2 font-medium">Score</th>
              <th className="pb-2 font-medium">Level</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr
                key={a.debris_id}
                className="border-b border-border-subtle/50 hover:bg-white/\[0\.02%5D transition-colors"
                style={{ opacity: 0, animation: `fade-up 0.3s ease-out ${i * 30}ms forwards` }}
              >
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[a.risk_level] }} />
                    <span className="text-on-dark/300 truncate max-w-[180px]">{a.debris_name}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 font-mono text-on-dark/400 data-value">
                  {a.min_distance_km.toFixed(1)}
                </td>
                <td className="py-2.5 pr-4 font-mono text-on-dark/400">
                  {formatTime(a.time_to_closest_s)}
                </td>
                <td className="py-2.5 pr-4 font-mono text-on-dark/400">
                  {a.relative_velocity_km_s.toFixed(2)}
                </td>
                <td className="py-2.5 pr-4 font-mono text-on-dark/400 data-value font-semibold">
                  {a.risk_score.toFixed(1)}
                </td>
                <td className="py-2.5">
                  <span className={`risk-badge risk-badge-${a.risk_level.toLowerCase()}`}>
                    {a.risk_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}
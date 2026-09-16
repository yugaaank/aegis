import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { ClosestApproachResult, RiskLevel } from '../../types'
import { RISK_COLORS } from '../../types'

export default function RiskDonut({ approaches }: { approaches: ClosestApproachResult[] }) {
  const counts: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 }
  approaches.forEach((a) => { counts[a.risk_level]++ })

  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name as RiskLevel, value }))

  const total = approaches.length

  return (
    <div className="flex items-center gap-6">
      <div className="w-36 h-36 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={60}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={RISK_COLORS[entry.name]}
                  stroke="transparent"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2.5 flex-1">
        {(Object.keys(counts) as RiskLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[level] }} />
            <span className="text-xs text-on-dark/60 flex-1">{level}</span>
            <span className="text-xs font-mono text-on-dark/50">{counts[level]}</span>
            <span className="text-[10px] font-mono text-on-dark/400 w-10 text-right">
              {total > 0 ? ((counts[level] / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ClosestApproachResult } from '../../types'
import { RISK_COLORS } from '../../types'

export default function ApproachTimeline({ approaches }: { approaches: ClosestApproachResult[] }) {
  const sorted = [...approaches]
    .sort((a, b) => a.time_to_closest_s - b.time_to_closest_s)
    .slice(0, 20)
    .map((a, i) => ({
      name: a.debris_name.length > 15 ? a.debris_name.slice(0, 15) + '…' : a.debris_name,
      distance: a.min_distance_km,
      risk: a.risk_level,
      time: a.time_to_closest_s,
    }))

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'km', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: '#0a0f1e',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono',
            }}
            formatter={(value: number) => [`${value.toFixed(1)} km`, 'Distance']}
          />
          <Bar dataKey="distance" radius={[4, 4, 0, 0]} animationDuration={800}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={RISK_COLORS[entry.risk as keyof typeof RISK_COLORS]} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

import { useMemo } from 'react'
import { useSimulationStore } from '../../store/simulationStore'

export default function DebrisInfoCard() {
  const { selectedObject, result, debrisList, selectObject } = useSimulationStore()

  const approach = useMemo(() => {
    if (!selectedObject || !result) return null
    return result.approaches.find((a) => a.debris_id === selectedObject)
  }, [selectedObject, result])

  const debris = useMemo(() => {
    if (!selectedObject) return null
    return debrisList.find((d) => d.id === selectedObject)
  }, [selectedObject, debrisList])

  if (!approach || !debris) return null

  const riskColor = approach.risk_level === 'CRITICAL' ? '#ef4444'
    : approach.risk_level === 'HIGH' ? '#f97316'
    : approach.risk_level === 'MODERATE' ? '#eab308'
    : '#22c55e'

  const formatTime = (s: number) => {
    if (s < 60) return `${Math.round(s)}s`
    if (s < 3600) return `${(s / 60).toFixed(1)}m`
    return `${(s / 3600).toFixed(1)}h`
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-72 card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-on-dark">Debris Details</h3>
        <button onClick={() => selectObject(null)} className="text-on-dark/40 hover:text-on-dark transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="text-sm font-medium text-on-dark truncate">{approach.debris_name}</div>

      <div className="space-y-2">
        <InfoRow label="Distance" value={`${approach.min_distance_km.toFixed(1)} km`} />
        <InfoRow label="Relative Velocity" value={`${approach.relative_velocity_km_s.toFixed(2)} km/s`} />
        <InfoRow label="Time to Closest" value={formatTime(approach.time_to_closest_s)} />
        <InfoRow label="Risk Score" value={approach.risk_score.toFixed(1)} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-dark/50">Risk Level</span>
          <span className="risk-badge" style={{ background: `${riskColor}20`, color: riskColor }}>
            {approach.risk_level}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-borderSubtle space-y-1">
        <div className="text-[10px] text-on-dark/40 uppercase tracking-wider">Orbital Elements</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span className="text-on-dark/50">Alt: {(debris.orbital_elements.semi_major_axis_km - 6371).toFixed(0)} km</span>
          <span className="text-on-dark/50">Inc: {debris.orbital_elements.inclination_deg.toFixed(1)}°</span>
          <span className="text-on-dark/50">Ecc: {debris.orbital_elements.eccentricity.toFixed(4)}</span>
          <span className="text-on-dark/50">RAAN: {debris.orbital_elements.raan_deg.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-on-dark/50">{label}</span>
      <span className="text-xs font-mono text-on-dark/80">{value}</span>
    </div>
  )
}
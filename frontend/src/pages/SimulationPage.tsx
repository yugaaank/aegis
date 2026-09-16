import { useSimulationStore } from '../store/simulationStore'
import KpiCards from '../components/dashboard/KpiCards'
import PlaybackControls from '../components/dashboard/PlaybackControls'
import DebrisInfoCard from '../components/dashboard/DebrisInfoCard'
import Scene from '../components/three/Scene'
import { RISK_COLORS } from '../types'

export default function SimulationPage() {
  const { result, isRunning, satellite, debrisList } = useSimulationStore()
  const hasData = satellite && debrisList.length > 0

  return (
    <div className="relative h-[calc(100vh-3.5rem)] bg-black overflow-hidden">
      <Scene />

        {!hasData && !isRunning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="card p-8 text-center pointer-events-auto max-w-md">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0070d1" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)" />
                  <circle cx="12" cy="12" r="2" fill="#0070d1" />
                </svg>
              </div>
              <h2 className="font-display font-semibold text-lg text-on-dark mb-2">Configure &amp; Simulate</h2>
              <p className="text-sm text-on-dark/50">Load demo data from the sidebar, then click Run Simulation.</p>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="card p-8 text-center pointer-events-auto">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-on-dark/40 font-mono">Propagating orbits...</p>
            </div>
          </div>
        )}

        {result && (
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
            <KpiCards result={result} />
          </div>
        )}

      {result && (
        <div className="p-6 space-y-6 pb-20">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm text-on-dark">Conjunction Summary</h3>
              <span className="text-xs font-mono text-on-dark/50">
                {result.approaches.length} pairs analyzed · {result.time_window_hours}h window
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-on-dark/60 uppercase tracking-wider border-b border-borderSubtle">
                    <th className="pb-2 pr-4 font-medium">Object</th>
                    <th className="pb-2 pr-4 font-medium">Min Distance</th>
                    <th className="pb-2 pr-4 font-medium">Time to Closest</th>
                    <th className="pb-2 pr-4 font-medium">Rel. Velocity</th>
                    <th className="pb-2 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {result.approaches.slice(0, 15).map((a, i) => (
                    <tr key={a.debris_id}
                      className="border-b border-borderSubtle/50 hover:bg-white/5 transition-colors"
                      style={{ opacity: 0, animation: `fade-up 0.3s ease-out ${i * 30}ms forwards` }}>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[a.risk_level] }} />
                          <span className="text-on-dark/70 truncate max-w-[200px]">{a.debris_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-on-dark/50 data-value">{a.min_distance_km.toFixed(1)} km</td>
                      <td className="py-2.5 pr-4 font-mono text-on-dark/50">{formatTime(a.time_to_closest_s)}</td>
                      <td className="py-2.5 pr-4 font-mono text-on-dark/50">{a.relative_velocity_km_s.toFixed(2)} km/s</td>
                      <td className="py-2.5">
                        <span className={`risk-badge risk-badge-${a.risk_level.toLowerCase()}`}>{a.risk_level}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {result && <PlaybackControls />}
      <DebrisInfoCard />
    </div>
  )
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}
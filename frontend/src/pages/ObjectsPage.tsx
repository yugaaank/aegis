import { useSimulationStore } from '../store/simulationStore'
import type { SpaceObject } from '../types'

export default function ObjectsPage() {
  const { satellite, debrisList, loadDemoData } = useSimulationStore()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary">Orbital Objects</h1>
          <p className="text-sm text-on-dark/50 mt-1">
            {debrisList.length} debris objects loaded
          </p>
        </div>
        <button onClick={loadDemoData} className="button-primary text-xs px-4 py-2">
          Reload Demo
        </button>
      </div>

      {satellite && (
        <div className="p-5">
          <h3 className="text-xs font-display font-semibold text-primary uppercase tracking-wider mb-4">
            Target Satellite
          </h3>
          <ObjectTable objects={[satellite]} />
        </div>
      )}

      <div className="p-5">
        <h3 className="text-xs font-display font-semibold text-primary uppercase tracking-wider mb-4">
          Debris Field
        </h3>
        <ObjectTable objects={debrisList} />
      </div>
    </div>
  )
}

function ObjectTable({ objects }: { objects: SpaceObject[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-on-dark/60 uppercase tracking-wider border-b border-border-subtle">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Alt (km)</th>
            <th className="pb-2 pr-4 font-medium">Ecc</th>
            <th className="pb-2 pr-4 font-medium">Inc (°)</th>
            <th className="pb-2 pr-4 font-medium">RAAN (°)</th>
            <th className="pb-2 pr-4 font-medium">ArgP (°)</th>
            <th className="pb-2 font-medium">M₀ (°)</th>
          </tr>
        </thead>
        <tbody>
          {objects.map((obj) => {
            const oe = obj.orbital_elements
            return (
              <tr
                key={obj.id}
                className="border-b border-border-subtle/50 hover:bg-white/5 transition-colors"
              >
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${obj.type === 'satellite' ? 'bg-primary' : 'bg-riskHigh/60'}`} />
                    <span className="text-on-dark/70 truncate max-w-[180px]">{obj.name}</span>
                  </div>
                </td>
                <td className="py-2 pr-4 font-mono text-on-dark/50">{(oe.semi_major_axis_km - 6371).toFixed(0)}</td>
                <td className="py-2 pr-4 font-mono text-on-dark/50">{oe.eccentricity.toFixed(4)}</td>
                <td className="py-2 pr-4 font-mono text-on-dark/50">{oe.inclination_deg.toFixed(1)}</td>
                <td className="py-2 pr-4 font-mono text-on-dark/50">{oe.raan_deg.toFixed(1)}</td>
                <td className="py-2 pr-4 font-mono text-on-dark/50">{oe.arg_perigee_deg.toFixed(1)}</td>
                <td className="py-2 font-mono text-on-dark/50">{oe.mean_anomaly_deg.toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
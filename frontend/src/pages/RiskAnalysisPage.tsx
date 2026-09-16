import { useSimulationStore } from '../store/simulationStore'
import RiskTable from '../components/risk/RiskTable'
import RiskDonut from '../components/dashboard/RiskDonut'
import ApproachTimeline from '../components/dashboard/ApproachTimeline'

export default function RiskAnalysisPage() {
  const { result } = useSimulationStore()

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h2 className="font-display font-semibold text-xl text-on-dark/60 mb-2">No Data Yet</h2>
        <p className="text-sm text-on-dark/50">Run a simulation first to see risk analysis.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary">Risk Analysis</h1>
          <p className="text-sm text-on-dark/50 mt-1">
            {result.approaches.length} conjunction events · {result.time_window_hours}h propagation window
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h3 className="text-xs font-display font-semibold text-primary uppercase tracking-wider mb-4">
            Risk Distribution
          </h3>
          <RiskDonut approaches={result.approaches} />
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="text-xs font-display font-semibold text-primary uppercase tracking-wider mb-4">
            Distance vs Time
          </h3>
          <ApproachTimeline approaches={result.approaches} />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-xs font-display font-semibold text-primary uppercase tracking-wider mb-4">
          All Conjunction Events
        </h3>
        <RiskTable approaches={result.approaches} />
      </div>
    </div>
  )
}
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../store/simulationStore'
import Scene from '../components/three/Scene'

export default function LandingPage() {
  const navigate = useNavigate()
  const { loadDemoData, satellite } = useSimulationStore()

  useEffect(() => {
    if (!satellite) loadDemoData()
  }, [])

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Scene />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono text-primary">DEMO ACTIVE</span>
        </div>

        <h1 className="font-display font-bold text-5xl md:text-7xl tracking-tight mb-6">
          <span className="text-gradient-primary">ORBITAL</span>{' '}
          <span className="text-on-dark">SHIELD</span>
        </h1>

        <p className="text-lg md:text-xl text-on-dark/60 mb-4 max-w-xl mx-auto leading-relaxed">
          Space debris collision risk estimator. Propagate Keplerian orbits, detect close approaches, and rank conjunction threats in real time.
        </p>

        <p className="text-sm text-on-dark/50 mb-10 font-mono">
          Approximate results. Full perturbation models not included.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/simulation')}
            className="button-primary text-base px-8 py-3"
          >
            Launch Simulation
          </button>
          <button
            onClick={() => navigate('/methodology')}
            className="px-6 py-3 rounded-lg border border-border-subtle text-on-dark/60 hover:text-white hover:border-on-dark/40 transition-all text-sm font-medium"
          >
            Methodology
          </button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          <Stat value="50" label="Debris Objects" />
          <Stat value="6-El" label="Keplerian" />
          <Stat value="<1s" label="Propagation" />
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display font-bold text-2xl text-primary" dangerouslySetInnerHTML={{ __html: value }} />
      <div className="text-xs text-on-dark/50 mt-1">{label}</div>
    </div>
  )
}
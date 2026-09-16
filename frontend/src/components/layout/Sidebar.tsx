import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSimulationStore } from '../../store/simulationStore'
import type { SpaceObject, OrbitalElements } from '../../types'

const TIME_WINDOWS = [1, 6, 12, 24, 48, 168]

const PRESETS: Record<string, Partial<OrbitalElements>> = {
  'ISS-like': { semi_major_axis_km: 6771, eccentricity: 0.0002, inclination_deg: 51.6 },
  'GPS-like': { semi_major_axis_km: 26560, eccentricity: 0.02, inclination_deg: 55 },
  'GEO-like': { semi_major_axis_km: 42164, eccentricity: 0.0001, inclination_deg: 0.1 },
  'LEO Polar': { semi_major_axis_km: 6771, eccentricity: 0.001, inclination_deg: 97.4 },
}

export default function Sidebar() {
  const location = useLocation()
  const {
    satellite, debrisList, isRunning, sidebarOpen, toggleSidebar,
    timeWindowHours, setTimeWindow, loadDemoData, runSim,
  } = useSimulationStore()

  const [selectedPreset, setSelectedPreset] = useState('ISS-like')

  useEffect(() => {
    if (window.innerWidth < 1024 && sidebarOpen) {
      toggleSidebar()
    }
  }, [location.pathname])

  if (!sidebarOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        onClick={toggleSidebar}
      />
      <aside className="fixed top-14 left-0 bottom-0 w-72 z-40 overflow-y-auto border-r border-border-subtle lg:translate-x-0"
        style={{ background: 'rgba(3, 7, 18, 0.95)', backdropFilter: 'blur(12px)' }}>

      <div className="p-4 space-y-5">
        <div>
          <button
            onClick={loadDemoData}
            className="w-full neon-btn text-sm"
            disabled={isRunning}
          >
            {satellite ? 'Reload Demo Data' : 'Load Demo Scenario'}
          </button>
        </div>

        {satellite && (
          <div className="glass-panel p-3 space-y-3">
            <h3 className="text-xs font-display font-semibold text-accent-cyan uppercase tracking-wider">
              Target Satellite
            </h3>
            <div className="text-sm font-medium text-slate-200">{satellite.name}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <DataField label="Alt" value={`${(satellite.orbital_elements.semi_major_axis_km - 6371).toFixed(0)} km`} />
              <DataField label="Inc" value={`${satellite.orbital_elements.inclination_deg.toFixed(1)}°`} />
              <DataField label="Ecc" value={satellite.orbital_elements.eccentricity.toFixed(4)} />
              <DataField label="RAAN" value={`${satellite.orbital_elements.raan_deg.toFixed(1)}°`} />
            </div>
          </div>
        )}

        <div className="glass-panel p-3 space-y-3">
          <h3 className="text-xs font-display font-semibold text-accent-cyan uppercase tracking-wider">
            Satellite Preset
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                onClick={() => setSelectedPreset(name)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  selectedPreset === name
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                    : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-3 space-y-3">
          <h3 className="text-xs font-display font-semibold text-accent-cyan uppercase tracking-wider">
            Time Window
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {TIME_WINDOWS.map((h) => (
              <button
                key={h}
                onClick={() => setTimeWindow(h)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                  timeWindowHours === h
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                    : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-display font-semibold text-accent-cyan uppercase tracking-wider">
              Debris Field
            </h3>
            <span className="text-xs font-mono text-slate-500">{debrisList.length} objects</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {debrisList.slice(0, 20).map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-xs text-slate-400 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-risk-high/60" />
                <span className="truncate flex-1">{d.name}</span>
                <span className="font-mono text-slate-600">{(d.orbital_elements.semi_major_axis_km - 6371).toFixed(0)}km</span>
              </div>
            ))}
            {debrisList.length > 20 && (
              <div className="text-xs text-slate-600 text-center pt-1">
                +{debrisList.length - 20} more
              </div>
            )}
          </div>
        </div>

        <button
          onClick={runSim}
          disabled={isRunning || !satellite || debrisList.length === 0}
          className="w-full neon-btn text-sm disabled:opacity-40"
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Propagating...
            </span>
          ) : (
            'Run Simulation'
          )}
        </button>
      </div>
    </aside>
    </>
  )
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</span>
      <span className="font-mono text-slate-300">{value}</span>
    </div>
  )
}

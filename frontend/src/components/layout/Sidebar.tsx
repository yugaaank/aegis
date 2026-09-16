import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSimulationStore } from '../../store/simulationStore'
import type { OrbitalElements } from '../../types'

const TIME_WINDOWS = [1, 6, 12, 24, 48, 168]

const PRESETS: Record<string, Partial<OrbitalElements>> = {
  'ISS-like': { semi_major_axis_km: 6771, eccentricity: 0.0002, inclination_deg: 51.6, raan_deg: 0, arg_perigee_deg: 0, mean_anomaly_deg: 0 },
  'GPS-like': { semi_major_axis_km: 26560, eccentricity: 0.02, inclination_deg: 55, raan_deg: 0, arg_perigee_deg: 0, mean_anomaly_deg: 0 },
  'GEO-like': { semi_major_axis_km: 42164, eccentricity: 0.0001, inclination_deg: 0.1, raan_deg: 0, arg_perigee_deg: 0, mean_anomaly_deg: 0 },
  'LEO Polar': { semi_major_axis_km: 6771, eccentricity: 0.001, inclination_deg: 97.4, raan_deg: 0, arg_perigee_deg: 0, mean_anomaly_deg: 0 },
}

const CUSTOM_DEFAULTS: OrbitalElements = {
  semi_major_axis_km: 6771,
  eccentricity: 0.001,
  inclination_deg: 51.6,
  raan_deg: 0,
  arg_perigee_deg: 0,
  mean_anomaly_deg: 0,
}

export default function Sidebar() {
  const location = useLocation()
  const {
    satellite, debrisList, isRunning, sidebarOpen, toggleSidebar,
    timeWindowHours, setTimeWindow, loadDemoData, setSatellite, runSim,
  } = useSimulationStore()

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customElements, setCustomElements] = useState<OrbitalElements>({ ...CUSTOM_DEFAULTS })

  useEffect(() => {
    if (window.innerWidth < 1024 && sidebarOpen) {
      toggleSidebar()
    }
  }, [location.pathname])

  const handlePresetClick = (name: string) => {
    setSelectedPreset(name)
    const preset = PRESETS[name]
    setSatellite({
      id: `preset-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${name} Satellite`,
      type: 'satellite',
      orbital_elements: {
        semi_major_axis_km: preset.semi_major_axis_km ?? 6771,
        eccentricity: preset.eccentricity ?? 0.001,
        inclination_deg: preset.inclination_deg ?? 51.6,
        raan_deg: preset.raan_deg ?? 0,
        arg_perigee_deg: preset.arg_perigee_deg ?? 0,
        mean_anomaly_deg: preset.mean_anomaly_deg ?? 0,
      },
    })
  }

  const handleCustomApply = () => {
    setSatellite({
      id: 'custom-satellite',
      name: 'Custom Satellite',
      type: 'satellite',
      orbital_elements: customElements,
    })
  }

  const handleDownloadCSV = () => {
    const rows = [['id', 'name', 'type', 'semi_major_axis_km', 'eccentricity', 'inclination_deg', 'raan_deg', 'arg_perigee_deg', 'mean_anomaly_deg']]
    if (satellite) {
      const oe = satellite.orbital_elements
      rows.push([satellite.id, satellite.name, satellite.type, String(oe.semi_major_axis_km), String(oe.eccentricity), String(oe.inclination_deg), String(oe.raan_deg), String(oe.arg_perigee_deg), String(oe.mean_anomaly_deg)])
    }
    debrisList.forEach((d) => {
      const oe = d.orbital_elements
      rows.push([d.id, d.name, d.type, String(oe.semi_major_axis_km), String(oe.eccentricity), String(oe.inclination_deg), String(oe.raan_deg), String(oe.arg_perigee_deg), String(oe.mean_anomaly_deg)])
    })
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orbital_objects.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!sidebarOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={toggleSidebar} />
      <aside className="fixed top-14 left-0 bottom-0 w-72 z-40 overflow-y-auto border-r border-borderSubtle lg:translate-x-0"
        style={{ background: 'rgba(3, 7, 18, 0.95)', backdropFilter: 'blur(12px)' }}>

        <div className="p-4 space-y-5">
          <div>
            <button onClick={loadDemoData} className="w-full button-primary disabled:opacity-40" disabled={isRunning}>
              {satellite ? 'Reload Demo Data' : 'Load Demo Scenario'}
            </button>
          </div>

          {satellite && (
            <div className="p-3 space-y-3">
              <h3 className="text-xs font-display font-semibold text-primary uppercase tracking-wider">Target Satellite</h3>
              <div className="text-sm font-medium text-on-dark">{satellite.name}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <DataField label="Alt" value={`${(satellite.orbital_elements.semi_major_axis_km - 6371).toFixed(0)} km`} />
                <DataField label="Inc" value={`${satellite.orbital_elements.inclination_deg.toFixed(1)}°`} />
                <DataField label="Ecc" value={satellite.orbital_elements.eccentricity.toFixed(4)} />
                <DataField label="RAAN" value={`${satellite.orbital_elements.raan_deg.toFixed(1)}°`} />
              </div>
            </div>
          )}

          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-display font-semibold text-primary uppercase tracking-wider">Satellite Preset</h3>
              <button onClick={() => setShowCustomForm(!showCustomForm)} className="text-xs text-primary hover:underline">
                {showCustomForm ? 'Presets' : 'Custom'}
              </button>
            </div>

            {!showCustomForm ? (
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(PRESETS).map((name) => (
                  <button key={name} onClick={() => handlePresetClick(name)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      selectedPreset === name
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-white/5 text-on-dark/60 border border-transparent hover:bg-white/10'
                    }`}>
                    {name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <CustomInput label="Semi-major axis (km)" value={customElements.semi_major_axis_km} onChange={(v) => setCustomElements({ ...customElements, semi_major_axis_km: v })} />
                <CustomInput label="Eccentricity" value={customElements.eccentricity} step={0.001} onChange={(v) => setCustomElements({ ...customElements, eccentricity: v })} />
                <CustomInput label="Inclination (°)" value={customElements.inclination_deg} onChange={(v) => setCustomElements({ ...customElements, inclination_deg: v })} />
                <CustomInput label="RAAN (°)" value={customElements.raan_deg} onChange={(v) => setCustomElements({ ...customElements, raan_deg: v })} />
                <CustomInput label="Arg Perigee (°)" value={customElements.arg_perigee_deg} onChange={(v) => setCustomElements({ ...customElements, arg_perigee_deg: v })} />
                <CustomInput label="Mean Anomaly (°)" value={customElements.mean_anomaly_deg} onChange={(v) => setCustomElements({ ...customElements, mean_anomaly_deg: v })} />
                <button onClick={handleCustomApply} className="w-full button-primary text-xs">Apply Custom Satellite</button>
              </div>
            )}
          </div>

          <div className="p-3 space-y-3">
            <h3 className="text-xs font-display font-semibold text-primary uppercase tracking-wider">Time Window</h3>
            <div className="flex flex-wrap gap-1.5">
              {TIME_WINDOWS.map((h) => (
                <button key={h} onClick={() => setTimeWindow(h)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                    timeWindowHours === h
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-on-dark/60 border border-transparent hover:bg-white/10'
                  }`}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-display font-semibold text-primary uppercase tracking-wider">Debris Field</h3>
              <span className="text-xs font-mono text-on-dark/50">{debrisList.length} objects</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {debrisList.slice(0, 20).map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-xs text-on-dark py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-riskHigh/60" />
                  <span className="truncate flex-1">{d.name}</span>
                  <span className="font-mono text-on-dark/60">{(d.orbital_elements.semi_major_axis_km - 6371).toFixed(0)}km</span>
                </div>
              ))}
              {debrisList.length > 20 && (
                <div className="text-xs text-on-dark/60 text-center pt-1">+{debrisList.length - 20} more</div>
              )}
            </div>
          </div>

          <button onClick={runSim} disabled={isRunning || !satellite || debrisList.length === 0}
            className="w-full button-primary disabled:opacity-40">
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Propagating...
              </span>
            ) : 'Run Simulation'}
          </button>

          {(satellite || debrisList.length > 0) && (
            <button onClick={handleDownloadCSV}
              className="w-full px-3 py-2 rounded text-xs font-medium bg-white/5 text-on-dark/60 border border-borderSubtle hover:bg-white/10 transition-all">
              Download CSV
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-on-dark/60 uppercase tracking-wider">{label}</span>
      <span className="font-mono text-on-dark/90">{value}</span>
    </div>
  )
}

function CustomInput({ label, value, step = 1, onChange }: { label: string; value: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] text-on-dark/60 uppercase tracking-wider mb-0.5">{label}</label>
      <input type="number" value={value} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-2 py-1 rounded text-xs font-mono text-on-dark bg-white/5 border border-borderSubtle focus:border-primary focus:outline-none" />
    </div>
  )
}
export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl text-slate-100 mb-2">Methodology</h1>
        <p className="text-sm text-slate-500">
          How Orbital Shield computes collision risk estimates.
        </p>
      </div>

      <DisclaimerBox />

      <Section title="Orbital Propagation">
        <p>
          Orbital Shield uses simplified Keplerian (two-body) propagation with full 6-element classical orbital elements:
        </p>
        <ul className="list-disc list-inside text-slate-400 text-sm mt-2 space-y-1">
          <li>Semi-major axis (a)</li>
          <li>Eccentricity (e)</li>
          <li>Inclination (i)</li>
          <li>Right Ascension of Ascending Node (Ω)</li>
          <li>Argument of Perigee (ω)</li>
          <li>Mean Anomaly at epoch (M₀)</li>
        </ul>
        <p className="text-sm text-slate-400 mt-3">
          The propagator solves Kepler's equation (M = E − e·sin(E)) using Newton-Raphson iteration, then converts eccentric anomaly to true anomaly. Position is computed in the orbital plane and rotated to ECI coordinates using 3-1-3 Euler angle rotations (ω → i → Ω).
        </p>
        <FormulaBlock>
          {`r(ν) = a(1 − e²) / (1 + e·cos(ν))
n = √(μ/a³)   [μ = 398600.4418 km³/s²]
M(t) = M₀ + n·t`}
        </FormulaBlock>
      </Section>

      <Section title="Closest Approach Detection">
        <p>
          Two-pass algorithm for each satellite-debris pair:
        </p>
        <ol className="list-decimal list-inside text-slate-400 text-sm mt-2 space-y-1">
          <li>Coarse grid scan at 60-second intervals over the full time window</li>
          <li>Refinement via scipy.optimize.minimize_scalar within ±60s of each candidate minimum</li>
        </ol>
        <p className="text-sm text-slate-400 mt-3">
          Relative velocity is approximated via central finite difference (±0.5s) of position at the closest approach time.
        </p>
      </Section>

      <Section title="Risk Scoring">
        <FormulaBlock>
          {`score = 100 × dist_factor × v_factor × t_factor

dist_factor = max(0, 1 − d_min / 500)        [0–1]
v_factor    = 0.3 + 0.7 × min(v_rel / 15, 1)  [0.3–1]
t_factor    = 1 − 0.5 × min(t / 3600, 1)       [0.5–1]`}
        </FormulaBlock>
        <p className="text-sm text-slate-400 mt-3">
          All factors are normalized to [0, 1], so the score is always in [0, 100].
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <RiskRow level="CRITICAL" range="≥ 85" color="#ef4444" />
          <RiskRow level="HIGH" range="60–84" color="#f97316" />
          <RiskRow level="MODERATE" range="30–59" color="#eab308" />
          <RiskRow level="LOW" range="< 30" color="#22c55e" />
        </div>
      </Section>

      <Section title="Known Limitations">
        <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
          <li>No J2 perturbation (Earth oblateness)</li>
          <li>No atmospheric drag modeling</li>
          <li>No solar radiation pressure</li>
          <li>No third-body gravitational effects (Sun, Moon)</li>
          <li>Circular orbit assumption in visualization (orbits rendered as circles even for e &gt; 0)</li>
          <li>Relative velocity is an upper bound (sum of magnitudes, not vector difference)</li>
          <li>No uncertainty/covariance modeling</li>
        </ul>
      </Section>

      <Section title="Data Sources">
        <p className="text-sm text-slate-400">
          The demo dataset contains 50 synthetic debris objects modeled after the Iridium 33 / Cosmos 2251 collision fragments (February 2009). Orbital elements are based on published characteristics of these debris populations. For operational use, real TLE data from CelesTrak or Space-Track would be required.
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel p-5 space-y-3">
      <h2 className="font-display font-semibold text-lg text-slate-200">{title}</h2>
      {children}
    </div>
  )
}

function FormulaBlock({ children }: { children: string }) {
  return (
    <pre className="font-mono text-xs text-accent-cyan bg-black/30 rounded-lg p-4 overflow-x-auto border border-accent-cyan/10">
      {children}
    </pre>
  )
}

function RiskRow({ level, range, color }: { level: string; range: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.02]">
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="font-mono text-slate-300">{level}</span>
      <span className="text-slate-600 ml-auto">{range}</span>
    </div>
  )
}

function DisclaimerBox() {
  return (
    <div className="rounded-lg border border-risk-moderate/30 bg-risk-moderate/5 p-4">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-risk-moderate/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-risk-moderate text-xs font-bold">!</span>
        </div>
        <div>
          <p className="text-sm font-medium text-risk-moderate">Approximate Results</p>
          <p className="text-xs text-slate-400 mt-1">
            This tool provides simplified estimates for educational and demonstration purposes.
            Full perturbation modeling (J2, atmospheric drag, solar radiation pressure) is not included.
            Do not use for operational collision avoidance decisions.
          </p>
        </div>
      </div>
    </div>
  )
}

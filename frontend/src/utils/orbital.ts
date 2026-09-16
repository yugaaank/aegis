const MU = 398600.4418
const DEG = Math.PI / 180

export function solveKepler(M: number, e: number): number {
  let E = M
  for (let i = 0; i < 20; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E -= dE
    if (Math.abs(dE) < 1e-10) break
  }
  return E
}

export function getPosition(
  a: number, e: number, inc: number, raan: number, argp: number, M0: number, t: number
): [number, number, number] {
  const n = Math.sqrt(MU / (a * a * a))
  const M = ((M0 * DEG + n * t) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  const E = solveKepler(M, e)
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  )
  const r = a * (1 - e * e) / (1 + e * Math.cos(nu))
  const xOrb = r * Math.cos(nu)
  const yOrb = r * Math.sin(nu)
  const cosA = Math.cos(argp * DEG), sinA = Math.sin(argp * DEG)
  const cosI = Math.cos(inc * DEG), sinI = Math.sin(inc * DEG)
  const cosR = Math.cos(raan * DEG), sinR = Math.sin(raan * DEG)
  const x = (cosA * cosR - sinA * sinR * cosI) * xOrb + (-sinA * cosR - cosA * sinR * cosI) * yOrb
  const y = (cosA * sinR + sinA * cosR * cosI) * xOrb + (-sinA * sinR + cosA * cosR * cosI) * yOrb
  const z = (sinA * sinI) * xOrb + (cosA * sinI) * yOrb
  return [x, z, -y]
}

export function distanceBetween(
  a1: { semi_major_axis_km: number; eccentricity: number; inclination_deg: number; raan_deg: number; arg_perigee_deg: number; mean_anomaly_deg: number },
  a2: { semi_major_axis_km: number; eccentricity: number; inclination_deg: number; raan_deg: number; arg_perigee_deg: number; mean_anomaly_deg: number },
  t: number
): number {
  const p1 = getPosition(a1.semi_major_axis_km, a1.eccentricity, a1.inclination_deg, a1.raan_deg, a1.arg_perigee_deg, a1.mean_anomaly_deg, t)
  const p2 = getPosition(a2.semi_major_axis_km, a2.eccentricity, a2.inclination_deg, a2.raan_deg, a2.arg_perigee_deg, a2.mean_anomaly_deg, t)
  const dx = p1[0] - p2[0]
  const dy = p1[1] - p2[1]
  const dz = p1[2] - p2[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function computeOrbitPath(
  a: number, e: number, inc: number, raan: number, argp: number,
  steps = 128
): [number, number, number][] {
  const points: [number, number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const nu = (i / steps) * 2 * Math.PI
    const r = a * (1 - e * e) / (1 + e * Math.cos(nu))
    const xOrb = r * Math.cos(nu)
    const yOrb = r * Math.sin(nu)
    const cosA = Math.cos(argp * DEG), sinA = Math.sin(argp * DEG)
    const cosI = Math.cos(inc * DEG), sinI = Math.sin(inc * DEG)
    const cosR = Math.cos(raan * DEG), sinR = Math.sin(raan * DEG)
    const x = (cosA * cosR - sinA * sinR * cosI) * xOrb + (-sinA * cosR - cosA * sinR * cosI) * yOrb
    const y = (cosA * sinR + sinA * cosR * cosI) * xOrb + (-sinA * sinR + cosA * cosR * cosI) * yOrb
    const z = (sinA * sinI) * xOrb + (cosA * sinI) * yOrb
    points.push([x, z, -y])
  }
  return points
}
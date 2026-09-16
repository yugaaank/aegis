import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'
import { RISK_COLORS } from '../../types'

const MU = 398600.4418
const DEG = Math.PI / 180

function solveKepler(M: number, e: number): number {
  let E = M
  for (let i = 0; i < 20; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E -= dE
    if (Math.abs(dE) < 1e-10) break
  }
  return E
}

function getPosition(
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

function DebrisDot({ debris, riskLevel }: { debris: any; riskLevel?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { currentTime } = useSimulationStore()
  const color = riskLevel ? RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] : '#f97316'

  useFrame(() => {
    if (!meshRef.current) return
    const oe = debris.orbital_elements
    const [x, y, z] = getPosition(
      oe.semi_major_axis_km, oe.eccentricity, oe.inclination_deg,
      oe.raan_deg, oe.arg_perigee_deg, oe.mean_anomaly_deg, currentTime
    )
    meshRef.current.position.set(x, y, z)
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[30, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  )
}

export default function DebrisMarkers() {
  const { debrisList, result } = useSimulationStore()

  const riskMap = useMemo(() => {
    if (!result) return {}
    const map: Record<string, string> = {}
    result.approaches.forEach((a) => { map[a.debris_id] = a.risk_level })
    return map
  }, [result])

  return (
    <group>
      {debrisList.map((d) => (
        <DebrisDot key={d.id} debris={d} riskLevel={riskMap[d.id]} />
      ))}
    </group>
  )
}

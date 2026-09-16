import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'

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

export default function ClosestApproachLine() {
  const { satellite, debrisList, result, currentTime, selectedObject } = useSimulationStore()
  const groupRef = useRef<THREE.Group>(null)

  const closestPair = useMemo(() => {
    if (!result || result.approaches.length === 0) return null
    if (selectedObject) {
      return result.approaches.find((a) => a.debris_id === selectedObject) || result.approaches[0]
    }
    return result.approaches[0]
  }, [result, selectedObject])

  const debrisObj = useMemo(() => {
    if (!closestPair) return null
    return debrisList.find((d) => d.id === closestPair.debris_id)
  }, [closestPair, debrisList])

  useFrame(() => {
    if (!groupRef.current || !satellite || !debrisObj || !closestPair) return

    const satOe = satellite.orbital_elements
    const debOe = debrisObj.orbital_elements

    const satPos = getPosition(
      satOe.semi_major_axis_km, satOe.eccentricity, satOe.inclination_deg,
      satOe.raan_deg, satOe.arg_perigee_deg, satOe.mean_anomaly_deg, currentTime
    )
    const debPos = getPosition(
      debOe.semi_major_axis_km, debOe.eccentricity, debOe.inclination_deg,
      debOe.raan_deg, debOe.arg_perigee_deg, debOe.mean_anomaly_deg, currentTime
    )

    const children = groupRef.current.children
    if (children.length >= 2) {
      children[0].position.set(...satPos)
      children[1].position.set(...debPos)
    }
  })

  if (!closestPair || !debrisObj || !satellite) return null

  const satOe = satellite.orbital_elements
  const debOe = debrisObj.orbital_elements
  const satPos = getPosition(
    satOe.semi_major_axis_km, satOe.eccentricity, satOe.inclination_deg,
    satOe.raan_deg, satOe.arg_perigee_deg, satOe.mean_anomaly_deg, currentTime
  )
  const debPos = getPosition(
    debOe.semi_major_axis_km, debOe.eccentricity, debOe.inclination_deg,
    debOe.raan_deg, debOe.arg_perigee_deg, debOe.mean_anomaly_deg, currentTime
  )

  const color = closestPair.risk_level === 'CRITICAL' ? '#ef4444'
    : closestPair.risk_level === 'HIGH' ? '#f97316'
    : '#eab308'

  return (
    <group ref={groupRef}>
      <mesh position={satPos as any}>
        <sphereGeometry args={[80, 16, 16]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <mesh position={debPos as any}>
        <sphereGeometry args={[30, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Line
        points={[satPos, debPos]}
        color={color}
        lineWidth={2}
        transparent
        opacity={0.8}
        dashed
        dashSize={200}
        gapSize={100}
      />
    </group>
  )
}

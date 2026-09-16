import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'
import { getPosition } from '../../utils/orbital'

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
        <meshBasicMaterial color="#0070d1" />
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
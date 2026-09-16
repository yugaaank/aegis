import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'
import { getPosition, distanceBetween } from '../../utils/orbital'

function DebrisDot({ debris }: { debris: any }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { satellite, currentTime, result, selectedObject, selectObject } = useSimulationStore()

  const isSelected = selectedObject === debris.id

  const riskColor = useMemo(() => {
    if (!result) return '#d53b00'
    const approach = result.approaches.find((a: any) => a.debris_id === debris.id)
    if (!approach) return '#d53b00'
    switch (approach.risk_level) {
      case 'CRITICAL': return '#ef4444'
      case 'HIGH': return '#f97316'
      case 'MODERATE': return '#eab308'
      case 'LOW': return '#22c55e'
      default: return '#d53b00'
    }
  }, [result, debris.id])

  const distColor = useMemo(() => {
    if (!satellite || !result) return riskColor
    const approach = result.approaches.find((a: any) => a.debris_id === debris.id)
    if (!approach) return riskColor
    const d = approach.min_distance_km
    if (d < 100) return '#ef4444'
    if (d < 300) return '#f97316'
    if (d < 500) return '#eab308'
    return '#22c55e'
  }, [satellite, result, debris.id, riskColor])

  const color = satellite ? distColor : riskColor

  useFrame(() => {
    if (!meshRef.current) return
    const oe = debris.orbital_elements
    const [x, y, z] = getPosition(
      oe.semi_major_axis_km, oe.eccentricity, oe.inclination_deg,
      oe.raan_deg, oe.arg_perigee_deg, oe.mean_anomaly_deg, currentTime
    )
    meshRef.current.position.set(x, y, z)
  })

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    selectObject(isSelected ? null : debris.id)
  }, [debris.id, isSelected, selectObject])

  return (
    <group>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[isSelected ? 45 : 30, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 1 : 0.8} />
      </mesh>
    </group>
  )
}

export default function DebrisMarkers() {
  const { debrisList } = useSimulationStore()

  return (
    <group>
      {debrisList.map((d) => (
        <DebrisDot key={d.id} debris={d} />
      ))}
    </group>
  )
}
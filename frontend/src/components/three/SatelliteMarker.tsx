import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'
import { getPosition } from '../../utils/orbital'

export default function SatelliteMarker() {
  const groupRef = useRef<THREE.Group>(null)
  const { satellite, currentTime } = useSimulationStore()

  useFrame(() => {
    if (!satellite || !groupRef.current) return
    const oe = satellite.orbital_elements
    const [x, y, z] = getPosition(
      oe.semi_major_axis_km, oe.eccentricity, oe.inclination_deg,
      oe.raan_deg, oe.arg_perigee_deg, oe.mean_anomaly_deg, currentTime
    )
    groupRef.current.position.set(x, y, z)
  })

  if (!satellite) return null

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[80, 16, 16]} />
        <meshBasicMaterial color="#0070d1" />
      </mesh>
      <mesh>
        <sphereGeometry args={[140, 16, 16]} />
        <meshBasicMaterial color="#0070d1" transparent opacity={0.12} />
      </mesh>
      <pointLight color="#0070d1" intensity={2} distance={500} />
    </group>
  )
}
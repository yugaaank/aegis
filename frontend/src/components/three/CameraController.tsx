import { useRef, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'
import { getPosition } from '../../utils/orbital'

export default function CameraController() {
  const { selectedObject, satellite, currentTime } = useSimulationStore()
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 8000, 12000))
  const isAnimating = useRef(false)

  useEffect(() => {
    if (selectedObject && satellite) {
      const oe = satellite.orbital_elements
      const [x, y, z] = getPosition(
        oe.semi_major_axis_km, oe.eccentricity, oe.inclination_deg,
        oe.raan_deg, oe.arg_perigee_deg, oe.mean_anomaly_deg, currentTime
      )
      const dist = 12000
      targetPos.current.set(x + dist * 0.5, y + dist * 0.7, z + dist)
      isAnimating.current = true
    } else {
      targetPos.current.set(0, 8000, 12000)
      isAnimating.current = true
    }
  }, [selectedObject, satellite, currentTime])

  useFrame(() => {
    if (!isAnimating.current || !controlsRef.current) return
    camera.position.lerp(targetPos.current, 0.03)
    if (camera.position.distanceTo(targetPos.current) < 50) {
      isAnimating.current = false
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={7000}
      maxDistance={40000}
      autoRotate={!selectedObject}
      autoRotateSpeed={0.3}
      dampingFactor={0.05}
      enableDamping
    />
  )
}
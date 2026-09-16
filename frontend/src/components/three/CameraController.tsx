import { OrbitControls } from '@react-three/drei'
import { useSimulationStore } from '../../store/simulationStore'

export default function CameraController() {
  const { selectedObject } = useSimulationStore()

  return (
    <OrbitControls
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

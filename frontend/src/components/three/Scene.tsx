import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Earth from './Earth'
import OrbitPaths from './OrbitPath'
import SatelliteMarker from './SatelliteMarker'
import DebrisMarkers from './DebrisMarker'
import ClosestApproachLine from './ClosestApproachLine'
import Starfield from './Starfield'
import CameraController from './CameraController'

export default function Scene({ height = '100%' }: { height?: string }) {
  return (
    <div className="relative w-full" style={{ height }}>
      <Canvas
        camera={{ position: [0, 8000, 12000], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.15} />
          <directionalLight position={[5000, 3000, 5000]} intensity={1.2} color="#e0f0ff" />
          <directionalLight position={[-3000, -1000, -3000]} intensity={0.3} color="#06b6d4" />

          <Starfield />
          <Earth />
          <OrbitPaths />
          <SatelliteMarker />
          <DebrisMarkers />
          <ClosestApproachLine />
          <CameraController />
        </Suspense>
      </Canvas>

      <div className="scanline-overlay rounded-xl" />
    </div>
  )
}

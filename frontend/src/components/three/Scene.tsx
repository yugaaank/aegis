import { Canvas } from '@react-three/fiber'
import Earth from './Earth'
import OrbitPaths from './OrbitPath'
import SatelliteMarker from './SatelliteMarker'
import DebrisMarkers from './DebrisMarker'
import Starfield from './Starfield'
import CameraController from './CameraController'

export default function Scene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 8000, 12000], fov: 45, near: 1, far: 100000 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000')
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ambientLight intensity={0.15} color="#b0c4de" />
        <directionalLight position={[10000, 3000, 5000]} intensity={2.5} color="#fff5e6" castShadow />
        <hemisphereLight args={['#4488cc', '#223322', 0.25]} />

        <Starfield />
        <Earth />
        <OrbitPaths />
        <SatelliteMarker />
        <DebrisMarkers />
        <CameraController />
      </Canvas>
    </div>
  )
}

import { useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import Earth from './Earth'
import OrbitPaths from './OrbitPath'
import SatelliteMarker from './SatelliteMarker'
import DebrisMarkers from './DebrisMarker'
import Starfield from './Starfield'
import CameraController from './CameraController'

export default function Scene() {
  const [domElement, setDomElement] = useState<EventTarget | null>(null)
  const overlayRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setDomElement(node)
  }, [])

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
        <CameraController domElement={domElement as HTMLElement} />
      </Canvas>
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{ pointerEvents: 'auto', zIndex: 1 }}
      />
    </div>
  )
}

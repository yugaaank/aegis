import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const R_EARTH = 6371

export default function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  const earthMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: '#1a3a5c',
      emissive: '#0a1628',
      shininess: 25,
      transparent: true,
      opacity: 0.95,
    })
  }, [])

  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color('#06b6d4') },
        viewVector: { value: new THREE.Vector3(0, 0, 12000) },
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.6);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    })
  }, [])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02
    }
  })

  return (
    <group>
      <mesh ref={meshRef} material={earthMaterial}>
        <sphereGeometry args={[R_EARTH, 64, 64]} />
      </mesh>
      <mesh ref={glowRef} material={glowMaterial} scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[R_EARTH, 64, 64]} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R_EARTH + 0.5, 64, 64]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.05} />
      </mesh>
    </group>
  )
}

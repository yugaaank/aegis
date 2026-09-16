import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { useSimulationStore } from '../../store/simulationStore'

const MU = 398600.4418
const R_EARTH = 6371

function computeOrbitPath(
  a: number, e: number, inc: number, raan: number, argp: number,
  steps = 128
): [number, number, number][] {
  const points: [number, number, number][] = []
  const DEG = Math.PI / 180

  for (let i = 0; i <= steps; i++) {
    const nu = (i / steps) * 2 * Math.PI
    const r = a * (1 - e * e) / (1 + e * Math.cos(nu))

    const xOrb = r * Math.cos(nu)
    const yOrb = r * Math.sin(nu)

    const cosA = Math.cos(argp * DEG)
    const sinA = Math.sin(argp * DEG)
    const cosI = Math.cos(inc * DEG)
    const sinI = Math.sin(inc * DEG)
    const cosR = Math.cos(raan * DEG)
    const sinR = Math.sin(raan * DEG)

    const x = (cosA * cosR - sinA * sinR * cosI) * xOrb + (-sinA * cosR - cosA * sinR * cosI) * yOrb
    const y = (cosA * sinR + sinA * cosR * cosI) * xOrb + (-sinA * sinR + cosA * cosR * cosI) * yOrb
    const z = (sinA * sinI) * xOrb + (cosA * sinI) * yOrb

    points.push([x, z, -y])
  }
  return points
}

export default function OrbitPaths() {
  const { satellite, debrisList } = useSimulationStore()

  const satOrbit = useMemo(() => {
    if (!satellite) return null
    const oe = satellite.orbital_elements
    return computeOrbitPath(oe.semi_major_axis_km, oe.eccentricity, oe.inclination_deg, oe.raan_deg, oe.arg_perigee_deg)
  }, [satellite])

  const debrisOrbits = useMemo(() => {
    return debrisList.map((d) => {
      const oe = d.orbital_elements
      return {
        id: d.id,
        points: computeOrbitPath(oe.semi_major_axis_km, oe.eccentricity, oe.inclination_deg, oe.raan_deg, oe.arg_perigee_deg),
      }
    })
  }, [debrisList])

  return (
    <group>
      {satOrbit && (
        <Line
          points={satOrbit}
          color="#06b6d4"
          lineWidth={1.5}
          transparent
          opacity={0.6}
        />
      )}
      {debrisOrbits.map((orbit) => (
        <Line
          key={orbit.id}
          points={orbit.points}
          color="#f97316"
          lineWidth={0.5}
          transparent
          opacity={0.2}
        />
      ))}
    </group>
  )
}

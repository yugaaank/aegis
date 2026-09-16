import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { useSimulationStore } from '../../store/simulationStore'
import { computeOrbitPath } from '../../utils/orbital'

export default function OrbitPaths() {
  const { satellite, debrisList, result } = useSimulationStore()

  const nearbyDebrisIds = useMemo(() => {
    if (!result) return new Set<string>()
    return new Set(
      result.approaches
        .filter((a) => a.min_distance_km < 500)
        .map((a) => a.debris_id)
    )
  }, [result])

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
        isNearby: nearbyDebrisIds.has(d.id),
      }
    })
  }, [debrisList, nearbyDebrisIds])

  return (
    <group>
      {satOrbit && (
        <Line
          points={satOrbit}
          color="#0070d1"
          lineWidth={1.5}
          transparent
          opacity={0.6}
        />
      )}
      {debrisOrbits.map((orbit) => (
        <Line
          key={orbit.id}
          points={orbit.points}
          color={orbit.isNearby ? '#f97316' : '#d53b00'}
          lineWidth={orbit.isNearby ? 1.2 : 0.3}
          transparent
          opacity={orbit.isNearby ? 0.5 : 0.1}
        />
      ))}
    </group>
  )
}
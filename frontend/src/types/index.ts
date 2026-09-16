export interface OrbitalElements {
  semi_major_axis_km: number
  eccentricity: number
  inclination_deg: number
  raan_deg: number
  arg_perigee_deg: number
  mean_anomaly_deg: number
}

export interface SpaceObject {
  id: string
  name: string
  type: 'satellite' | 'debris'
  orbital_elements: OrbitalElements
}

export interface ClosestApproachResult {
  debris_id: string
  debris_name: string
  min_distance_km: number
  time_to_closest_s: number
  relative_velocity_km_s: number
  risk_score: number
  risk_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
}

export interface SimulationResponse {
  satellite: SpaceObject
  debris_count: number
  time_window_hours: number
  propagation_dt_s: number
  approaches: ClosestApproachResult[]
  timestamp: string
}

export interface SimulationRequest {
  satellite: SpaceObject
  debris: SpaceObject[]
  time_window_hours: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ObjectListResponse {
  satellite: SpaceObject
  debris: SpaceObject[]
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'

export const RISK_COLORS: Record<RiskLevel, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MODERATE: '#eab308',
  LOW: '#22c55e',
}

export const RISK_BG: Record<RiskLevel, string> = {
  CRITICAL: 'rgba(239, 68, 68, 0.15)',
  HIGH: 'rgba(249, 115, 22, 0.15)',
  MODERATE: 'rgba(234, 179, 8, 0.15)',
  LOW: 'rgba(34, 197, 94, 0.15)',
}

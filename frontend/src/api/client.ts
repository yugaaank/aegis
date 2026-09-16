import axios from 'axios'
import type {
  SimulationRequest,
  SimulationResponse,
  ObjectListResponse,
  ValidationResult,
  SpaceObject,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

export async function healthCheck(): Promise<{ status: string }> {
  const { data } = await client.get('/health')
  return data
}

export async function getObjects(): Promise<ObjectListResponse> {
  const { data } = await client.get('/objects')
  return data
}

export async function validateObject(
  orbital_elements: SpaceObject['orbital_elements']
): Promise<ValidationResult> {
  const { data } = await client.post('/validate', { orbital_elements })
  return data
}

export async function runSimulation(
  req: SimulationRequest
): Promise<SimulationResponse> {
  const { data } = await client.post('/simulate', req)
  return data
}

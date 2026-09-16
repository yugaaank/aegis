import { create } from 'zustand'
import type { SpaceObject, SimulationResponse, ClosestApproachResult } from '../types'
import { runSimulation, getObjects } from '../api/client'

interface SimulationState {
  satellite: SpaceObject | null
  debrisList: SpaceObject[]
  result: SimulationResponse | null
  isRunning: boolean
  isPlaying: boolean
  playbackSpeed: number
  currentTime: number
  selectedObject: string | null
  sidebarOpen: boolean
  timeWindowHours: number

  setSatellite: (s: SpaceObject) => void
  addDebris: (d: SpaceObject) => void
  removeDebris: (id: string) => void
  loadDebris: (list: SpaceObject[]) => void
  loadDemoData: () => Promise<void>
  runSim: () => Promise<void>
  setPlaybackSpeed: (speed: number) => void
  setCurrentTime: (t: number) => void
  setIsPlaying: (p: boolean) => void
  selectObject: (id: string | null) => void
  toggleSidebar: () => void
  setTimeWindow: (h: number) => void
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  satellite: null,
  debrisList: [],
  result: null,
  isRunning: false,
  isPlaying: false,
  playbackSpeed: 1,
  currentTime: 0,
  selectedObject: null,
  sidebarOpen: true,
  timeWindowHours: 24,

  setSatellite: (s) => set({ satellite: s }),

  addDebris: (d) => set((state) => ({ debrisList: [...state.debrisList, d] })),

  removeDebris: (id) =>
    set((state) => ({
      debrisList: state.debrisList.filter((d) => d.id !== id),
    })),

  loadDebris: (list) => set({ debrisList: list }),

  loadDemoData: async () => {
    try {
      const data = await getObjects()
      set({ satellite: data.satellite, debrisList: data.debris })
    } catch (err) {
      console.error('Failed to load demo data:', err)
    }
  },

  runSim: async () => {
    const { satellite, debrisList, timeWindowHours } = get()
    if (!satellite || debrisList.length === 0) return

    set({ isRunning: true, result: null })
    try {
      const result = await runSimulation({
        satellite,
        debris: debrisList,
        time_window_hours: timeWindowHours,
      })
      set({ result, isPlaying: true, currentTime: 0 })
    } catch (err) {
      console.error('Simulation failed:', err)
    } finally {
      set({ isRunning: false })
    }
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setIsPlaying: (p) => set({ isPlaying: p }),
  selectObject: (id) => set({ selectedObject: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTimeWindow: (h) => set({ timeWindowHours: h }),
}))

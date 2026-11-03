import { create } from 'zustand'

interface RideState {
  speed: number // simulation rate multiplier (1 = nominal)
  riding: boolean
  hour: number // time of day, 0-24
  autoTime: boolean
  sound: boolean
  volume: number
  setSpeed: (speed: number) => void
  toggleRide: () => void
  setHour: (hour: number) => void
  setAutoTime: (on: boolean) => void
  setSound: (on: boolean) => void
  setVolume: (v: number) => void
}

export const useRideStore = create<RideState>((set) => ({
  speed: 1,
  riding: false,
  hour: 9,
  autoTime: true,
  sound: false,
  volume: 0.6,
  setSpeed: (speed) => set({ speed }),
  toggleRide: () => set((s) => ({ riding: !s.riding })),
  setHour: (hour) => set({ hour }),
  setAutoTime: (autoTime) => set({ autoTime }),
  setSound: (sound) => set({ sound }),
  setVolume: (volume) => set({ volume }),
}))

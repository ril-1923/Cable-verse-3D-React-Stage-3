import { create } from 'zustand'

export interface TicketStats {
  queue: [number, number] // waiting at summit, valley
  sold: number
  revenue: number
  turnedAway: number
  load: number // average seats filled, 0..1
}

interface TicketState {
  price: number
  capacity: number // passengers allowed per cabin
  stats: TicketStats
  setPrice: (price: number) => void
  setCapacity: (capacity: number) => void
}

export const useTicketStore = create<TicketState>((set) => ({
  price: 8,
  capacity: 5,
  stats: { queue: [4, 3], sold: 0, revenue: 0, turnedAway: 0, load: 0 },
  setPrice: (price) => set({ price }),
  setCapacity: (capacity) => set({ capacity }),
}))

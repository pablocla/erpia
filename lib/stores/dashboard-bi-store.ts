import { create } from "zustand"
import { startOfMonth, endOfMonth, format } from "date-fns"

interface DashboardBiState {
  globalDesde: string | null
  globalHasta: string | null
  sucursalId: number | null
  crossFilters: { campo: string; valor: string | number; etiqueta: string }[]

  setGlobalDesde: (date: string | null) => void
  setGlobalHasta: (date: string | null) => void
  setSucursalId: (id: number | null) => void
  addCrossFilter: (campo: string, valor: string | number, etiqueta: string) => void
  removeCrossFilter: (campo: string) => void
  resetFilters: () => void
}

const today = new Date()
const INITIAL_DESDE = format(startOfMonth(today), "yyyy-MM-dd")
const INITIAL_HASTA = format(endOfMonth(today), "yyyy-MM-dd")

export const useDashboardBiStore = create<DashboardBiState>((set) => ({
  globalDesde: INITIAL_DESDE,
  globalHasta: INITIAL_HASTA,
  sucursalId: null,
  crossFilters: [],

  setGlobalDesde: (date) => set({ globalDesde: date }),
  setGlobalHasta: (date) => set({ globalHasta: date }),
  setSucursalId: (id) => set({ sucursalId: id }),
  addCrossFilter: (campo, valor, etiqueta) => 
    set((state) => {
      const filtered = state.crossFilters.filter((f) => f.campo !== campo)
      return { crossFilters: [...filtered, { campo, valor, etiqueta }] }
    }),
  removeCrossFilter: (campo) => 
    set((state) => ({ crossFilters: state.crossFilters.filter((f) => f.campo !== campo) })),
  resetFilters: () =>
    set({
      globalDesde: INITIAL_DESDE,
      globalHasta: INITIAL_HASTA,
      sucursalId: null,
      crossFilters: [],
    }),
}))

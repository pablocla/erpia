import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

/* ═══════════════════════════════════════════════════════════════════════════
   CAJA / POS STORE — Point-of-sale cart & cash register state (Zustand)
   Manages: current cart, open caja session, payments in progress.
   Persists to localStorage so cart survives page refreshes.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CartItem {
  productoId: number
  codigo: string
  nombre: string
  cantidad: number
  precioUnitario: number
  descuento: number // percentage 0-100
  iva: number // percentage (21, 10.5, etc.)
  subtotal: number
  depositoId?: number
}

export interface CajaSession {
  id: number
  nombre: string
  sucursalId: number
  apertura: string // ISO date
  saldoInicial: number
  movimientos: number
}

export type PaymentMethod = "efectivo" | "tarjeta_debito" | "tarjeta_credito" | "transferencia" | "cheque" | "cuenta_corriente"

export interface PaymentLine {
  metodo: PaymentMethod
  monto: number
  referencia?: string
}

interface CajaState {
  // Cart
  items: CartItem[]
  clienteId: number | null
  clienteNombre: string | null
  listaPrecioId: number | null
  observaciones: string

  // Active caja session
  session: CajaSession | null

  // Payment in progress
  payments: PaymentLine[]

  // Cart actions
  addItem: (item: Omit<CartItem, "subtotal">) => void
  updateItem: (productoId: number, changes: Partial<CartItem>) => void
  removeItem: (productoId: number) => void
  clearCart: () => void
  setCliente: (id: number | null, nombre: string | null) => void
  setListaPrecio: (id: number | null) => void
  setObservaciones: (obs: string) => void

  // Session actions
  openSession: (session: CajaSession) => void
  closeSession: () => void

  // Payment actions
  addPayment: (payment: PaymentLine) => void
  removePayment: (index: number) => void
  clearPayments: () => void

  // Computed (call as functions)
  getSubtotal: () => number
  getIVA: () => number
  getTotal: () => number
  getPaymentTotal: () => number
  getSaldo: () => number
}

function calcSubtotal(item: Omit<CartItem, "subtotal">): number {
  const base = item.cantidad * item.precioUnitario
  return base * (1 - item.descuento / 100)
}

export const useCajaStore = create<CajaState>()(
  persist(
    (set, get) => ({
      items: [],
      clienteId: null,
      clienteNombre: null,
      listaPrecioId: null,
      observaciones: "",
      session: null,
      payments: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productoId === item.productoId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productoId === item.productoId
                  ? { ...i, cantidad: i.cantidad + item.cantidad, subtotal: calcSubtotal({ ...i, cantidad: i.cantidad + item.cantidad }) }
                  : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, subtotal: calcSubtotal(item) }] }
        }),

      updateItem: (productoId, changes) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productoId !== productoId) return i
            const updated = { ...i, ...changes }
            return { ...updated, subtotal: calcSubtotal(updated) }
          }),
        })),

      removeItem: (productoId) =>
        set((state) => ({ items: state.items.filter((i) => i.productoId !== productoId) })),

      clearCart: () =>
        set({ items: [], clienteId: null, clienteNombre: null, listaPrecioId: null, observaciones: "", payments: [] }),

      setCliente: (id, nombre) => set({ clienteId: id, clienteNombre: nombre }),
      setListaPrecio: (id) => set({ listaPrecioId: id }),
      setObservaciones: (obs) => set({ observaciones: obs }),

      openSession: (session) => set({ session }),
      closeSession: () => set({ session: null, items: [], payments: [] }),

      addPayment: (payment) =>
        set((state) => ({ payments: [...state.payments, payment] })),

      removePayment: (index) =>
        set((state) => ({ payments: state.payments.filter((_, i) => i !== index) })),

      clearPayments: () => set({ payments: [] }),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
      getIVA: () =>
        get().items.reduce((sum, i) => sum + i.subtotal * (i.iva / 100), 0),
      getTotal: () => {
        const s = get()
        return s.items.reduce((sum, i) => sum + i.subtotal * (1 + i.iva / 100), 0)
      },
      getPaymentTotal: () => get().payments.reduce((sum, p) => sum + p.monto, 0),
      getSaldo: () => get().getTotal() - get().getPaymentTotal(),
    }),
    {
      name: "erp-caja",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        clienteId: state.clienteId,
        clienteNombre: state.clienteNombre,
        listaPrecioId: state.listaPrecioId,
        observaciones: state.observaciones,
        session: state.session,
      }),
    },
  ),
)

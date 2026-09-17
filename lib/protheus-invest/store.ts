import { create } from "zustand"
import {
  ASIENTOS,
  BANKS,
  CLIENTES,
  CONNECTORS,
  FISCAL,
  INSTRUMENTS,
  INVESTS,
  VALORES,
  VALUACIONES,
  type Asiento,
  type Bank,
  type Cliente,
  type Connector,
  type FiscalLine,
  type Instrument,
  type Investment,
  type Valor,
  type Valuacion,
} from "./seed"
import {
  instrumentOf,
  lastValuacion,
  markToMarket,
  nextMarketPrice,
  seriesOf,
  splitRescue,
  theoreticalValue,
  TODAY,
} from "./invest"

type Toast = { id: number; msg: string }

export type NewInvest = {
  tipoId: string
  ticker: string
  nombre: string
  bancoId: string
  capital: number
  cantidad: number
  tasa: number
  inicio: string
  vence: string
  moneda: 1 | 2
}

export type LiveSource = "demo" | "protheus"

type State = {
  source: LiveSource
  banks: Bank[]
  invests: Investment[]
  instruments: Instrument[]
  valuaciones: Valuacion[]
  asientos: Asiento[]
  valores: Valor[]
  fiscal: FiscalLine[]
  clientes: Cliente[]
  connectors: Connector[]
  tc: number
  toasts: Toast[]
  syncing: boolean
  rescue: (id: string, input: { fecha: string; total: number }) => void
  deposit: (id: string) => void
  reject: (id: string) => void
  addInvest: (i: NewInvest) => void
  toggleConnector: (id: string) => void
  syncAll: () => void
  pushToast: (msg: string) => void
  dismiss: (id: number) => void
  reset: () => void
  hydrateFromProtheus: (payload: {
    banks?: Bank[]
    invests?: Investment[]
    instruments?: Instrument[]
    valuaciones?: Valuacion[]
    asientos?: Asiento[]
  }) => void
}

let tid = 1
let se5 = 10
let z03 = 40
let invSeq = INVESTS.length

const demoSnapshot = () => ({
  source: "demo" as const,
  banks: BANKS,
  invests: INVESTS,
  instruments: INSTRUMENTS,
  valuaciones: VALUACIONES,
  asientos: ASIENTOS,
  valores: VALORES,
  fiscal: FISCAL,
  clientes: CLIENTES,
  connectors: CONNECTORS,
  tc: 1482,
})

export const useCaja = create<State>((set, get) => ({
  ...demoSnapshot(),
  toasts: [],
  syncing: false,
  pushToast: (msg) => {
    const id = tid++
    set((s) => ({ toasts: [...s.toasts, { id, msg }] }))
    setTimeout(() => get().dismiss(id), 3200)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  hydrateFromProtheus: (payload) => {
    set({
      source: "protheus",
      banks: payload.banks?.length ? payload.banks : get().banks,
      invests: payload.invests ?? [],
      instruments: payload.instruments?.length ? payload.instruments : get().instruments,
      valuaciones: payload.valuaciones ?? [],
      asientos: payload.asientos ?? [],
    })
  },
  rescue: (id, input) => {
    const inv = get().invests.find((x) => x.id === id)
    if (!inv || inv.estado !== "activa") return
    const tipo = instrumentOf(get().instruments, inv.tipoId)
    const { capital, interes } = splitRescue(inv.capital, input.total)
    const rows: Asiento[] = []
    rows.push({
      id: `se5-${se5++}`,
      investId: inv.id,
      fecha: input.fecha,
      tipo: "NC",
      valor: capital,
      naturaleza: tipo?.natCap ?? "INV001",
      histor: `Rescate capital ${inv.ticker}`,
      bancoId: inv.bancoId,
    })
    if (interes > 0) {
      rows.push({
        id: `se5-${se5++}`,
        investId: inv.id,
        fecha: input.fecha,
        tipo: "NC",
        valor: interes,
        naturaleza: tipo?.natInt ?? "INT001",
        histor: `Intereses ${inv.ticker}`,
        bancoId: inv.bancoId,
      })
    } else if (interes < 0) {
      rows.push({
        id: `se5-${se5++}`,
        investId: inv.id,
        fecha: input.fecha,
        tipo: "ND",
        valor: Math.abs(interes),
        naturaleza: tipo?.natInt ?? "INT001",
        histor: `Perdida financiera ${inv.ticker}`,
        bancoId: inv.bancoId,
      })
    }
    set((s) => ({
      invests: s.invests.map((x) => (x.id === id ? { ...x, estado: "rescatada" as const, resultado: interes } : x)),
      banks: s.banks.map((b) => (b.id === inv.bancoId ? { ...b, saldo: b.saldo + input.total } : b)),
      asientos: [...s.asientos, ...rows],
    }))
    get().pushToast(
      interes >= 0
        ? "FINA100: NC capital + NC intereses. Vuelve a SA6."
        : "FINA100: NC capital y ND pérdida. Neto acreditado en SA6.",
    )
  },
  deposit: (id) => {
    const v = get().valores.find((x) => x.id === id)
    if (!v || v.estado !== "cartera") return
    set((s) => ({
      valores: s.valores.map((x) => (x.id === id ? { ...x, estado: "depositado" as const } : x)),
      banks: s.banks.map((b) => (b.id === v.bancoId ? { ...b, pendiente: b.pendiente + v.monto } : b)),
    }))
    get().pushToast(`${v.numero} depositado. Pendiente de acreditar en SA6.`)
  },
  reject: (id) => {
    const v = get().valores.find((x) => x.id === id)
    if (!v) return
    set((s) => ({
      valores: s.valores.map((x) => (x.id === id ? { ...x, estado: "rechazado" as const } : x)),
      clientes: s.clientes.map((c) =>
        c.cuit === v.cuit
          ? { ...c, chequesRechazados: c.chequesRechazados + 1, bcra: Math.min(5, c.bcra + 1) as 1 | 2 | 3 | 4 | 5 }
          : c,
      ),
    }))
    get().pushToast(`${v.numero} rechazado. Riesgo BCRA actualizado.`)
  },
  addInvest: (i) => {
    const bank = get().banks.find((b) => b.id === i.bancoId)
    const tipo = instrumentOf(get().instruments, i.tipoId)
    if (!bank || i.capital <= 0) return
    const cantidad = i.cantidad > 0 ? i.cantidad : 1
    const id = `INV${String(++invSeq).padStart(5, "0")}`
    const inv: Investment = {
      ...i,
      id,
      agencia: bank.agencia,
      cuenta: bank.cuenta,
      cantidad,
      preCom: Math.round((i.capital / cantidad) * 10000) / 10000,
      estado: "activa",
    }
    const nd: Asiento = {
      id: `se5-${se5++}`,
      investId: id,
      fecha: i.inicio,
      tipo: "ND",
      valor: i.capital,
      naturaleza: tipo?.natCap ?? "INV001",
      histor: `Inversion ${i.ticker}`,
      bancoId: i.bancoId,
    }
    const z: Valuacion = {
      id: `z03-${z03++}`,
      investId: id,
      fecha: i.inicio,
      precio: inv.preCom,
      valor: i.capital,
      rtoDia: 0,
      origen: "M",
    }
    set((s) => ({
      invests: [...s.invests, inv],
      banks: s.banks.map((b) => (b.id === i.bancoId ? { ...b, saldo: b.saldo - i.capital } : b)),
      asientos: [...s.asientos, nd],
      valuaciones: [...s.valuaciones, z],
    }))
    get().pushToast(`FINA100 ND ${tipo?.natCap ?? "INV001"}: sale de SA6 ${bank.sa6}.`)
  },
  toggleConnector: (id) =>
    set((s) => ({
      connectors: s.connectors.map((c) => (c.id === id ? { ...c, on: !c.on } : c)),
    })),
  syncAll: () => {
    set({ syncing: true })
    window.setTimeout(() => {
      const s = get()
      const ppiOn = s.connectors.find((c) => c.id === "ppi")?.on ?? false
      const nextVals = [...s.valuaciones]
      for (const inv of s.invests) {
        if (inv.estado !== "activa") continue
        const tipo = instrumentOf(s.instruments, inv.tipoId)
        if (!tipo) continue
        const last = lastValuacion(nextVals, inv.id)
        const prevDay = seriesOf(nextVals, inv.id)
          .filter((v) => v.fecha < TODAY)
          .at(-1)
        let precio: number
        let valor: number
        let origen: Valuacion["origen"]
        if (tipo.usaApi && ppiOn) {
          const base = last?.precio ?? inv.preCom
          precio = nextMarketPrice(base)
          valor = Math.round(precio * inv.cantidad)
          origen = "A"
        } else if (tipo.renta === "F") {
          valor = theoreticalValue(inv, TODAY)
          precio = inv.cantidad === 1 ? valor : Math.round((valor / inv.cantidad) * 10000) / 10000
          origen = "C"
        } else {
          continue
        }
        const rtoDia = valor - (prevDay?.valor ?? last?.valor ?? inv.capital)
        const row: Valuacion = {
          id: `z03-${z03++}`,
          investId: inv.id,
          fecha: TODAY,
          precio,
          valor,
          rtoDia,
          origen,
        }
        const idx = nextVals.findIndex((v) => v.investId === inv.id && v.fecha === TODAY)
        if (idx >= 0) nextVals[idx] = row
        else nextVals.push(row)
      }
      set({
        syncing: false,
        valuaciones: nextVals,
        tc: 1482 + Math.round(Math.random() * 8 - 3),
        connectors: s.connectors.map((c) => (c.on ? { ...c, lastSync: "2026-09-17 18:31" } : c)),
        banks: s.banks.map((b) =>
          b.id === "mp" ? { ...b, saldo: b.saldo + 124000, pendiente: Math.max(0, b.pendiente - 124000) } : b,
        ),
      })
      get().pushToast(ppiOn ? "Job Z03: PPI + devengamiento tasa fija. SE5 intacto." : "Sync sin PPI. Sólo tasa fija recalculada.")
    }, 900)
  },
  reset: () => {
    invSeq = INVESTS.length
    se5 = 10
    z03 = 40
    set({ ...demoSnapshot(), toasts: get().toasts })
  },
}))

export function totals(s: Pick<State, "banks" | "invests" | "valores" | "fiscal" | "valuaciones">) {
  const cajaBancos = s.banks.reduce((a, b) => a + b.saldo, 0)
  const pendiente = s.banks.reduce((a, b) => a + b.pendiente, 0)
  const activas = s.invests.filter((i) => i.estado === "activa")
  const capitalVigente = activas.reduce((a, i) => a + i.capital, 0)
  const investVigente = activas.reduce((a, i) => a + markToMarket(i, s.valuaciones), 0)
  const pnlInvertido = investVigente - capitalVigente
  const cartera = s.valores
    .filter((v) => v.estado === "cartera" || v.estado === "depositado")
    .reduce((a, v) => a + v.monto, 0)
  const percibido = s.fiscal.filter((f) => f.tipo === "percepcion").reduce((a, f) => a + f.monto, 0)
  const saldoFavor = s.fiscal.filter((f) => f.tipo === "saldo").reduce((a, f) => a + f.monto, 0)
  const entra = pendiente + cartera
  const teSacan = percibido
  const queda = cajaBancos - teSacan
  return { cajaBancos, pendiente, investVigente, capitalVigente, pnlInvertido, cartera, percibido, saldoFavor, entra, teSacan, queda }
}

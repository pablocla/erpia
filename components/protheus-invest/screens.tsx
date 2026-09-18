"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { PiBadge, PiButton, PiCard, PiInput } from "./ui"
import { totals, useCaja } from "@/lib/protheus-invest/store"
import { compact, dmy, money } from "@/lib/protheus-invest/format"
import { FORECAST } from "@/lib/protheus-invest/seed"
import { cn } from "@/lib/utils"
import type { Valor } from "@/lib/protheus-invest/seed"

export function CajaScreen({ onGo }: { onGo: (tab: string) => void }) {
  const s = useCaja()
  const t = totals(s)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Caja neta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lo que entra, lo que el fisco y las comisiones se llevan, lo que queda para girar. Saldos SA6.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Entra (7 días)" value={t.entra} hint="Cartera + pendiente de acreditar" tone="info" />
        <Kpi label="Te sacan" value={t.teSacan} hint="Percepciones IIBB / SIRCREB / SIRCUPA" tone="bad" />
        <Kpi label="Te queda" value={t.queda} hint="Bancos SA6 menos percibido" tone="ok" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <PiCard className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Proyección 30 días</h2>
            <span className="text-xs text-muted-foreground">millones ARS</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FORECAST}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3d9b8f" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3d9b8f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fill: "#8fa3b3", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#182430", border: "1px solid rgb(232 238 242 / 0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#e8eef2" }}
                />
                <Area type="monotone" dataKey="queda" stroke="#3d9b8f" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PiCard>

        <PiCard className="flex flex-col gap-3 p-5 lg:col-span-2">
          <h2 className="text-sm font-medium">Posición SA6</h2>
          {s.banks.map((b) => (
            <div key={b.id} className="flex items-start justify-between gap-3 border-t border-border pt-3 first:border-0 first:pt-0">
              <div>
                <div className="text-sm">{b.name}</div>
                <div className="text-[11px] text-muted-foreground">SA6 {b.sa6} · {b.cbu}</div>
              </div>
              <div className="text-right">
                <div className="tabular-nums text-sm">{compact(b.saldo)}</div>
                <div className="text-[11px] text-muted-foreground">pend. {compact(b.pendiente)}</div>
              </div>
            </div>
          ))}
          <div className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">
            Inversiones MTM {money(t.investVigente)}
            <span className={t.pnlInvertido >= 0 ? " text-[oklch(0.72_0.14_145)]" : " text-destructive"}>
              {" "}
              ({t.pnlInvertido >= 0 ? "+" : ""}
              {compact(t.pnlInvertido)})
            </span>
            {" · "}TC BCRA {s.tc}
          </div>
        </PiCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini onClick={() => onGo("cartera")} title="Cartera" value={compact(t.cartera)} sub="eCheqs por acreditar" />
        <Mini onClick={() => onGo("invest")} title="Invertido (MTM)" value={compact(t.investVigente)} sub="Z03 mark-to-market" />
        <Mini onClick={() => onGo("fiscal")} title="Saldo a favor IIBB" value={compact(t.saldoFavor)} sub="plata trabada en el fisco" />
        <Mini onClick={() => onGo("riesgo")} title="Clientes en 3+" value={String(s.clientes.filter((c) => c.bcra >= 3).length)} sub="bloqueo de pedido SC5" />
      </div>
    </div>
  )
}

function Kpi({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: "ok" | "bad" | "info" }) {
  const color = tone === "ok" ? "text-[oklch(0.72_0.14_145)]" : tone === "bad" ? "text-destructive" : "text-primary"
  return (
    <PiCard className="p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 tabular-nums text-2xl font-medium ${color}`}>{money(value)}</div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </PiCard>
  )
}

function Mini({ onClick, title, value, sub }: { onClick: () => void; title: string; value: string; sub: string }) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <PiCard className="p-4 transition-colors hover:bg-secondary">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="mt-1 tabular-nums text-lg">{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </PiCard>
    </button>
  )
}

const TONE: Record<Valor["estado"], "neutral" | "ok" | "warn" | "bad" | "info"> = {
  cartera: "info",
  depositado: "warn",
  descontado: "warn",
  acreditado: "ok",
  rechazado: "bad",
}

export function CarteraScreen() {
  const { valores, banks, deposit, reject } = useCaja()
  const viva = valores.filter((v) => v.estado === "cartera" || v.estado === "depositado").reduce((a, v) => a + v.monto, 0)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Cartera eCheq</h1>
        <p className="mt-1 text-sm text-muted-foreground">Plata que todavía no es plata. En cartera {money(viva)}.</p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Valor", "Cliente", "Banco", "Vence", "Monto", "Estado", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {valores.map((v) => {
              const bank = banks.find((b) => b.id === v.bancoId)
              return (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.numero}</div>
                    <div className="text-xs text-muted-foreground">{v.tipo}</div>
                  </td>
                  <td className="px-4 py-3">
                    {v.cliente}
                    <div className="text-xs text-muted-foreground">{v.cuit}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{bank?.sa6}</td>
                  <td className="px-4 py-3 tabular-nums">{dmy(v.vence)}</td>
                  <td className="px-4 py-3 tabular-nums">{money(v.monto)}</td>
                  <td className="px-4 py-3">
                    <PiBadge tone={TONE[v.estado]}>{v.estado}</PiBadge>
                  </td>
                  <td className="px-4 py-3">
                    {v.estado === "cartera" && (
                      <div className="flex gap-2">
                        <PiButton size="sm" onClick={() => deposit(v.id)}>Depositar</PiButton>
                        <PiButton size="sm" variant="ghost" onClick={() => reject(v.id)}>Rechazo</PiButton>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function FiscalScreen() {
  const s = useCaja()
  const t = totals(s)
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Caja fiscal</h1>
        <p className="mt-1 text-sm text-muted-foreground">Facturaste más de lo que te dejan. El saldo a favor no es caja.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <PiCard className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Percibido esta semana</div>
          <div className="mt-2 tabular-nums text-2xl text-destructive">{money(t.percibido)}</div>
        </PiCard>
        <PiCard className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Saldo a favor IIBB</div>
          <div className="mt-2 tabular-nums text-2xl text-[oklch(0.78_0.12_80)]">{money(t.saldoFavor)}</div>
        </PiCard>
        <PiCard className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Caja neta post fisco</div>
          <div className="mt-2 tabular-nums text-2xl text-[oklch(0.72_0.14_145)]">{money(t.queda)}</div>
        </PiCard>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Fecha", "Impuesto", "Jurisdicción", "Tipo", "Origen", "Monto"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.fiscal.map((f) => (
              <tr key={f.id} className="border-t border-border">
                <td className="px-4 py-3 tabular-nums">{dmy(f.fecha)}</td>
                <td className="px-4 py-3">{f.impuesto}</td>
                <td className="px-4 py-3">{f.jur}</td>
                <td className="px-4 py-3">
                  <PiBadge tone={f.tipo === "saldo" ? "warn" : f.tipo === "percepcion" ? "bad" : "info"}>{f.tipo}</PiBadge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{f.origen}</td>
                <td className="px-4 py-3 tabular-nums">{money(f.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function RiesgoScreen() {
  const clientes = useCaja((s) => s.clientes)
  const pushToast = useCaja((s) => s.pushToast)
  const [q, setQ] = useState("")
  const found = useMemo(() => {
    const n = q.replace(/\D/g, "")
    if (n.length < 5) return null
    return clientes.find((c) => c.cuit.replace(/\D/g, "").includes(n)) ?? null
  }, [q, clientes])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Riesgo al pedido</h1>
        <p className="mt-1 text-sm text-muted-foreground">Consultá CUIT contra BCRA + constancia ARCA antes de confirmar SC5.</p>
      </header>
      <PiCard className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <label className="flex-1">
          <div className="mb-1.5 text-xs text-muted-foreground">CUIT / cliente</div>
          <PiInput placeholder="30-55556666-7" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <PiButton
          variant="secondary"
          onClick={() => {
            if (found) {
              if (found.bcra >= 3) pushToast(`Bloquear pedido: ${found.nombre} situación ${found.bcra}`)
              else pushToast(`${found.nombre} OK para confirmar SC5`)
            } else pushToast("CUIT no está en padrones demo. Probá 30555566667.")
          }}
        >
          Consultar APIs
        </PiButton>
      </PiCard>
      {found && (
        <PiCard className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <div className="text-lg font-medium">{found.nombre}</div>
            <div className="text-sm text-muted-foreground">{found.cuit}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PiBadge tone={found.bcra <= 2 ? "ok" : found.bcra === 3 ? "warn" : "bad"}>BCRA sit. {found.bcra}</PiBadge>
            <PiBadge tone={found.chequesRechazados ? "bad" : "ok"}>{found.chequesRechazados} cheques rechazados</PiBadge>
            <PiBadge tone={found.estadoCuit === "activo" ? "ok" : "bad"}>{found.estadoCuit}</PiBadge>
            <PiBadge>{found.iva}</PiBadge>
          </div>
        </PiCard>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Cliente", "CUIT", "BCRA", "Rechazos", "IVA", "Límite"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">{c.nombre}</td>
                <td className="px-4 py-3 tabular-nums">{c.cuit}</td>
                <td className="px-4 py-3">{c.bcra}</td>
                <td className="px-4 py-3">{c.chequesRechazados}</td>
                <td className="px-4 py-3">{c.iva}</td>
                <td className="px-4 py-3 tabular-nums">{money(c.limite)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ConectoresScreen() {
  const { connectors, toggleConnector } = useCaja()
  const onlyPpi = connectors.filter((c) => c.id === "ppi")
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Job PPI → Z03</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Instrumentos con Z01_USAAPI=1. El job de las 18:30 pisa precio de cierre; no genera SE5.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {onlyPpi.map((c) => (
          <PiCard key={c.id} className="flex items-start justify-between gap-4 p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                <PiBadge tone={c.on ? "ok" : "neutral"}>{c.on ? "on" : "off"}</PiBadge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.source}</p>
              {c.lastSync && <p className="mt-2 text-xs text-muted-foreground">Último sync {c.lastSync}</p>}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={c.on}
              onClick={() => toggleConnector(c.id)}
              className={cn("relative h-7 w-12 shrink-0 rounded-full", c.on ? "bg-primary" : "bg-muted")}
            >
              <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-foreground transition-transform", c.on && "translate-x-5")} />
            </button>
          </PiCard>
        ))}
      </div>
    </div>
  )
}

export function BoletinScreen() {
  const rows = [
    ["Z01", "Tipos de instrumento", "Maestro paramétrico. Renta F/V/M, USAAPI, naturalezas SED."],
    ["Z02", "Operación (cabecera)", "Alta = ND FINA100. Status 1 activa / 2 rescatada."],
    ["Z03", "Valuación diaria", "1 fila por día. Job 18:30 o API PPI. No toca SE5."],
    ["SA6", "Banco / broker", "A6_COD + agencia + cuenta. De ahí sale y vuelve la plata."],
    ["SED", "Naturalezas", "Z01_NATCAP / Z01_NATINT. Capital vs interés en contabilidad."],
    ["SE5", "Movimientos", "Sólo via ExecAuto FINA100. ND alta, NC rescate."],
  ]
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Boletín técnico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lo que el socio dejó en alineamientos, compilable. Protheus sigue siendo el system of record.
        </p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Tabla", "Rol", "Contrato"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-border">
                <td className="px-4 py-3 font-medium tabular-nums">{r[0]}</td>
                <td className="px-4 py-3">{r[1]}</td>
                <td className="px-4 py-3 text-muted-foreground">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PiCard className="p-5 text-sm text-muted-foreground">
        REST: <code className="text-primary">/api/claver/v1/investments/*</code> en CLVINV01.PRW. Compilar después de crear SX3.
        Health: <code className="text-primary">GET …/health</code>. Esta página lo prueba con el panel de arriba.
      </PiCard>
    </div>
  )
}

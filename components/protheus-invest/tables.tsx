"use client"

import { PiBadge, PiCard } from "./ui"
import { totals, useCaja } from "@/lib/protheus-invest/store"
import { compact, dmy, money, price } from "@/lib/protheus-invest/format"
import {
  ORIGEN_LABEL,
  RENTA_LABEL,
  lastValuacion,
  markToMarket,
  seriesOf,
} from "@/lib/protheus-invest/invest"
import { cn } from "@/lib/utils"

export function Sa6Screen() {
  const s = useCaja()
  const t = totals(s)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Bancos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          De acá sale el capital (ND) y acá vuelve el rescate (NC). Agencia y cuenta viajan en Z02.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Saldo SA6" value={money(t.cajaBancos)} hint="Suma de cuentas" />
        <Kpi label="Invertido MTM" value={money(t.investVigente)} hint="Z03 del día" />
        <Kpi
          label="Resultado no realizado"
          value={money(t.pnlInvertido)}
          hint="Valuación menos capital"
          tone={t.pnlInvertido >= 0 ? "ok" : "bad"}
        />
      </div>
      <div className="grid gap-3">
        {s.banks.map((b) => (
          <PiCard key={b.id} className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="font-medium">{b.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                SA6 {b.sa6} · agencia {b.agencia} · cta {b.cuenta}
              </div>
              <div className="text-xs text-muted-foreground">CBU {b.cbu}</div>
            </div>
            <div className="text-right">
              <div className="tabular-nums text-lg">{compact(b.saldo)}</div>
              <div className="text-xs text-muted-foreground">pend. {compact(b.pendiente)}</div>
            </div>
          </PiCard>
        ))}
      </div>
    </div>
  )
}

export function Z01Screen() {
  const instruments = useCaja((s) => s.instruments)
  const invests = useCaja((s) => s.invests)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Instrumentos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Maestro paramétrico. Si mañana hay cripto, se da de alta un tipo: no se toca ADVPL.
        </p>
      </header>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Código", "Descripción", "Renta", "API PPI", "Nat. capital", "Nat. interés", "Z02 activas"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instruments.map((t) => {
              const n = invests.filter((i) => i.tipoId === t.id && i.estado === "activa").length
              return (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3 tabular-nums font-medium">{t.id}</td>
                  <td className="px-4 py-3">{t.desc}</td>
                  <td className="px-4 py-3">
                    <PiBadge tone={t.renta === "F" ? "neutral" : t.renta === "V" ? "info" : "warn"}>{RENTA_LABEL[t.renta]}</PiBadge>
                  </td>
                  <td className="px-4 py-3">
                    <PiBadge tone={t.usaApi ? "ok" : "neutral"}>{t.usaApi ? "Z01_USAAPI=1" : "cálculo interno"}</PiBadge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{t.natCap}</td>
                  <td className="px-4 py-3 tabular-nums">{t.natInt}</td>
                  <td className="px-4 py-3 tabular-nums">{n}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Z03Screen() {
  const { invests, valuaciones, instruments } = useCaja()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Valuación diaria</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Una fila por día y operación. El job de las 18:30 (PPI o devengamiento) no mueve SE5.
        </p>
      </header>
      <div className="grid gap-3">
        {invests.map((inv) => {
          const last = lastValuacion(valuaciones, inv.id)
          const tipo = instruments.find((t) => t.id === inv.tipoId)
          const pnl = markToMarket(inv, valuaciones) - inv.capital
          const rows = seriesOf(valuaciones, inv.id)
          return (
            <PiCard key={inv.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{inv.ticker}</span>
                  <PiBadge>{tipo?.desc ?? inv.tipoId}</PiBadge>
                  <PiBadge tone={inv.estado === "activa" ? "info" : "ok"}>{inv.estado}</PiBadge>
                </div>
                <div className="text-right text-sm">
                  <div className="tabular-nums">{last ? money(last.valor) : money(inv.capital)}</div>
                  <div className={cn("text-xs", pnl >= 0 ? "text-emerald-600" : "text-destructive")}>
                    {pnl >= 0 ? "+" : ""}
                    {money(pnl)}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-2 font-medium">Fecha</th>
                      <th className="px-5 py-2 font-medium">Precio</th>
                      <th className="px-5 py-2 font-medium">Valuación</th>
                      <th className="px-5 py-2 font-medium">Rto. día</th>
                      <th className="px-5 py-2 font-medium">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rows].reverse().map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-5 py-2 text-muted-foreground">{dmy(r.fecha)}</td>
                        <td className="px-5 py-2 tabular-nums">{price(r.precio)}</td>
                        <td className="px-5 py-2 tabular-nums">{money(r.valor)}</td>
                        <td className={cn("px-5 py-2 tabular-nums", r.rtoDia >= 0 ? "text-emerald-600" : "text-destructive")}>
                          {r.rtoDia >= 0 ? "+" : ""}
                          {money(r.rtoDia)}
                        </td>
                        <td className="px-5 py-2">
                          <PiBadge tone={r.origen === "A" ? "info" : r.origen === "C" ? "neutral" : "warn"}>
                            {ORIGEN_LABEL[r.origen]}
                          </PiBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PiCard>
          )
        })}
      </div>
    </div>
  )
}

export function Se5Screen() {
  const asientos = useCaja((s) => s.asientos)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Movimientos bancarios</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ND al constituir. Al rescatar, NC capital (NATCAP) y NC/ND interés (NATINT). Nunca un INSERT directo.
        </p>
      </header>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Naturaleza</th>
              <th className="px-4 py-3 font-medium">Historia</th>
              <th className="px-4 py-3 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody>
            {[...asientos].reverse().map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2.5 text-muted-foreground">{dmy(a.fecha)}</td>
                <td className="px-4 py-2.5">
                  <PiBadge tone={a.tipo === "ND" ? "warn" : "ok"}>{a.tipo}</PiBadge>
                </td>
                <td className="px-4 py-2.5 tabular-nums">{a.naturaleza}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.histor}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(a.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone?: "ok" | "bad"
}) {
  return (
    <PiCard className="p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-2 tabular-nums text-2xl font-medium",
          tone === "ok" && "text-emerald-600",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </PiCard>
  )
}

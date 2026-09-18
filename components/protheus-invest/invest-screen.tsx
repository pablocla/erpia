"use client"

import { useMemo, useState } from "react"
import { PiBadge, PiButton, PiCard, PiInput, SELECT_CLS } from "./ui"
import { useCaja, type NewInvest } from "@/lib/protheus-invest/store"
import { compact, dmy, money, pct, price, qty } from "@/lib/protheus-invest/format"
import {
  ESTADO_LABEL,
  MONEDA_LABEL,
  ORIGEN_LABEL,
  RENTA_LABEL,
  TODAY,
  asientosOf,
  daysBetween,
  instrumentOf,
  lastValuacion,
  markToMarket,
  seriesOf,
  splitRescue,
} from "@/lib/protheus-invest/invest"
import type { Asiento, Bank, Instrument, Investment, Valuacion } from "@/lib/protheus-invest/seed"
import { cn } from "@/lib/utils"
import { postHolding, postRescue } from "@/lib/protheus-invest/rest-client"

const DEFAULT_OPEN = "INV00001"

export function InvestScreen() {
  const { invests, banks, instruments, valuaciones, asientos, rescue, addInvest, source, pushToast } = useCaja()
  const [open, setOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(DEFAULT_OPEN)
  const activas = invests.filter((i) => i.estado === "activa")
  const mtm = activas.reduce((a, i) => a + markToMarket(i, valuaciones), 0)
  const cap = activas.reduce((a, i) => a + i.capital, 0)
  const vencen = activas
    .filter((i) => i.vence)
    .map((i) => ({ i, d: daysBetween(TODAY, i.vence) }))
    .filter((x) => x.d <= 7)
    .sort((a, b) => a.d - b.d)

  async function onSave(i: NewInvest) {
    if (source === "protheus") {
      const r = await postHolding(i)
      if (!r.ok) {
        pushToast(r.error ?? "Protheus rechazó el alta")
        return
      }
      pushToast("Z02 + FINA100 ND en el Protheus de este tenant.")
    }
    addInvest(i)
  }

  async function onRescue(id: string, input: { fecha: string; total: number }) {
    if (source === "protheus") {
      const r = await postRescue(id, input)
      if (!r.ok) {
        pushToast(r.error ?? "Protheus rechazó el rescate")
        return
      }
    }
    rescue(id, input)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Cartera</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Constitución y rescate impactan el banco del ERP. El detalle técnico está en Ayuda.
          </p>
        </div>
        <PiButton onClick={() => setOpen((v) => !v)}>{open ? "Cerrar" : "Nueva inversión"}</PiButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Mark-to-market" value={money(mtm)} hint="Valor de mercado al último cierre" />
        <Kpi
          label="Resultado no realizado"
          value={money(mtm - cap)}
          hint="Valuación menos capital inicial"
          tone={mtm >= cap ? "ok" : "bad"}
        />
        <Kpi
          label="Vencen en 7 días"
          value={String(vencen.length)}
          hint={vencen[0] ? `${vencen[0].i.ticker} · ${vencen[0].d} d` : "Nada por vencer"}
        />
      </div>

      {vencen.length > 0 && (
        <PiCard className="px-4 py-3 text-sm">
          <PiBadge tone="warn" className="mr-2">Aviso</PiBadge>
          Job de vencimientos: {vencen.map((v) => `${v.i.ticker} (${v.d === 0 ? "hoy" : `${v.d} d`})`).join(" · ")}
        </PiCard>
      )}

      {open && <NewInvestForm instruments={instruments} banks={banks} onClose={() => setOpen(false)} onSave={onSave} />}

      <div className="grid gap-3">
        {invests.map((inv) => (
          <InvestCard
            key={inv.id}
            inv={inv}
            instruments={instruments}
            banks={banks}
            valuaciones={valuaciones}
            asientos={asientos}
            open={openId === inv.id}
            onToggle={() => setOpenId((id) => (id === inv.id ? null : inv.id))}
            onRescue={onRescue}
          />
        ))}
        {invests.length === 0 && (
          <PiCard className="p-5 text-sm text-muted-foreground">No hay operaciones en este tenant (o el ERP no devolvió datos).</PiCard>
        )}
      </div>

      <PiCard className="overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Movimientos bancarios</h2>
          <p className="text-xs text-muted-foreground">ND al constituir · dos NC al rescatar. Nunca un INSERT directo.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2 font-medium">Fecha</th>
                <th className="px-5 py-2 font-medium">Tipo</th>
                <th className="px-5 py-2 font-medium">Naturaleza</th>
                <th className="px-5 py-2 font-medium">Historia</th>
                <th className="px-5 py-2 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {[...asientos].reverse().map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-5 py-2.5 text-muted-foreground">{dmy(a.fecha)}</td>
                  <td className="px-5 py-2.5">
                    <PiBadge tone={a.tipo === "ND" ? "warn" : "ok"}>{a.tipo}</PiBadge>
                  </td>
                  <td className="px-5 py-2.5 tabular-nums">{a.naturaleza}</td>
                  <td className="px-5 py-2.5 text-muted-foreground">{a.histor}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{money(a.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PiCard>
    </div>
  )
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "ok" | "bad" }) {
  return (
    <PiCard className="p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-2 font-medium tabular-nums text-2xl",
          tone === "ok" && "text-[oklch(0.72_0.14_145)]",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </PiCard>
  )
}

function InvestCard({
  inv,
  instruments,
  banks,
  valuaciones,
  asientos,
  open,
  onToggle,
  onRescue,
}: {
  inv: Investment
  instruments: Instrument[]
  banks: Bank[]
  valuaciones: Valuacion[]
  asientos: Asiento[]
  open: boolean
  onToggle: () => void
  onRescue: (id: string, input: { fecha: string; total: number }) => void
}) {
  const tipo = instrumentOf(instruments, inv.tipoId)
  const bank = banks.find((b) => b.id === inv.bancoId)
  const last = lastValuacion(valuaciones, inv.id)
  const valor = markToMarket(inv, valuaciones)
  const pnl = valor - inv.capital
  const rows = seriesOf(valuaciones, inv.id)
  const moves = asientosOf(asientos, inv.id)
  const activa = inv.estado === "activa"

  return (
    <PiCard className="overflow-hidden">
      <button type="button" onClick={onToggle} className="flex w-full flex-col gap-3 p-5 text-left sm:flex-row sm:items-center sm:justify-between hover:bg-accent/50 transition-colors">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{inv.ticker}</span>
            <PiBadge>{tipo?.desc ?? inv.tipoId}</PiBadge>
            {tipo && <PiBadge tone="neutral">{RENTA_LABEL[tipo.renta]}</PiBadge>}
            <PiBadge tone={activa ? "info" : "ok"}>{ESTADO_LABEL[inv.estado]}</PiBadge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {inv.nombre} · {bank?.name ?? inv.bancoId} · SA6 {bank?.sa6 ?? inv.bancoId}
            {inv.vence ? ` · vence ${dmy(inv.vence)}` : " · sin vencimiento"}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="tabular-nums text-lg">{money(valor)}</div>
          <div className={cn("text-xs", pnl >= 0 ? "text-[oklch(0.72_0.14_145)]" : "text-destructive")}>
            {pnl >= 0 ? "+" : ""}
            {money(pnl)} vs capital {compact(inv.capital)}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Meta k="Nro. operación" v={inv.id} />
            <Meta k="Moneda" v={MONEDA_LABEL[inv.moneda]} />
            <Meta k="Nominales" v={qty(inv.cantidad)} />
            <Meta k="Precio compra" v={price(inv.preCom)} />
            <Meta k="Capital inicial" v={money(inv.capital)} />
            <Meta k="TNA" v={inv.tasa ? pct(inv.tasa) : "—"} />
            <Meta k="Banco / agencia / cta." v={`${inv.bancoId.toUpperCase()} · ${inv.agencia} · ${inv.cuenta}`} />
            <Meta k="Última valuación" v={last ? `${dmy(last.fecha)} · ${ORIGEN_LABEL[last.origen]}` : "—"} />
          </dl>

          <h3 className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">Valuación diaria</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 pr-4 font-medium">Precio</th>
                  <th className="py-2 pr-4 font-medium">Valuación</th>
                  <th className="py-2 pr-4 font-medium">Rto. día</th>
                  <th className="py-2 font-medium">Origen</th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 pr-4 text-muted-foreground">{dmy(r.fecha)}</td>
                    <td className="py-2 pr-4 tabular-nums">{price(r.precio)}</td>
                    <td className="py-2 pr-4 tabular-nums">{money(r.valor)}</td>
                    <td className={cn("py-2 pr-4 tabular-nums", r.rtoDia >= 0 ? "text-[oklch(0.72_0.14_145)]" : "text-destructive")}>
                      {r.rtoDia >= 0 ? "+" : ""}
                      {money(r.rtoDia)}
                    </td>
                    <td className="py-2">
                      <PiBadge tone={r.origen === "A" ? "info" : r.origen === "C" ? "neutral" : "warn"}>
                        {ORIGEN_LABEL[r.origen]}
                      </PiBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {moves.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              SE5: {moves.map((m) => `${m.tipo} ${m.naturaleza} ${compact(m.valor)}`).join(" · ")}
            </p>
          )}

          {activa && tipo && (
            <RescueBox inv={inv} natCap={tipo.natCap} natInt={tipo.natInt} suggested={valor} onRescue={onRescue} />
          )}
          {inv.resultado != null && (
            <p className="mt-4 text-sm text-[oklch(0.72_0.14_145)]">Rescatada. Resultado {money(inv.resultado)} (interés / pérdida).</p>
          )}
        </div>
      )}
    </PiCard>
  )
}

function RescueBox({
  inv,
  natCap,
  natInt,
  suggested,
  onRescue,
}: {
  inv: Investment
  natCap: string
  natInt: string
  suggested: number
  onRescue: (id: string, input: { fecha: string; total: number }) => void
}) {
  const [fecha, setFecha] = useState(TODAY)
  const [total, setTotal] = useState(String(suggested))
  const n = Number(total) || 0
  const { capital, interes } = splitRescue(inv.capital, n)

  return (
    <div className="mt-5 rounded-md border border-border bg-secondary p-4">
      <div className="text-sm font-medium">Rescatar (FINZRES)</div>
      <p className="mt-1 text-xs text-muted-foreground">
        El tesorero carga el monto acreditado. El sistema separa capital ({natCap}) de interés ({natInt}).
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Fecha de rescate">
          <PiInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="Monto total acreditado">
          <PiInput type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-md bg-muted px-3 py-2">
          NC capital · {natCap}
          <div className="tabular-nums text-sm text-foreground">{money(capital)}</div>
        </div>
        <div className="rounded-md bg-muted px-3 py-2">
          {interes >= 0 ? `NC intereses · ${natInt}` : `ND pérdida · ${natInt}`}
          <div className={cn("tabular-nums text-sm", interes >= 0 ? "text-[oklch(0.72_0.14_145)]" : "text-destructive")}>
            {money(Math.abs(interes))}
          </div>
        </div>
      </div>
      <PiButton className="mt-3" size="sm" disabled={n <= 0} onClick={() => onRescue(inv.id, { fecha, total: n })}>
        Confirmar rescate
      </PiButton>
    </div>
  )
}

function NewInvestForm({
  instruments,
  banks,
  onClose,
  onSave,
}: {
  instruments: Instrument[]
  banks: Bank[]
  onClose: () => void
  onSave: (i: NewInvest) => void
}) {
  const [form, setForm] = useState({
    tipoId: "003",
    ticker: "PF-30D",
    nombre: "Plazo fijo 30d",
    bancoId: banks[0]?.id ?? "gal",
    capital: "2000000",
    cantidad: "1",
    tasa: "38.5",
    inicio: TODAY,
    vence: "2026-10-17",
    moneda: "1",
  })
  const tipo = useMemo(() => instrumentOf(instruments, form.tipoId), [instruments, form.tipoId])
  const fija = tipo?.renta === "F"
  const preCom = Number(form.cantidad) > 0 ? Number(form.capital) / Number(form.cantidad) : 0

  return (
    <PiCard className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Tipo Z01">
        <select
          className={SELECT_CLS}
          value={form.tipoId}
          onChange={(e) => {
            const next = instrumentOf(instruments, e.target.value)
            setForm((f) => ({
              ...f,
              tipoId: e.target.value,
              tasa: next?.renta === "F" ? "38.5" : "0",
              cantidad: next?.renta === "F" ? "1" : "10000",
              vence: next?.renta === "F" ? f.vence || "2026-10-17" : "",
              ticker:
                next?.id === "002"
                  ? "FCI-PREMIU"
                  : next?.id === "004"
                    ? "S31O6"
                    : next?.id === "005"
                      ? "AL30"
                      : next?.id === "001"
                        ? "GGAL"
                        : "PF-30D",
              nombre: next ? next.desc : f.nombre,
            }))
          }}
        >
          {instruments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.id} · {t.desc} ({RENTA_LABEL[t.renta]}
              {t.usaApi ? " · PPI" : ""})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ticker">
        <PiInput value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} />
      </Field>
      <Field label="Nombre">
        <PiInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      </Field>
      <Field label="Banco">
        <select className={SELECT_CLS} value={form.bancoId} onChange={(e) => setForm({ ...form, bancoId: e.target.value })}>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} · {b.agencia}/{b.cuenta}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Moneda">
        <select className={SELECT_CLS} value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
          <option value="1">ARS</option>
          <option value="2">USD</option>
        </select>
      </Field>
      <Field label="Capital inicial">
        <PiInput type="number" value={form.capital} onChange={(e) => setForm({ ...form, capital: e.target.value })} />
      </Field>
      <Field label="Cant. nominales">
        <PiInput type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
      </Field>
      <Field label="Precio compra (calc.)">
        <PiInput readOnly value={price(preCom || 0)} />
      </Field>
      {fija && (
        <Field label="TNA %">
          <PiInput type="number" value={form.tasa} onChange={(e) => setForm({ ...form, tasa: e.target.value })} />
        </Field>
      )}
      <Field label="Fecha inversión">
        <PiInput type="date" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
      </Field>
      <Field label={fija ? "Vencimiento" : "Vencimiento (opcional)"}>
        <PiInput type="date" value={form.vence} onChange={(e) => setForm({ ...form, vence: e.target.value })} />
      </Field>
      {tipo && (
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
          Al confirmar: ND {tipo.natCap} por el capital.{" "}
          {tipo.usaApi ? "El job PPI (18:30) llena Z03." : "El devengamiento de tasa fija llena Z03."}
        </p>
      )}
      <div className="sm:col-span-2 lg:col-span-3">
        <PiButton
          onClick={() => {
            if (!form.ticker || Number(form.capital) <= 0) return
            onSave({
              tipoId: form.tipoId,
              ticker: form.ticker,
              nombre: form.nombre,
              bancoId: form.bancoId,
              capital: Number(form.capital),
              cantidad: Number(form.cantidad) || 1,
              tasa: Number(form.tasa) || 0,
              inicio: form.inicio,
              vence: form.vence,
              moneda: form.moneda === "2" ? 2 : 1,
            })
            onClose()
          }}
        >
          Constituir (ND sale de banco)
        </PiButton>
      </div>
    </PiCard>
  )
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 tabular-nums">{v}</dd>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

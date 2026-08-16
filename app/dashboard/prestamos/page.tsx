"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  MessageSquare,
  Search,
  History,
  Printer,
  Wallet,
  RefreshCw,
} from "lucide-react"
import { authFetch, useAuthStore } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { CobrarDialog } from "@/components/prestamos/cobrar-dialog"
import { NuevoPrestamoDialog } from "@/components/prestamos/nuevo-prestamo-dialog"
import { HistorialDialog } from "@/components/prestamos/historial-dialog"
import { fmtArs, type CobroPrestamo, type MedioCobro } from "@/lib/prestamos/prestamos-meta"
import {
  mensajeRecordatorio,
  mensajeReciboCobro,
  waMeUrl,
} from "@/lib/prestamos/prestamos-messages"

interface Prestamo {
  id: number
  cliente: string
  telefono?: string
  capital: number
  interes: number
  interesPct?: number
  total: number
  totalOriginal?: number
  estado: string
  fechaVencimiento: string
  notas?: string
  cobros?: CobroPrestamo[]
  cobrarHoy?: boolean
  cobradoHoy?: number
}

interface ClienteOption {
  id: number
  nombre: string
  telefono?: string | null
  saldo?: number
}

type TabId = "cartera" | "hoy"

function formatVence(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function estadoBadge(estado: string) {
  if (estado === "Vencido")
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
  if (estado === "Vence hoy")
    return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
  if (estado === "Saldado")
    return "bg-slate-100 text-slate-600 border-slate-200"
  return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
}

export default function PrestamosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
          Cargando libreta…
        </div>
      }
    >
      <PrestamosPageInner />
    </Suspense>
  )
}

function PrestamosPageInner() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const empresaNombre = useAuthStore((s) => s.user?.empresaNombre) || "mi negocio"

  const [tab, setTab] = useState<TabId>("cartera")
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalCobrar, setModalCobrar] = useState(false)
  const [modalHist, setModalHist] = useState(false)
  const [selected, setSelected] = useState<Prestamo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lastCobro, setLastCobro] = useState<{
    cliente: string
    telefono?: string
    monto: number
    saldo: number
    medio: string
  } | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [resList, resCli] = await Promise.all([
        authFetch("/api/prestamos"),
        authFetch("/api/prestamos?scope=clientes"),
      ])
      if (resList.ok) {
        const data = await resList.json()
        setPrestamos(Array.isArray(data) ? data : [])
      } else {
        setPrestamos([])
      }
      if (resCli.ok) {
        const data = await resCli.json()
        setClientes(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error(e)
      setPrestamos([])
      toast({
        title: "No se pudo cargar la libreta",
        description: "Revisá la conexión e intentá de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setModalNuevo(true)
    }
    if (searchParams.get("tab") === "hoy") {
      setTab("hoy")
    }
  }, [searchParams])

  const filtrados = useMemo(() => {
    const base = tab === "hoy" ? prestamos.filter((p) => p.cobrarHoy) : prestamos
    const query = q.trim().toLowerCase()
    if (!query) return base
    return base.filter(
      (p) =>
        p.cliente.toLowerCase().includes(query) ||
        (p.telefono || "").includes(query) ||
        (p.notas || "").toLowerCase().includes(query),
    )
  }, [prestamos, tab, q])

  const totalCartera = prestamos.reduce((s, p) => s + p.total, 0)
  const totalHoy = prestamos.filter((p) => p.cobrarHoy).reduce((s, p) => s + p.total, 0)
  const cobradoHoy = prestamos.reduce((s, p) => s + (p.cobradoHoy || 0), 0)
  const countHoy = prestamos.filter((p) => p.cobrarHoy).length

  const openCobrar = (p: Prestamo) => {
    setSelected(p)
    setLastCobro(null)
    setModalCobrar(true)
  }

  const openHistorial = (p: Prestamo) => {
    setSelected(p)
    setModalHist(true)
  }

  const openWaRecordatorio = (p: Prestamo) => {
    const texto = mensajeRecordatorio({
      cliente: p.cliente,
      saldo: p.total,
      empresaNombre,
      fechaVencimiento: p.fechaVencimiento,
    })
    window.open(waMeUrl(p.telefono, texto), "_blank", "noopener,noreferrer")
  }

  const openWaRecibo = () => {
    if (!lastCobro) return
    const texto = mensajeReciboCobro({
      cliente: lastCobro.cliente,
      monto: lastCobro.monto,
      saldoRestante: lastCobro.saldo,
      empresaNombre,
      medio: lastCobro.medio,
    })
    window.open(waMeUrl(lastCobro.telefono, texto), "_blank", "noopener,noreferrer")
  }

  const handleCobrar = async (payload: { monto: number; medio: MedioCobro }) => {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await authFetch("/api/prestamos/cobrar", {
        method: "POST",
        body: JSON.stringify({
          clienteId: selected.id,
          monto: payload.monto,
          medio: payload.medio,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "No se pudo registrar el cobro")
      }
      const data = await res.json()
      setLastCobro({
        cliente: data.cliente,
        telefono: data.telefono || selected.telefono,
        monto: data.montoCobrado,
        saldo: data.nuevoSaldo,
        medio: data.medio || payload.medio,
      })
      setModalCobrar(false)
      toast({
        title:
          data.nuevoSaldo <= 0
            ? `${data.cliente} quedó en cero`
            : `Cobrado ${fmtArs(data.montoCobrado)}`,
        description:
          data.nuevoSaldo <= 0
            ? "Préstamo saldado."
            : `Queda debiendo ${fmtArs(data.nuevoSaldo)}.`,
      })
      await cargar()
    } catch (e) {
      toast({
        title: "Error al cobrar",
        description: e instanceof Error ? e.message : "Reintentá",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleNuevo = async (payload: {
    cliente: string
    clienteId?: number
    capital: number
    interesPct: number
    fechaVencimiento: string
    telefono?: string
  }) => {
    setSubmitting(true)
    try {
      const res = await authFetch("/api/prestamos", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "No se pudo crear el préstamo")
      }
      const data = await res.json()
      setModalNuevo(false)
      toast({
        title: data.reutilizado ? `Suma a ${data.cliente}` : `Préstamo a ${data.cliente}`,
        description: `Tiene que devolver ${fmtArs(data.total)} (saldo actual).`,
      })
      await cargar()
    } catch (e) {
      toast({
        title: "Error al prestar",
        description: e instanceof Error ? e.message : "Reintentá",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MotionPage className="flex h-full flex-col bg-background">
      <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto max-w-3xl mx-auto w-full pb-28">
        {/* Header simple */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Libreta de cobros</h1>
            <p className="text-sm text-muted-foreground">
              Quién te debe, cobrá lo que te dieron, avisá por WhatsApp.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => void cargar()} title="Actualizar">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={() => setModalNuevo(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Prestar
            </Button>
          </div>
        </div>

        {/* KPIs mínimos caseros */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/80">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Te deben</p>
              <p className="text-xl font-bold tabular-nums">{fmtArs(totalCartera)}</p>
              <p className="text-[11px] text-muted-foreground">{prestamos.length} deudores</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Hoy cobré</p>
              <p className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {fmtArs(cobradoHoy)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                A cobrar hoy: {fmtArs(totalHoy)} ({countHoy})
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border p-1 bg-muted/40 gap-1">
          <button
            type="button"
            onClick={() => setTab("cartera")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === "cartera" ? "bg-background shadow text-foreground" : "text-muted-foreground"
            }`}
          >
            Quién me debe
          </button>
          <button
            type="button"
            onClick={() => setTab("hoy")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === "hoy" ? "bg-background shadow text-foreground" : "text-muted-foreground"
            }`}
          >
            Hoy {countHoy > 0 ? `(${countHoy})` : ""}
          </button>
        </div>

        {/* Buscar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11"
            placeholder="Buscar por apodo, nombre o teléfono…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {lastCobro && (
          <Card className="border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30">
            <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-sm">
                Último cobro: <strong>{fmtArs(lastCobro.monto)}</strong> a {lastCobro.cliente}
                {lastCobro.saldo > 0
                  ? ` · queda ${fmtArs(lastCobro.saldo)}`
                  : " · saldado"}
              </p>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openWaRecibo}>
                <MessageSquare className="h-4 w-4 mr-1" /> Enviar recibo WA
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista */}
        {loading ? (
          <p className="text-center text-muted-foreground py-12 animate-pulse">Cargando libreta…</p>
        ) : filtrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <p className="text-muted-foreground">
                {q
                  ? "Nadie coincide con la búsqueda."
                  : tab === "hoy"
                    ? "No hay vencidos ni cobros de hoy. Cuando marques un vencimiento, aparecen acá."
                    : "Todavía no hay deudas. Tocá Prestar para anotar el primero."}
              </p>
              {!q && tab === "cartera" && (
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setModalNuevo(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Prestar
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {filtrados.map((p) => (
              <li key={p.id}>
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg truncate">{p.cliente}</h3>
                          <Badge variant="outline" className={estadoBadge(p.estado)}>
                            {p.estado}
                          </Badge>
                        </div>
                        <p className="text-2xl font-black tabular-nums mt-0.5">{fmtArs(p.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence {formatVence(p.fechaVencimiento)}
                          {p.capital > 0 && (
                            <>
                              {" "}
                              · capital {fmtArs(p.capital)}
                              {p.interesPct != null ? ` + ${p.interesPct}%` : ""}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold col-span-2 sm:col-span-1"
                        onClick={() => openCobrar(p)}
                      >
                        <Wallet className="h-4 w-4 mr-1" /> Cobrar
                      </Button>
                      <Button variant="outline" onClick={() => openWaRecordatorio(p)}>
                        <MessageSquare className="h-4 w-4 mr-1 text-emerald-600" /> WA
                      </Button>
                      <Button variant="outline" onClick={() => openHistorial(p)}>
                        <History className="h-4 w-4 mr-1" /> Historial
                      </Button>
                      <Link href={`/dashboard/prestamos/pagares?id=${p.id}`}>
                        <Button variant="outline" className="w-full">
                          <Printer className="h-4 w-4 mr-1" /> Pagaré
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CobrarDialog
        open={modalCobrar}
        onOpenChange={setModalCobrar}
        deudor={
          selected
            ? { id: selected.id, cliente: selected.cliente, total: selected.total, telefono: selected.telefono }
            : null
        }
        submitting={submitting}
        onConfirm={handleCobrar}
      />

      <NuevoPrestamoDialog
        open={modalNuevo}
        onOpenChange={setModalNuevo}
        clientes={clientes}
        submitting={submitting}
        onConfirm={handleNuevo}
      />

      <HistorialDialog
        open={modalHist}
        onOpenChange={setModalHist}
        cliente={selected?.cliente || ""}
        saldo={selected?.total || 0}
        cobros={selected?.cobros || []}
        notas={selected?.notas}
      />
    </MotionPage>
  )
}

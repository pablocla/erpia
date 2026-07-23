"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageShell, PageHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { authFetch } from "@/lib/stores"
import {
  Bot,
  Loader2,
  Play,
  MessageCircle,
  Send,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react"

type CatalogItem = {
  code: string
  nombre: string
  lema: string
  descripcion: string
  sku: string
  precioArs: number
  dashboardPath: string
}

type Instancia = {
  id: number
  code: string
  nombre: string
  lema?: string | null
  estado: string
  sku: string
  lastRunAt?: string | null
  runsTotal: number
  tokensMes: number
  accionesMes: number
  dashboardPath: string
}

type Channels = {
  leoActivo: boolean
  whatsapp: {
    configured: boolean
    cloudApi: boolean
    empresaTelefono: string | null
    note: string
  }
  telegram: {
    configured: boolean
    botUsername: string | null
    vinculosUsuarios: number
    note: string
  }
}

export default function EmpleadosDigitalesPage() {
  const router = useRouter()
  const [catalogo, setCatalogo] = useState<CatalogItem[]>([])
  const [instancias, setInstancias] = useState<Instancia[]>([])
  const [channels, setChannels] = useState<Channels | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")
  const [activating, setActivating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [res, resCh] = await Promise.all([
        authFetch("/api/empleados-digitales"),
        authFetch("/api/empleados-digitales/channels"),
      ])
      const data = await res.json()
      const dataCh = await resCh.json().catch(() => null)
      if (!res.ok) {
        setError(data.error || "Error al cargar")
        return
      }
      setCatalogo(data.catalogo || [])
      setInstancias(data.instancias || [])
      if (resCh.ok && dataCh) setChannels(dataCh)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const activar = async (code: string) => {
    setActivating(code)
    setError("")
    setMsg("")
    try {
      const res = await authFetch("/api/empleados-digitales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, trial: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo activar")
        return
      }
      setMsg(
        data.trial
          ? "Leo activado en trial. Te llevamos al panel para probar."
          : "Leo activado.",
      )
      await load()
      const path =
        data.instancia?.dashboardPath ||
        `/dashboard/empleados-digitales/${code}?onboarding=1`
      setTimeout(() => router.push(path), 600)
    } finally {
      setActivating(null)
    }
  }

  const byCode = new Map(instancias.map((i) => [i.code, i]))

  return (
    <PageShell>
      <PageHeader
        title="Empleados digitales"
        description="Activá a Leo, probá cobranzas y hablá con él por Telegram. WhatsApp es el canal hacia tus clientes."
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {msg && (
        <Alert className="mb-4 border-emerald-500/40">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}

      {/* Canales */}
      {channels && (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <Card className="border-emerald-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                WhatsApp (→ clientes)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {channels.whatsapp.configured ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-600" />
                )}
                <span>
                  {channels.whatsapp.configured
                    ? "Twilio configurado — envíos reales"
                    : "Sin Twilio — modo dev (solo logs)"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{channels.whatsapp.note}</p>
              <p className="text-[11px] text-muted-foreground">
                Tel. empresa: {channels.whatsapp.empresaTelefono || "no cargado (útil para inbound)"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-sky-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4 text-sky-600" />
                Telegram (→ vos / dueño)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {channels.telegram.configured ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-600" />
                )}
                <span>
                  {channels.telegram.configured
                    ? `Bot @${channels.telegram.botUsername || "…"}`
                    : "Sin TELEGRAM_BOT_TOKEN"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{channels.telegram.note}</p>
              <p className="text-[11px] text-muted-foreground">
                Vinculados: {channels.telegram.vinculosUsuarios} usuario(s)
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/ia">Vincular Telegram</Link>
                </Button>
                {channels.telegram.botUsername && (
                  <Button asChild size="sm" variant="ghost">
                    <a
                      href={`https://t.me/${channels.telegram.botUsername}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir bot <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
              <p className="rounded-md bg-muted/50 p-2 font-mono text-[10px]">
                /leo status · /leo run · /leo pendientes · /leo aprobar ID
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Alert className="mb-4">
        <AlertTitle>Probar Leo en 3 pasos</AlertTitle>
        <AlertDescription className="text-sm">
          1) Activar (trial) · 2) Vista previa / Correr · 3) Aprobar borrador. Con Telegram:{" "}
          <code className="text-xs">/leo run</code> y <code className="text-xs">/leo aprobar</code>.
          Guía completa:{" "}
          <code className="text-xs">docs/empleados-digitales/CANALES_WA_TELEGRAM.md</code>
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {catalogo.map((t) => {
            const inst = byCode.get(t.code)
            return (
              <Card key={t.code} className="border-emerald-500/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                        <Bot className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{t.nombre}</CardTitle>
                        <CardDescription>{t.lema}</CardDescription>
                      </div>
                    </div>
                    {inst ? (
                      <Badge
                        variant={
                          inst.estado === "activo" || inst.estado === "trial"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {inst.estado}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No activado</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t.descripcion}</p>
                  <p className="text-sm font-medium">
                    Desde ${t.precioArs.toLocaleString("es-AR")} / mes · trial gratis al activar
                  </p>
                  {inst && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-muted p-2">
                        <div className="font-semibold">{inst.runsTotal}</div>
                        <div className="text-muted-foreground">corridas</div>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <div className="font-semibold">{inst.accionesMes}</div>
                        <div className="text-muted-foreground">acciones/mes</div>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <div className="font-semibold">{inst.tokensMes}</div>
                        <div className="text-muted-foreground">tokens/mes</div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {inst ? (
                      <>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-500">
                          <Link href={`${inst.dashboardPath}?onboarding=1`}>
                            <Play className="mr-2 h-4 w-4" />
                            Probar ahora
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href={inst.dashboardPath}>Panel</Link>
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => void activar(t.code)}
                        disabled={activating === t.code}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        {activating === t.code ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activando…
                          </>
                        ) : (
                          "Activar Leo (trial)"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}

"use client"

import { useEffect, useState } from "react"
import {
  Users,
  Share2,
  Gift,
  DollarSign,
  Copy,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

export default function AfiliadosDashboardPage() {
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aliasMP, setAliasMP] = useState("")
  const [retirando, setRetirando] = useState(false)

  async function cargarDatos() {
    setLoading(true)
    try {
      const res = await authFetch("/api/afiliados/mi-red")
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch (e) {
      toast({ title: "Error al cargar datos de afiliados", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  function copiarLinkReferido() {
    if (!data?.afiliado?.codigoAfiliado) return
    const url = `${window.location.origin}/?ref=${data.afiliado.codigoAfiliado}`
    navigator.clipboard.writeText(url)
    toast({
      title: "¡Enlace de referido copiado!",
      description: "Compartilo con otros profesionales o corralones para ganar comisiones recurrentes.",
    })
  }

  function compartirWhatsApp() {
    if (!data?.afiliado?.codigoAfiliado) return
    const url = `${window.location.origin}/?ref=${data.afiliado.codigoAfiliado}`
    const msg = encodeURIComponent(
      `Hola colega, te recomiendo probar Claver Oficios para pasar presupuestos en 3 niveles y cobrar señas con Mercado Pago desde el celular:\n\n👉 ${url}\n\nTenés 7 días gratis.`
    )
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }

  async function solicitarRetiro() {
    if (!aliasMP.trim()) {
      toast({ title: "Ingresá tu Alias o CVU de Mercado Pago", variant: "destructive" })
      return
    }

    setRetirando(true)
    try {
      const res = await authFetch("/api/afiliados/solicitar-retiro", {
        method: "POST",
        body: JSON.stringify({ aliasMercadoPago: aliasMP }),
      })

      if (res.ok) {
        toast({
          title: "¡Solicitud de retiro enviada!",
          description: "La acreditación en tu cuenta de Mercado Pago se procesará en 24hs hábiles.",
        })
        setAliasMP("")
        cargarDatos()
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error al solicitar retiro", variant: "destructive" })
    } finally {
      setRetirando(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Cargando programa de afiliados...</div>
  }

  const { viralLoop, afiliado, referidos } = data || {}

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Gift className="h-6 w-6" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mi Red & Comisiones Recurrentes</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Invitá a 3 colegas y tu suscripción a Claver es <strong>gratis de por vida</strong>. A partir del 4to, ganás el 25% mensual.
        </p>
      </div>

      {/* Banner Viral Loop */}
      <Card className="border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-extrabold text-foreground">
                  {viralLoop?.esGratisDePorVida
                    ? "🎉 ¡Tu plan es GRATIS de por vida!"
                    : `Llevás ${viralLoop?.totalReferidos || 0} de ${viralLoop?.metaReferidos} colegas activos`}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl">
                {viralLoop?.esGratisDePorVida
                  ? "Ya alcanzaste 3 colegas activos. Tu cuota mensual está 100% bonificada mientras mantengas a tus referidos activos."
                  : `Te faltan solo ${viralLoop?.faltantesParaGratis} referidos para no pagar nunca más tu sistema Claver.`}
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={copiarLinkReferido} variant="outline" className="gap-2 text-xs flex-1 sm:flex-none">
                <Copy className="h-4 w-4" />
                Copiar Enlace
              </Button>
              <Button onClick={compartirWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs flex-1 sm:flex-none">
                <Share2 className="h-4 w-4" />
                Invitar por WA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              Colegas Referidos
              <Users className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{viralLoop?.totalReferidos || 0} activos</div>
            <p className="text-xs text-muted-foreground mt-1">25% comisión Nivel 1 recurrente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              Saldo Disponible para Retiro
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {fmt(Number(afiliado?.saldoAcumulado || 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Retiro directo a Mercado Pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              Total Cobrado Histórico
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{fmt(Number(afiliado?.totalCobrado || 0))}</div>
            <p className="text-xs text-muted-foreground mt-1">Acreditado en tu CVU/Alias</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listado de Colegas Referidos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Tus Colegas Activos</CardTitle>
              <CardDescription className="text-xs">Empresas y contratistas registrados con tu enlace.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {(referidos || []).length === 0 ? (
                <div className="text-center p-8 text-xs text-muted-foreground border border-dashed rounded-lg space-y-2">
                  <p>Todavía no tenés colegas registrados con tu enlace.</p>
                  <Button onClick={compartirWhatsApp} size="sm" variant="outline" className="text-xs gap-1.5">
                    <Share2 className="h-3.5 w-3.5" /> Compartir en grupos de WhatsApp
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {referidos.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg border text-xs">
                      <div>
                        <span className="font-semibold block">{r.empresa}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">CUIT: {r.cuit}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          + {fmt(r.comisionEstimada)}/mes
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Retiro de Comisiones */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Solicitar Retiro de Ganancias</CardTitle>
              <CardDescription className="text-xs">
                Transferencia directa a tu cuenta de Mercado Pago.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div>
                <Label className="text-xs">Tu Alias o CVU de Mercado Pago</Label>
                <Input
                  placeholder="ejemplo.mp o CVU de 22 dígitos"
                  value={aliasMP}
                  onChange={(e) => setAliasMP(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <Button
                onClick={solicitarRetiro}
                disabled={retirando || Number(afiliado?.saldoAcumulado || 0) <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {retirando ? "Procesando..." : "Retirar Saldo Acumulado"}
              </Button>

              {Number(afiliado?.saldoAcumulado || 0) <= 0 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Necesitás saldo acumulado para realizar un retiro.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

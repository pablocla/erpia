"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { PageShell, PageHeader } from "@/components/layout"
import { EmptyState } from "@/components/ui/empty-state"
import { ComercialPipelineBoard } from "@/components/claver-cloud/comercial-pipeline-board"
import { UpgradesArcaInbox } from "@/components/claver-cloud/upgrades-arca-inbox"
import {
  COMMERCIAL_OBJECTIONS,
  SALES_SCRIPT_15MIN,
  calculateMerchantROI,
  type SalesObjection,
  type SalesScriptStep,
} from "@/lib/comercial/commercial-sales-playbook"
import {
  Target,
  ShieldAlert,
  Calculator,
  BookOpen,
  Copy,
  Check,
  Share2,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  Search,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react"

export default function ComercialHubPage() {
  const [tab, setTab] = useState<string>("pipeline")
  const [busquedaObjecion, setBusquedaObjecion] = useState<string>("")
  const [categoriaObjecion, setCategoriaObjecion] = useState<string>("__todas__")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Inputs ROI Calculator
  const [roiRubro, setRoiRubro] = useState<string>("kiosco")
  const [ventasMensuales, setVentasMensuales] = useState<number>(3_500_000)
  const [fiadosEstimados, setFiadosEstimados] = useState<number>(250_000)
  const [horasAFIP, setHorasAFIP] = useState<number>(4)

  const { toast } = useToast()

  // Cálculo de ROI dinámico
  const roiCalculado = useMemo(() => {
    return calculateMerchantROI({
      rubroId: roiRubro,
      ventasMensualesARS: ventasMensuales,
      estimacionFiadosARS: fiadosEstimados,
      horasSemanalesAFIP: horasAFIP,
    })
  }, [roiRubro, ventasMensuales, fiadosEstimados, horasAFIP])

  // Filtrar objeciones
  const objecionesFiltradas = useMemo(() => {
    return COMMERCIAL_OBJECTIONS.filter((o) => {
      if (categoriaObjecion !== "__todas__" && o.categoria !== categoriaObjecion) return false
      if (busquedaObjecion) {
        const q = busquedaObjecion.toLowerCase()
        return (
          o.objecion.toLowerCase().includes(q) ||
          o.respuestaVendedor.toLowerCase().includes(q) ||
          o.script60Segundos.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [categoriaObjecion, busquedaObjecion])

  const handleCopiarWhatsApp = (objecion: SalesObjection) => {
    navigator.clipboard.writeText(objecion.copyWhatsAppRapido)
    setCopiedId(objecion.id)
    toast({
      title: "Respuesta copiada",
      description: "Texto listo para enviar por WhatsApp al comerciante.",
    })
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <PageShell className="max-w-7xl mx-auto">
      <PageHeader
        variant="surface"
        title="Centro comercial"
        description="Pendientes ARCA, pipeline, objeciones, ROI del prospecto y playbook de 15 minutos para el equipo de calle."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Target className="h-3.5 w-3.5" />
            Claver Cloud · Sales
          </span>
        }
        actions={
          <Button variant="outline" size="sm" asChild className="min-h-[40px]">
            <Link href="/claver-cloud/marketing">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Marketing digital
            </Link>
          </Button>
        }
      />

      {/* Tabs Principales */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 max-w-4xl">
          <TabsTrigger value="arca" className="gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>ARCA</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <Target className="h-4 w-4" />
            <span>Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="objeciones" className="gap-2">
            <ShieldAlert className="h-4 w-4 text-[var(--status-warning)]" />
            <span>Objeciones</span>
          </TabsTrigger>
          <TabsTrigger value="roi" className="gap-2">
            <Calculator className="h-4 w-4 text-[var(--status-success)]" />
            <span>ROI</span>
          </TabsTrigger>
          <TabsTrigger value="playbook" className="gap-2">
            <BookOpen className="h-4 w-4 text-[var(--status-info)]" />
            <span>Playbook 15 min</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arca" className="m-0">
          <UpgradesArcaInbox />
        </TabsContent>

        {/* TAB 1: PIPELINE KANBAN */}
        <TabsContent value="pipeline" className="m-0">
          <ComercialPipelineBoard showHeader={false} />
        </TabsContent>

        {/* TAB 2: MATRIZ DE OBJECIONES */}
        <TabsContent value="objeciones" className="space-y-6 m-0">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar objeción (ej: AFIP, caro, Excel, tecnología)..."
                    className="pl-9"
                    value={busquedaObjecion}
                    onChange={(e) => setBusquedaObjecion(e.target.value)}
                  />
                </div>
                <Select value={categoriaObjecion} onValueChange={setCategoriaObjecion}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__todas__">Todas las categorías</SelectItem>
                    <SelectItem value="precio">Precio / Costo</SelectItem>
                    <SelectItem value="afip">AFIP / Impuestos</SelectItem>
                    <SelectItem value="proceso">Procesos / Excel / Cuaderno</SelectItem>
                    <SelectItem value="tecnologia">Dificultad Tecnológica</SelectItem>
                    <SelectItem value="competencia">Sistema Legacy / Viejo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {objecionesFiltradas.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Ninguna objeción coincide"
              description="Probá otra palabra clave (AFIP, Excel, precio) o elegí “Todas las categorías”."
              actionLabel="Limpiar búsqueda"
              onAction={() => {
                setBusquedaObjecion("")
                setCategoriaObjecion("__todas__")
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {objecionesFiltradas.map((item) => (
                <Card key={item.id} className="border-border/60 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-2 bg-[var(--status-warning-muted)] text-[var(--status-warning-foreground)] rounded-lg shrink-0">
                          <HelpCircle className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-base font-semibold leading-tight">
                          &ldquo;{item.objecion}&rdquo;
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs shrink-0">
                        {item.categoria}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-sm flex-1">
                    <div className="bg-muted/40 p-3 rounded-lg border">
                      <p className="text-xs font-semibold text-foreground mb-1">Respuesta recomendada (es-AR)</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.respuestaVendedor}</p>
                    </div>

                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/15">
                      <p className="text-xs font-semibold text-primary mb-1">Script 60 s (en vivo)</p>
                      <p className="text-xs text-foreground/90 leading-relaxed font-mono">{item.script60Segundos}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--status-success-foreground)]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--status-success)]" />
                      <span>{item.pruebaSocial}</span>
                    </div>
                  </CardContent>

                  <div className="p-4 pt-0 border-t flex items-center justify-between gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Copy listo para WhatsApp</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs min-h-[40px]"
                      onClick={() => handleCopiarWhatsApp(item)}
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3.5 w-3.5 text-[var(--status-success)]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedId === item.id ? "Copiado" : "Copiar a WhatsApp"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: CALCULADORA DE ROI */}
        <TabsContent value="roi" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inputs Form */}
            <Card className="lg:col-span-1 glass-panel">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-emerald-600" />
                  Datos del Prospecto
                </CardTitle>
                <CardDescription>Completá el perfil del comercio para estimar su retorno.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Rubro Comercial</Label>
                  <Select value={roiRubro} onValueChange={setRoiRubro}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kiosco">Kiosco / Almacén de Barrio</SelectItem>
                      <SelectItem value="ferreteria">Ferretería / Corralón</SelectItem>
                      <SelectItem value="gimnasio">Gimnasio / Club</SelectItem>
                      <SelectItem value="veterinaria">Veterinaria / Pet Shop</SelectItem>
                      <SelectItem value="taller">Taller Mecánico</SelectItem>
                      <SelectItem value="servicios">Prestador de Servicios / Monotributo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Ventas Mensuales Estimadas ($ ARS)</Label>
                  <Input
                    type="number"
                    value={ventasMensuales}
                    onChange={(e) => setVentasMensuales(Number(e.target.value))}
                    step={100000}
                  />
                  <p className="text-[11px] text-muted-foreground">Venta bruta estimada del comercio</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Fiados en Libreta / Morosos ($ ARS)</Label>
                  <Input
                    type="number"
                    value={fiadosEstimados}
                    onChange={(e) => setFiadosEstimados(Number(e.target.value))}
                    step={50000}
                  />
                  <p className="text-[11px] text-muted-foreground">Monto estimado anotado en papel sin cobrar</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Horas Semanales en Carga AFIP / Excel</Label>
                  <Input
                    type="number"
                    value={horasAFIP}
                    onChange={(e) => setHorasAFIP(Number(e.target.value))}
                    min={1}
                    max={30}
                  />
                  <p className="text-[11px] text-muted-foreground">Horas dedicadas a papelería y facturación</p>
                </div>
              </CardContent>
            </Card>

            {/* Output Display */}
            <Card className="lg:col-span-2 glass-panel border-emerald-500/30">
              <CardHeader className="bg-emerald-500/5 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-emerald-950 dark:text-emerald-300">
                      Retorno de Inversión (ROI) Estimado
                    </CardTitle>
                    <CardDescription>Argumento financiero para cerrar la venta en la primera visita.</CardDescription>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-sm px-3 py-1">
                    {roiCalculado.roiPorcentaje}% ROI Estimado
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/40 rounded-xl border">
                    <span className="text-xs text-muted-foreground block mb-1">Recupero de Fiados WA:</span>
                    <span className="text-xl font-bold text-emerald-600">
                      ${roiCalculado.ahorroFiadoMensualARS.toLocaleString("es-AR")} ARS/mes
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-1">35% de cobro efectivo de deudas</span>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-xl border">
                    <span className="text-xs text-muted-foreground block mb-1">Protección Aumento %:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ${roiCalculado.ahorroInflacionMensualARS.toLocaleString("es-AR")} ARS/mes
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-1">Evita vender a precios viejos</span>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-xl border">
                    <span className="text-xs text-muted-foreground block mb-1">Horas Dueño Ahorradas:</span>
                    <span className="text-xl font-bold text-violet-600">
                      ${roiCalculado.valorHorasAhorradasMensualARS.toLocaleString("es-AR")} ARS/mes
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-1">Valorización de tiempo de gestión</span>
                  </div>
                </div>

                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                      Beneficio Neto Total Estimado para el Comercio:
                    </p>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                      ${roiCalculado.beneficioTotalMensualARS.toLocaleString("es-AR")} ARS / mes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Recupero de Inversión (Payback):</p>
                    <p className="text-lg font-bold text-foreground">En solo {roiCalculado.paybackDias} días</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-card p-3 rounded-lg border font-mono">
                  💡 <strong>Pitch para el Vendedor:</strong> &ldquo;El abono de ClavERP cuesta $39.900 ARS/mes. Según tus números, el sistema te va a hacer ganar y ahorrar cerca de ${roiCalculado.beneficioTotalMensualARS.toLocaleString("es-AR")} ARS al mes. Se paga solo en los primeros {roiCalculado.paybackDias} días.&rdquo;
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: PLAYBOOK DE VISITA 15 MIN */}
        <TabsContent value="playbook" className="space-y-6 m-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Guión Cronometrado de Venta Presencial (15 minutos)
              </CardTitle>
              <CardDescription>
                Paso a paso que debe seguir el vendedor o partner al ingresar a un comercio de calle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {SALES_SCRIPT_15MIN.map((step, idx) => (
                  <div key={idx} className="p-4 rounded-xl border bg-card/60 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-white font-mono text-xs">{step.minuto}</Badge>
                        <h3 className="font-semibold text-sm">{step.bloque}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {step.objetivo}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs text-muted-foreground font-medium">Qué decir en voz alta (es-AR):</p>
                      <p className="text-xs text-foreground bg-muted/40 p-3 rounded-lg leading-relaxed font-mono">
                        &ldquo;{step.queDecir}&rdquo;
                      </p>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Acción / Qué mostrar en el celular:</span> {step.queMostrar}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
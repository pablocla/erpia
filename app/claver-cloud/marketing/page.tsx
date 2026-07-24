"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Megaphone,
  Copy,
  Check,
  ExternalLink,
  Share2,
  DollarSign,
  Target,
  Users,
  Sparkles,
  Search,
  Instagram,
  Globe,
  MessageSquare,
  Video,
  Store,
  Wrench,
  Dumbbell,
  Stethoscope,
  Building,
} from "lucide-react"
import { MARKETING_CAMPAIGNS, type MarketingCampaign } from "@/lib/marketing/campaign-catalog"

const CANAL_ICONS: Record<string, React.ElementType> = {
  instagram_reels: Instagram,
  meta_ads: Globe,
  google_search: Search,
  tiktok: Video,
  whatsapp_blast: MessageSquare,
}

const RUBRO_ICONS: Record<string, React.ElementType> = {
  kiosco: Store,
  ferreteria: Wrench,
  gimnasio: Dumbbell,
  veterinaria: Stethoscope,
  taller: Wrench,
  monotributo: Building,
}

export default function ClaverMarketingCloudPage() {
  const [rubroFiltro, setRubroFiltro] = useState<string>("__todos__")
  const [canalFiltro, setCanalFiltro] = useState<string>("__todos__")
  const [busqueda, setBusqueda] = useState<string>("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  const campañasFiltradas = useMemo(() => {
    return MARKETING_CAMPAIGNS.filter((c) => {
      if (rubroFiltro !== "__todos__" && c.rubroId !== rubroFiltro) return false
      if (canalFiltro !== "__todos__" && c.canal !== canalFiltro) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        const match =
          c.titulo.toLowerCase().includes(q) ||
          c.rubroNombre.toLowerCase().includes(q) ||
          c.headline.toLowerCase().includes(q) ||
          c.copyPrincipal.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [rubroFiltro, canalFiltro, busqueda])

  const handleCopiarCopy = (campaña: MarketingCampaign) => {
    const texto = `🔥 CAMPAÑA MKT: ${campaña.titulo} (${campaña.rubroNombre})
📌 CANAL: ${campaña.canalLabel}
----------------------------------------
HEADLINE: ${campaña.headline}

COPY:
${campaña.copyPrincipal}

CTA: ${campaña.callToAction}
DEMO LINK: ${window.location.origin}${campaña.linkDemo}`

    navigator.clipboard.writeText(texto)
    setCopiedId(campaña.id)
    toast({
      title: "Copy copiado al portapapeles",
      description: `Campaña "${campaña.titulo}" lista para pegar en Meta Ads o WhatsApp.`,
    })
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleCompartirWhatsApp = (campaña: MarketingCampaign) => {
    const text = encodeURIComponent(
      `🚀 *Campaña de Marketing para ${campaña.rubroNombre}*\n\n` +
        `*Headline:* ${campaña.headline}\n\n` +
        `*Copy:* ${campaña.copyPrincipal.slice(0, 200)}...\n\n` +
        `*Probar Demo:* ${window.location.origin}${campaña.linkDemo}`
    )
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Shell */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Marketing Digital por Rubro</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Claver Cloud Growth
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Campañas publicitarias empaquetadas y segmentadas para lanzar en redes sociales y generar trials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/demo">
              <ExternalLink className="h-4 w-4 mr-2" />
              Probar Sensor Demo
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campañas Catalogadas</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MARKETING_CAMPAIGNS.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Segmentadas en 6 verticales clave</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CPL Promedio Est.</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">$530 ARS</div>
            <p className="text-xs text-muted-foreground mt-1">Costo por Lead calificado en Meta Ads</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto Mín. Sugerido</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">$3.500 ARS/día</div>
            <p className="text-xs text-muted-foreground mt-1">Por rubro activado en campaña</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar / Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por rubro, headline o palabra clave..."
                className="pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={rubroFiltro} onValueChange={setRubroFiltro}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por Rubro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos__">Todos los Rubros</SelectItem>
                  <SelectItem value="kiosco">Kiosco / Almacén</SelectItem>
                  <SelectItem value="ferreteria">Ferretería / Corralón</SelectItem>
                  <SelectItem value="gimnasio">Gimnasio / Club</SelectItem>
                  <SelectItem value="veterinaria">Veterinaria / Pet</SelectItem>
                  <SelectItem value="taller">Taller Mecánico</SelectItem>
                  <SelectItem value="monotributo">Monotributista</SelectItem>
                </SelectContent>
              </Select>

              <Select value={canalFiltro} onValueChange={setCanalFiltro}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos__">Todos los Canales</SelectItem>
                  <SelectItem value="instagram_reels">Instagram Reels</SelectItem>
                  <SelectItem value="meta_ads">Meta Ads (FB/IG)</SelectItem>
                  <SelectItem value="google_search">Google Search</SelectItem>
                  <SelectItem value="tiktok">TikTok Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Campañas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campañasFiltradas.map((campaña) => {
          const CanalIcon = CANAL_ICONS[campaña.canal] || Globe
          const RubroIcon = RUBRO_ICONS[campaña.rubroId] || Building

          return (
            <Card key={campaña.id} className="glass-panel border-border/60 hover:shadow-md transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <RubroIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs font-normal mb-1">
                        {campaña.rubroNombre}
                      </Badge>
                      <CardTitle className="text-base font-semibold leading-tight">
                        {campaña.titulo}
                      </CardTitle>
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                    <CanalIcon className="h-3 w-3" />
                    {campaña.canalLabel}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-sm flex-1">
                {/* Headline Hook */}
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <p className="font-semibold text-primary text-xs uppercase tracking-wide mb-0.5">Headline Hook:</p>
                  <p className="font-medium text-foreground">{campaña.headline}</p>
                </div>

                {/* Copy Text */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Texto de la Publicación / Copy:</p>
                  <p className="text-xs text-foreground/90 whitespace-pre-line bg-muted/30 p-3 rounded-lg font-mono border">
                    {campaña.copyPrincipal}
                  </p>
                </div>

                {/* Audiencia Objetivo & Presupuesto */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-card p-3 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground block">Segmento Objetivo:</span>
                    <span className="font-medium">{campaña.audienciaObjetivo.segmento}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Presupuesto Sugerido:</span>
                    <span className="font-medium text-emerald-600">
                      ${campaña.presupuestoDiarioARS.toLocaleString("es-AR")} ARS / día
                    </span>
                  </div>
                </div>

                {campaña.promptImagenIA && (
                  <div className="text-xs bg-violet-500/5 p-2.5 rounded-lg border border-violet-500/20">
                    <span className="font-semibold text-violet-600 block mb-0.5">Prompt Imagen IA (Midjourney/DALL-E):</span>
                    <span className="text-muted-foreground italic">{campaña.promptImagenIA}</span>
                  </div>
                )}
              </CardContent>

              {/* Card Footer Actions */}
              <div className="p-4 pt-0 border-t flex flex-wrap items-center justify-between gap-2 mt-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => handleCopiarCopy(campaña)}
                  >
                    {copiedId === campaña.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedId === campaña.id ? "¡Copiado!" : "Copiar Copy"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                    onClick={() => handleCompartirWhatsApp(campaña)}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Enviar WA
                  </Button>
                </div>
                <Button size="sm" variant="default" className="gap-1.5 text-xs" asChild>
                  <Link href={campaña.linkDemo} target="_blank">
                    <Sparkles className="h-3.5 w-3.5" />
                    Abrir Demo Rubro
                  </Link>
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

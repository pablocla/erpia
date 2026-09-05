"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Copy,
  Check,
  ExternalLink,
  MousePointerClick,
  Eye,
  Megaphone,
  LayoutDashboard,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  FACEBOOK_CAMPAIGN_ERP_CORE,
  buildFacebookCampaignUrl,
  productionFacebookUrl,
  type CoreErpModule,
  type FacebookCampaign,
} from "@/lib/marketing/facebook-campaigns"

type Pulso = {
  hits: number
  sesiones: number
  landings: number
  clicksModulo: number
  entradasErp: number
  sesionesEnDashboard: number
}

type CampaignRow = FacebookCampaign & {
  urlProduccion: string
  urlLocalEjemplo: string
}

type DashboardPayload = {
  originProduccion: string
  landingPath: string
  campanas: CampaignRow[]
  modulosCore: CoreErpModule[]
  instruccionesMeta: {
    destino: string
    cta: string
    notaPixel: string
    parametros: string[]
  }
  pulso: {
    periodo: { days: number; desde: string }
    pulso: Pulso
    porCampana: { utmCampaign: string; sesiones: number; hits: number; entradasErp: number }[]
    porSubpagina: { path: string; views: number }[]
    porModulo: { modulo: string; clicks: number }[]
    recientes: {
      id: number
      sessionId: string
      path: string
      evento: string
      utmCampaign: string | null
      modulo: string | null
      createdAt: string
    }[]
  }
}

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function FacebookCampaignsCloudPage() {
  const { toast } = useToast()
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState("7")
  const [copied, setCopied] = useState<string | null>(null)
  const [origin, setOrigin] = useState("http://localhost:3000")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/claver/campanas/facebook?days=${days}`, {
        headers: cloudAuthHeaders(),
      })
      if (!res.ok) return
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const localUrl = buildFacebookCampaignUrl(origin)
  const prodUrl = productionFacebookUrl()
  const campaign = data?.campanas[0] ?? FACEBOOK_CAMPAIGN_ERP_CORE
  const pulso = data?.pulso.pulso

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    toast({ title: "Copiado", description: label })
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <CloudPageHeader
        icon={Megaphone}
        eyebrow="Negocio & Ventas"
        title="Campañas Facebook"
        badge="Admin"
        description="Link del anuncio, copy para Meta y pulso de quién entra a /erp y al CORE del ERP. En local probás el mismo path; al pushear queda en claver.com.ar."
        onRefresh={() => void cargar()}
        loading={loading}
        actions={
          <div className="flex items-center gap-2">
            {(["7", "14", "30"] as const).map((d) => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? "default" : "outline"}
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link para el anuncio</CardTitle>
          <CardDescription>
            Pegalo en Destino de Meta Ads. Facebook agrega <code>fbclid</code> solo; Claver lo guarda en la sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LinkBlock
            label="Producción (claver.com.ar)"
            value={prodUrl}
            copied={copied === "prod"}
            onCopy={() => copy("prod", prodUrl)}
            openHref={prodUrl}
          />
          <LinkBlock
            label="Este entorno (localhost o preview)"
            value={localUrl}
            copied={copied === "local"}
            onCopy={() => copy("local", localUrl)}
            openHref={localUrl}
          />
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {(data?.instruccionesMeta.parametros ?? []).map((p) => (
              <Badge key={p} variant="outline" className="font-mono">
                {p}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {data?.instruccionesMeta.notaPixel}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Eye} label="Sesiones FB" value={pulso?.sesiones ?? 0} />
        <Kpi icon={MousePointerClick} label="Landings /erp" value={pulso?.landings ?? 0} />
        <Kpi icon={LayoutDashboard} label="Entraron al ERP" value={pulso?.sesionesEnDashboard ?? 0} />
        <Kpi icon={Users} label="Clicks de módulo" value={pulso?.clicksModulo ?? 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Copy para la publicación</CardTitle>
            <CardDescription>Headline, texto y CTA de Meta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Headline" value={campaign.headline} onCopy={() => copy("headline", campaign.headline)} copied={copied === "headline"} />
            <Field label="Texto principal" value={campaign.textoPrincipal} onCopy={() => copy("body", campaign.textoPrincipal)} copied={copied === "body"} multiline />
            <Field label="Texto corto / Reels" value={campaign.textoCorto} onCopy={() => copy("short", campaign.textoCorto)} copied={copied === "short"} />
            <p>
              <span className="text-muted-foreground">CTA Meta:</span>{" "}
              <strong>{campaign.ctaMeta}</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Qué aplicar en Meta Ads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Objetivo: Tráfico o Conversiones (Lead / CompleteRegistration).</li>
              <li>Destino: URL de producción de arriba. No uses la home ni /f.</li>
              <li>CTA del anuncio: {campaign.ctaMeta}.</li>
              <li>Formato: Reels / Stories 9:16. El video no debe llevar URL en pantalla (la IA la escribe mal).</li>
              <li>Al publicar, Meta suma fbclid. El pulso aparece acá en minutos.</li>
              <li>El visitante ve todos los módulos CORE y puede entrar al ERP demo sin tarjeta.</li>
            </ol>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/erp" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir /erp en esta sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pulso por subpágina</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              empty="Todavía no hay visitas con UTM de Facebook. Abrí el link local para generar el primer pulso."
              rows={(data?.pulso.porSubpagina ?? []).map((r) => [r.path, String(r.views)])}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Módulos tocados</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              empty="Nadie tocó un módulo todavía."
              rows={(data?.pulso.porModulo ?? []).map((r) => [r.modulo, String(r.clicks)])}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">Cuando</th>
                <th className="py-2 pr-3 font-medium">Evento</th>
                <th className="py-2 pr-3 font-medium">Ruta</th>
                <th className="py-2 pr-3 font-medium">Campaña</th>
                <th className="py-2 font-medium">Módulo</th>
              </tr>
            </thead>
            <tbody>
              {(data?.pulso.recientes ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-muted-foreground">
                    Sin eventos en el período.
                  </td>
                </tr>
              )}
              {(data?.pulso.recientes ?? []).map((row) => (
                <tr key={row.id} className="border-t border-border/60">
                  <td className="py-2 pr-3 whitespace-nowrap">{fmtWhen(row.createdAt)}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{row.evento}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{row.path}</td>
                  <td className="py-2 pr-3">{row.utmCampaign ?? "—"}</td>
                  <td className="py-2">{row.modulo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye
  label: string
  value: number
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between text-muted-foreground mb-1">
          <span className="text-xs font-medium">{label}</span>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function LinkBlock({
  label,
  value,
  copied,
  onCopy,
  openHref,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
  openHref: string
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <code className="flex-1 rounded-md border bg-muted/40 px-3 py-2 text-xs break-all">
          {value}
        </code>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={onCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={openHref} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onCopy,
  copied,
  multiline,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
  multiline?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <p className={cn("rounded-md border bg-muted/30 px-3 py-2 whitespace-pre-wrap", multiline && "min-h-[6rem]")}>
        {value}
      </p>
    </div>
  )
}

function SimpleTable({ empty, rows }: { empty: string; rows: [string, string][] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <ul className="space-y-2 text-sm">
      {rows.map(([name, count]) => (
        <li key={name} className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs truncate">{name}</span>
          <span className="tabular-nums text-muted-foreground">{count}</span>
        </li>
      ))}
    </ul>
  )
}

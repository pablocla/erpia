"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CreditCard,
  PlusSquare,
  Server,
  Shield,
  Store,
  Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import { navSections } from "@/lib/claver-cloud/nav-config"

type PlataformaMetricas = {
  clientes: number
  entornosEnError: number
  slaVencidos: number
  mttrHoras: number
}

const quickActions = [
  { href: "/claver-cloud/provisioning/new", label: "Nueva organización", desc: "Cliente + servicios + CCA", icon: PlusSquare, primary: true },
  { href: "/claver-cloud/superadmin", label: "Super Admin", desc: "Vista de flota", icon: Shield },
  { href: "/claver-cloud/organizations", label: "Organizaciones", desc: "Todos los tenants", icon: Building2 },
  { href: "/claver-cloud/marketplace", label: "Marketplace", desc: "Activar servicios", icon: Store },
  { href: "/claver-cloud/implementation", label: "Implementación", desc: "Proyectos CCA", icon: Target },
  { href: "/claver-cloud/billing", label: "Facturación", desc: "MRR y planes", icon: CreditCard },
]

export default function ClaverCloudHomePage() {
  const [plataforma, setPlataforma] = useState<PlataformaMetricas | null>(null)
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/ops/metricas", { headers: cloudAuthHeaders() })
      if (res.ok) setPlataforma(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  return (
    <div className="space-y-8">
      <CloudPageHeader
        title="Torre de operaciones"
        description="Consola de operaciones, tenants, marketplace y Protheus / OPO — una organización, infinitos servicios."
        onRefresh={cargar}
        loading={loading}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizaciones</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plataforma?.clientes ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Tenants en la flota</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entornos con error</CardTitle>
            <Server className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{plataforma?.entornosEnError ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{plataforma?.slaVencidos ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Tickets fuera de SLA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTTR plataforma</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plataforma?.mttrHoras ?? "—"}h</div>
            <p className="text-xs text-muted-foreground">Tiempo medio de recuperación</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex items-start gap-3 rounded-lg border p-4 transition ${
                action.primary
                  ? "border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/15"
                  : "hover:border-violet-500/40 hover:bg-violet-500/5"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20">
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {navSections.map((section) => (
          <Card key={section.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{section.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {section.items
                .filter((item) => item.href !== "/claver-cloud")
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.name}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: usá la barra de búsqueda arriba para ir directo al panel de un tenant por ID, CUIT o nombre.
      </p>
    </div>
  )
}
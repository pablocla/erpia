"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Server,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Layers,
  User,
  Sparkles,
} from "lucide-react"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { SkuPicker, type SkuCatalogItem } from "@/components/claver-cloud/sku-picker"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import type { TenantPlanId } from "@/lib/ops/tenant-plan-limits"
import { TENANT_PLAN_LIMITS } from "@/lib/ops/tenant-plan-limits"
import { cn } from "@/lib/utils"

const STEPS = [
  { n: 1, label: "Cliente", icon: Building2 },
  { n: 2, label: "Plan y servicios", icon: Layers },
  { n: 3, label: "Implementación", icon: User },
  { n: 4, label: "Confirmar", icon: Sparkles },
] as const

export default function NewProvisioningPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalog, setCatalog] = useState<SkuCatalogItem[]>([])
  const [formData, setFormData] = useState({
    contactoNombre: "",
    contactoEmail: "",
    razonSocial: "",
    cuit: "",
    planHosting: "Pro" as TenantPlanId,
    analistaAsignado: "",
    skus: [] as string[],
  })

  useEffect(() => {
    fetch("/api/claver/marketplace/catalog", { headers: cloudAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.catalog) setCatalog(data.catalog)
      })
      .finally(() => setCatalogLoading(false))
  }, [])

  const canAdvanceStep1 =
    formData.razonSocial.trim() &&
    formData.cuit.trim() &&
    formData.contactoNombre.trim() &&
    formData.contactoEmail.trim()

  const handleNext = () => {
    if (step === 1 && !canAdvanceStep1) return
    setStep((s) => Math.min(s + 1, 4))
  }
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver-cloud/provisioning/orders", {
        method: "POST",
        headers: cloudAuthHeaders(true),
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success && data.empresaId) {
        router.push(`/claver-cloud/tenants/${data.empresaId}?provisioned=1`)
      } else {
        alert("Error: " + (data.error ?? "No se pudo aprovisionar"))
      }
    } catch (e: unknown) {
      alert("Error de conexión: " + (e instanceof Error ? e.message : "desconocido"))
    } finally {
      setLoading(false)
    }
  }

  const planInfo = TENANT_PLAN_LIMITS[formData.planHosting]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <CloudPageHeader
        icon={Server}
        eyebrow="Provisioning"
        title="Nueva organización"
        description="Creá el tenant, activá servicios del marketplace y asigná el proyecto CCA en un solo flujo."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/claver-cloud/provisioning">Ver órdenes</Link>
          </Button>
        }
      />

      <div className="relative flex justify-between items-start gap-2 mb-2">
        <div className="absolute left-4 right-4 top-4 h-0.5 bg-muted -z-10 hidden sm:block" />
        {STEPS.map((s) => (
          <div key={s.n} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 shrink-0 bg-background",
                step >= s.n
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted text-muted-foreground",
              )}
            >
              {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
            </div>
            <span className={cn("text-[10px] sm:text-xs text-center truncate w-full", step >= s.n ? "text-foreground font-medium" : "text-muted-foreground")}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="border rounded-xl bg-card p-5 sm:p-6 min-h-[420px] flex flex-col shadow-sm">
        {step === 1 && (
          <div className="space-y-4 flex-1">
            <h3 className="text-lg font-semibold">Datos del cliente</h3>
            <p className="text-sm text-muted-foreground -mt-2">
              Estos datos crean la empresa y el usuario administrador inicial en Clavis.
            </p>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="razonSocial">Razón social</Label>
                <Input
                  id="razonSocial"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  placeholder="Ej. Kiosko Doña Rosa SRL"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  value={formData.cuit}
                  onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                  placeholder="Ej. 30-12345678-9"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contactoNombre">Contacto (admin)</Label>
                  <Input
                    id="contactoNombre"
                    value={formData.contactoNombre}
                    onChange={(e) => setFormData({ ...formData, contactoNombre: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactoEmail">Email del admin</Label>
                  <Input
                    id="contactoEmail"
                    type="email"
                    value={formData.contactoEmail}
                    onChange={(e) => setFormData({ ...formData, contactoEmail: e.target.value })}
                    placeholder="Ej. juan@empresa.com"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 flex-1">
            <div>
              <h3 className="text-lg font-semibold">Plan comercial y servicios</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Elegí el plan y los módulos del marketplace. Podés sumar más después desde el panel del tenant.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Plan de hosting</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["Starter", "Pro", "Enterprise"] as TenantPlanId[]).map((plan) => (
                  <Button
                    key={plan}
                    type="button"
                    variant={formData.planHosting === plan ? "default" : "outline"}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        planHosting: plan,
                        skus: formData.skus.slice(0, TENANT_PLAN_LIMITS[plan].maxSkusActivos),
                      })
                    }
                    className="flex flex-col h-auto py-3 gap-0.5"
                  >
                    <span>{plan}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      hasta {TENANT_PLAN_LIMITS[plan].maxSkusActivos === 999 ? "∞" : TENANT_PLAN_LIMITS[plan].maxSkusActivos} SKUs
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            {catalogLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando catálogo…
              </div>
            ) : (
              <SkuPicker
                catalog={catalog}
                selected={formData.skus}
                onChange={(skus) => setFormData({ ...formData, skus })}
                plan={formData.planHosting}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 flex-1">
            <h3 className="text-lg font-semibold">Asignación CCA</h3>
            <p className="text-sm text-muted-foreground -mt-2">
              Se creará un proyecto de implementación automáticamente. El analista recibe las tareas de onboarding.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="analistaAsignado">Analista de implementación</Label>
              <Input
                id="analistaAsignado"
                type="email"
                value={formData.analistaAsignado}
                onChange={(e) => setFormData({ ...formData, analistaAsignado: e.target.value })}
                placeholder="Vacío = tu usuario actual"
              />
              <p className="text-xs text-muted-foreground">
                Si lo dejás vacío, se asigna al analista que está creando la orden.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5 flex-1">
            <div className="text-center py-4">
              <Server className="h-12 w-12 text-violet-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold">Listo para aprovisionar</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-sm mt-2">
                Se creará <strong>{formData.razonSocial}</strong>, entornos dev/val/prd, usuario{" "}
                <strong>{formData.contactoEmail}</strong> y proyecto CCA.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <Badge variant="outline">{formData.planHosting}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicios activos</span>
                <span>{formData.skus.length} SKU{formData.skus.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base mensual plan</span>
                <span>{planInfo.precioBaseArs.toLocaleString("es-AR")} ARS</span>
              </div>
              {formData.skus.length > 0 && (
                <ul className="text-xs text-muted-foreground pt-2 border-t mt-2 space-y-0.5 max-h-24 overflow-y-auto">
                  {formData.skus.map((sku) => (
                    <li key={sku}>→ {catalog.find((c) => c.sku === sku)?.nombre ?? sku}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-4 border-t">
          <Button variant="outline" onClick={handlePrev} disabled={step === 1 || loading}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext} disabled={step === 1 && !canAdvanceStep1}>
              Siguiente <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Provisionando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Crear organización
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
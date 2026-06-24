"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Server, Loader2, ArrowRight, ArrowLeft } from "lucide-react"

export default function NewProvisioningPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    contactoNombre: "",
    contactoEmail: "",
    razonSocial: "",
    cuit: "",
    planHosting: "Pro",
    analistaAsignado: "",
    skus: [] as string[],
  })

  const handleNext = () => setStep((s) => Math.min(s + 1, 4))
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver-cloud/provisioning/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        router.push("/claver-cloud/provisioning")
      } else {
        alert("Error: " + data.error)
      }
    } catch (e: any) {
      alert("Excepción: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pt-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Tenant</h2>
        <p className="text-muted-foreground mt-1">
          Aprovisionamiento automático de clientes y entornos post-venta.
        </p>
      </div>

      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-muted -z-10" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= i ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-muted text-muted-foreground'}`}>
            {step > i ? <CheckCircle2 className="w-4 h-4" /> : i}
          </div>
        ))}
      </div>

      <div className="border rounded-lg bg-card p-6 min-h-[400px] flex flex-col">
        {step === 1 && (
          <div className="space-y-4 flex-1">
            <h3 className="text-xl font-semibold mb-4">Datos del Cliente</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="razonSocial">Razón Social</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contactoNombre">Nombre de Contacto (Admin)</Label>
                  <Input
                    id="contactoNombre"
                    value={formData.contactoNombre}
                    onChange={(e) => setFormData({ ...formData, contactoNombre: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactoEmail">Email (Usuario Admin)</Label>
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
          <div className="space-y-4 flex-1">
            <h3 className="text-xl font-semibold mb-4">Configuración Comercial</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Plan de Hosting</Label>
                <div className="flex gap-2">
                  {["Starter", "Pro", "Enterprise"].map((plan) => (
                    <Button
                      key={plan}
                      type="button"
                      variant={formData.planHosting === plan ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, planHosting: plan })}
                      className="flex-1"
                    >
                      {plan}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 flex-1">
            <h3 className="text-xl font-semibold mb-4">Asignación CCA</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="analistaAsignado">Email Analista de Implementación</Label>
                <Input
                  id="analistaAsignado"
                  type="email"
                  value={formData.analistaAsignado}
                  onChange={(e) => setFormData({ ...formData, analistaAsignado: e.target.value })}
                  placeholder="Ej. analista1@claver.cloud"
                />
                <p className="text-xs text-muted-foreground">Si se deja vacío, se asignará a un analista genérico.</p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 flex-1 text-center flex flex-col items-center justify-center">
            <Server className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold">Listo para Aprovisionar</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Al confirmar, se creará el tenant <strong>{formData.razonSocial}</strong>, se configurarán los entornos, se creará el usuario admin <strong>{formData.contactoEmail}</strong> y se enviará el email de bienvenida automáticamente.
            </p>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-4 border-t">
          <Button variant="outline" onClick={handlePrev} disabled={step === 1 || loading}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
          </Button>
          
          {step < 4 ? (
            <Button onClick={handleNext}>
              Siguiente <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Provisionando...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar Provisión</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

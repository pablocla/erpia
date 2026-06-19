"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Bot, Cable, Check, ChevronLeft, ChevronRight, Play, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const WIZARD_STEPS = [
  { id: 1, title: "Conectar", icon: Cable },
  { id: 2, title: "Eventos", icon: Zap },
  { id: 3, title: "Workers", icon: Bot },
  { id: 4, title: "Probar", icon: Play },
] as const

const EVENT_WIZARD_COPY: Record<string, string> = {
  VENTA_EMITIDA: "Cada vez que factures o emitas un ticket fiscal en el mostrador.",
  STOCK_BAJO: "Alertas cuando el inventario cruce el stock mínimo.",
  WEBHOOK_TEST: "Evento de prueba para validar la conexión con n8n.",
}

export interface WizardEventRow {
  key: string
  label: string
}

export interface AutomationWizardProps {
  events: WizardEventRow[]
  n8nBaseUrl: string
  webhookSecret: string
  eventUrls: Record<string, string>
  eventActive: Record<string, boolean>
  onN8nBaseUrlChange: (v: string) => void
  onWebhookSecretChange: (v: string) => void
  onEventUrlChange: (key: string, url: string) => void
  onEventActiveChange: (key: string, active: boolean) => void
  onSaveConfig: () => Promise<void>
  onSeed: () => Promise<void>
  onTest: () => Promise<{ ok: boolean; reason?: string }>
  onActivate: () => Promise<void>
  onComplete: () => void
  workersCount: number
}

export function AutomationWizard(props: AutomationWizardProps) {
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [testResult, setTestResult] = useState<"idle" | "ok" | "fail">("idle")
  const [seeded, setSeeded] = useState(props.workersCount > 0)

  const progress = (step / WIZARD_STEPS.length) * 100

  const wizardEvents = props.events.filter((e) =>
    ["VENTA_EMITIDA", "STOCK_BAJO", "WEBHOOK_TEST"].includes(e.key)
  )

  async function runAction(fn: () => Promise<void>) {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  async function handleNext() {
    if (step === 1 || step === 2) {
      await runAction(props.onSaveConfig)
    }
    if (step === 3 && !seeded && props.workersCount === 0) {
      try {
        await runAction(async () => {
          await props.onSeed()
          setSeeded(true)
        })
      } catch {
        setSeeded(true)
      }
    }
    if (step < 4) setStep(step + 1)
  }

  async function handleFinish() {
    const result = await props.onTest()
    setTestResult(result.ok ? "ok" : "fail")
    if (result.ok) {
      await props.onActivate()
      props.onComplete()
    }
  }

  return (
    <Card
      data-testid="automation-wizard"
      className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Asistente de configuración</CardTitle>
          <Badge variant="outline" className="ml-auto">
            Paso {step} de 4
          </Badge>
        </div>
        <CardDescription>
          Configurá n8n en minutos — sin tecnicismos innecesarios.
        </CardDescription>
        <Progress value={progress} className="h-1.5 mt-2" />
        <div className="flex gap-2 pt-2 flex-wrap">
          {WIZARD_STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-1 text-xs rounded-full px-2 py-1",
                step === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-3 w-3" />
              {s.title}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <div className="space-y-4 max-w-lg">
            <div>
              <h3 className="font-medium">Conectá tu motor n8n</h3>
              <p className="text-sm text-muted-foreground">
                Vinculá tu servidor local o en la nube para procesar eventos.
              </p>
            </div>
            <div className="space-y-2">
              <Label>URL Base n8n</Label>
              <Input
                data-testid="wizard-n8n-url"
                placeholder="https://n8n.tuempresa.com"
                value={props.n8nBaseUrl}
                onChange={(e) => props.onN8nBaseUrlChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ingresá la dirección de tu n8n (ej. https://n8n.tuempresa.com)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <Input
                value={props.webhookSecret}
                onChange={(e) => props.onWebhookSecretChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Generá o pegá una llave segura para firmar los datos salientes.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Elegí qué eventos enviar</h3>
              <p className="text-sm text-muted-foreground">
                Activá los triggers que NOP disparará automáticamente.
              </p>
            </div>
            {wizardEvents.map((ev) => (
              <div key={ev.key} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{ev.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {EVENT_WIZARD_COPY[ev.key] ?? ev.key}
                    </p>
                  </div>
                  <Switch
                    checked={props.eventActive[ev.key] ?? false}
                    onCheckedChange={(v) => props.onEventActiveChange(ev.key, v)}
                  />
                </div>
                {(props.eventActive[ev.key] ?? false) && (
                  <Input
                    placeholder={`${props.n8nBaseUrl || "https://n8n..."}/webhook/...`}
                    value={props.eventUrls[ev.key] ?? ""}
                    onChange={(e) => props.onEventUrlChange(ev.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 max-w-lg">
            <div>
              <h3 className="font-medium">Asigná tus Workers</h3>
              <p className="text-sm text-muted-foreground">
                Activá bots con perfiles predefinidos para gestionar tareas internas.
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="font-medium">Ana Reposición</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ana Reposición controlará tus faltantes y armará órdenes de compra borrador en
                horario de depósito.
              </p>
              {seeded || props.workersCount > 0 ? (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Catálogo de 10 workers instalado
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Al continuar se instalarán 10 empleados virtuales preconfigurados.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 max-w-lg">
            <div>
              <h3 className="font-medium">Probá la conexión</h3>
              <p className="text-sm text-muted-foreground">
                Enviá un evento de prueba para validar que tu n8n responda HTTP 200.
              </p>
            </div>
            {testResult === "ok" && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" /> Evento WEBHOOK_TEST despachado. Automatización activada.
              </p>
            )}
            {testResult === "fail" && (
              <p className="text-sm text-destructive">
                n8n no responde. NOP reintentará en background. Verificá URL y secret.
              </p>
            )}
            <Button data-testid="wizard-test-activate" onClick={handleFinish} disabled={busy}>
              <Play className="mr-2 h-4 w-4" />
              {busy ? "Enviando…" : "Enviar evento de prueba y activar"}
            </Button>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            disabled={step === 1 || busy}
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext} disabled={busy}>
              {busy ? "Guardando…" : "Siguiente"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" onClick={props.onComplete}>
              Cerrar asistente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
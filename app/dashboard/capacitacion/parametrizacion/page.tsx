"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  ChevronLeft,
  Layers,
  Zap,
  Workflow,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Info,
  Database,
  Building2,
  Factory,
  UtensilsCrossed,
  Stethoscope,
  Truck,
  ShieldCheck,
  GitBranch,
  Eye,
  ToggleRight,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────── */
/*  Reusable diagram components                                */
/* ─────────────────────────────────────────────────────────── */

function FlowNode({
  children,
  variant = "step",
  className,
}: {
  children: React.ReactNode
  variant?: "start" | "step" | "decision" | "end" | "highlight"
  className?: string
}) {
  const styles: Record<string, string> = {
    start: "bg-purple-500/10 border-purple-300 text-purple-700 dark:text-purple-300",
    step: "bg-card border-border text-foreground",
    decision: "bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300 rotate-0",
    end: "bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-300",
    highlight: "bg-primary/10 border-primary text-primary",
  }
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium shadow-sm",
        styles[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}

function FlowArrow({ label, direction = "down" }: { label?: string; direction?: "down" | "right" }) {
  if (direction === "right") {
    return (
      <div className="flex items-center gap-1 px-2">
        <div className="h-0.5 w-6 bg-muted-foreground/30" />
        {label && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</span>}
        <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <div className="w-0.5 h-4 bg-muted-foreground/30" />
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
      <ArrowDown className="h-3 w-3 text-muted-foreground/50" />
    </div>
  )
}

function FlowDiagram({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="relative">
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
      )}
      <div className="flex flex-col items-center gap-0 p-6 rounded-xl bg-muted/30 border border-border/50 overflow-x-auto">
        {children}
      </div>
    </div>
  )
}

function FlowBranch({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-6 flex-wrap justify-center">{children}</div>
}

function FlowPath({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0">
      <Badge variant="outline" className="text-[10px] mb-1">{label}</Badge>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Section: Arquitectura de 3 capas                           */
/* ─────────────────────────────────────────────────────────── */

function SeccionArquitectura() {
  return (
    <div className="space-y-6" id="arquitectura">
      <div>
        <h2 className="text-xl font-bold mb-1">1. Arquitectura de 3 Capas</h2>
        <p className="text-sm text-muted-foreground">
          El sistema resuelve la configuración en cascada: primero consulta si la empresa tiene un override,
          si no lo tiene usa el default del rubro, y si no existe la feature queda desactivada.
        </p>
      </div>

      <FlowDiagram title="Resolución en cascada — ¿Está activa la feature?">
        <FlowNode variant="start">
          <Eye className="h-4 w-4" /> Consultar feature X para empresa #42
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="decision">
          <Database className="h-4 w-4" /> ¿Existe override en FeatureEmpresa?
        </FlowNode>
        <FlowBranch>
          <FlowPath label="Sí">
            <FlowArrow />
            <FlowNode variant="highlight">
              <CheckCircle2 className="h-4 w-4" /> Usar valor de FeatureEmpresa
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="end">
              <ToggleRight className="h-4 w-4" /> Retornar activado/desactivado + params mergeados
            </FlowNode>
          </FlowPath>
          <FlowPath label="No">
            <FlowArrow />
            <FlowNode variant="decision">
              <Database className="h-4 w-4" /> ¿Existe en ConfiguracionRubro?
            </FlowNode>
            <FlowBranch>
              <FlowPath label="Sí">
                <FlowArrow />
                <FlowNode variant="highlight">
                  <CheckCircle2 className="h-4 w-4" /> Usar default del rubro
                </FlowNode>
              </FlowPath>
              <FlowPath label="No">
                <FlowArrow />
                <FlowNode variant="end">
                  <XCircle className="h-4 w-4" /> Feature desactivada (false)
                </FlowNode>
              </FlowPath>
            </FlowBranch>
          </FlowPath>
        </FlowBranch>
      </FlowDiagram>

      {/* Tabla de capas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            capa: "Capa 1",
            titulo: "FeatureRubro",
            desc: "Catálogo global de features disponibles por rubro. Define QUÉ EXISTE.",
            icon: Layers,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            ejemplo: "KDS existe para ALIM, no existe para SALUD",
          },
          {
            capa: "Capa 2",
            titulo: "ConfiguracionRubro",
            desc: "Defaults por rubro. Define QUÉ SE ACTIVA por defecto al crear una empresa.",
            icon: Settings,
            color: "text-violet-500",
            bgColor: "bg-violet-500/10",
            ejemplo: "KDS activo por defecto en ALIM con params {estaciones: 2}",
          },
          {
            capa: "Capa 3",
            titulo: "FeatureEmpresa",
            desc: "Override individual por empresa. La empresa PERSONALIZA sus features.",
            icon: Building2,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            ejemplo: "Empresa #42 desactiva KDS, activa Portal B2B",
          },
        ].map((capa) => (
          <Card key={capa.capa} className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 w-1 h-full", capa.bgColor.replace("/10", ""))} />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", capa.bgColor)}>
                  <capa.icon className={cn("h-4 w-4", capa.color)} />
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px]">{capa.capa}</Badge>
                  <CardTitle className="text-sm">{capa.titulo}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">{capa.desc}</p>
              <div className="bg-muted/50 rounded px-2 py-1.5">
                <p className="text-[11px] font-mono text-muted-foreground">
                  <span className="text-primary font-semibold">Ej:</span> {capa.ejemplo}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Section: Features por Rubro                                */
/* ─────────────────────────────────────────────────────────── */

const FEATURES_MATRIX = [
  { key: "pos", label: "Punto de Venta", alim: true, com: true, salud: true, ind: true, serv: true },
  { key: "stock", label: "Control de Stock", alim: true, com: true, salud: true, ind: true, serv: true },
  { key: "facturacion_afip", label: "Facturación AFIP", alim: true, com: true, salud: true, ind: true, serv: true },
  { key: "contabilidad", label: "Contabilidad", alim: true, com: true, salud: true, ind: true, serv: true },
  { key: "kds", label: "Kitchen Display", alim: true, com: false, salud: false, ind: false, serv: false },
  { key: "mesas_salon", label: "Mesas / Salón", alim: true, com: false, salud: false, ind: false, serv: false },
  { key: "picking", label: "Picking Warehouse", alim: false, com: true, salud: false, ind: false, serv: false },
  { key: "logistica", label: "Logística", alim: false, com: true, salud: false, ind: false, serv: false },
  { key: "historia_clinica", label: "Historia Clínica", alim: false, com: false, salud: true, ind: false, serv: false },
  { key: "turnos_agenda", label: "Turnos / Agenda", alim: false, com: false, salud: true, ind: false, serv: true },
  { key: "bom_produccion", label: "BOM / Producción", alim: false, com: false, salud: false, ind: true, serv: false },
  { key: "ordenes_produccion", label: "Órdenes Producción", alim: false, com: false, salud: false, ind: true, serv: false },
]

function SeccionFeatures() {
  return (
    <div className="space-y-6" id="features">
      <div>
        <h2 className="text-xl font-bold mb-1">2. Activación de Features por Rubro</h2>
        <p className="text-sm text-muted-foreground">
          Cada rubro tiene un conjunto de features habilitadas por defecto. La empresa puede activar/desactivar
          cualquier feature disponible para su rubro desde Configuración → Features.
        </p>
      </div>

      {/* Diagrama: Flujo de activación */}
      <FlowDiagram title="Flujo de activación de una feature">
        <FlowNode variant="start">
          <Settings className="h-4 w-4" /> Admin abre Configuración → Features
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <Eye className="h-4 w-4" /> Sistema carga features del rubro (FeatureRubro)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <Database className="h-4 w-4" /> Mergea con overrides de la empresa (FeatureEmpresa)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="decision">
          <ToggleRight className="h-4 w-4" /> Admin activa/desactiva feature
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <FileText className="h-4 w-4" /> PATCH /api/config/features {"{"} featureKey, activado {"}"}
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="highlight">
          <Database className="h-4 w-4" /> Crea/actualiza FeatureEmpresa (override)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="end">
          <CheckCircle2 className="h-4 w-4" /> Feature activa/inactiva — sidebar se actualiza
        </FlowNode>
      </FlowDiagram>

      {/* Matriz de features */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Matriz de Features por Rubro
          </CardTitle>
          <CardDescription className="text-xs">
            ✅ = activo por defecto | ❌ = no disponible para este rubro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold">Feature</th>
                  <th className="text-center py-2 px-2 font-semibold">
                    <span className="flex items-center justify-center gap-1">
                      <UtensilsCrossed className="h-3 w-3" /> ALIM
                    </span>
                  </th>
                  <th className="text-center py-2 px-2 font-semibold">
                    <span className="flex items-center justify-center gap-1">
                      <Truck className="h-3 w-3" /> COM
                    </span>
                  </th>
                  <th className="text-center py-2 px-2 font-semibold">
                    <span className="flex items-center justify-center gap-1">
                      <Stethoscope className="h-3 w-3" /> SALUD
                    </span>
                  </th>
                  <th className="text-center py-2 px-2 font-semibold">
                    <span className="flex items-center justify-center gap-1">
                      <Factory className="h-3 w-3" /> IND
                    </span>
                  </th>
                  <th className="text-center py-2 px-2 font-semibold">SERV</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES_MATRIX.map((f) => (
                  <tr key={f.key} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-1.5 px-2 font-medium">{f.label}</td>
                    {[f.alim, f.com, f.salud, f.ind, f.serv].map((val, i) => (
                      <td key={i} className="text-center py-1.5 px-2">
                        {val ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Código ejemplo */}
      <Card className="bg-slate-950 text-slate-100 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-slate-400 font-mono">
            Ejemplo: Verificar feature en un servicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs leading-relaxed overflow-x-auto">
            <code>{`import { isFeatureActiva, FEATURES } from "@/lib/config/rubro-config-service"

// En cualquier servicio:
const tieneKDS = await isFeatureActiva(empresaId, FEATURES.KDS)

if (tieneKDS) {
  // Ruta gastronomía: enviar comanda al KDS
  await eventBus.emit({ type: "comanda.nueva", payload: comanda })
}

// Obtener parámetros custom de una feature:
const params = await getFeatureParam(empresaId, "kds", "estaciones")
// → 3 (número de estaciones KDS configuradas)`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Section: Workflows                                         */
/* ─────────────────────────────────────────────────────────── */

function SeccionWorkflows() {
  return (
    <div className="space-y-6" id="workflows">
      <div>
        <h2 className="text-xl font-bold mb-1">3. Motor de Workflows (Railroad Switch)</h2>
        <p className="text-sm text-muted-foreground">
          El workflow engine ejecuta flujos dinámicos con pasos condicionales según el rubro y las features activas.
          Cada paso puede tener un &quot;feature gate&quot; que lo salta automáticamente si la feature no está activa.
        </p>
      </div>

      {/* Diagrama principal: Railroad Switch */}
      <FlowDiagram title="Railroad Switch — Flujo de venta por rubro">
        <FlowNode variant="start">
          <GitBranch className="h-4 w-4" /> Inicio Venta
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="decision">
          <Workflow className="h-4 w-4" /> Railroad Switch — ¿Qué rubro?
        </FlowNode>
        <FlowBranch>
          {/* Gastronomía */}
          <FlowPath label="🍳 ALIM">
            <FlowArrow />
            <FlowNode variant="step">Crear Comanda</FlowNode>
            <FlowArrow />
            <FlowNode variant="decision">¿KDS activo?</FlowNode>
            <FlowArrow label="Sí" />
            <FlowNode variant="step">Enviar a KDS</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Preparar Cuenta</FlowNode>
          </FlowPath>

          {/* Distribución */}
          <FlowPath label="📦 COM">
            <FlowArrow />
            <FlowNode variant="step">Crear Pedido</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Reservar Stock</FlowNode>
            <FlowArrow />
            <FlowNode variant="decision">¿Picking activo?</FlowNode>
            <FlowArrow label="Sí" />
            <FlowNode variant="step">Orden de Picking</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Emitir Remito</FlowNode>
          </FlowPath>

          {/* Salud */}
          <FlowPath label="🏥 SALUD">
            <FlowArrow />
            <FlowNode variant="step">Confirmar Turno</FlowNode>
            <FlowArrow />
            <FlowNode variant="decision">¿HC activo?</FlowNode>
            <FlowArrow label="Sí" />
            <FlowNode variant="step">Registrar en HC</FlowNode>
          </FlowPath>

          {/* Industria */}
          <FlowPath label="🏭 IND">
            <FlowArrow />
            <FlowNode variant="step">Orden Producción</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Consumir BOM</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Ingresar PT</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Costear OP</FlowNode>
          </FlowPath>
        </FlowBranch>

        <FlowArrow />
        <FlowNode variant="highlight">
          <ShieldCheck className="h-4 w-4" /> Emitir Factura AFIP (común a todos)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="decision">¿Contabilidad activa?</FlowNode>
        <FlowArrow label="Sí" />
        <FlowNode variant="step">Generar Asiento Contable</FlowNode>
        <FlowArrow />
        <FlowNode variant="step">Registrar Cobro</FlowNode>
        <FlowArrow />
        <FlowNode variant="end">
          <CheckCircle2 className="h-4 w-4" /> Venta completada
        </FlowNode>
      </FlowDiagram>

      {/* Feature Gates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Feature Gates en Workflows
          </CardTitle>
          <CardDescription className="text-xs">
            Cada paso del workflow puede tener un featureGate. Si la feature no está activa, el paso se salta automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { paso: "Enviar a KDS", gate: "kds", rubro: "ALIM", skip: "Prepara cuenta directo" },
              { paso: "Orden de Picking", gate: "picking_warehouse", rubro: "COM", skip: "Emite remito directo" },
              { paso: "Registrar en HC", gate: "historia_clinica", rubro: "SALUD", skip: "Factura directo" },
              { paso: "Generar Asiento", gate: "contabilidad", rubro: "TODOS", skip: "Cobra sin asiento" },
            ].map((item) => (
              <div key={item.gate} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.paso}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Gate: <code className="bg-muted px-1 rounded text-[10px]">{item.gate}</code>
                    <span className="mx-1">•</span>
                    Rubro: {item.rubro}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Si inactivo → {item.skip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diagrama: Ciclo de vida de un workflow */}
      <FlowDiagram title="Ciclo de vida de una instancia de workflow">
        <FlowNode variant="start">
          <Workflow className="h-4 w-4" /> POST /api/config/workflows
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          Cargar template del rubro (WorkflowRubro)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          Crear WorkflowInstancia (estado: &quot;en_curso&quot;)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="decision">
          ¿Hay más pasos?
        </FlowNode>
        <FlowBranch>
          <FlowPath label="Sí">
            <FlowArrow />
            <FlowNode variant="decision">
              ¿Feature gate del paso activa?
            </FlowNode>
            <FlowBranch>
              <FlowPath label="Sí">
                <FlowArrow />
                <FlowNode variant="step">Ejecutar paso (handler)</FlowNode>
                <FlowArrow />
                <FlowNode variant="step">Registrar en WorkflowPasoLog</FlowNode>
              </FlowPath>
              <FlowPath label="No">
                <FlowArrow />
                <FlowNode variant="step">Skip paso (log: &quot;skipped&quot;)</FlowNode>
              </FlowPath>
            </FlowBranch>
          </FlowPath>
          <FlowPath label="No más pasos">
            <FlowArrow />
            <FlowNode variant="end">
              <CheckCircle2 className="h-4 w-4" /> Estado: &quot;completado&quot;
            </FlowNode>
          </FlowPath>
        </FlowBranch>
      </FlowDiagram>

      {/* Código ejemplo */}
      <Card className="bg-slate-950 text-slate-100 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-slate-400 font-mono">
            Ejemplo: Ejecutar un workflow desde una API route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs leading-relaxed overflow-x-auto">
            <code>{`import { WorkflowEngine } from "@/lib/config/workflow-engine"

export async function POST(req: NextRequest) {
  const auth = getAuthContext(req)
  if (!auth.ok) return auth.response

  const factura = await crearFactura(...)
  
  // El engine resuelve la ruta correcta según el rubro
  const engine = new WorkflowEngine(auth.auth.empresaId)
  const resultado = await engine.ejecutar("venta", {
    facturaId: factura.id,
    total: factura.total,
    clienteId: factura.clienteId,
  })

  // resultado.estado = "completado"
  // resultado.contexto = { asientoId: 99, cobroId: 41, ... }
  return NextResponse.json({ factura, workflow: resultado })
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Section: Seed y Migración                                  */
/* ─────────────────────────────────────────────────────────── */

function SeccionMigracion() {
  return (
    <div className="space-y-6" id="migracion">
      <div>
        <h2 className="text-xl font-bold mb-1">4. Seed y Migración</h2>
        <p className="text-sm text-muted-foreground">
          Cómo inicializar features al crear una empresa, y cómo migrar empresas existentes al sistema de rubros.
        </p>
      </div>

      <FlowDiagram title="Onboarding de una empresa nueva">
        <FlowNode variant="start">
          <Building2 className="h-4 w-4" /> Crear Empresa (Onboarding IA)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          Detectar rubro (ej: ALIM → Gastronomía)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          prisma.empresa.create({"{"} rubroId: 3 {"}"})
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="highlight">
          inicializarFeaturesDesdeRubro(empresaId, rubroId)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          Copiar ConfiguracionRubro → FeatureEmpresa
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="end">
          <CheckCircle2 className="h-4 w-4" /> Empresa lista con features del rubro
        </FlowNode>
      </FlowDiagram>

      <FlowDiagram title="Migración de empresas existentes">
        <FlowNode variant="start">
          <Database className="h-4 w-4" /> Empresas existentes sin rubroId
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          UPDATE Empresa SET rubroId = Rubro.id WHERE rubro = código
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          Para cada empresa: inicializarFeaturesDesdeRubro()
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="end">
          <CheckCircle2 className="h-4 w-4" /> Todas las empresas con features configuradas
        </FlowNode>
      </FlowDiagram>

      {/* APIs disponibles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            APIs de Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Método</th>
                  <th className="text-left py-2 px-2">Ruta</th>
                  <th className="text-left py-2 px-2">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { method: "GET", route: "/api/config/rubros", desc: "Listar rubros con stats" },
                  { method: "POST", route: "/api/config/rubros", desc: "Seed completo de features + workflows" },
                  { method: "GET", route: "/api/config/features", desc: "Listar features de la empresa" },
                  { method: "GET", route: "/api/config/features?feature=kds", desc: "Verificar una feature" },
                  { method: "PATCH", route: "/api/config/features", desc: "Activar/desactivar feature" },
                  { method: "GET", route: "/api/config/workflows", desc: "Templates de workflow" },
                  { method: "POST", route: "/api/config/workflows", desc: "Ejecutar workflow" },
                ].map((api) => (
                  <tr key={api.route + api.method} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-1.5 px-2">
                      <Badge variant={api.method === "GET" ? "secondary" : api.method === "POST" ? "default" : "outline"} className="text-[10px]">
                        {api.method}
                      </Badge>
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[11px]">{api.route}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">{api.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Main Page                                                  */
/* ─────────────────────────────────────────────────────────── */

export default function ParametrizacionPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 gap-1 text-muted-foreground">
          <Link href="/dashboard/capacitacion">
            <ChevronLeft className="h-4 w-4" /> Volver a Capacitación
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parametrización del Sistema</h1>
            <p className="text-sm text-muted-foreground">
              Railroad Switch Engine — Configuración dinámica por rubro, features y workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs">Intermedio</Badge>
          <Badge variant="outline" className="text-xs gap-1"><Info className="h-3 w-3" /> 25 min lectura</Badge>
        </div>
      </div>

      {/* Table of contents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Índice</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="space-y-1">
            {[
              { href: "#arquitectura", label: "1. Arquitectura de 3 Capas", desc: "FeatureRubro → ConfiguracionRubro → FeatureEmpresa" },
              { href: "#features", label: "2. Activación de Features por Rubro", desc: "Matriz de features, cómo activar/desactivar" },
              { href: "#workflows", label: "3. Motor de Workflows (Railroad Switch)", desc: "Flujos dinámicos, feature gates, audit trail" },
              { href: "#migracion", label: "4. Seed y Migración", desc: "Onboarding, migración, APIs disponibles" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Sections */}
      <SeccionArquitectura />
      <SeccionFeatures />
      <SeccionWorkflows />
      <SeccionMigracion />

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" asChild className="gap-1">
          <Link href="/dashboard/capacitacion">
            <ChevronLeft className="h-4 w-4" /> Capacitación
          </Link>
        </Button>
        <Button asChild className="gap-1">
          <Link href="/dashboard/capacitacion/manual-usuario">
            Manual de Usuario <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

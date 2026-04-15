"use client"

import type React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  GraduationCap,
  Settings,
  BookOpen,
  ChevronRight,
  Workflow,
  Layers,
  Users,
  Zap,
  ShieldCheck,
  ArrowRight,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─────────────────────── Data ─────────────────────── */

interface Curso {
  href: string
  icon: React.ElementType
  titulo: string
  descripcion: string
  duracion: string
  nivel: "Básico" | "Intermedio" | "Avanzado"
  nivelColor: string
  temas: string[]
  color: string
  bgColor: string
}

const CURSOS_AUTOMATICO: Curso[] = [
  {
    href: "/dashboard/capacitacion/parametrizacion",
    icon: Settings,
    titulo: "Parametrización del Sistema",
    descripcion: "Configurar rubros, features, workflows y reglas del railroad switch engine para adaptar el ERP a tu negocio.",
    duracion: "25 min",
    nivel: "Intermedio",
    nivelColor: "bg-amber-500/10 text-amber-600 border-amber-200",
    temas: ["Rubros y verticales", "Feature flags", "Workflows dinámicos", "Override por empresa"],
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    href: "/dashboard/capacitacion/parametrizacion#features",
    icon: Zap,
    titulo: "Activación de Features",
    descripcion: "Cómo activar y desactivar módulos verticales (KDS, Picking, HC, IoT) según el rubro de tu empresa.",
    duracion: "15 min",
    nivel: "Básico",
    nivelColor: "bg-green-500/10 text-green-600 border-green-200",
    temas: ["Catálogo de features", "Resolución en cascada", "Parámetros custom"],
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    href: "/dashboard/capacitacion/parametrizacion#workflows",
    icon: Workflow,
    titulo: "Motor de Workflows",
    descripcion: "Crear y personalizar flujos de proceso con el Workflow Engine: pasos, transiciones, feature gates.",
    duracion: "20 min",
    nivel: "Avanzado",
    nivelColor: "bg-red-500/10 text-red-600 border-red-200",
    temas: ["Definir workflows", "Steps y transitions", "Feature gates", "Audit trail"],
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
]

const CURSOS_MANUAL: Curso[] = [
  {
    href: "/dashboard/capacitacion/manual-usuario",
    icon: BookOpen,
    titulo: "Guía de Operación Diaria",
    descripcion: "Flujo completo desde la apertura de caja hasta el cierre del día, facturación, cobros y reportes.",
    duracion: "30 min",
    nivel: "Básico",
    nivelColor: "bg-green-500/10 text-green-600 border-green-200",
    temas: ["Apertura de caja", "Facturación AFIP", "Cobros y pagos", "Cierre de caja"],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    href: "/dashboard/capacitacion/manual-usuario#ventas",
    icon: Layers,
    titulo: "Ciclo de Ventas Completo",
    descripcion: "Presupuesto → Pedido → Factura → Cobro → Asiento contable. Flujo end-to-end por rubro.",
    duracion: "25 min",
    nivel: "Intermedio",
    nivelColor: "bg-amber-500/10 text-amber-600 border-amber-200",
    temas: ["Presupuestos", "Factura electrónica", "Notas de crédito", "Contabilización"],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    href: "/dashboard/capacitacion/manual-usuario#compras",
    icon: Users,
    titulo: "Ciclo de Compras y Stock",
    descripcion: "Orden de compra → Recepción → Factura proveedor → Pago. Control de stock y costos.",
    duracion: "20 min",
    nivel: "Intermedio",
    nivelColor: "bg-amber-500/10 text-amber-600 border-amber-200",
    temas: ["Órdenes de compra", "Remitos", "Cuentas a pagar", "Movimientos de stock"],
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    href: "/dashboard/capacitacion/manual-usuario#rubros",
    icon: ShieldCheck,
    titulo: "Operatoria por Rubro",
    descripcion: "Guías específicas: Gastronomía (comandas/KDS), Salud (turnos/HC), Distribución (picking/logística).",
    duracion: "15 min",
    nivel: "Básico",
    nivelColor: "bg-green-500/10 text-green-600 border-green-200",
    temas: ["Gastronomía", "Salud / Veterinaria", "Distribución", "Industria"],
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
]

/* ─────────────────────── Components ─────────────────────── */

function CursoCard({ curso }: { curso: Curso }) {
  return (
    <Link href={curso.href}>
      <Card className="group h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", curso.bgColor)}>
              <curso.icon className={cn("h-5 w-5", curso.color)} />
            </div>
            <Badge variant="outline" className={cn("text-[10px] shrink-0", curso.nivelColor)}>
              {curso.nivel}
            </Badge>
          </div>
          <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors">
            {curso.titulo}
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            {curso.descripcion}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {curso.temas.map((tema) => (
              <Badge key={tema} variant="secondary" className="text-[10px] font-normal">
                {tema}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {curso.duracion}
            </span>
            <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Comenzar <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/* ─────────────────────── Page ─────────────────────── */

export default function CapacitacionPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Centro de Capacitación</h1>
              <p className="text-sm text-muted-foreground">
                Guías interactivas con diagramas de flujo para dominar el ERP
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <Target className="h-3 w-3" />
            8 módulos
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            ~2.5 horas total
          </Badge>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-200/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Módulos de Parametrización</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-200/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">4</p>
              <p className="text-xs text-muted-foreground">Guías de Usuario</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-200/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">12+</p>
              <p className="text-xs text-muted-foreground">Diagramas de Flujo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección 1: Parametrización Automática */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Settings className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Parametrización Automática</h2>
            <p className="text-xs text-muted-foreground">
              Configuración del railroad switch engine, features por rubro y workflows dinámicos
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CURSOS_AUTOMATICO.map((curso) => (
            <CursoCard key={curso.titulo} curso={curso} />
          ))}
        </div>
      </section>

      {/* Sección 2: Manual de Usuario */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Manual de Usuario</h2>
            <p className="text-xs text-muted-foreground">
              Operatoria diaria, flujos de trabajo paso a paso con diagramas interactivos
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CURSOS_MANUAL.map((curso) => (
            <CursoCard key={curso.titulo} curso={curso} />
          ))}
        </div>
      </section>

      {/* Sección 3: Diagnóstico de Implementación */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Diagnóstico de Implementación</h2>
            <p className="text-xs text-muted-foreground">
              Mapa visual de gaps: qué está implementado, qué falta y la prioridad de cierre
            </p>
          </div>
        </div>
        <Link href="/dashboard/capacitacion/diagnostico">
          <Card className="group transition-all duration-200 hover:shadow-lg hover:border-red-300/50 hover:-translate-y-0.5 cursor-pointer border-red-200/30 bg-gradient-to-r from-red-500/5 to-orange-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Target className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-red-600 transition-colors">Scorecard de 17 Módulos</h3>
                <p className="text-xs text-muted-foreground">
                  Diagramas de flujo end-to-end con nodos color-coded (✅ implementado, ⚠️ stub, ❌ faltante) — 
                  4 gaps críticos, 13 altos, roadmap priorizado
                </p>
              </div>
              <Badge variant="destructive" className="text-[10px] shrink-0">4 Críticos</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* CTA final */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold">¿Necesitás ayuda personalizada?</h3>
            <p className="text-sm text-muted-foreground">
              El Asistente IA puede guiarte paso a paso en la configuración de tu empresa.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/ia" className="gap-2">
              Consultar IA <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

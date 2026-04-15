"use client"

import type React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  Wallet,
  Receipt,
  CreditCard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  FileText,
  Landmark,
  BarChart3,
  Clock,
  Settings,
  BookOpen,
  UtensilsCrossed,
  Stethoscope,
  Factory,
  Cpu,
  PawPrint,
  DollarSign,
  Building2,
  Banknote,
  ScanLine,
  Bot,
  Shield,
  Printer,
  Mail,
  Database,
  TrendingUp,
  GitBranch,
  Layers,
  Zap,
  Activity,
  Target,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────── */
/*  Flow Diagram Components                                    */
/* ─────────────────────────────────────────────────────────── */

function FlowNode({
  children,
  variant = "step",
  className,
}: {
  children: React.ReactNode
  variant?: "start" | "step" | "decision" | "end" | "highlight" | "warning" | "missing" | "stub"
  className?: string
}) {
  const styles: Record<string, string> = {
    start: "bg-purple-500/10 border-purple-300 text-purple-700 dark:text-purple-300",
    step: "bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-300",
    decision: "bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300",
    end: "bg-blue-500/10 border-blue-300 text-blue-700 dark:text-blue-300",
    highlight: "bg-primary/10 border-primary text-primary",
    warning: "bg-orange-500/10 border-orange-300 text-orange-700 dark:text-orange-300",
    missing: "bg-red-500/10 border-red-400 text-red-700 dark:text-red-300 border-dashed",
    stub: "bg-amber-500/10 border-amber-400 text-amber-700 dark:text-amber-300 border-dashed",
  }
  return (
    <div className={cn("inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium shadow-sm", styles[variant], className)}>
      {children}
    </div>
  )
}

function FlowArrow({ label }: { label?: string }) {
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
      {title && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>}
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
/*  Legend                                                      */
/* ─────────────────────────────────────────────────────────── */

function Leyenda() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Leyenda de los Diagramas</CardTitle>
        <CardDescription className="text-xs">Cada nodo indica el estado de implementación de esa funcionalidad</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { variant: "step" as const, label: "Implementado", desc: "Funcional y completo", icon: CheckCircle2, color: "text-emerald-500" },
            { variant: "stub" as const, label: "Stub / Parcial", desc: "Código existe pero incompleto", icon: AlertTriangle, color: "text-amber-500" },
            { variant: "missing" as const, label: "Faltante", desc: "No implementado aún", icon: XCircle, color: "text-red-500" },
            { variant: "highlight" as const, label: "Crítico", desc: "Impacto alto en operación", icon: Zap, color: "text-primary" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <FlowNode variant={item.variant} className="!px-2 !py-1 !text-[11px]">
                <item.icon className={cn("h-3 w-3", item.color)} /> {item.label}
              </FlowNode>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Gap Item Component                                         */
/* ─────────────────────────────────────────────────────────── */

function GapItem({ severity, title, details }: { severity: "critical" | "high" | "medium" | "low"; title: string; details: string }) {
  const colors = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-amber-500",
    low: "bg-blue-500",
  }
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", colors[severity])} />
      <div>
        <span className="text-sm font-medium">{title}</span>
        <p className="text-xs text-muted-foreground">{details}</p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Module:  Ventas end-to-end                                 */
/* ─────────────────────────────────────────────────────────── */

function DiagramaVentas() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
          <Receipt className="h-4 w-4 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold">Ciclo de Ventas — Gaps</h3>
      </div>
      <FlowDiagram>
        <FlowNode variant="step"><FileText className="h-4 w-4" /> Presupuesto (✅ Service + API)</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><ArrowRight className="h-4 w-4" /> Ruta /presupuestos/{"{"} id {"}"}/convertir FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><ShoppingCart className="h-4 w-4" /> Pedido de Venta (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Receipt className="h-4 w-4" /> Factura AFIP (✅ WSFE + CAE)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Package className="h-4 w-4" /> Descontar stock (✅ evento)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Building2 className="h-4 w-4" /> Asiento contable (✅ auto)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><CreditCard className="h-4 w-4" /> Cobro + Recibo (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><FileText className="h-4 w-4" /> PDF del Recibo — FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><TrendingUp className="h-4 w-4" /> Comisiones liquidadas (sin persistencia)</FlowNode>
        <FlowArrow label="Devolución" />
        <FlowNode variant="step"><FileText className="h-4 w-4" /> Nota de Crédito (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><DollarSign className="h-4 w-4" /> Interés moratorio — FALTA</FlowNode>
      </FlowDiagram>
      <div className="space-y-1">
        <GapItem severity="high" title="POST /presupuestos/{id}/convertir" details="El service tiene convertirAFactura() pero no hay ruta dedicada" />
        <GapItem severity="medium" title="LiquidacionComision model" details="El service calcula comisiones pero no persiste la liquidación" />
        <GapItem severity="medium" title="Recibo PDF" details="No hay generación de PDF para recibos de cobro" />
        <GapItem severity="low" title="Descuento escalonado en línea" details="Solo porcentaje fijo, no escala por cantidad" />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Module: Compras end-to-end                                 */
/* ─────────────────────────────────────────────────────────── */

function DiagramaCompras() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <ShoppingCart className="h-4 w-4 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold">Ciclo de Compras — Gaps</h3>
      </div>
      <FlowDiagram>
        <FlowNode variant="missing"><FileText className="h-4 w-4" /> Solicitud de Compra — FALTA modelo</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><ShoppingCart className="h-4 w-4" /> Orden de Compra (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Truck className="h-4 w-4" /> Recepción + Remito (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><CheckCircle2 className="h-4 w-4" /> Three-Way Match (✅ completo)</FlowNode>
        <FlowArrow />
        <FlowNode variant="stub"><Shield className="h-4 w-4" /> WSCDC verificación — existe pero no wired</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Receipt className="h-4 w-4" /> Factura Proveedor (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="highlight"><XCircle className="h-4 w-4" /> generarCPPorCompra() — STUB CRÍTICO</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Banknote className="h-4 w-4" /> Orden de Pago (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="stub"><Building2 className="h-4 w-4" /> Asiento OP — haber IIBB truncado</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><FileText className="h-4 w-4" /> OP PDF — FALTA</FlowNode>
      </FlowDiagram>
      <div className="space-y-1">
        <GapItem severity="critical" title="generarCPPorCompra() es STUB" details="Las compras no generan CuentaPagar automáticamente — el flujo está roto" />
        <GapItem severity="high" title="Asiento OP haber IIBB truncado" details="Falta movimiento contable de retención IIBB en pagos" />
        <GapItem severity="high" title="WSCDC no integrado" details="Se puede verificar comprobantes de terceros pero no se usa en el flow de 3-way" />
        <GapItem severity="medium" title="SolicitudCompra model" details="No existe pedido interno previo a la OC" />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Module: Stock                                              */
/* ─────────────────────────────────────────────────────────── */

function DiagramaStock() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Package className="h-4 w-4 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold">Stock — Gaps</h3>
      </div>
      <FlowDiagram>
        <FlowNode variant="step"><Package className="h-4 w-4" /> CRUD Productos (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><ArrowDown className="h-4 w-4" /> Movimientos entrada/salida (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Layers className="h-4 w-4" /> Multi-depósito modelo (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><ArrowRight className="h-4 w-4" /> Transferencia entre depósitos — sin ruta</FlowNode>
        <FlowArrow />
        <FlowNode variant="stub"><Database className="h-4 w-4" /> Lotes — modelo existe, sin service</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Target className="h-4 w-4" /> Toma de Inventario — FALTA todo</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><DollarSign className="h-4 w-4" /> Valorización FIFO/PPP — FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Package className="h-4 w-4" /> Reserva de stock por pedido — FALTA</FlowNode>
      </FlowDiagram>
      <div className="space-y-1">
        <GapItem severity="high" title="Toma de Inventario" details="No existe modelo TomaInventario ni servicio para conteo físico" />
        <GapItem severity="high" title="Transferencia entre depósitos" details="Modelo TransferenciaDeposito existe pero sin API/service" />
        <GapItem severity="high" title="Valorización de stock" details="No hay cálculo FIFO/LIFO/PPP para costeo" />
        <GapItem severity="medium" title="Lotes sin servicio" details="El modelo Lote existe en Prisma pero no tiene servicio de gestión" />
        <GapItem severity="medium" title="StockReserva" details="Los pedidos confirmados no reservan stock automáticamente" />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Module: Financiero (Caja + Banco + Cheques)                */
/* ─────────────────────────────────────────────────────────── */

function DiagramaFinanciero() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-violet-500" />
        </div>
        <h3 className="text-lg font-semibold">Financiero — Gaps</h3>
      </div>

      {/* Caja */}
      <FlowDiagram title="Caja">
        <FlowNode variant="step"><Wallet className="h-4 w-4" /> Apertura/Cierre (✅ store + API)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><DollarSign className="h-4 w-4" /> Movimientos (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="stub"><Settings className="h-4 w-4" /> Lógica en API, sin CajaService</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><BarChart3 className="h-4 w-4" /> Arqueo de caja — FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Wallet className="h-4 w-4" /> Caja chica / fondos fijos — FALTA</FlowNode>
      </FlowDiagram>

      {/* Banco */}
      <FlowDiagram title="Banco">
        <FlowNode variant="step"><Landmark className="h-4 w-4" /> Transferencias paired (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><FileText className="h-4 w-4" /> Conciliación auto-match (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Database className="h-4 w-4" /> Persistir conciliación — FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><FileText className="h-4 w-4" /> Importar extracto OFX — solo CSV</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Building2 className="h-4 w-4" /> Asiento por transferencia — FALTA</FlowNode>
      </FlowDiagram>

      {/* Cheques */}
      <FlowDiagram title="Cheques">
        <FlowNode variant="step"><Banknote className="h-4 w-4" /> CRUD + estado (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="stub"><Settings className="h-4 w-4" /> Lógica inline, sin ChequeService</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Users className="h-4 w-4" /> Cadena de endosos — sin registro</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><AlertTriangle className="h-4 w-4" /> Cheque rechazado → re-debito CC — FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Zap className="h-4 w-4" /> ECHEQ electrónico — FALTA</FlowNode>
      </FlowDiagram>

      <div className="space-y-1">
        <GapItem severity="high" title="Arqueo de caja" details="No existe modelo ArqueoCaja ni reconciliación de cierre" />
        <GapItem severity="high" title="Conciliación no persiste" details="Auto-match correcto pero los resultados no se guardan en DB" />
        <GapItem severity="high" title="Cheque rechazado" details="Cambia estado pero no genera re-débito en cuenta corriente del cliente" />
        <GapItem severity="medium" title="CajaService/ChequeService" details="Lógica inline en API routes, sin service layer testeable" />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Module: Contabilidad                                       */
/* ─────────────────────────────────────────────────────────── */

function DiagramaContabilidad() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-cyan-500" />
        </div>
        <h3 className="text-lg font-semibold">Contabilidad — Gaps</h3>
      </div>
      <FlowDiagram>
        <FlowNode variant="step"><BookOpen className="h-4 w-4" /> Asientos partida doble (✅ 5 auto)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><FileText className="h-4 w-4" /> Plan de Cuentas (✅ 10 rubros)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><BarChart3 className="h-4 w-4" /> Balance Sumas y Saldos (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Clock className="h-4 w-4" /> Períodos Fiscales (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><TrendingUp className="h-4 w-4" /> Activos Fijos + Depreciación (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="stub"><Layers className="h-4 w-4" /> Centros de Costo — sin UI ni wire</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><BarChart3 className="h-4 w-4" /> Balance General — FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><DollarSign className="h-4 w-4" /> Estado de Resultados — FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Shield className="h-4 w-4" /> Cierre de Ejercicio — FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Activity className="h-4 w-4" /> Ajuste por Inflación — FALTA (crítico ARG)</FlowNode>
      </FlowDiagram>
      <div className="space-y-1">
        <GapItem severity="critical" title="Balance General / Estado Resultados" details="Solo existe Sumas y Saldos — falta balance sheet y P&L" />
        <GapItem severity="critical" title="Ajuste por Inflación" details="Obligatorio en Argentina (RT 6) — no existe modelo ni servicio" />
        <GapItem severity="high" title="Cierre de Ejercicio" details="No hay asiento de refundición de cuentas de resultado" />
        <GapItem severity="medium" title="Centros de Costo sin UI" details="Service existe pero no está conectado al flujo de asientos ni tiene UI" />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Module: Impuestos                                          */
/* ─────────────────────────────────────────────────────────── */

function DiagramaImpuestos() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
          <Shield className="h-4 w-4 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold">Impuestos — Gaps</h3>
      </div>
      <FlowDiagram>
        <FlowNode variant="step"><Receipt className="h-4 w-4" /> IVA Débito/Crédito (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><FileText className="h-4 w-4" /> Libros IVA Digital (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Shield className="h-4 w-4" /> SICORE Retenciones (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><FileText className="h-4 w-4" /> IIBB DDJJ (✅ ARBA/AGIP/generic)</FlowNode>
        <FlowArrow />
        <FlowNode variant="step"><Database className="h-4 w-4" /> Padrón IIBB import (✅)</FlowNode>
        <FlowArrow />
        <FlowNode variant="stub"><Zap className="h-4 w-4" /> Percepciones auto en factura — no wired</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><FileText className="h-4 w-4" /> Certificado Retención PDF — FALTA</FlowNode>
        <FlowArrow />
        <FlowNode variant="missing"><Database className="h-4 w-4" /> LiquidacionImpuesto model — FALTA</FlowNode>
      </FlowDiagram>
      <div className="space-y-1">
        <GapItem severity="high" title="Percepciones auto al facturar" details="PadronRegimenCliente existe pero no se aplica automáticamente al emitir factura" />
        <GapItem severity="high" title="Certificado de Retención" details="Obligatorio para agentes — no hay generación de certificado" />
        <GapItem severity="medium" title="LiquidacionImpuesto" details="Las liquidaciones de IVA/IIBB no se persisten como registro" />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Module: Verticales                                         */
/* ─────────────────────────────────────────────────────────── */

function DiagramaVerticales() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
          <GitBranch className="h-4 w-4 text-pink-500" />
        </div>
        <h3 className="text-lg font-semibold">Verticales por Rubro — Gaps</h3>
      </div>

      {/* Grid de verticales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hospitalidad */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-orange-500" /> Hospitalidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Salones, Mesas, Comandas, KDS</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Platos/Recetas con consumo stock</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Mesa → Factura flow</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Reservas de mesa</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> División de cuenta (split bill)</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Modificadores de plato (extra/sin)</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Delivery integration</div>
          </CardContent>
        </Card>

        {/* Salud */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-red-500" /> Salud
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Turnos/Agenda con conflictos</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Historia Clínica</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Turnos recurrentes</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Recordatorio SMS/WhatsApp</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Prescripciones</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Portal paciente (auto-agendar)</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Adjuntos clínicos</div>
          </CardContent>
        </Card>

        {/* Industria */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Factory className="h-4 w-4 text-emerald-500" /> Industria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> BOM CRUD</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Órdenes de Producción</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Consumo automático de materiales</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Costeo de OP (rollup BOM)</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Control de calidad</div>
          </CardContent>
        </Card>

        {/* IoT */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 text-sky-500" /> IoT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Dispositivos CRUD</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Lecturas + alertas threshold</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Conectores MQTT/Modbus</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Dashboard real-time widgets</div>
          </CardContent>
        </Card>

        {/* Veterinaria */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PawPrint className="h-4 w-4 text-pink-500" /> Veterinaria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Pacientes + Consultas</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Historial vacunas</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Calendario vacunación</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Tracking de peso</div>
          </CardContent>
        </Card>

        {/* Picking + Logística */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-violet-500" /> Picking + Logística
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Picking line-by-line + auto-complete</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Envíos + transportistas CRUD</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Wave picking (batch)</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> COT ARBA</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Tarifa flete por zona</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Module: Cross-cutting                                      */
/* ─────────────────────────────────────────────────────────── */

function DiagramaCrossCutting() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
          <Wrench className="h-4 w-4 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold">Cross-Cutting — Gaps</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Printer */}
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Printer className="h-4 w-4 text-red-500" /> Impresión
              <Badge variant="destructive" className="text-[10px]">CRÍTICO</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> ESC/POS command generation (Hasar + Epson)</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> <strong>enviarComandos() es STUB — NO envía al dispositivo</strong></div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Conexión TCP/USB/Serial no implementada</div>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4 text-pink-500" /> Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> SMTP + attachments</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Templates HTML (facturas, recibos)</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Cola de reintentos</div>
          </CardContent>
        </Card>

        {/* Export */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-500" /> Exportación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> CSV export (6 entidades)</div>
            <div className="flex items-center gap-2 text-xs"><AlertTriangle className="h-3 w-3 text-amber-500" /> XLSX degrada a CSV</div>
            <div className="flex items-center gap-2 text-xs"><AlertTriangle className="h-3 w-3 text-amber-500" /> PDF service presente pero sin validar</div>
          </CardContent>
        </Card>

        {/* AI */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-500" /> IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Chat dual (Ollama/Anthropic)</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Alertas, anomalías, proyecciones</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Agentes framework</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Agente autopilot (acciones reales limitadas)</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> RAG / vector search</div>
          </CardContent>
        </Card>

        {/* Monitoring */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-500" /> Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Structured JSON logging</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Sentry/Datadog connector</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Business metrics dashboard</div>
          </CardContent>
        </Card>

        {/* Stores + Hooks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-500" /> Stores & Hooks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> auth, caja, ui stores</div>
            <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> useAuthFetch, useMobile, useToast</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> useDebounce, usePermissions, useHotkeys</div>
            <div className="flex items-center gap-2 text-xs"><XCircle className="h-3 w-3 text-red-500" /> Notification store</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Summary scoreboard                                         */
/* ─────────────────────────────────────────────────────────── */

const RESUMEN_MODULOS = [
  { modulo: "Ventas", completitud: 85, criticos: 0, altos: 1, medios: 2 },
  { modulo: "Compras", completitud: 70, criticos: 1, altos: 2, medios: 1 },
  { modulo: "Stock", completitud: 55, criticos: 0, altos: 3, medios: 2 },
  { modulo: "Caja", completitud: 60, criticos: 0, altos: 1, medios: 1 },
  { modulo: "Banco", completitud: 65, criticos: 0, altos: 1, medios: 2 },
  { modulo: "Cheques", completitud: 50, criticos: 0, altos: 1, medios: 2 },
  { modulo: "Contabilidad", completitud: 60, criticos: 2, altos: 1, medios: 1 },
  { modulo: "Impuestos", completitud: 80, criticos: 0, altos: 2, medios: 1 },
  { modulo: "Hospitalidad", completitud: 70, criticos: 0, altos: 0, medios: 3 },
  { modulo: "Salud/Agenda", completitud: 55, criticos: 0, altos: 0, medios: 4 },
  { modulo: "Industria", completitud: 45, criticos: 0, altos: 2, medios: 1 },
  { modulo: "Logistica/Picking", completitud: 65, criticos: 0, altos: 0, medios: 3 },
  { modulo: "IoT", completitud: 60, criticos: 0, altos: 0, medios: 2 },
  { modulo: "Veterinaria", completitud: 65, criticos: 0, altos: 0, medios: 2 },
  { modulo: "AFIP", completitud: 85, criticos: 0, altos: 0, medios: 2 },
  { modulo: "IA", completitud: 80, criticos: 0, altos: 0, medios: 2 },
  { modulo: "Impresión", completitud: 30, criticos: 1, altos: 0, medios: 0 },
]

function TablaResumen() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Scorecard de Módulos
        </CardTitle>
        <CardDescription className="text-xs">Completitud estimada y gaps por severidad en cada módulo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Módulo</th>
                <th className="text-center py-2 px-2">Completitud</th>
                <th className="text-center py-2 px-2">Barra</th>
                <th className="text-center py-2 px-2 text-red-500">Críticos</th>
                <th className="text-center py-2 px-2 text-orange-500">Altos</th>
                <th className="text-center py-2 px-2 text-amber-500">Medios</th>
              </tr>
            </thead>
            <tbody>
              {RESUMEN_MODULOS.map((m) => (
                <tr key={m.modulo} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-1.5 px-2 font-medium">{m.modulo}</td>
                  <td className="text-center py-1.5 px-2 font-mono">{m.completitud}%</td>
                  <td className="py-1.5 px-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          m.completitud >= 80 ? "bg-emerald-500" :
                          m.completitud >= 60 ? "bg-amber-500" :
                          m.completitud >= 40 ? "bg-orange-500" :
                          "bg-red-500"
                        )}
                        style={{ width: `${m.completitud}%` }}
                      />
                    </div>
                  </td>
                  <td className="text-center py-1.5 px-2">
                    {m.criticos > 0 ? <Badge variant="destructive" className="text-[10px]">{m.criticos}</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="text-center py-1.5 px-2">
                    {m.altos > 0 ? <Badge className="text-[10px] bg-orange-500">{m.altos}</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="text-center py-1.5 px-2">
                    {m.medios > 0 ? <Badge variant="outline" className="text-[10px]">{m.medios}</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Page                                                       */
/* ─────────────────────────────────────────────────────────── */

export default function DiagnosticoPage() {
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
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Diagnóstico de Implementación</h1>
            <p className="text-sm text-muted-foreground">
              Flujos completos con gaps identificados — qué falta para exprimir toda la tecnología
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">199</p>
              <p className="text-[10px] text-muted-foreground">API Routes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">~170</p>
              <p className="text-[10px] text-muted-foreground">Modelos Prisma</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-600">4</p>
              <p className="text-[10px] text-muted-foreground">Gaps Críticos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">13</p>
              <p className="text-[10px] text-muted-foreground">Gaps Altos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Leyenda />
      <TablaResumen />

      {/* Diagrams by module */}
      <DiagramaVentas />
      <DiagramaCompras />
      <DiagramaStock />
      <DiagramaFinanciero />
      <DiagramaContabilidad />
      <DiagramaImpuestos />
      <DiagramaVerticales />
      <DiagramaCrossCutting />

      {/* Critical path */}
      <Card className="border-red-200 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Roadmap de Cierre Crítico — Por prioridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { prio: 1, titulo: "generarCPPorCompra() — Completar stub", desc: "Las compras no generan cuentas a pagar. Sin esto el ciclo compras→pago está roto.", modulo: "Compras/CC-CP" },
            { prio: 2, titulo: "Balance General + Estado Resultados", desc: "Solo existe Sumas y Saldos. Obligatorio para presentaciones contables y AFIP.", modulo: "Contabilidad" },
            { prio: 3, titulo: "Ajuste por Inflación (RT 6)", desc: "Requerimiento legal en Argentina para EECC. No existe modelo ni servicio.", modulo: "Contabilidad" },
            { prio: 4, titulo: "Impresión — enviarComandos()", desc: "Los comandos ESC/POS se generan bien pero NO se envían al dispositivo. Sin esto no hay tickets.", modulo: "Impresión" },
            { prio: 5, titulo: "Toma de Inventario", desc: "No hay forma de hacer conteo físico y conciliar diferencias con stock del sistema.", modulo: "Stock" },
            { prio: 6, titulo: "Transferencia entre depósitos", desc: "Modelo existe pero sin API/service. Multi-depósito inutilizable sin transferencias.", modulo: "Stock" },
            { prio: 7, titulo: "Percepciones auto al facturar", desc: "El padrón IIBB se importa pero no se aplica automáticamente al emitir factura.", modulo: "Impuestos" },
            { prio: 8, titulo: "Persistir conciliación bancaria", desc: "Auto-match excelente pero los resultados se pierden. Sin persistencia no sirve.", modulo: "Banco" },
            { prio: 9, titulo: "Cierre de ejercicio contable", desc: "No hay asiento de refundición ni cierre de cuentas de resultado.", modulo: "Contabilidad" },
            { prio: 10, titulo: "Cheque rechazado → re-débito CC", desc: "El estado cambia pero no se re-debita la cuenta corriente del cliente.", modulo: "Cheques" },
            { prio: 11, titulo: "Consumo automático de materiales", desc: "Las OP no descuentan materias primas del stock al completar producción.", modulo: "Industria" },
            { prio: 12, titulo: "Asiento por transferencia bancaria", desc: "Las transferencias entre cuentas propias no generan asiento contable.", modulo: "Banco" },
            { prio: 13, titulo: "Arqueo de caja", desc: "No hay modelo ni proceso de reconciliación de caja al cierre.", modulo: "Caja" },
          ].map((item) => (
            <div key={item.prio} className="flex items-start gap-3">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                item.prio <= 4 ? "bg-red-500" : item.prio <= 8 ? "bg-orange-500" : "bg-amber-500"
              )}>
                {item.prio}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{item.titulo}</p>
                  <Badge variant="outline" className="text-[10px]">{item.modulo}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" asChild className="gap-1">
          <Link href="/dashboard/capacitacion">
            <ChevronLeft className="h-4 w-4" /> Capacitación
          </Link>
        </Button>
        <Button variant="ghost" asChild className="gap-1">
          <Link href="/dashboard/capacitacion/parametrizacion">
            Parametrización <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  ChevronLeft,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  XCircle,
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
  Info,
  AlertTriangle,
  UtensilsCrossed,
  Monitor,
  Stethoscope,
  CalendarDays,
  Factory,
  ScanLine,
  HeartPulse,
  PawPrint,
  ShieldCheck,
  DollarSign,
  Building2,
  Banknote,
  TrendingUp,
  GitBranch,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────── */
/*  Reusable Flow Diagram Components                           */
/* ─────────────────────────────────────────────────────────── */

function FlowNode({
  children,
  variant = "step",
  className,
}: {
  children: React.ReactNode
  variant?: "start" | "step" | "decision" | "end" | "highlight" | "warning"
  className?: string
}) {
  const styles: Record<string, string> = {
    start: "bg-purple-500/10 border-purple-300 text-purple-700 dark:text-purple-300",
    step: "bg-card border-border text-foreground",
    decision: "bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300",
    end: "bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-300",
    highlight: "bg-primary/10 border-primary text-primary",
    warning: "bg-red-500/10 border-red-300 text-red-700 dark:text-red-300",
  }
  return (
    <div className={cn("inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium shadow-sm", styles[variant], className)}>
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

function StepCard({ numero, titulo, descripcion, icon: Icon, color, pasos }: {
  numero: number
  titulo: string
  descripcion: string
  icon: React.ElementType
  color: string
  pasos: string[]
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0", color)}>
          {numero}
        </div>
        <div className="w-0.5 flex-1 bg-border mt-1" />
      </div>
      <div className="pb-8 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-semibold text-sm">{titulo}</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{descripcion}</p>
        <ul className="space-y-1">
          {pasos.map((paso, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
              {paso}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Section: Operación Diaria                                  */
/* ─────────────────────────────────────────────────────────── */

function SeccionOperacionDiaria() {
  return (
    <div className="space-y-6" id="operacion-diaria">
      <div>
        <h2 className="text-xl font-bold mb-1">1. Operación Diaria</h2>
        <p className="text-sm text-muted-foreground">
          El ciclo completo desde la apertura de caja hasta el cierre del día.
        </p>
      </div>

      <FlowDiagram title="Flujo de operación diaria completo">
        <FlowNode variant="start">
          <Clock className="h-4 w-4" /> Inicio del Día
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="highlight">
          <Wallet className="h-4 w-4" /> Apertura de Caja (fondo inicial)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <Receipt className="h-4 w-4" /> Operar durante el día (ventas, cobros, pagos)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="decision">
          ¿Fin del día?
        </FlowNode>
        <FlowBranch>
          <FlowPath label="No">
            <FlowArrow />
            <FlowNode variant="step">Seguir operando</FlowNode>
          </FlowPath>
          <FlowPath label="Sí">
            <FlowArrow />
            <FlowNode variant="step">
              <BarChart3 className="h-4 w-4" /> Revisar movimientos del día
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <DollarSign className="h-4 w-4" /> Contar efectivo en caja
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="decision">
              ¿Cuadra con el sistema?
            </FlowNode>
            <FlowBranch>
              <FlowPath label="Sí">
                <FlowArrow />
                <FlowNode variant="end">
                  <CheckCircle2 className="h-4 w-4" /> Cerrar Caja OK
                </FlowNode>
              </FlowPath>
              <FlowPath label="No">
                <FlowArrow />
                <FlowNode variant="warning">
                  <AlertTriangle className="h-4 w-4" /> Registrar diferencia
                </FlowNode>
                <FlowArrow />
                <FlowNode variant="end">
                  Cerrar con observaciones
                </FlowNode>
              </FlowPath>
            </FlowBranch>
          </FlowPath>
        </FlowBranch>
      </FlowDiagram>

      {/* Steps detallados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Pasos detallados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <StepCard
            numero={1}
            titulo="Apertura de Caja"
            descripcion="Registrar el fondo inicial de caja para comenzar a operar."
            icon={Wallet}
            color="bg-violet-500"
            pasos={[
              "Ir a Dashboard → Caja",
              "Clic en 'Abrir Caja'",
              "Ingresar monto de fondo inicial (efectivo)",
              "Confirmar apertura — la caja queda en estado 'Abierta'",
            ]}
          />
          <StepCard
            numero={2}
            titulo="Emitir Facturas"
            descripcion="Crear facturas electrónicas AFIP (A, B o C según condición IVA del cliente)."
            icon={Receipt}
            color="bg-green-500"
            pasos={[
              "Dashboard → Ventas → Facturación",
              "Seleccionar cliente (o crear nuevo)",
              "Agregar productos/servicios al detalle",
              "Seleccionar tipo de comprobante (Factura A/B/C)",
              "Clic en 'Emitir' — el sistema obtiene CAE de AFIP automáticamente",
            ]}
          />
          <StepCard
            numero={3}
            titulo="Registrar Cobros"
            descripcion="Cobrar facturas pendientes o al contado. Se registra en caja automáticamente."
            icon={CreditCard}
            color="bg-blue-500"
            pasos={[
              "Dashboard → Cuentas a Cobrar (o desde la factura)",
              "Seleccionar factura(s) a cobrar",
              "Elegir forma de pago: Efectivo, Tarjeta, Transferencia, Cheque",
              "Confirmar cobro — se genera movimiento de caja y asiento contable",
            ]}
          />
          <StepCard
            numero={4}
            titulo="Cierre de Caja"
            descripcion="Al finalizar el día, cerrar la caja y verificar el cuadre."
            icon={BarChart3}
            color="bg-orange-500"
            pasos={[
              "Dashboard → Caja → 'Cerrar Caja'",
              "Contar efectivo físico e ingresar el monto",
              "El sistema compara con los movimientos registrados",
              "Si hay diferencia, se registra como sobrante/faltante",
              "Confirmar cierre — genera reporte Z del día",
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Section: Ciclo de Ventas                                   */
/* ─────────────────────────────────────────────────────────── */

function SeccionVentas() {
  return (
    <div className="space-y-6" id="ventas">
      <div>
        <h2 className="text-xl font-bold mb-1">2. Ciclo de Ventas Completo</h2>
        <p className="text-sm text-muted-foreground">
          Desde el presupuesto hasta el cobro y la contabilización.
        </p>
      </div>

      <FlowDiagram title="Flujo end-to-end de ventas">
        <FlowNode variant="start">
          <Users className="h-4 w-4" /> Cliente solicita cotización
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <FileText className="h-4 w-4" /> Crear Presupuesto
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="decision">
          ¿Cliente aprueba?
        </FlowNode>
        <FlowBranch>
          <FlowPath label="Sí">
            <FlowArrow />
            <FlowNode variant="highlight">
              <Receipt className="h-4 w-4" /> Convertir a Factura AFIP
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <Package className="h-4 w-4" /> Descontar stock automático
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <Building2 className="h-4 w-4" /> Generar asiento contable
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="decision">
              ¿Pago al contado?
            </FlowNode>
            <FlowBranch>
              <FlowPath label="Sí">
                <FlowArrow />
                <FlowNode variant="step">
                  <CreditCard className="h-4 w-4" /> Registrar cobro
                </FlowNode>
                <FlowArrow />
                <FlowNode variant="end">
                  <CheckCircle2 className="h-4 w-4" /> Venta cerrada
                </FlowNode>
              </FlowPath>
              <FlowPath label="Cuenta corriente">
                <FlowArrow />
                <FlowNode variant="step">
                  <TrendingUp className="h-4 w-4" /> Saldo en Ctas a Cobrar
                </FlowNode>
                <FlowArrow />
                <FlowNode variant="step">Cobrar cuando pague</FlowNode>
                <FlowArrow />
                <FlowNode variant="end">
                  <CheckCircle2 className="h-4 w-4" /> Venta cerrada
                </FlowNode>
              </FlowPath>
            </FlowBranch>
          </FlowPath>
          <FlowPath label="No">
            <FlowArrow />
            <FlowNode variant="warning">
              <XCircle className="h-4 w-4" /> Presupuesto rechazado
            </FlowNode>
          </FlowPath>
        </FlowBranch>
      </FlowDiagram>

      {/* Notas de crédito */}
      <FlowDiagram title="Nota de crédito (devolución / descuento)">
        <FlowNode variant="start">
          <AlertTriangle className="h-4 w-4" /> Cliente solicita devolución
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          Seleccionar factura original
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <FileText className="h-4 w-4" /> Crear Nota de Crédito (asociada al CAE original)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <Package className="h-4 w-4" /> Reingreso de stock (si aplica)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <Building2 className="h-4 w-4" /> Asiento contable inverso
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="end">
          <CheckCircle2 className="h-4 w-4" /> NC emitida — saldo ajustado
        </FlowNode>
      </FlowDiagram>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Section: Ciclo de Compras                                  */
/* ─────────────────────────────────────────────────────────── */

function SeccionCompras() {
  return (
    <div className="space-y-6" id="compras">
      <div>
        <h2 className="text-xl font-bold mb-1">3. Ciclo de Compras y Stock</h2>
        <p className="text-sm text-muted-foreground">
          Desde la orden de compra hasta el pago al proveedor y el ingreso al stock.
        </p>
      </div>

      <FlowDiagram title="Flujo de compras completo">
        <FlowNode variant="start">
          <Package className="h-4 w-4" /> Stock bajo (alerta automática)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <ShoppingCart className="h-4 w-4" /> Crear Orden de Compra
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          Enviar al proveedor
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <Truck className="h-4 w-4" /> Recibir mercadería + Remito
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="highlight">
          <Package className="h-4 w-4" /> Ingresar al stock (movimiento entrada)
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <Receipt className="h-4 w-4" /> Cargar Factura del Proveedor
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">
          <Building2 className="h-4 w-4" /> Generar asiento contable de compra
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="decision">
          ¿Pago inmediato?
        </FlowNode>
        <FlowBranch>
          <FlowPath label="Sí">
            <FlowArrow />
            <FlowNode variant="step">
              <Banknote className="h-4 w-4" /> Emitir Orden de Pago
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="end">
              <CheckCircle2 className="h-4 w-4" /> Compra cerrada
            </FlowNode>
          </FlowPath>
          <FlowPath label="A crédito">
            <FlowArrow />
            <FlowNode variant="step">
              <TrendingUp className="h-4 w-4" /> Saldo en Ctas a Pagar
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Pagar al vencimiento</FlowNode>
            <FlowArrow />
            <FlowNode variant="end">
              <CheckCircle2 className="h-4 w-4" /> Compra cerrada
            </FlowNode>
          </FlowPath>
        </FlowBranch>
      </FlowDiagram>

      {/* Tips */}
      <Card className="border-amber-200 bg-amber-500/5">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Tips de Compras</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• El sistema alerta automáticamente cuando un producto baja del stock mínimo configurado.</li>
              <li>• Podés cargar la factura del proveedor antes o después de recibir la mercadería.</li>
              <li>• Si usás cheques para pagar, registrá el cheque en el módulo Cheques antes de emitir la OP.</li>
              <li>• Las retenciones (IVA, IIBB, Ganancias) se calculan automáticamente según el TES configurado.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Section: Operatoria por Rubro                              */
/* ─────────────────────────────────────────────────────────── */

function SeccionRubros() {
  return (
    <div className="space-y-6" id="rubros">
      <div>
        <h2 className="text-xl font-bold mb-1">4. Operatoria por Rubro</h2>
        <p className="text-sm text-muted-foreground">
          Cada rubro tiene flujos de trabajo específicos que se activan automáticamente.
        </p>
      </div>

      {/* Gastronomía */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Gastronomía (ALIM)</CardTitle>
              <CardDescription className="text-xs">Restaurantes, bares, cafés, delivery</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FlowDiagram title="Flujo gastronómico completo">
            <FlowNode variant="start">
              <Users className="h-4 w-4" /> Cliente llega al local
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Asignar Mesa</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Tomar Comanda (desde tablet/PC)</FlowNode>
            <FlowArrow />
            <FlowNode variant="highlight">
              <Monitor className="h-4 w-4" /> Enviar a KDS (Pantalla Cocina)
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Cocina prepara — marca &quot;listo&quot; en KDS</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Mozo retira y sirve</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <Receipt className="h-4 w-4" /> Pedir la cuenta → generar Factura
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <CreditCard className="h-4 w-4" /> Cobrar (efectivo / tarjeta / QR)
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Liberar mesa</FlowNode>
            <FlowArrow />
            <FlowNode variant="end">
              <CheckCircle2 className="h-4 w-4" /> Mesa disponible
            </FlowNode>
          </FlowDiagram>
        </CardContent>
      </Card>

      {/* Salud */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Salud (SALUD)</CardTitle>
              <CardDescription className="text-xs">Consultorios, clínicas, centros médicos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FlowDiagram title="Flujo de atención médica">
            <FlowNode variant="start">
              <CalendarDays className="h-4 w-4" /> Paciente solicita turno
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Agenda → Asignar turno disponible</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Confirmar turno (WhatsApp automático)</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Paciente se presenta</FlowNode>
            <FlowArrow />
            <FlowNode variant="highlight">
              <HeartPulse className="h-4 w-4" /> Atención → Registrar en Historia Clínica
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <Receipt className="h-4 w-4" /> Facturar consulta/práctica
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <CreditCard className="h-4 w-4" /> Cobrar (obra social / particular)
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="end">
              <CheckCircle2 className="h-4 w-4" /> Atención completada
            </FlowNode>
          </FlowDiagram>
        </CardContent>
      </Card>

      {/* Distribución */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Truck className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Distribución / Comercio (COM)</CardTitle>
              <CardDescription className="text-xs">Mayoristas, distribuidores, e-Commerce</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FlowDiagram title="Flujo de distribución con picking">
            <FlowNode variant="start">
              <ShoppingCart className="h-4 w-4" /> Pedido del cliente (Portal B2B / vendedor)
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Validar stock disponible</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <Package className="h-4 w-4" /> Reservar stock
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="highlight">
              <ScanLine className="h-4 w-4" /> Generar Orden de Picking
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Depósito arma el pedido (tablet)</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <Truck className="h-4 w-4" /> Emitir Remito + asignar transportista
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <Receipt className="h-4 w-4" /> Facturar al cliente
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Entregar + POD (comprobante de entrega)</FlowNode>
            <FlowArrow />
            <FlowNode variant="end">
              <CheckCircle2 className="h-4 w-4" /> Pedido completado
            </FlowNode>
          </FlowDiagram>
        </CardContent>
      </Card>

      {/* Industria */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Factory className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Industria (IND)</CardTitle>
              <CardDescription className="text-xs">Fábricas, talleres, manufactura</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FlowDiagram title="Flujo de producción industrial">
            <FlowNode variant="start">
              <FileText className="h-4 w-4" /> Pedido de cliente / reposición interna
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Verificar BOM (lista de materiales)</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <Package className="h-4 w-4" /> Verificar stock de materias primas
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="highlight">
              <Factory className="h-4 w-4" /> Crear Orden de Producción
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Consumir materias primas del stock</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Producir → Ingresar Producto Terminado</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <DollarSign className="h-4 w-4" /> Costear la OP (materiales + mano de obra)
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <Receipt className="h-4 w-4" /> Facturar producto terminado
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="end">
              <CheckCircle2 className="h-4 w-4" /> Ciclo productivo completado
            </FlowNode>
          </FlowDiagram>
        </CardContent>
      </Card>

      {/* Veterinaria */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <PawPrint className="h-4 w-4 text-pink-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Veterinaria</CardTitle>
              <CardDescription className="text-xs">Clínicas veterinarias, petshops</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FlowDiagram title="Flujo de atención veterinaria">
            <FlowNode variant="start">
              <CalendarDays className="h-4 w-4" /> Agendar turno para mascota
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="step">Consulta → Registrar en ficha del paciente</FlowNode>
            <FlowArrow />
            <FlowNode variant="step">
              <HeartPulse className="h-4 w-4" /> Historia clínica veterinaria
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="decision">¿Requiere productos?</FlowNode>
            <FlowBranch>
              <FlowPath label="Sí">
                <FlowArrow />
                <FlowNode variant="step">
                  <Package className="h-4 w-4" /> Vender productos (petshop)
                </FlowNode>
              </FlowPath>
              <FlowPath label="Solo consulta">
                <FlowArrow />
                <FlowNode variant="step">Solo facturar consulta</FlowNode>
              </FlowPath>
            </FlowBranch>
            <FlowArrow />
            <FlowNode variant="step">
              <Receipt className="h-4 w-4" /> Facturar todo junto
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="end">
              <CheckCircle2 className="h-4 w-4" /> Atención completada
            </FlowNode>
          </FlowDiagram>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Section: Banco y Cheques                                   */
/* ─────────────────────────────────────────────────────────── */

function SeccionBanco() {
  return (
    <div className="space-y-6" id="banco">
      <div>
        <h2 className="text-xl font-bold mb-1">5. Banco, Cheques y Conciliación</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de cuentas bancarias, cheques propios y de terceros, conciliación automática.
        </p>
      </div>

      <FlowDiagram title="Circuito de cheques">
        <FlowNode variant="start">
          <Banknote className="h-4 w-4" /> Recibir cheque de cliente
        </FlowNode>
        <FlowArrow />
        <FlowNode variant="step">Registrar cheque de tercero (cartera)</FlowNode>
        <FlowArrow />
        <FlowNode variant="decision">¿Qué hacer con el cheque?</FlowNode>
        <FlowBranch>
          <FlowPath label="Depositar">
            <FlowArrow />
            <FlowNode variant="step">
              <Landmark className="h-4 w-4" /> Depositar en banco propio
            </FlowNode>
            <FlowArrow />
            <FlowNode variant="end">Acreditado</FlowNode>
          </FlowPath>
          <FlowPath label="Endosar">
            <FlowArrow />
            <FlowNode variant="step">Endosar a proveedor (pago)</FlowNode>
            <FlowArrow />
            <FlowNode variant="end">Entregado</FlowNode>
          </FlowPath>
          <FlowPath label="Cobrar">
            <FlowArrow />
            <FlowNode variant="step">Presentar al cobro</FlowNode>
            <FlowArrow />
            <FlowNode variant="decision">¿Se acreditó?</FlowNode>
            <FlowBranch>
              <FlowPath label="Sí">
                <FlowArrow />
                <FlowNode variant="end">
                  <CheckCircle2 className="h-4 w-4" /> Cobrado
                </FlowNode>
              </FlowPath>
              <FlowPath label="No">
                <FlowArrow />
                <FlowNode variant="warning">
                  <AlertTriangle className="h-4 w-4" /> Rechazado
                </FlowNode>
              </FlowPath>
            </FlowBranch>
          </FlowPath>
        </FlowBranch>
      </FlowDiagram>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/*  Main Page                                                  */
/* ─────────────────────────────────────────────────────────── */

export default function ManualUsuarioPage() {
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
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manual de Usuario</h1>
            <p className="text-sm text-muted-foreground">
              Guías de operación diaria con diagramas de flujo paso a paso
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">Básico</Badge>
          <Badge variant="outline" className="text-xs gap-1"><Info className="h-3 w-3" /> 30 min lectura</Badge>
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
              { href: "#operacion-diaria", label: "1. Operación Diaria", desc: "Apertura de caja, facturación, cobros, cierre" },
              { href: "#ventas", label: "2. Ciclo de Ventas Completo", desc: "Presupuesto → Factura → Cobro → Asiento" },
              { href: "#compras", label: "3. Ciclo de Compras y Stock", desc: "OC → Recepción → FC Proveedor → Pago" },
              { href: "#rubros", label: "4. Operatoria por Rubro", desc: "Gastronomía, Salud, Distribución, Industria, Veterinaria" },
              { href: "#banco", label: "5. Banco, Cheques y Conciliación", desc: "Circuito de cheques, depósitos, endosos" },
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
      <SeccionOperacionDiaria />
      <SeccionVentas />
      <SeccionCompras />
      <SeccionRubros />
      <SeccionBanco />

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" asChild className="gap-1">
          <Link href="/dashboard/capacitacion/parametrizacion">
            <ChevronLeft className="h-4 w-4" /> Parametrización
          </Link>
        </Button>
        <Button variant="ghost" asChild className="gap-1">
          <Link href="/dashboard/capacitacion">
            Volver a Capacitación <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

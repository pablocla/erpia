"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HelpCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"

interface TutorialStep {
  titulo: string
  descripcion: string
  completado?: boolean
}

interface TutorialSeccion {
  id: string
  titulo: string
  icono?: string
  pasos: TutorialStep[]
  tips?: string[]
  advertencias?: string[]
  linkDoc?: string
}

// ─── CONTENT REGISTRY — Tutoriales por módulo/ruta ──────────────────────────

const TUTORIALES: Record<string, TutorialSeccion[]> = {
  "/dashboard": [
    {
      id: "inicio",
      titulo: "Primeros Pasos",
      pasos: [
        { titulo: "Configurá tu empresa", descripcion: "Andá a Configuración → Parámetros y completá razón social, CUIT y punto de venta." },
        { titulo: "Subí certificados AFIP", descripcion: "En Configuración, cargá tu certificado CRT y KEY para facturación electrónica." },
        { titulo: "Cargá productos", descripcion: "Desde Productos, agregá tu catálogo con precios, IVA y stock inicial." },
        { titulo: "Abrí la caja", descripcion: "En Caja → Abrir Caja, definí el monto inicial y empezá a operar." },
        { titulo: "Hacé tu primera venta", descripcion: "En Ventas, seleccioná cliente, agregá productos y emití la factura con CAE." },
      ],
      tips: [
        "Podés personalizar los temas y colores del sistema desde el icono de paleta en la barra superior.",
        "El Onboarding IA configura todo automáticamente según tu rubro.",
        "Cada módulo se puede activar/desactivar desde Configuración → Parámetros.",
      ],
    },
  ],
  "/dashboard/ventas": [
    {
      id: "facturacion",
      titulo: "Facturación Electrónica",
      pasos: [
        { titulo: "Seleccioná el cliente", descripcion: "Elegí un cliente existente o creá uno nuevo. El tipo de factura (A/B/C) se determina automáticamente por la condición IVA del cliente." },
        { titulo: "Agregá productos", descripcion: "Buscá por nombre o código de barras. El IVA se aplica automáticamente según cada producto." },
        { titulo: "Revisá el comprobante", descripcion: "Verificá subtotal, IVA y total. Podés agregar observaciones y seleccionar condición de pago." },
        { titulo: "Emití la factura", descripcion: "Al confirmar, el sistema solicita CAE a AFIP y genera el QR fiscal automáticamente." },
      ],
      tips: [
        "Factura A → entre Responsables Inscriptos (IVA discriminado).",
        "Factura B → a Consumidor Final o Monotributista (IVA incluido).",
        "Factura C → emitida por Monotributista o Exento.",
        "Las Notas de Crédito revierten stock automáticamente.",
        "RG 5824: ventas a Consumidor Final > $10M requieren CUIT del comprador.",
      ],
      advertencias: [
        "Necesitás certificados AFIP cargados para emitir facturas electrónicas.",
        "El CAE tiene vencimiento. Emití facturas dentro del plazo autorizado.",
      ],
    },
  ],
  "/dashboard/compras": [
    {
      id: "compras",
      titulo: "Compras y Proveedores",
      pasos: [
        { titulo: "Registrá la compra", descripcion: "Ingresá los datos de la factura del proveedor: tipo, número, punto de venta, fecha e importes." },
        { titulo: "Verificá el IVA", descripcion: "El sistema calcula IVA Crédito Fiscal automáticamente. Verificá que coincida con la factura recibida." },
        { titulo: "Asiento automático", descripcion: "Al guardar, se genera el asiento contable: Mercadería (D) / IVA CF (D) / Proveedores (H)." },
        { titulo: "Cuenta a Pagar", descripcion: "Si la condición de pago es a plazo, se generan cuotas automáticas en Cuentas a Pagar." },
      ],
      tips: [
        "Podés verificar el CAE del proveedor con WSCDC de AFIP desde la sección de verificación.",
        "El three-way matching compara orden de compra ↔ remito ↔ factura.",
        "Las percepciones de IIBB recibidas se acumulan automáticamente.",
      ],
    },
  ],
  "/dashboard/caja": [
    {
      id: "caja",
      titulo: "Gestión de Caja",
      pasos: [
        { titulo: "Abrí la caja", descripcion: "Definí el monto inicial (efectivo). Solo puede haber una caja abierta a la vez." },
        { titulo: "Registrá movimientos", descripcion: "Cada venta suma al ingreso. Podés registrar egresos manuales (pago a proveedor, gastos)." },
        { titulo: "Cerrá la caja", descripcion: "Al cerrar, el sistema te muestra: esperado vs real por cada medio de pago. Registrá diferencias." },
      ],
      tips: [
        "6 medios de pago: efectivo, débito, crédito, transferencia, cheque, mercadopago.",
        "El cierre de caja emite el evento CAJA_CERRADA para auditoría.",
      ],
    },
  ],
  "/dashboard/contabilidad": [
    {
      id: "contabilidad",
      titulo: "Contabilidad y Asientos",
      pasos: [
        { titulo: "Asientos automáticos", descripcion: "Las ventas, compras y notas de crédito generan asientos automáticos via event bus." },
        { titulo: "Asientos manuales", descripcion: "Para ajustes o asientos especiales, creá uno manual. El sistema valida partida doble (Debe = Haber)." },
        { titulo: "Libro Diario", descripcion: "Consultá todos los asientos por rango de fechas. Exportá a CSV." },
        { titulo: "Libro Mayor", descripcion: "Consultá el detalle de una cuenta con saldo acumulado." },
        { titulo: "Balance de Sumas y Saldos", descripcion: "Verificá que todas las cuentas estén balanceadas." },
      ],
      tips: [
        "El plan de cuentas se configura por rubro en el onboarding.",
        "Podés cerrar períodos fiscales desde Contabilidad → Períodos para impedir asientos en meses pasados.",
        "Los asientos de venta usan las cuentas configuradas en ConfigAsientoCuenta.",
      ],
    },
  ],
  "/dashboard/contabilidad/periodos": [
    {
      id: "periodos",
      titulo: "Cierre de Períodos",
      pasos: [
        { titulo: "Revisá las transacciones", descripcion: "Antes de cerrar un mes, verificá que estén registradas todas las facturas, compras y NC del período." },
        { titulo: "Cerrá el período", descripcion: "El cierre bloquea la creación de transacciones con fecha en ese mes. Solo admin puede reabrir." },
        { titulo: "Bloqueo AFIP", descripcion: "Después de presentar la DDJJ, podés bloquear el período. Esto es irreversible sin auditoría." },
      ],
      tips: [
        "Los períodos deben cerrarse en orden cronológico.",
        "Un período abierto permite operar normalmente.",
        "Cerrá el mes una vez que el contador haya verificado todo.",
      ],
      advertencias: [
        "No cierres un período si faltan facturas por registrar.",
        "El bloqueo post-AFIP es irreversible.",
      ],
    },
  ],
  "/dashboard/impuestos": [
    {
      id: "impuestos",
      titulo: "Libros Fiscales e Impuestos",
      pasos: [
        { titulo: "Libro IVA Ventas", descripcion: "Generá el libro con todas las facturas emitidas del período. Exportá a CSV para AFIP." },
        { titulo: "Libro IVA Compras", descripcion: "Ídem con facturas recibidas. Controlá que el IVA CF sea correcto." },
        { titulo: "Liquidación IVA", descripcion: "Compará DF vs CF para determinar IVA a pagar o saldo a favor." },
        { titulo: "SICORE", descripcion: "Generá el archivo de retenciones para importar en SIAP." },
        { titulo: "IIBB", descripcion: "Consultá la liquidación por jurisdicción. Cerrá el período y generá la DDJJ." },
      ],
      tips: [
        "El TES (Tipo de Impuesto) configura automáticamente qué impuestos aplican por operación.",
        "Las alícuotas se pueden modificar desde la base de datos sin tocar código.",
        "SICORE: código 767 = retención IVA, 217/219 = Ganancias, 305 = servicios.",
      ],
    },
  ],
  "/dashboard/impuestos/iibb": [
    {
      id: "iibb",
      titulo: "Ingresos Brutos — IIBB",
      pasos: [
        { titulo: "Acumulación automática", descripcion: "Cada venta acumula IIBB por jurisdicción. El tax engine calcula la alícuota según la provincia." },
        { titulo: "Percepciones recibidas", descripcion: "Las percepciones IIBB de proveedores se registran automáticamente y reducen el saldo a pagar." },
        { titulo: "Liquidación mensual", descripcion: "Consultá el devengado vs percibido por jurisdicción. Cerrá el período al finalizar el mes." },
        { titulo: "Generación DDJJ", descripcion: "Generá la Declaración Jurada en formato compatible con ARBA, ARCIBA o DGR provincial." },
        { titulo: "Marcar presentado", descripcion: "Una vez presentada en el organismo, marcá el período como presentado." },
      ],
      tips: [
        "5 jurisdicciones soportadas: PBA (ARBA), CABA (ARCIBA), SF, CBA, MZA.",
        "La alícuota general varía: 3% CABA, 3.5% PBA/SF, 3% CBA/MZA.",
        "Importá padrones ARBA/ARCIBA para alícuotas especiales por CUIT.",
      ],
      advertencias: [
        "Cerrá el período IIBB antes de generar la DDJJ.",
        "Las percepciones recibidas deben coincidir con los comprobantes del proveedor.",
      ],
    },
  ],
  "/dashboard/impuestos/padron": [
    {
      id: "padron",
      titulo: "Padrón de Percepciones IIBB",
      pasos: [
        { titulo: "Descargá el padrón", descripcion: "Ingresá a ARBA, ARCIBA o DGR de tu provincia y descargá el padrón de percepciones en CSV." },
        { titulo: "Importá el CSV", descripcion: "Desde el botón Importar, pegá el contenido CSV y seleccioná el organismo. El sistema procesa por lotes." },
        { titulo: "Verificá vigencia", descripcion: "Los registros importados muestran fecha desde/hasta. El sistema ignora registros vencidos." },
        { titulo: "Consultá un CUIT", descripcion: "En la pestaña Consultar, buscá un CUIT para ver todos los regímenes activos." },
      ],
      tips: [
        "ARBA usa punto y coma (;) como separador. AGIP usa pipe (|). DGR usa coma (,).",
        "Al emitir factura, el sistema consulta automáticamente el padrón para aplicar percepciones.",
        "Alícuota 0 = sujeto excluido de percepción.",
      ],
    },
  ],
  "/dashboard/ventas/presupuestos": [
    {
      id: "presupuestos",
      titulo: "Presupuestos → Pedidos",
      pasos: [
        { titulo: "Creá un presupuesto", descripcion: "Seleccioná cliente, agregá líneas con cantidad y precio. Podés aplicar descuento por línea y global." },
        { titulo: "Enviá al cliente", descripcion: "Desde la tabla, hacé clic en Enviar. El presupuesto pasa a estado 'enviado' y queda disponible para el cliente." },
        { titulo: "Aceptar o rechazar", descripcion: "Cuando el cliente responda, marcá como aceptado o rechazado." },
        { titulo: "Convertí a pedido", descripcion: "Un presupuesto aceptado se puede convertir en Pedido de Venta con un clic. Las líneas se copian automáticamente." },
        { titulo: "Duplicá presupuestos", descripcion: "Para hacer uno similar, usá Duplicar. Se crea un nuevo borrador con las mismas líneas." },
      ],
      tips: [
        "El IVA se calcula automáticamente al 21% sobre los subtotales.",
        "Los estados son: borrador → enviado → aceptado/rechazado → facturado.",
        "Los presupuestos vencidos se marcan automáticamente.",
      ],
    },
  ],
  "/dashboard/contabilidad/activos-fijos": [
    {
      id: "activos-fijos",
      titulo: "Activos Fijos — Depreciación",
      pasos: [
        { titulo: "Cargá un activo", descripcion: "Indicá nombre, categoría (vehículo/inmueble/maquinaria/etc.), valor de compra, residual y vida útil en meses." },
        { titulo: "Depreciación mensual", descripcion: "Ejecutá la depreciación mensual desde el botón. El sistema calcula automáticamente y genera asientos contables." },
        { titulo: "Cuadro de amortización", descripcion: "Consultá la proyección mes a mes de cada activo: valor al inicio, depreciación y valor al cierre." },
        { titulo: "Dar de baja", descripcion: "Cuando un activo se vende, destruye o pierde, registrá la baja con motivo." },
      ],
      tips: [
        "Método: línea recta = (valor compra - valor residual) / vida útil en meses.",
        "La depreciación genera asientos: Debe 'Amortizaciones' / Haber 'Amort. Acumulada'.",
        "Un activo al 100% se marca como 'totalmente amortizado' automáticamente.",
      ],
      advertencias: [
        "La depreciación mensual debe correrse antes del cierre del período contable.",
        "Dar de baja un activo es irreversible.",
      ],
    },
  ],
  "/dashboard/contabilidad/centros-costo": [
    {
      id: "centros-costo",
      titulo: "Centros de Costo",
      pasos: [
        { titulo: "Creá centros de costo", descripcion: "Definí centros como Administración, Ventas, Producción, Sucursal Norte, etc." },
        { titulo: "Jerarquía", descripcion: "Los centros pueden tener un padre (ej: 'Sucursal Norte' → hijo de 'Ventas')." },
        { titulo: "Asigná movimientos", descripcion: "Al crear asientos manuales, asigná cada movimiento a un centro de costo." },
        { titulo: "Reporte por período", descripcion: "Consultá debe/haber/saldo por centro para un mes y año. Identificá dónde se concentran los gastos." },
      ],
      tips: [
        "La jerarquía permite reportes consolidados (padre acumula hijos).",
        "Desactivar un centro no borra datos: lo oculta de nuevas asignaciones.",
      ],
    },
  ],
  "/dashboard/configuracion/cotizaciones": [
    {
      id: "cotizaciones",
      titulo: "Cotizaciones y Multi-Moneda",
      pasos: [
        { titulo: "Registrá cotización", descripcion: "Ingresá el tipo de cambio manualmente seleccionando moneda, tipo (oficial/blue/MEP/CCL) y valor." },
        { titulo: "Actualizar BNA", descripcion: "El botón 'Actualizar BNA' descarga automáticamente la cotización USD oficial y blue del Banco Nación." },
        { titulo: "Convertir monedas", descripcion: "Usá el Convertidor para calcular equivalencias entre ARS y cualquier moneda cargada." },
      ],
      tips: [
        "Las cotizaciones se usan automáticamente en facturas en moneda extranjera (RG 5616).",
        "Si no hay cotización del día, el sistema usa la más reciente disponible.",
        "El tipo 'oficial' es el requerido por AFIP para facturación.",
      ],
    },
  ],
  "/dashboard/banco": [
    {
      id: "banco",
      titulo: "Gestión Bancaria",
      pasos: [
        { titulo: "Registrá cuentas bancarias", descripcion: "Cargá las cuentas de tu empresa con banco, CBU, moneda y tipo (CC/CA)." },
        { titulo: "Movimientos", descripcion: "Registrá depósitos, transferencias, débitos y créditos. Cada movimiento indica concepto y monto." },
        { titulo: "Cheques", descripcion: "Administrá cheques propios (emitidos) y de terceros (recibidos) con fecha de vencimiento y estado." },
        { titulo: "Conciliación", descripcion: "Marcá los movimientos que coinciden con el extracto bancario." },
      ],
      tips: [
        "Los cheques de terceros pueden endosarse o depositarse.",
        "La conciliación es flag-based: marcá cada movimiento como conciliado.",
      ],
    },
  ],
  "/dashboard/logistica": [
    {
      id: "logistica",
      titulo: "Logística y Envíos",
      pasos: [
        { titulo: "Configurá transportistas", descripcion: "Cargá los transportistas con los que trabajás: nombre, CUIT, tipo de servicio." },
        { titulo: "Creá un envío", descripcion: "Vinculá un envío a un remito. Indicá peso, bultos y dirección de entrega." },
        { titulo: "Seguimiento", descripcion: "Actualizá el estado del envío: preparado → en tránsito → entregado." },
      ],
      tips: [
        "Los envíos se vinculan a remitos para trazabilidad completa.",
        "Podés asignar peso y número de bultos a cada envío.",
      ],
    },
  ],
  "/dashboard/industria": [
    {
      id: "industria",
      titulo: "Industria — BOM y Producción",
      pasos: [
        { titulo: "Creá una lista de materiales (BOM)", descripcion: "Definí los componentes necesarios para fabricar un producto terminado." },
        { titulo: "Orden de producción", descripcion: "Creá una orden indicando producto, cantidad y BOM. El sistema reserva los materiales." },
        { titulo: "Seguimiento", descripcion: "Actualizá el avance: planificada → en producción → terminada → cancelada." },
      ],
      tips: [
        "El BOM permite múltiples niveles (sub-ensambles).",
        "Al terminar la producción, se descuenta stock de insumos y se ingresa el producto terminado.",
      ],
    },
  ],
  "/dashboard/picking": [
    {
      id: "picking",
      titulo: "Picking y Armado",
      pasos: [
        { titulo: "Crear lista de picking", descripcion: "Se genera automáticamente desde un pedido o remito pendiente." },
        { titulo: "Asignar operario", descripcion: "Asigná un operario y zona de almacén a la lista de picking." },
        { titulo: "Registrar cantidades", descripcion: "El operario registra las cantidades realmente picadas por ítem." },
        { titulo: "Confirmar", descripcion: "Al completar, la lista pasa a completada y habilita la generación del remito." },
      ],
      tips: [
        "Las listas se priorizan por antigüedad del pedido.",
        "El picking genera movimientos de stock automáticos.",
      ],
    },
  ],
  "/dashboard/cuentas-cobrar": [
    {
      id: "cuentas-cobrar",
      titulo: "Cuentas a Cobrar",
      pasos: [
        { titulo: "Generación automática", descripcion: "Al emitir una factura con condición de pago a plazo, se generan automáticamente las cuotas en CC." },
        { titulo: "Aging", descripcion: "Consultá el reporte de antigüedad: corriente, 30, 60, 90 y +90 días." },
        { titulo: "Registrar cobro", descripcion: "Aplicá un recibo indicando monto, medio de pago y retenciones sufridas (IVA/Ganancias/IIBB)." },
        { titulo: "Asiento automático", descripcion: "Al cobrar se genera asiento: Caja/Banco (D) / Cliente (H) + retenciones." },
      ],
      tips: [
        "Las ventas de contado no generan CC (se cobran en el momento).",
        "Las retenciones sufridas se registran automáticamente en SICORE.",
      ],
    },
  ],
  "/dashboard/cuentas-pagar": [
    {
      id: "cuentas-pagar",
      titulo: "Cuentas a Pagar",
      pasos: [
        { titulo: "Generación desde compras", descripcion: "Al registrar una compra con condición a plazo, se generan cuotas en CP automáticamente." },
        { titulo: "Orden de pago", descripcion: "Creá una OP seleccionando las CP a cancelar, medio de pago y retenciones a aplicar." },
        { titulo: "Aging", descripcion: "Consultá corriente/30/60/90/+90 para priorizar pagos." },
        { titulo: "Asiento automático", descripcion: "La OP genera asiento: Proveedor (D) / Banco (H) + retenciones aplicadas." },
      ],
      tips: [
        "Podés pagar parcialmente una CP.",
        "Las retenciones aplicadas se incluyen en el archivo SICORE.",
      ],
    },
  ],
  "/dashboard/iot": [
    {
      id: "iot",
      titulo: "IoT Industrial",
      pasos: [
        { titulo: "Registrar dispositivo", descripcion: "Cargá sensores indicando tipo (temperatura, humedad, presión, etc.) y protocolo (MQTT, Modbus, OPC-UA)." },
        { titulo: "Configurar alertas", descripcion: "Definí umbrales mínimos y máximos. Si una lectura excede, se genera alerta automática." },
        { titulo: "Monitorear lecturas", descripcion: "Consultá las lecturas históricas por dispositivo con gráficos de telemetría." },
        { titulo: "Calibración", descripcion: "Registrá las calibraciones para cumplir normas industriales." },
      ],
      tips: [
        "11 tipos de sensor soportados.",
        "9 protocolos de comunicación: MQTT, Modbus RTU/TCP, OPC-UA, HTTP, etc.",
      ],
    },
  ],
  "/dashboard/configuracion": [
    {
      id: "config",
      titulo: "Configuración del Sistema",
      pasos: [
        { titulo: "Datos de empresa", descripcion: "CUIT, razón social, punto de venta. Esto se usa en cada factura." },
        { titulo: "Certificados AFIP", descripcion: "Subí archivos CRT y KEY para WSAA. Probá en homologación antes de producción." },
        { titulo: "Módulos activos", descripcion: "Activá/desactivá módulos según tu negocio. Todo lo que no necesitás se oculta del menú." },
        { titulo: "Parámetros fiscales", descripcion: "Umbrales de RG 5824, mínimos de SICORE, alícuotas de IIBB por jurisdicción." },
        { titulo: "Plan de cuentas", descripcion: "Revisá que las cuentas contables estén correctas para tu rubro." },
      ],
    },
  ],
  "/dashboard/hospitalidad": [
    {
      id: "hospitalidad",
      titulo: "Gastronomía — Mesas y Comandas",
      pasos: [
        { titulo: "Configurá salones", descripcion: "Creá los salones del local (interior, terraza, barra) con sus mesas." },
        { titulo: "Abrir mesa", descripcion: "Asigná una mesa a un mozo y registrá los comensales." },
        { titulo: "Tomar comanda", descripcion: "Agregá items a la comanda. Se envían automáticamente al KDS (cocina)." },
        { titulo: "Cerrar mesa", descripcion: "Generá la factura desde la comanda, seleccioná medio de pago." },
      ],
      tips: [
        "El KDS ordena los pedidos por antigüedad.",
        "Podés dividir cuentas por comensal.",
        "El consumo interno descuenta stock sin facturar.",
      ],
    },
  ],
  "/dashboard/onboarding": [
    {
      id: "onboarding",
      titulo: "Onboarding Guiado por IA",
      pasos: [
        { titulo: "Seleccioná tu rubro", descripcion: "El sistema reconoce 13 rubros: ferretería, kiosco, bar/restaurante, veterinaria, clínica, farmacia, librería, ropa, supermercado, distribuidora, salón de belleza, gimnasio." },
        { titulo: "Respondé las preguntas", descripcion: "Tamaño del negocio, si tenés stock, personal, facturación, local, delivery." },
        { titulo: "Revisá la configuración", descripcion: "El sistema sugiere: módulos activos, plan de cuentas, TES, productos de ejemplo y roles." },
        { titulo: "Aplicá", descripcion: "Con un clic, todo se configura: módulos, cuentas contables, productos, usuarios." },
      ],
      tips: [
        "El onboarding dura menos de 10 minutos.",
        "Podés cambiar la configuración después en cualquier momento.",
        "Cada rubro tiene particularidades específicas pre-configuradas.",
      ],
    },
  ],
}

// ─── Match route to tutorial ──────────────────────────────────────────────

function getTutorialForPath(pathname: string): TutorialSeccion[] {
  // Exact match first
  if (TUTORIALES[pathname]) return TUTORIALES[pathname]
  // Try parent paths
  const segments = pathname.split("/")
  while (segments.length > 1) {
    segments.pop()
    const parent = segments.join("/")
    if (TUTORIALES[parent]) return TUTORIALES[parent]
  }
  return TUTORIALES["/dashboard"] ?? []
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export function ContextualHelp() {
  const pathname = usePathname()
  const [tutoriales, setTutoriales] = useState<TutorialSeccion[]>([])
  const [completados, setCompletados] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setTutoriales(getTutorialForPath(pathname))
  }, [pathname])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("erp-tutorial-progress")
      if (saved) setCompletados(JSON.parse(saved))
    } catch { /* noop */ }
  }, [])

  const togglePaso = (seccionId: string, pasoIdx: number) => {
    const key = `${seccionId}:${pasoIdx}`
    setCompletados((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem("erp-tutorial-progress", JSON.stringify(next))
      return next
    })
  }

  const totalPasos = tutoriales.reduce((s, t) => s + t.pasos.length, 0)
  const pasosCompletados = tutoriales.reduce(
    (s, t) => s + t.pasos.filter((_, i) => completados[`${t.id}:${i}`]).length,
    0
  )

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
          title="Ayuda y tutoriales"
        >
          <HelpCircle className="h-4 w-4" />
          {pasosCompletados < totalPasos && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[440px] p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            Guía — {tutoriales[0]?.titulo ?? "Ayuda"}
          </SheetTitle>
          {totalPasos > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${totalPasos > 0 ? (pasosCompletados / totalPasos) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {pasosCompletados}/{totalPasos}
              </span>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-4">
            {tutoriales.map((seccion) => (
              <Accordion key={seccion.id} type="single" collapsible defaultValue={seccion.id}>
                <AccordionItem value={seccion.id} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-medium py-3">
                    {seccion.titulo}
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-3">
                    {/* Steps */}
                    <div className="space-y-2">
                      {seccion.pasos.map((paso, idx) => {
                        const key = `${seccion.id}:${idx}`
                        const done = completados[key]
                        return (
                          <button
                            key={idx}
                            onClick={() => togglePaso(seccion.id, idx)}
                            className="w-full text-left flex gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="shrink-0 mt-0.5">
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50" />
                              )}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                                {paso.titulo}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{paso.descripcion}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Tips */}
                    {seccion.tips && seccion.tips.length > 0 && (
                      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                        <CardContent className="p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Tips</span>
                          </div>
                          <ul className="space-y-1">
                            {seccion.tips.map((tip, i) => (
                              <li key={i} className="text-xs text-amber-700/80 dark:text-amber-300/80 flex gap-1.5">
                                <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Warnings */}
                    {seccion.advertencias && seccion.advertencias.length > 0 && (
                      <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                        <CardContent className="p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-xs font-medium text-red-800 dark:text-red-200">Importante</span>
                          </div>
                          <ul className="space-y-1">
                            {seccion.advertencias.map((adv, i) => (
                              <li key={i} className="text-xs text-red-700/80 dark:text-red-300/80 flex gap-1.5">
                                <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" />
                                {adv}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

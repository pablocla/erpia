/**
 * Configuración Feature Service — CRUD + Seed de features por rubro
 *
 * Responsabilidades:
 * - Seed de features por rubro con configuraciones iniciales completas
 * - CRUD de ConfiguracionRubro y FeatureRubro
 * - Seed de workflows por rubro
 * - Utilidades para listar features/workflows disponibles
 */

import { prisma } from "@/lib/prisma"
import { FEATURES, type FeatureKey } from "./rubro-config-service"

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface FeatureSeed {
  featureKey: FeatureKey
  activado: boolean
  modoSimplificado?: boolean
  grupo: string
  label: string
  orden: number
  descripcion?: string
  icono?: string
  parametros?: Record<string, unknown>
}

interface WorkflowSeed {
  proceso: string
  nombre: string
  descripcion: string
  pasos: {
    stepKey: string
    nombre: string
    tipo: string
    accion?: string
    orden: number
    obligatorio: boolean
    requiereFeature?: string
    parametros?: Record<string, unknown>
    condicion?: unknown
    transiciones?: { label: string; destinoStepKey: string; condicion?: unknown }[]
  }[]
}

// ─── SEED POR RUBRO ──────────────────────────────────────────────────────────
// Features organizadas por rubro. core_features son compartidas.

const CORE_FEATURES: FeatureSeed[] = [
  { featureKey: FEATURES.POS, activado: true, grupo: "core", label: "Punto de Venta", orden: 1, icono: "ShoppingCart" },
  { featureKey: FEATURES.STOCK, activado: true, grupo: "core", label: "Control de Stock", orden: 2, icono: "Package" },
  { featureKey: FEATURES.FACTURACION_AFIP, activado: true, grupo: "fiscal", label: "Facturación AFIP", orden: 3, icono: "FileText" },
  { featureKey: FEATURES.CONTABILIDAD, activado: true, grupo: "core", label: "Contabilidad", orden: 4, icono: "Calculator" },
  { featureKey: FEATURES.CC_CP, activado: true, grupo: "core", label: "Cta. Cte. Clientes/Proveedores", orden: 5, icono: "Users" },
  { featureKey: FEATURES.COBROS_PAGOS, activado: true, grupo: "core", label: "Cobros y Pagos", orden: 6, icono: "Wallet" },
  { featureKey: FEATURES.PRESUPUESTOS, activado: true, grupo: "core", label: "Presupuestos", orden: 7, icono: "ClipboardList" },
  { featureKey: FEATURES.IVA_DIGITAL, activado: true, grupo: "fiscal", label: "IVA Digital", orden: 8, icono: "Landmark" },
  { featureKey: FEATURES.LISTAS_PRECIO, activado: true, grupo: "core", label: "Listas de Precio", orden: 9, icono: "Tag" },
  { featureKey: FEATURES.EMAIL_NOTIFICACIONES, activado: true, grupo: "integracion", label: "Email/Notificaciones", orden: 10, icono: "Mail" },
  { featureKey: FEATURES.NOTAS_CREDITO, activado: true, grupo: "fiscal", label: "Notas de Crédito/Débito", orden: 11, icono: "ReceiptText" },
  { featureKey: FEATURES.CHEQUES, activado: true, grupo: "core", label: "Cheques", orden: 12, icono: "CreditCard" },
  { featureKey: FEATURES.CONCILIACION_BANCARIA, activado: true, grupo: "core", label: "Conciliación Bancaria", orden: 13, icono: "Landmark" },
  { featureKey: FEATURES.TRANSFERENCIAS, activado: true, grupo: "core", label: "Transferencias Bancarias", orden: 14, icono: "ArrowLeftRight" },
]

const RUBRO_FEATURES: Record<string, FeatureSeed[]> = {
  ALIM: [
    { featureKey: FEATURES.KDS, activado: true, grupo: "vertical", label: "Kitchen Display System", orden: 20, icono: "ChefHat" },
    { featureKey: FEATURES.MESAS_SALON, activado: true, grupo: "vertical", label: "Mesas y Salón", orden: 21, icono: "Armchair" },
    { featureKey: FEATURES.COMANDAS, activado: true, grupo: "vertical", label: "Comandas", orden: 22, icono: "ScrollText" },
    { featureKey: FEATURES.RECETAS_BOM, activado: true, grupo: "vertical", label: "Recetas / BOM", orden: 23, icono: "CookingPot", parametros: { requiereStock: true } },
    { featureKey: FEATURES.TIENDA_ONLINE, activado: false, grupo: "integracion", label: "Tienda Online", orden: 50, icono: "Globe" },
  ],
  SALUD: [
    { featureKey: FEATURES.HISTORIA_CLINICA, activado: true, grupo: "vertical", label: "Historia Clínica", orden: 20, icono: "Stethoscope" },
    { featureKey: FEATURES.TURNOS_AGENDA, activado: true, grupo: "vertical", label: "Turnos / Agenda", orden: 21, icono: "CalendarDays" },
    { featureKey: FEATURES.MEMBRESIAS, activado: false, grupo: "vertical", label: "Membresías / Obras Sociales", orden: 22, icono: "IdCard" },
  ],
  IND: [
    { featureKey: FEATURES.BOM_PRODUCCION, activado: true, grupo: "vertical", label: "BOM / Producción", orden: 20, icono: "Factory" },
    { featureKey: FEATURES.ORDENES_PRODUCCION, activado: true, grupo: "vertical", label: "Órdenes de Producción", orden: 21, icono: "ClipboardCheck" },
    { featureKey: FEATURES.STOCK_MULTI_DEPOSITO, activado: true, grupo: "core", label: "Stock Multi-Depósito", orden: 22, icono: "Warehouse" },
    { featureKey: FEATURES.IOT_SENSORES, activado: false, grupo: "integracion", label: "IoT / Sensores", orden: 50, icono: "Cpu" },
  ],
  COM: [
    { featureKey: FEATURES.PEDIDOS_VENTA, activado: true, grupo: "core", label: "Pedidos de Venta", orden: 20, icono: "ShoppingBag" },
    { featureKey: FEATURES.ORDENES_COMPRA, activado: true, grupo: "core", label: "Órdenes de Compra", orden: 21, icono: "Truck" },
    { featureKey: FEATURES.REMITOS, activado: true, grupo: "core", label: "Remitos", orden: 22, icono: "FileOutput" },
    { featureKey: FEATURES.PICKING_WAREHOUSE, activado: true, grupo: "vertical", label: "Picking / Warehouse", orden: 23, icono: "ScanBarcode" },
    { featureKey: FEATURES.LOGISTICA, activado: true, grupo: "vertical", label: "Logística", orden: 24, icono: "Route" },
    { featureKey: FEATURES.PORTAL_B2B, activado: false, grupo: "integracion", label: "Portal B2B", orden: 50, icono: "Building" },
    { featureKey: FEATURES.MERCADO_LIBRE, activado: false, grupo: "integracion", label: "Mercado Libre", orden: 51, icono: "ShoppingCart" },
    { featureKey: FEATURES.HOJAS_RUTA, activado: true, grupo: "vertical", label: "Hojas de Ruta", orden: 25, icono: "Map" },
    { featureKey: FEATURES.STOCK_MULTI_DEPOSITO, activado: true, grupo: "core", label: "Stock Multi-Depósito", orden: 26, icono: "Warehouse" },
  ],
  SERV: [
    { featureKey: FEATURES.TURNOS_AGENDA, activado: true, grupo: "vertical", label: "Turnos / Agenda", orden: 20, icono: "CalendarDays" },
    { featureKey: FEATURES.MEMBRESIAS, activado: false, grupo: "vertical", label: "Membresías", orden: 21, icono: "IdCard" },
  ],
  TRANS: [
    { featureKey: FEATURES.LOGISTICA, activado: true, grupo: "vertical", label: "Logística", orden: 20, icono: "Route" },
    { featureKey: FEATURES.HOJAS_RUTA, activado: true, grupo: "vertical", label: "Hojas de Ruta", orden: 21, icono: "Map" },
    { featureKey: FEATURES.IOT_SENSORES, activado: false, grupo: "integracion", label: "IoT / Sensores GPS", orden: 50, icono: "Cpu" },
  ],
  AGRO: [
    { featureKey: FEATURES.STOCK_MULTI_DEPOSITO, activado: true, grupo: "core", label: "Stock Multi-Depósito", orden: 20, icono: "Warehouse" },
    { featureKey: FEATURES.LOGISTICA, activado: true, grupo: "vertical", label: "Logística", orden: 21, icono: "Route" },
    { featureKey: FEATURES.IOT_SENSORES, activado: false, grupo: "integracion", label: "IoT / Sensores", orden: 50, icono: "Cpu" },
    { featureKey: FEATURES.PERCEPCIONES, activado: true, grupo: "fiscal", label: "Percepciones", orden: 22, icono: "Percent" },
    { featureKey: FEATURES.RETENCIONES, activado: true, grupo: "fiscal", label: "Retenciones", orden: 23, icono: "Percent" },
  ],
  TECH: [
    { featureKey: FEATURES.ACTIVOS_FIJOS, activado: true, grupo: "core", label: "Activos Fijos", orden: 20, icono: "HardDrive" },
    { featureKey: FEATURES.CENTROS_COSTO, activado: true, grupo: "core", label: "Centros de Costo", orden: 21, icono: "PieChart" },
    { featureKey: FEATURES.MULTI_MONEDA, activado: true, grupo: "core", label: "Multi-Moneda", orden: 22, icono: "Coins" },
  ],
  FIN: [
    { featureKey: FEATURES.ACTIVOS_FIJOS, activado: true, grupo: "core", label: "Activos Fijos", orden: 20, icono: "HardDrive" },
    { featureKey: FEATURES.CENTROS_COSTO, activado: true, grupo: "core", label: "Centros de Costo", orden: 21, icono: "PieChart" },
    { featureKey: FEATURES.MULTI_MONEDA, activado: true, grupo: "core", label: "Multi-Moneda", orden: 22, icono: "Coins" },
    { featureKey: FEATURES.AJUSTE_INFLACION, activado: true, grupo: "fiscal", label: "Ajuste por Inflación", orden: 23, icono: "TrendingUp" },
    { featureKey: FEATURES.SICORE, activado: true, grupo: "fiscal", label: "SICORE", orden: 24, icono: "FileSpreadsheet" },
    { featureKey: FEATURES.PERCEPCIONES, activado: true, grupo: "fiscal", label: "Percepciones", orden: 25, icono: "Percent" },
    { featureKey: FEATURES.RETENCIONES, activado: true, grupo: "fiscal", label: "Retenciones", orden: 26, icono: "Percent" },
  ],
  EDUC: [
    { featureKey: FEATURES.TURNOS_AGENDA, activado: true, grupo: "vertical", label: "Agenda / Horarios", orden: 20, icono: "CalendarDays" },
    { featureKey: FEATURES.MEMBRESIAS, activado: true, grupo: "vertical", label: "Cuotas / Membresías", orden: 21, icono: "IdCard" },
  ],
}

// Veterinaria = salud + veterinaria feature
RUBRO_FEATURES["CONS"] = [
  { featureKey: FEATURES.TURNOS_AGENDA, activado: true, grupo: "vertical", label: "Turnos / Agenda", orden: 20, icono: "CalendarDays" },
  { featureKey: FEATURES.HISTORIA_CLINICA, activado: false, grupo: "vertical", label: "Historia Clínica", orden: 21, icono: "Stethoscope" },
  { featureKey: FEATURES.VETERINARIA, activado: true, grupo: "vertical", label: "Veterinaria", orden: 22, icono: "PawPrint" },
]

// ─── WORKFLOW SEEDS POR RUBRO ────────────────────────────────────────────────

const WORKFLOW_SEEDS: Record<string, WorkflowSeed[]> = {
  ALIM: [
    {
      proceso: "venta",
      nombre: "Venta Gastronomía",
      descripcion: "Comanda → KDS → Cuenta → Facturación → Contabilidad → Cierre Caja",
      pasos: [
        { stepKey: "crear_comanda", nombre: "Crear Comanda", tipo: "service_call", accion: "hospitalidadService.crearComanda", orden: 1, obligatorio: true },
        { stepKey: "enviar_kds", nombre: "Enviar a KDS", tipo: "event_emit", accion: "comanda.nueva", orden: 2, obligatorio: true, requiereFeature: FEATURES.KDS },
        { stepKey: "preparar_cuenta", nombre: "Preparar Cuenta", tipo: "service_call", accion: "hospitalidadService.prepararCuenta", orden: 3, obligatorio: true },
        { stepKey: "emitir_factura", nombre: "Emitir Factura AFIP", tipo: "service_call", accion: "facturaService.emitirFactura", orden: 4, obligatorio: true, requiereFeature: FEATURES.FACTURACION_AFIP },
        { stepKey: "generar_asiento", nombre: "Generar Asiento Contable", tipo: "service_call", accion: "asientoService.generarAsientoVenta", orden: 5, obligatorio: false, requiereFeature: FEATURES.CONTABILIDAD },
        { stepKey: "registrar_cobro", nombre: "Registrar Cobro", tipo: "service_call", accion: "cobrosService.registrarCobro", orden: 6, obligatorio: true },
      ],
    },
  ],
  COM: [
    {
      proceso: "venta",
      nombre: "Venta Distribución",
      descripcion: "Pedido → Stock → Picking → Remito → Factura → CC → Cobro",
      pasos: [
        { stepKey: "crear_pedido", nombre: "Crear Pedido", tipo: "service_call", accion: "ventasService.crearPedido", orden: 1, obligatorio: true },
        { stepKey: "reservar_stock", nombre: "Reservar Stock", tipo: "service_call", accion: "stockService.reservar", orden: 2, obligatorio: true, requiereFeature: FEATURES.STOCK },
        { stepKey: "generar_picking", nombre: "Generar Orden Picking", tipo: "service_call", accion: "pickingService.generarOrden", orden: 3, obligatorio: false, requiereFeature: FEATURES.PICKING_WAREHOUSE },
        { stepKey: "emitir_remito", nombre: "Emitir Remito", tipo: "service_call", accion: "ventasService.emitirRemito", orden: 4, obligatorio: true, requiereFeature: FEATURES.REMITOS },
        { stepKey: "emitir_factura", nombre: "Emitir Factura AFIP", tipo: "service_call", accion: "facturaService.emitirFactura", orden: 5, obligatorio: true },
        { stepKey: "registrar_cc", nombre: "Cargar a Cta. Cte.", tipo: "service_call", accion: "cuentasCorrientesService.cargarComprobante", orden: 6, obligatorio: true, requiereFeature: FEATURES.CC_CP },
        { stepKey: "generar_asiento", nombre: "Generar Asiento", tipo: "service_call", accion: "asientoService.generarAsientoVenta", orden: 7, obligatorio: false, requiereFeature: FEATURES.CONTABILIDAD },
      ],
    },
    {
      proceso: "compra",
      nombre: "Compra Distribución",
      descripcion: "OC → Recepción → Stock → Factura Proveedor → CP → Pago",
      pasos: [
        { stepKey: "crear_oc", nombre: "Crear Orden de Compra", tipo: "service_call", accion: "comprasService.crearOC", orden: 1, obligatorio: true },
        { stepKey: "recepcion_mercaderia", nombre: "Recepción Mercadería", tipo: "service_call", accion: "stockService.ingresarStock", orden: 2, obligatorio: true },
        { stepKey: "cargar_factura_proveedor", nombre: "Cargar Factura Proveedor", tipo: "service_call", accion: "comprasService.cargarFactura", orden: 3, obligatorio: true },
        { stepKey: "registrar_cp", nombre: "Cargar a Cta. Cte. Proveedor", tipo: "service_call", accion: "cuentasCorrientesService.cargarComprobante", orden: 4, obligatorio: true },
        { stepKey: "generar_asiento_compra", nombre: "Generar Asiento", tipo: "service_call", accion: "asientoService.generarAsientoCompra", orden: 5, obligatorio: false, requiereFeature: FEATURES.CONTABILIDAD },
      ],
    },
  ],
  SALUD: [
    {
      proceso: "consulta",
      nombre: "Consulta Médica",
      descripcion: "Turno → Historia Clínica → Prescripción → Facturación → Cobro",
      pasos: [
        { stepKey: "confirmar_turno", nombre: "Confirmar Turno", tipo: "service_call", accion: "agendaService.confirmarTurno", orden: 1, obligatorio: true, requiereFeature: FEATURES.TURNOS_AGENDA },
        { stepKey: "registrar_consulta", nombre: "Registrar en HC", tipo: "service_call", accion: "historiaClinicaService.registrarConsulta", orden: 2, obligatorio: true, requiereFeature: FEATURES.HISTORIA_CLINICA },
        { stepKey: "emitir_factura", nombre: "Emitir Factura", tipo: "service_call", accion: "facturaService.emitirFactura", orden: 3, obligatorio: true },
        { stepKey: "registrar_cobro", nombre: "Registrar Cobro", tipo: "service_call", accion: "cobrosService.registrarCobro", orden: 4, obligatorio: true },
      ],
    },
  ],
  IND: [
    {
      proceso: "produccion",
      nombre: "Orden de Producción",
      descripcion: "OP → Consumo Materiales → Producción → Ingreso PT → Costeo",
      pasos: [
        { stepKey: "crear_op", nombre: "Crear Orden Producción", tipo: "service_call", accion: "produccionService.crearOP", orden: 1, obligatorio: true },
        { stepKey: "consumir_materiales", nombre: "Consumir Materiales", tipo: "service_call", accion: "stockService.consumirBOM", orden: 2, obligatorio: true },
        { stepKey: "ingresar_pt", nombre: "Ingresar Producto Terminado", tipo: "service_call", accion: "stockService.ingresarStock", orden: 3, obligatorio: true },
        { stepKey: "costear_op", nombre: "Costear OP", tipo: "service_call", accion: "produccionService.costear", orden: 4, obligatorio: false },
        { stepKey: "generar_asiento_produccion", nombre: "Asiento Producción", tipo: "service_call", accion: "asientoService.generarAsientoProduccion", orden: 5, obligatorio: false, requiereFeature: FEATURES.CONTABILIDAD },
      ],
    },
  ],
}

// ─── SEED FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Seed de todas las features de un rubro (core + verticales).
 * Idempotente — usa upsert.
 */
export async function seedConfiguracionRubro(rubroId: number, rubroCodigo: string): Promise<number> {
  const allFeatures = [...CORE_FEATURES, ...(RUBRO_FEATURES[rubroCodigo] ?? [])]
  let count = 0

  for (const feat of allFeatures) {
    await prisma.configuracionRubro.upsert({
      where: { rubroId_featureKey: { rubroId, featureKey: feat.featureKey } },
      create: {
        rubroId,
        featureKey: feat.featureKey,
        activado: feat.activado,
        modoSimplificado: feat.modoSimplificado ?? false,
        grupo: feat.grupo,
        label: feat.label,
        descripcion: feat.descripcion ?? null,
        icono: feat.icono ?? null,
        orden: feat.orden,
        parametros: feat.parametros ?? null,
      },
      update: {
        activado: feat.activado,
        grupo: feat.grupo,
        label: feat.label,
        orden: feat.orden,
      },
    })
    count++
  }

  return count
}

/**
 * Seed del catálogo FeatureRubro para un rubro.
 */
export async function seedFeatureRubro(rubroId: number, rubroCodigo: string): Promise<number> {
  const allFeatures = [...CORE_FEATURES, ...(RUBRO_FEATURES[rubroCodigo] ?? [])]
  let count = 0

  for (const feat of allFeatures) {
    await prisma.featureRubro.upsert({
      where: { rubroId_featureKey: { rubroId, featureKey: feat.featureKey } },
      create: {
        rubroId,
        featureKey: feat.featureKey,
        grupo: feat.grupo,
        label: feat.label,
        descripcion: feat.descripcion ?? null,
        icono: feat.icono ?? null,
        orden: feat.orden,
        activadoPorDefecto: feat.activado,
      },
      update: {
        grupo: feat.grupo,
        label: feat.label,
        orden: feat.orden,
        activadoPorDefecto: feat.activado,
      },
    })
    count++
  }

  return count
}

/**
 * Seed de workflows para un rubro.
 * Crea WorkflowRubro → WorkflowStep → WorkflowTransition (secuencial por defecto).
 */
export async function seedWorkflowsRubro(rubroId: number, rubroCodigo: string): Promise<number> {
  const workflows = WORKFLOW_SEEDS[rubroCodigo] ?? []
  let count = 0

  for (const wf of workflows) {
    // Upsert workflow
    const existing = await prisma.workflowRubro.findFirst({
      where: { rubroId, proceso: wf.proceso, version: 1 },
    })

    const workflow = existing
      ? await prisma.workflowRubro.update({
          where: { id: existing.id },
          data: { nombre: wf.nombre, descripcion: wf.descripcion },
        })
      : await prisma.workflowRubro.create({
          data: {
            rubroId,
            proceso: wf.proceso,
            nombre: wf.nombre,
            descripcion: wf.descripcion,
            version: 1,
          },
        })

    // Delete old steps and recreate (simpler than upsert for ordered relations)
    if (existing) {
      await prisma.workflowStep.deleteMany({ where: { workflowId: workflow.id } })
    }

    // Create steps
    const createdSteps: { stepKey: string; id: number }[] = []
    for (const paso of wf.pasos) {
      const step = await prisma.workflowStep.create({
        data: {
          workflowId: workflow.id,
          stepKey: paso.stepKey,
          nombre: paso.nombre,
          tipo: paso.tipo,
          accion: paso.accion ?? null,
          orden: paso.orden,
          obligatorio: paso.obligatorio,
          requiereFeature: paso.requiereFeature ?? null,
          parametros: paso.parametros ?? null,
          condicion: paso.condicion ?? null,
        },
      })
      createdSteps.push({ stepKey: paso.stepKey, id: step.id })
    }

    // Create sequential transitions (A→B→C→...)
    for (let i = 0; i < createdSteps.length - 1; i++) {
      const origen = createdSteps[i]!
      const destino = createdSteps[i + 1]!
      await prisma.workflowTransition.create({
        data: {
          origenId: origen.id,
          destinoId: destino.id,
          label: "siguiente",
          prioridad: 0,
        },
      })
    }

    // Create custom transitions if defined
    for (const paso of wf.pasos) {
      if (paso.transiciones) {
        const origenStep = createdSteps.find((s) => s.stepKey === paso.stepKey)
        if (!origenStep) continue
        for (const trans of paso.transiciones) {
          const destinoStep = createdSteps.find((s) => s.stepKey === trans.destinoStepKey)
          if (!destinoStep) continue
          await prisma.workflowTransition.create({
            data: {
              origenId: origenStep.id,
              destinoId: destinoStep.id,
              label: trans.label,
              condicion: trans.condicion ?? null,
              prioridad: 1,
            },
          })
        }
      }
    }

    count++
  }

  return count
}

/**
 * Seed completo: features + workflows para un rubro.
 */
export async function seedCompletoRubro(
  rubroId: number,
  rubroCodigo: string,
): Promise<{ features: number; featuresCatalogo: number; workflows: number }> {
  const features = await seedConfiguracionRubro(rubroId, rubroCodigo)
  const featuresCatalogo = await seedFeatureRubro(rubroId, rubroCodigo)
  const workflows = await seedWorkflowsRubro(rubroId, rubroCodigo)
  return { features, featuresCatalogo, workflows }
}

/**
 * Seed todos los rubros existentes.
 */
export async function seedTodosLosRubros(): Promise<Record<string, { features: number; workflows: number }>> {
  const rubros = await prisma.rubro.findMany({ where: { activo: true } })
  const results: Record<string, { features: number; workflows: number }> = {}

  for (const rubro of rubros) {
    const r = await seedCompletoRubro(rubro.id, rubro.codigo)
    results[rubro.codigo] = { features: r.features, workflows: r.workflows }
  }

  return results
}

// ─── QUERY HELPERS ───────────────────────────────────────────────────────────

/**
 * Obtener todos los rubros con counts de features y workflows.
 */
export async function listarRubrosConStats() {
  return prisma.rubro.findMany({
    where: { activo: true },
    include: {
      _count: {
        select: {
          configuraciones: true,
          workflows: true,
          featuresRubro: true,
        },
      },
    },
    orderBy: { orden: "asc" },
  })
}

/**
 * Obtener features agrupadas por grupo para un rubro.
 */
export async function getFeaturesAgrupadasPorRubro(rubroId: number) {
  const features = await prisma.configuracionRubro.findMany({
    where: { rubroId },
    orderBy: [{ grupo: "asc" }, { orden: "asc" }],
  })

  const grupos: Record<string, typeof features> = {}
  for (const f of features) {
    if (!grupos[f.grupo]) grupos[f.grupo] = []
    grupos[f.grupo]!.push(f)
  }
  return grupos
}

/**
 * Obtener workflows con pasos para un rubro.
 */
export async function getWorkflowsConPasos(rubroId: number) {
  return prisma.workflowRubro.findMany({
    where: { rubroId, activo: true },
    include: {
      pasos: {
        where: { activo: true },
        orderBy: { orden: "asc" },
        include: {
          transicionesSalida: { orderBy: { prioridad: "asc" } },
        },
      },
    },
    orderBy: { proceso: "asc" },
  })
}

/**
 * Onboarding guiado por IA — ERP Argentina
 *
 * DIFERENCIAL COMPETITIVO vs Odoo / Bind / Siigo:
 * → Ningún competidor argentino hace onboarding automático por IA
 * → < 10 minutos desde cero hasta primera venta
 * → Módulos correctos activados por rubro, no instalados manualmente
 * → TES preconfigurado según condición AFIP
 * → Productos de ejemplo cargados por rubro
 * → Roles sugeridos automáticamente según estructura del negocio
 */

import type { RolSistema } from "@/lib/auth/roles"

export type Rubro =
  | "ferreteria"
  | "kiosco"
  | "bar_restaurant"
  | "veterinaria"
  | "clinica"
  | "farmacia"
  | "libreria"
  | "ropa"
  | "supermercado"
  | "distribuidora"
  | "salon_belleza"
  | "gimnasio"
  | "otro"

export interface RespuestasOnboarding {
  rubro: Rubro
  tamano: "micro" | "pequeno" | "mediano"
  tieneStock: boolean
  tienePersonal: boolean
  necesitaFacturacion: boolean
  necesitaContabilidad: boolean
  condicionAfip: "monotributista" | "responsable_inscripto"
  tieneLocal: boolean
  tieneDelivery: boolean
  tieneContadorExterno?: boolean
  tieneVendedoresRuta?: boolean
  cantidadCajas?: number
  tieneMozos?: boolean
}

export interface ModuloERP {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
  requerido: boolean
}

export interface IAOnboardingInfo {
  modeloPrincipal: string
  top3Features: string[]
  horasAhorradasMes: number
  argumentoVentaIA: string
  features: Array<{ id: string; nombre: string; impacto: string; descripcion: string }>
}

export interface ConfiguracionGenerada {
  modulosActivos: string[]
  modulosDetalle: ModuloERP[]
  planCuentasSugerido: string
  tesSugeridos: string[]
  productosEjemplo: { nombre: string; codigo: string; precio: number; iva: number }[]
  rolesSugeridos: RolSistema[]
  mensajeBienvenida: string
  argumentoVenta: string
  proximosPasos: string[]
  particularidadesRubro: string[]
  maestrosCriticos: MaestroCritico[]
  flujosCriticos: string[]
  /** IA value-add info for this rubro */
  ia: IAOnboardingInfo | null
}

export interface MaestroCritico {
  tabla: string
  label: string
  descripcion: string
}

export interface RubroUxConfig {
  nombre: string
  foco: string[]
  alertas: string[]
  quickActions: { label: string; href: string }[]
  sidebarPrioridad: string[]
  maestrosCriticos: MaestroCritico[]
  flujosCriticos: string[]
}

// ─── CATÁLOGO DE MÓDULOS ────────────────────────────────────────────────────

const TODOS_LOS_MODULOS: ModuloERP[] = [
  { id: "pos", nombre: "POS / Punto de Venta", descripcion: "Venta rápida, código de barras, múltiples medios de pago", activo: false, requerido: false },
  { id: "ventas", nombre: "Facturación", descripcion: "Facturas A, B, C, NCR, NDB con CAE AFIP automático", activo: false, requerido: false },
  { id: "clientes", nombre: "Clientes", descripcion: "Cartera de clientes, cuenta corriente, historial", activo: false, requerido: false },
  { id: "compras", nombre: "Compras", descripcion: "Órdenes de compra, recepción, facturas de proveedor", activo: false, requerido: false },
  { id: "proveedores", nombre: "Proveedores", descripcion: "Gestión de proveedores y condiciones comerciales", activo: false, requerido: false },
  { id: "productos", nombre: "Productos / Inventario", descripcion: "Catálogo, stock, precios, variantes", activo: false, requerido: false },
  { id: "stock", nombre: "Control de Stock", descripcion: "Movimientos, alertas, inventario cíclico", activo: false, requerido: false },
  { id: "caja", nombre: "Caja", descripcion: "Apertura/cierre por turno, medios de pago, diferencias", activo: false, requerido: false },
  { id: "banco", nombre: "Banco", descripcion: "Extractos, conciliación automática", activo: false, requerido: false },
  { id: "contabilidad", nombre: "Contabilidad", descripcion: "Asientos, plan de cuentas, balance, estado de resultados", activo: false, requerido: false },
  { id: "impuestos", nombre: "Libros Fiscales", descripcion: "Libro IVA ventas/compras, DDJJ, exportación AFIP", activo: false, requerido: false },
  { id: "tes", nombre: "TES (Tipos de Imp.)", descripcion: "Discriminación inteligente de impuestos por operación", activo: false, requerido: false },
  { id: "hospitalidad", nombre: "Hospitalidad", descripcion: "Mesas, comandas digitales, salones", activo: false, requerido: false },
  { id: "kds", nombre: "Kitchen Display System", descripcion: "Pantalla en cocina que recibe pedidos en tiempo real", activo: false, requerido: false },
  { id: "agenda", nombre: "Agenda de Turnos", descripcion: "Turnos por profesional, recordatorios por WhatsApp", activo: false, requerido: false },
  { id: "historia_clinica", nombre: "Historia Clínica", descripcion: "Fichas de pacientes/mascotas, recetas digitales", activo: false, requerido: false },
  { id: "usuarios", nombre: "Usuarios y Permisos", descripcion: "9 roles configurables, auditoría completa", activo: false, requerido: false },
  { id: "rrhh", nombre: "RRHH / Comisiones", descripcion: "Horarios, liquidación de sueldos, comisiones", activo: false, requerido: false },
  { id: "membresías", nombre: "Membresías", descripcion: "Socios con vencimiento, control de acceso, renovación", activo: false, requerido: false },
  { id: "configuracion", nombre: "Configuración", descripcion: "Parámetros del sistema, tablas, auditoría", activo: false, requerido: false },
  { id: "reportes", nombre: "Reportes e Inteligencia", descripcion: "Dashboard ejecutivo, insights automáticos, pronósticos", activo: false, requerido: false },
  { id: "onboarding", nombre: "Onboarding IA", descripcion: "Configuración guiada < 10 minutos", activo: false, requerido: false },
]

// ─── CONFIGURACIONES POR RUBRO ──────────────────────────────────────────────

const CONFIG_POR_RUBRO: Record<Rubro, {
  modulos: string[]
  particularidades: string[]
  argumentoVenta: string
  rolesSugeridos: RolSistema[]
}> = {
  bar_restaurant: {
    modulos: ["pos", "ventas", "clientes", "compras", "proveedores", "productos", "stock", "caja", "contabilidad", "impuestos", "tes", "hospitalidad", "kds", "rrhh", "usuarios", "reportes"],
    particularidades: [
      "Gestión de mesas por salón con mapa visual editable",
      "Comandas digitales en tablet para mozos (sin papel)",
      "Kitchen Display System (KDS): pantalla en cocina",
      "Turnos de caja por turno, no por día",
      "Consumo interno: descuenta del stock sin factura",
      "Propinas separadas del ticket, distribuidas entre personal",
      "Recetas de platos: al vender descuenta ingredientes automáticamente",
      "Happy hour: precios automáticos por franja horaria",
      "Delivery y take-away con integración Rappi/PedidosYa",
    ],
    argumentoVenta: "¿Tus mozos todavía anotan en papel? Con esto, el pedido va directo a cocina desde la tablet, sin errores, sin idas y vueltas. Y al final del día sabés exactamente cuánto ganaste por mesa.",
    rolesSugeridos: ["dueno", "gerente", "cajero", "mozo"],
  },
  kiosco: {
    modulos: ["pos", "ventas", "clientes", "productos", "stock", "caja", "impuestos", "tes", "usuarios", "reportes"],
    particularidades: [
      "Venta ultra-rápida: 30 productos más vendidos como botones grandes",
      "Ticket opcional: mayoría de ventas sin comprobante",
      "Cuentas corrientes de clientes del barrio (fía y paga después)",
      "WhatsApp de recordatorio automático de deudas",
      "Carga de saldo: recargas de celular y SUBE como servicio especial",
      "Control de vencimientos: alertas de productos próximos a vencer",
      "Precio sugerido de venta: IA sugiere precio con margen configurable",
    ],
    argumentoVenta: "En 10 minutos lo tenés andando. Escaneás el código de barras, le ponés el precio y ya podés vender. Al final del día el sistema te dice cuánto ganaste y a quién le debés cobrar.",
    rolesSugeridos: ["dueno", "cajero"],
  },
  ferreteria: {
    modulos: ["pos", "ventas", "clientes", "compras", "proveedores", "productos", "stock", "caja", "contabilidad", "impuestos", "tes", "usuarios", "reportes"],
    particularidades: [
      "Múltiples unidades de medida: se vende por metro, se compra por barra",
      "Precio mayorista y minorista en el mismo producto",
      "Factura A para constructoras con IVA discriminado automático",
      "Cuentas corrientes para constructoras y contratistas",
      "Catálogo extenso: búsqueda por código, descripción, proveedor",
      "Pedido automático a proveedor cuando baja del stock mínimo",
      "Descuentos por volumen configurables por cantidad o cliente",
      "Código de barras propio para artículos a granel (tornillos, cables)",
    ],
    argumentoVenta: "Cuando entra un contratista y te pide 200 metros de cable, 50 caños y 40 llaves de luz, ¿cuánto tardás en armar la factura A hoy? Con esto, le escaneás todo, el sistema hace los precios por volumen solo y le mandás la factura por WhatsApp en 2 minutos.",
    rolesSugeridos: ["dueno", "gerente", "cajero", "deposito"],
  },
  veterinaria: {
    modulos: ["pos", "ventas", "clientes", "productos", "stock", "caja", "impuestos", "tes", "agenda", "historia_clinica", "usuarios", "reportes"],
    particularidades: [
      "Historia clínica digital por mascota (especie, raza, edad, peso, alergias)",
      "Control de vacunas con calendario por mascota",
      "Alertas automáticas al dueño por WhatsApp cuando vence una vacuna",
      "Agenda de turnos por veterinario y tipo de servicio",
      "Recordatorio automático 24hs antes del turno",
      "Recetas veterinarias digitales que descuentan del stock de farmacia",
      "Control de vencimientos de medicamentos y vacunas con alertas 30 días antes",
      "Dosis por peso: calculadora integrada según el peso del animal",
      "Facturación mixta: servicios + productos en un solo ticket",
    ],
    argumentoVenta: "¿Cuántas veces llamó un cliente preguntando cuándo le toca la vacuna al perro? Con esto, el sistema le manda el recordatorio solo por WhatsApp, con el nombre del animal. Los clientes vuelven solos.",
    rolesSugeridos: ["dueno", "cajero", "profesional"],
  },
  clinica: {
    modulos: ["pos", "ventas", "clientes", "stock", "caja", "impuestos", "tes", "agenda", "historia_clinica", "usuarios", "reportes"],
    particularidades: [
      "Agenda por médico y por consultorio, disponibilidad real",
      "Turnos online por web o WhatsApp sin llamar a la clínica",
      "Historia clínica básica: anamnesis, diagnóstico, tratamiento",
      "Liquidación de obras sociales y prepagas (lote mensual)",
      "Consentimientos informados digitales con firma en tablet",
      "Facturación a paciente y a obra social en el mismo acto médico",
      "Control de insumos descartables con descuento por práctica",
    ],
    argumentoVenta: "El médico no quiere saber nada de sistemas. Con esto, la secretaria carga los turnos, el médico ve su agenda en el celular, y al final del mes tienen el lote de la obra social listo para presentar. Sin papel, sin planillas.",
    rolesSugeridos: ["dueno", "gerente", "cajero", "profesional", "contador"],
  },
  farmacia: {
    modulos: ["pos", "ventas", "clientes", "compras", "proveedores", "productos", "stock", "caja", "contabilidad", "impuestos", "tes", "usuarios", "reportes"],
    particularidades: [
      "Trazabilidad ANMAT: lectura de troquel, seguimiento por lote",
      "Descuentos de obras sociales en tiempo real al escanear credencial",
      "Recetas controladas registradas con médico y paciente",
      "Control de psicotrópicos: libro de registro digital",
      "Stock mínimo para medicamentos críticos (antihipertensivos, insulinas)",
      "Alertas de vencimiento 60 y 30 días antes",
      "Liquidación de PAMI, IOMA, OSDE en formato requerido",
    ],
    argumentoVenta: "El control de ANMAT manual es un dolor de cabeza. Con esto, escaneás el troquel y el sistema registra todo solo. Y el descuento de PAMI lo aplica automático al escanear la credencial.",
    rolesSugeridos: ["dueno", "cajero", "deposito", "contador"],
  },
  libreria: {
    modulos: ["pos", "ventas", "clientes", "compras", "proveedores", "productos", "stock", "caja", "impuestos", "tes", "usuarios", "reportes"],
    particularidades: [
      "Catálogo con ISBN para libros",
      "IVA 10.5% para libros y útiles escolares",
      "Gestión de pedidos a editoriales y distribuidoras",
      "Temporada escolar: activación masiva de stock según lista de útiles",
    ],
    argumentoVenta: "En temporada escolar tenés todo el stock cargado con los precios correctos. Escaneás el ISBN, el precio ya está, y el ticket sale al instante.",
    rolesSugeridos: ["dueno", "cajero"],
  },
  ropa: {
    modulos: ["pos", "ventas", "clientes", "compras", "proveedores", "productos", "stock", "caja", "impuestos", "tes", "usuarios", "reportes"],
    particularidades: [
      "Variantes por talle y color con stock independiente por variante",
      "Ficha técnica con foto por colorway",
      "Gestión de temporadas con liquidación automática de saldos",
      "Etiquetas con código de barras por variante en recepción",
      "Sincronización con Tienda Nube y Shopify (stock unificado)",
      "Transferencia entre sucursales con registro automático",
    ],
    argumentoVenta: "¿Cuántas veces vendiste algo en el local y después resultó que ya lo habías vendido en la tienda online? Con esto, el stock es uno solo, en tiempo real.",
    rolesSugeridos: ["dueno", "gerente", "cajero", "deposito"],
  },
  supermercado: {
    modulos: ["pos", "ventas", "clientes", "compras", "proveedores", "productos", "stock", "caja", "contabilidad", "impuestos", "tes", "rrhh", "usuarios", "reportes"],
    particularidades: [
      "Múltiples cajas simultáneas",
      "Listas de precios por cliente o categoría",
      "Control de perecederos con alertas de vencimiento",
      "Etiquetado de góndola automático al cambiar precios",
      "Balance semanal por sección",
    ],
    argumentoVenta: "Múltiples cajas trabajando al mismo tiempo, el stock se descuenta solo, y al final del día tenés el cierre de cada caja con las diferencias.",
    rolesSugeridos: ["dueno", "gerente", "cajero", "deposito", "contador"],
  },
  distribuidora: {
    modulos: ["pos", "ventas", "clientes", "compras", "proveedores", "productos", "stock", "caja", "contabilidad", "impuestos", "tes", "rrhh", "usuarios", "reportes"],
    particularidades: [
      "Múltiples listas de precio por cliente o grupo",
      "Pedidos de vendedores en ruta con app offline",
      "Percepción de IIBB en facturas A según provincia",
      "Gestión de cartera de cobranza con app del cobrador",
      "Depósitos múltiples con transferencias registradas",
      "Remitos previos a la factura",
    ],
    argumentoVenta: "Tu vendedor de ruta hoy anota los pedidos en papel o en WhatsApp. Cuando llega, alguien tiene que pasarlos al sistema. Con esto, el pedido queda cargado en el momento, sin errores de transcripción.",
    rolesSugeridos: ["dueno", "gerente", "cajero", "deposito", "vendedor_ruta", "contador"],
  },
  salon_belleza: {
    modulos: ["pos", "ventas", "clientes", "productos", "stock", "caja", "impuestos", "tes", "agenda", "rrhh", "usuarios", "reportes"],
    particularidades: [
      "Agenda por profesional con duración configurable por servicio",
      "Ticket mixto: productos + servicios en una sola venta",
      "Comisiones automáticas por servicio a empleados",
      "Programa de fidelidad con sellos digitales",
      "Recordatorio de turno por WhatsApp 24hs antes con opción confirmar/cancelar",
      "Control de stock de insumos profesionales por servicio realizado",
      "Preferencias del cliente guardadas en la ficha",
    ],
    argumentoVenta: "¿Cuántos clientes perdiste porque se olvidaron el turno? El sistema les manda un WhatsApp el día anterior. Y si cancelan, el turno se libera solo para que otra persona lo tome.",
    rolesSugeridos: ["dueno", "cajero", "personal_servicio"],
  },
  gimnasio: {
    modulos: ["ventas", "clientes", "caja", "impuestos", "tes", "agenda", "membresías", "rrhh", "usuarios", "reportes"],
    particularidades: [
      "Membresías con vencimiento automático (mensual/trimestral/anual)",
      "Control de acceso por QR o huella dactilar",
      "Clases con cupo limitado, reserva por WhatsApp",
      "Seguimiento de asistencia con alertas de retención",
      "Congelamiento de membresía con extensión automática",
      "Deuda automática si falla el débito, bloqueo de acceso",
    ],
    argumentoVenta: "¿Sabés cuántos socios tenés que no vinieron en el último mes? El sistema te lo dice y te deja mandarles un WhatsApp personalizado para que vuelvan. La retención de socios se hace sola.",
    rolesSugeridos: ["dueno", "cajero", "personal_servicio"],
  },
  otro: {
    modulos: ["pos", "ventas", "clientes", "productos", "stock", "caja", "impuestos", "tes", "usuarios", "reportes"],
    particularidades: [
      "Sistema configurable para cualquier tipo de comercio",
      "Módulos adicionales activables en cualquier momento",
    ],
    argumentoVenta: "En 10 minutos tu negocio está andando. Vendés, controlás el stock y tenés la facturación al día.",
    rolesSugeridos: ["dueno", "cajero"],
  },
}

// ─── GENERADOR PRINCIPAL ─────────────────────────────────────────────────────

export function generarConfiguracionOnboarding(r: RespuestasOnboarding): ConfiguracionGenerada {
  const configRubro = CONFIG_POR_RUBRO[r.rubro]
  const ux = getRubroUx(r.rubro)

  // Base de módulos según rubro
  const modulosIds = new Set(configRubro.modulos)

  // Ajustes según respuestas adicionales
  if (r.tieneContadorExterno) modulosIds.add("contador")
  if (r.tienePersonal) { modulosIds.add("rrhh"); modulosIds.add("usuarios") }
  if (r.necesitaContabilidad) { modulosIds.add("contabilidad"); modulosIds.add("impuestos") }
  if (r.necesitaFacturacion) { modulosIds.add("ventas"); modulosIds.add("tes") }
  if (r.tieneDelivery) modulosIds.add("hospitalidad")
  modulosIds.add("configuracion")
  modulosIds.add("onboarding")
  modulosIds.add("reportes")

  // TES según condición AFIP
  const tes =
    r.condicionAfip === "responsable_inscripto"
      ? ["VFA", "VFB", "CFA", "CFB", "NCA", "NCB", "NCCA"]
      : ["VFC", "CFB", "CFC"]

  // Roles según rubro + ajustes
  const roles = new Set<RolSistema>(configRubro.rolesSugeridos)
  if (r.tieneContadorExterno) roles.add("contador")
  if (r.tieneMozos) roles.add("mozo")
  if (r.tieneVendedoresRuta) roles.add("vendedor_ruta")

  const modulosDetalle = TODOS_LOS_MODULOS.map(m => ({
    ...m,
    activo: modulosIds.has(m.id),
    requerido: ["pos", "ventas", "clientes", "usuarios", "configuracion"].includes(m.id),
  }))

  const proximosPasos = [
    "Configurar datos de tu empresa (CUIT, razón social, punto de venta)",
    r.necesitaFacturacion ? "Subir certificados AFIP/ARCA para facturación electrónica" : "",
    "Cargar tus productos o importarlos desde Excel",
    "Agregar tus primeros clientes y proveedores",
    r.tieneLocal ? "Abrir la primera caja del día" : "",
    r.tienePersonal ? "Crear los usuarios del equipo con sus roles" : "",
    "Hacer tu primera venta de prueba para validar la configuración",
  ].filter(Boolean) as string[]

  // IA value-add info
  let ia: IAOnboardingInfo | null = null
  try {
    const { getIAConfigRubro } = require("@/lib/ai/valor-agregado-rubro")
    const iaConfig = getIAConfigRubro(r.rubro)
    ia = {
      modeloPrincipal: iaConfig.modeloPrincipal,
      top3Features: iaConfig.top3,
      horasAhorradasMes: iaConfig.horasAhorradasMes,
      argumentoVentaIA: iaConfig.argumentoVentaIA,
      features: iaConfig.features.map((f: any) => ({
        id: f.id, nombre: f.nombre, impacto: f.impacto, descripcion: f.descripcion,
      })),
    }
  } catch { /* AI module optional */ }

  return {
    modulosActivos: [...modulosIds],
    modulosDetalle,
    planCuentasSugerido: r.condicionAfip === "responsable_inscripto" ? "PyME-RI Argentina" : "Monotributista Argentina",
    tesSugeridos: tes,
    productosEjemplo: getProductosEjemploByRubro(r.rubro),
    rolesSugeridos: [...roles] as RolSistema[],
    mensajeBienvenida: getMensajeBienvenida(r.rubro),
    argumentoVenta: configRubro.argumentoVenta,
    particularidadesRubro: configRubro.particularidades,
    proximosPasos,
    maestrosCriticos: ux.maestrosCriticos,
    flujosCriticos: ux.flujosCriticos,
    ia,
  }
}

function getMensajeBienvenida(rubro: Rubro): string {
  const mensajes: Record<Rubro, string> = {
    ferreteria: "¡Bienvenido! Tu sistema de ferretería está listo: catálogo extenso, facturas A/B, precios por volumen y control de stock.",
    kiosco: "¡Listo para arrancar! Venta rápida, código de barras, cuentas corrientes de clientes y cierre de caja automatizado.",
    bar_restaurant: "¡Tu bar/restaurant ya tiene mesas digitales, comandas en tablet, cocina conectada y facturación electrónica integrada!",
    veterinaria: "Sistema veterinario listo: historias clínicas, vacunas con recordatorio automático, agenda de turnos y farmacia interna.",
    clinica: "Tu clínica ya gestiona agenda por médico, historia clínica, obras sociales y facturación en un solo lugar.",
    farmacia: "Configurado para farmacia: trazabilidad ANMAT, descuentos de obras sociales automáticos y control de vencimientos.",
    libreria: "¡Tu librería está lista! Catálogo con ISBN, IVA correcto para útiles y gestión de pedidos a editoriales.",
    ropa: "Sistema de indumentaria activo: variantes por talle/color, temporadas, sincronización con Tienda Nube y control de sucursales.",
    supermercado: "Supermercado listo: múltiples cajas, listas de precios, perecederos y cierre diario automatizado.",
    distribuidora: "Distribuidora configurada: rutas de vendedores, listas de precios, cobranza y depósitos múltiples.",
    salon_belleza: "¡Tu salón está listo! Agenda por profesional, fidelidad con sellos, comisiones automáticas y recordatorio de turnos.",
    gimnasio: "Gimnasio configurado: membresías con vencimiento, control de acceso, clases con cupo y retención automática de socios.",
    otro: "¡Sistema configurado! Empezá a vender, controlar el stock y tener la facturación al día.",
  }
  return mensajes[rubro]
}

function getProductosEjemploByRubro(rubro: Rubro): { nombre: string; codigo: string; precio: number; iva: number }[] {
  const ejemplos: Record<Rubro, { nombre: string; codigo: string; precio: number; iva: number }[]> = {
    ferreteria: [
      { nombre: "Clavos 1\" x kg", codigo: "CLV001", precio: 850, iva: 21 },
      { nombre: "Pintura látex blanco 4L", codigo: "PNT001", precio: 4200, iva: 21 },
      { nombre: "Cinta métrica 5m", codigo: "CIN001", precio: 1200, iva: 21 },
      { nombre: "Cable unipolar 1.5mm (x metro)", codigo: "CAB001", precio: 280, iva: 21 },
    ],
    kiosco: [
      { nombre: "Coca-Cola 500ml", codigo: "CCL001", precio: 650, iva: 21 },
      { nombre: "Alfajor Oreo", codigo: "ALF001", precio: 380, iva: 10.5 },
      { nombre: "Cigarrillos Marlboro x20", codigo: "CIG001", precio: 1800, iva: 21 },
      { nombre: "Agua mineral 500ml", codigo: "AGU001", precio: 350, iva: 10.5 },
    ],
    bar_restaurant: [
      { nombre: "Cerveza 1L", codigo: "CRV001", precio: 1500, iva: 21 },
      { nombre: "Empanada carne", codigo: "EMP001", precio: 450, iva: 10.5 },
      { nombre: "Milanesa con papas", codigo: "MIL001", precio: 4500, iva: 10.5 },
      { nombre: "Cubierto", codigo: "CBR001", precio: 500, iva: 21 },
    ],
    veterinaria: [
      { nombre: "Consulta veterinaria", codigo: "CON001", precio: 5000, iva: 21 },
      { nombre: "Vacuna antirrabica", codigo: "VAC001", precio: 3500, iva: 21 },
      { nombre: "Antiparasitario Frontline", codigo: "ANT001", precio: 4200, iva: 21 },
      { nombre: "Alimento Royal Canin 3kg", codigo: "ALI001", precio: 8500, iva: 10.5 },
    ],
    clinica: [
      { nombre: "Consulta médica general", codigo: "CMG001", precio: 8000, iva: 0 },
      { nombre: "Electrocardiograma", codigo: "ECG001", precio: 4500, iva: 0 },
      { nombre: "Análisis de sangre completo", codigo: "ANA001", precio: 3500, iva: 0 },
      { nombre: "Consulta especialista", codigo: "CSP001", precio: 12000, iva: 0 },
    ],
    farmacia: [
      { nombre: "Ibuprofeno 400mg x20", codigo: "IBU001", precio: 1200, iva: 0 },
      { nombre: "Amoxicilina 500mg x12", codigo: "AMO001", precio: 2400, iva: 0 },
      { nombre: "Termómetro digital", codigo: "TER001", precio: 2800, iva: 21 },
      { nombre: "Alcohol en gel 500ml", codigo: "ALC001", precio: 1500, iva: 21 },
    ],
    libreria: [
      { nombre: "Cuaderno universitario 100 hjs", codigo: "CUA001", precio: 1800, iva: 10.5 },
      { nombre: "Lapicera BIC x12", codigo: "LAP001", precio: 950, iva: 10.5 },
      { nombre: "Resma A4 500 hojas", codigo: "RES001", precio: 3200, iva: 10.5 },
      { nombre: "Mochila escolar", codigo: "MOC001", precio: 12000, iva: 21 },
    ],
    ropa: [
      { nombre: "Remera algodón - Talle M", codigo: "REM-M-001", precio: 5500, iva: 21 },
      { nombre: "Jean elastizado - Talle 38", codigo: "JEA-38-001", precio: 12000, iva: 21 },
      { nombre: "Buzo campera - Talle L", codigo: "BUZ-L-001", precio: 18000, iva: 21 },
    ],
    supermercado: [
      { nombre: "Aceite de girasol 1.5L", codigo: "ACE001", precio: 2200, iva: 10.5 },
      { nombre: "Arroz largo fino 1kg", codigo: "ARR001", precio: 980, iva: 10.5 },
      { nombre: "Yerba Taragüí 1kg", codigo: "YER001", precio: 2800, iva: 10.5 },
    ],
    distribuidora: [
      { nombre: "Producto A (unidad)", codigo: "PDA001", precio: 1000, iva: 21 },
      { nombre: "Producto B (caja x12)", codigo: "PDB001", precio: 8400, iva: 21 },
    ],
    salon_belleza: [
      { nombre: "Corte de cabello", codigo: "CRT001", precio: 3500, iva: 21 },
      { nombre: "Coloración completa", codigo: "COL001", precio: 12000, iva: 21 },
      { nombre: "Keratina", codigo: "KER001", precio: 18000, iva: 21 },
      { nombre: "Shampoo profesional 300ml", codigo: "SHA001", precio: 4200, iva: 21 },
    ],
    gimnasio: [
      { nombre: "Membresía mensual", codigo: "MEM-MES", precio: 12000, iva: 21 },
      { nombre: "Membresía trimestral", codigo: "MEM-TRI", precio: 30000, iva: 21 },
      { nombre: "Clase suelta", codigo: "CLA001", precio: 2500, iva: 21 },
    ],
    otro: [
      { nombre: "Producto genérico 1", codigo: "PRD001", precio: 1000, iva: 21 },
      { nombre: "Servicio / Hora", codigo: "SRV001", precio: 5000, iva: 21 },
    ],
  }
  return ejemplos[rubro] ?? ejemplos.otro
}

// ─── UX POR RUBRO ─────────────────────────────────────────────────────────

const RUBRO_ALIASES: Record<string, Rubro> = {
  gastronomia: "bar_restaurant",
  salud: "clinica",
  comercio: "kiosco",
  hoteleria: "bar_restaurant",
  transporte: "distribuidora",
  servicios: "otro",
  industria: "otro",
  educacion: "otro",
  agro: "otro",
  construccion: "ferreteria",
}

const RUBRO_UX: Record<Rubro, RubroUxConfig> = {
  ferreteria: {
    nombre: "Ferreteria",
    foco: ["Margen por familia", "Ventas mayoristas", "Rotacion de inventario", "Stock critico"],
    alertas: ["SKU rapido sin stock", "Precio desactualizado", "CP vencidas"],
    quickActions: [
      { label: "Venta mostrador", href: "/dashboard/ventas" },
      { label: "Ordenes de compra", href: "/dashboard/compras" },
      { label: "Cuentas a pagar", href: "/dashboard/cuentas-pagar" },
    ],
    sidebarPrioridad: ["ventas", "stock", "compras", "caja", "contabilidad"],
    maestrosCriticos: [
      { tabla: "unidades-medida", label: "Unidades de medida", descripcion: "Venta por metro, kg o unidad." },
      { tabla: "listas-precio", label: "Listas de precio", descripcion: "Mayorista/minorista y promociones." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Cuenta corriente y plazos." },
      { tabla: "depositos", label: "Depositos", descripcion: "Almacen principal y sucursales." },
    ],
    flujosCriticos: ["Venta mostrador -> factura -> caja", "Compra -> ingreso -> stock", "Cuenta corriente -> cobranza"],
  },
  kiosco: {
    nombre: "Kiosco",
    foco: ["Ventas por hora", "Ticket promedio", "Margen por producto", "Rotacion de stock"],
    alertas: ["Stock bajo en top 20", "Caja sin cierre", "Productos vencidos"],
    quickActions: [
      { label: "Venta rapida", href: "/dashboard/ventas" },
      { label: "Movimientos stock", href: "/dashboard/productos/movimientos" },
      { label: "Cerrar caja", href: "/dashboard/caja" },
    ],
    sidebarPrioridad: ["ventas", "caja", "stock", "compras"],
    maestrosCriticos: [
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Efectivo, QR, tarjetas, transferencias." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Contado, fiado, cuotas." },
      { tabla: "rubros", label: "Rubros", descripcion: "Segmenta clientes y productos." },
      { tabla: "depositos", label: "Depositos", descripcion: "Control de stock por local." },
    ],
    flujosCriticos: ["Venta mostrador -> ticket -> caja", "Reposicion -> ingreso -> stock"],
  },
  bar_restaurant: {
    nombre: "Bar / Restaurant",
    foco: ["Comandas por turno", "Tiempo medio de preparacion", "Merma de insumos", "Venta por mesa"],
    alertas: ["Demora en cocina", "Insumo critico sin stock", "Caja por turno sin cierre"],
    quickActions: [
      { label: "Mesas y comandas", href: "/dashboard/hospitalidad" },
      { label: "KDS cocina", href: "/dashboard/hospitalidad/kds" },
      { label: "Caja", href: "/dashboard/caja" },
    ],
    sidebarPrioridad: ["hospitalidad", "caja", "ventas", "stock", "compras"],
    maestrosCriticos: [
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Tarjetas, QR, efectivo, propinas." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Contado, cuenta corriente." },
      { tabla: "depositos", label: "Depositos", descripcion: "Almacen e insumos de cocina." },
      { tabla: "rubros", label: "Rubros", descripcion: "Familias de productos y platos." },
    ],
    flujosCriticos: ["Mesa -> comanda -> cocina -> cobro", "Caja por turno -> cierre", "Recetas -> consumo de insumos"],
  },
  veterinaria: {
    nombre: "Veterinaria",
    foco: ["Turnos por profesional", "Vacunas al dia", "Ventas farmacia", "Retencion clientes"],
    alertas: ["Vacunas vencidas", "Turnos sin confirmar", "Stock critico medicamentos"],
    quickActions: [
      { label: "Agenda de turnos", href: "/dashboard/agenda" },
      { label: "Historia clinica", href: "/dashboard/historia-clinica" },
      { label: "Facturar", href: "/dashboard/ventas" },
    ],
    sidebarPrioridad: ["agenda", "historia_clinica", "ventas", "caja", "stock"],
    maestrosCriticos: [
      { tabla: "profesiones", label: "Profesiones", descripcion: "Especialidades por profesional." },
      { tabla: "tipos-contacto", label: "Tipos de contacto", descripcion: "WhatsApp, email, telefono." },
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Efectivo, QR, tarjetas." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Contado o cuenta corriente." },
    ],
    flujosCriticos: ["Turno -> atencion -> receta -> venta", "Vacunas -> recordatorio -> control"],
  },
  clinica: {
    nombre: "Clinica / Salud",
    foco: ["Turnos por especialidad", "Ocupacion consultorios", "Ingresos por practica", "Cobranza OS"],
    alertas: ["Turnos sin confirmar", "Baja ocupacion semanal", "Cobranza vencida"],
    quickActions: [
      { label: "Agenda", href: "/dashboard/agenda" },
      { label: "Historia clinica", href: "/dashboard/historia-clinica" },
      { label: "Facturar", href: "/dashboard/ventas" },
    ],
    sidebarPrioridad: ["agenda", "historia_clinica", "ventas", "caja", "stock"],
    maestrosCriticos: [
      { tabla: "profesiones", label: "Profesiones", descripcion: "Especialidades y practicas." },
      { tabla: "tipos-contacto", label: "Tipos de contacto", descripcion: "WhatsApp, email, telefono." },
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Efectivo, QR, tarjetas." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Obra social y particular." },
    ],
    flujosCriticos: ["Turno -> atencion -> facturacion", "Lote OS -> conciliacion"],
  },
  farmacia: {
    nombre: "Farmacia",
    foco: ["Ventas por obra social", "Rotacion de medicamentos", "Ticket promedio", "Vencimientos"],
    alertas: ["Lote por vencer", "Stock critico", "Descuento OS sin aplicar"],
    quickActions: [
      { label: "Venta mostrador", href: "/dashboard/ventas" },
      { label: "Compras", href: "/dashboard/compras" },
      { label: "Movimientos stock", href: "/dashboard/productos/movimientos" },
    ],
    sidebarPrioridad: ["ventas", "stock", "compras", "caja", "contabilidad"],
    maestrosCriticos: [
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Tarjetas, QR, efectivo." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Obras sociales y contado." },
      { tabla: "depositos", label: "Depositos", descripcion: "Control de stock por local." },
      { tabla: "rubros", label: "Rubros", descripcion: "Familias de productos." },
    ],
    flujosCriticos: ["Compra -> ingreso -> stock", "Venta -> descuento OS -> caja"],
  },
  libreria: {
    nombre: "Libreria",
    foco: ["Ventas por categoria", "Temporada escolar", "Rotacion", "Margen por proveedor"],
    alertas: ["Stock utiles criticos", "Sobrestock fin temporada", "Caja sin cierre"],
    quickActions: [
      { label: "Venta", href: "/dashboard/ventas" },
      { label: "Compras", href: "/dashboard/compras" },
      { label: "Movimientos stock", href: "/dashboard/productos/movimientos" },
    ],
    sidebarPrioridad: ["ventas", "stock", "compras", "caja"],
    maestrosCriticos: [
      { tabla: "listas-precio", label: "Listas de precio", descripcion: "Precios por temporada." },
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Efectivo, QR, tarjetas." },
      { tabla: "canales-venta", label: "Canales de venta", descripcion: "Mostrador, escuelas, empresas." },
      { tabla: "depositos", label: "Depositos", descripcion: "Stock por local." },
    ],
    flujosCriticos: ["Compra -> ingreso -> stock", "Venta -> ticket -> caja"],
  },
  ropa: {
    nombre: "Indumentaria",
    foco: ["Ventas por talle/color", "Rotacion por temporada", "Devoluciones", "Margen por marca"],
    alertas: ["Talle critico agotado", "Sobrestock temporada", "Cambios elevados"],
    quickActions: [
      { label: "Venta", href: "/dashboard/ventas" },
      { label: "Productos", href: "/dashboard/productos" },
      { label: "Compras temporada", href: "/dashboard/compras" },
    ],
    sidebarPrioridad: ["ventas", "stock", "compras", "caja"],
    maestrosCriticos: [
      { tabla: "listas-precio", label: "Listas de precio", descripcion: "Temporada y liquidaciones." },
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Efectivo, QR, tarjetas." },
      { tabla: "rubros", label: "Rubros", descripcion: "Lineas y colecciones." },
      { tabla: "depositos", label: "Depositos", descripcion: "Stock por sucursal." },
    ],
    flujosCriticos: ["Recepcion -> etiquetado -> venta", "Transferencia -> stock"],
  },
  supermercado: {
    nombre: "Supermercado",
    foco: ["Ventas por caja", "Rotacion perecederos", "Merma", "Margen por categoria"],
    alertas: ["Perecederos por vencer", "Caja sin cierre", "Stock critico"],
    quickActions: [
      { label: "Venta", href: "/dashboard/ventas" },
      { label: "Caja", href: "/dashboard/caja" },
      { label: "Movimientos stock", href: "/dashboard/productos/movimientos" },
    ],
    sidebarPrioridad: ["ventas", "caja", "stock", "compras"],
    maestrosCriticos: [
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Efectivo, QR, tarjetas." },
      { tabla: "listas-precio", label: "Listas de precio", descripcion: "Mayorista/minorista." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Contado y cuenta corriente." },
      { tabla: "depositos", label: "Depositos", descripcion: "Stock por local." },
    ],
    flujosCriticos: ["Venta por caja -> cierre", "Compra -> ingreso -> stock"],
  },
  distribuidora: {
    nombre: "Distribuidora",
    foco: ["Pedidos por vendedor", "Cobranza vencida", "Rotacion deposito", "Ventas por cliente"],
    alertas: ["Pedidos sin entregar", "Stock critico", "Aging CC +90"],
    quickActions: [
      { label: "Pedidos de venta", href: "/dashboard/ventas" },
      { label: "Picking", href: "/dashboard/picking" },
      { label: "Logistica", href: "/dashboard/logistica" },
    ],
    sidebarPrioridad: ["ventas", "picking", "logistica", "stock", "caja", "compras"],
    maestrosCriticos: [
      { tabla: "vendedores", label: "Vendedores", descripcion: "Rutas y comisiones." },
      { tabla: "transportistas", label: "Transportistas", descripcion: "Flota propia o terceros." },
      { tabla: "listas-precio", label: "Listas de precio", descripcion: "Por cliente o segmento." },
      { tabla: "canales-venta", label: "Canales de venta", descripcion: "Ruta, ecommerce, mayorista." },
      { tabla: "depositos", label: "Depositos", descripcion: "Multiple depositos." },
    ],
    flujosCriticos: ["Pedido -> picking -> remito -> factura", "Cobranza -> cuenta corriente"],
  },
  salon_belleza: {
    nombre: "Salon de Belleza",
    foco: ["Turnos por profesional", "Comisiones", "Ventas de productos", "Retencion clientes"],
    alertas: ["Turnos sin confirmar", "Stock insumos bajo", "Comisiones pendientes"],
    quickActions: [
      { label: "Agenda", href: "/dashboard/agenda" },
      { label: "Facturar", href: "/dashboard/ventas" },
      { label: "Caja", href: "/dashboard/caja" },
    ],
    sidebarPrioridad: ["agenda", "ventas", "caja", "stock"],
    maestrosCriticos: [
      { tabla: "profesiones", label: "Profesiones", descripcion: "Servicios y especialidades." },
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Efectivo, QR, tarjetas." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Contado y abonos." },
      { tabla: "rubros", label: "Rubros", descripcion: "Servicios y productos." },
    ],
    flujosCriticos: ["Turno -> servicio -> cobro", "Comision -> liquidacion"],
  },
  gimnasio: {
    nombre: "Gimnasio",
    foco: ["Membresias activas", "Renovaciones", "Asistencia", "Deuda"],
    alertas: ["Membresias vencidas", "Debitos fallidos", "Baja asistencia"],
    quickActions: [
      { label: "Membresias", href: "/dashboard/membresias" },
      { label: "Agenda", href: "/dashboard/agenda" },
      { label: "Caja", href: "/dashboard/caja" },
    ],
    sidebarPrioridad: ["membresias", "agenda", "caja", "ventas"],
    maestrosCriticos: [
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Debito, QR, tarjetas." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Mensual, trimestral, anual." },
      { tabla: "tipos-contacto", label: "Tipos de contacto", descripcion: "WhatsApp, email, telefono." },
      { tabla: "rubros", label: "Rubros", descripcion: "Planes y servicios." },
    ],
    flujosCriticos: ["Alta socio -> membresia -> cobro", "Renovacion -> control de acceso"],
  },
  otro: {
    nombre: "Comercio",
    foco: ["Ventas por periodo", "Ticket promedio", "Margen bruto", "Rotacion de inventario"],
    alertas: ["Stock bajo", "Caja sin cierre", "Margen bajo objetivo"],
    quickActions: [
      { label: "Emitir factura", href: "/dashboard/ventas" },
      { label: "Cargar compra", href: "/dashboard/compras" },
      { label: "Ajustar stock", href: "/dashboard/productos/movimientos" },
    ],
    sidebarPrioridad: ["ventas", "stock", "caja", "compras"],
    maestrosCriticos: [
      { tabla: "formas-pago", label: "Formas de pago", descripcion: "Efectivo, QR, tarjetas." },
      { tabla: "condiciones-pago", label: "Condiciones de pago", descripcion: "Contado y cuenta corriente." },
      { tabla: "rubros", label: "Rubros", descripcion: "Segmenta productos y clientes." },
      { tabla: "depositos", label: "Depositos", descripcion: "Stock por local." },
    ],
    flujosCriticos: ["Venta -> factura -> caja", "Compra -> ingreso -> stock"],
  },
}

export function normalizeRubroValue(raw?: string | null): Rubro {
  const normalized = String(raw ?? "").trim().toLowerCase()
  if (!normalized) return "otro"
  if (normalized in RUBRO_UX) return normalized as Rubro
  return RUBRO_ALIASES[normalized] ?? "otro"
}

export function getRubroUx(raw: string | null | undefined): RubroUxConfig {
  const rubro = normalizeRubroValue(raw)
  return RUBRO_UX[rubro] ?? RUBRO_UX.otro
}

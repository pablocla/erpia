import type { ElementType } from "react"
import type { Rubro } from "@/lib/onboarding/onboarding-ia"
import {
  LayoutDashboard,
  Compass,
  ShoppingCart,
  Receipt,
  Package,
  Wallet,
  FileText,
  BookOpen,
  Settings,
  Users,
  Scissors,
  ChevronDown,
  ChevronRight,
  Building2,
  BarChart3,
  Truck,
  ClipboardList,
  CreditCard,
  Landmark,
  FileMinus,
  FilePlus,
  Tags,
  RefreshCw,
  Shield,
  Database,
  Clock,
  Menu,
  X,
  Bug,
  UtensilsCrossed,
  Monitor,
  CalendarDays,
  HeartPulse,
  Sparkles,
  Dumbbell,
  Route,
  Factory,
  Layers,
  ScanLine,
  ListChecks,
  Cpu,
  Activity,
  TriangleAlert,
  Store,
  Hash,
  Warehouse,
  Wrench,
  ListOrdered,
  TrendingUp,
  FolderTree,
  TrendingDown,
  DollarSign,
  FileCheck,
  PawPrint,
  Stethoscope,
  ShoppingBag,
  Globe,
  Tablet,
  CheckSquare,
  ListTodo,
  MapPin,
  Banknote,
  Bot,
  Network,
  GraduationCap,
  Target,
  Workflow,
  Rocket,
  Calculator,
  Wallet2,
  ClipboardCheck,
  Bell,
  Repeat,
  UserCircle,
  FileSpreadsheet,
  Server,
  Link2,
  LayoutGrid,
  Cloud,
  Scale,
  Bike,
  Tv,
  Leaf,
  FlaskConical,
  Sprout,
  Beaker,
} from "lucide-react"

export interface DashboardMenuItem {
  href?: string
  icon: ElementType
  label: string
  translationKey?: any // for next-intl
  badge?: string
  children?: DashboardMenuItem[]
  featureKey?: string
  permisoModulo?: string
  allowedRoles?: string[]
  excludedRoles?: string[]
  allowedUsers?: string[]
  allowedRubros?: Rubro[]
  claverAnalystOnly?: boolean
  /** SKU horizontal — oculta si el producto no está activo */
  skuKey?: string
  requiredCountryFeature?: string
  /** Profundidad go-live (inyectado en shell) */
  goLiveTier?: "prd" | "piloto" | "demo" | "no_vender"
}

export interface DashboardModuloSection {
  label: string
  translationKey?: any
  color: string
  moduloKey?: string
  requiredCountryFeature?: string
  items: DashboardMenuItem[]
}

export const DASHBOARD_SIDEBAR_MODULOS: DashboardModuloSection[] = [
  {
    label: "Principal",
    translationKey: "sections.principal",
    color: "text-slate-500",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", translationKey: "items.dashboard" },
      { href: "/dashboard/mis-tareas", icon: CheckSquare, label: "Mis Tareas", translationKey: "items.myTasks" },
      { href: "/dashboard/empleados-digitales", icon: Bot, label: "Empleados digitales" },
      { href: "/dashboard/lab", icon: Compass, label: "Claver Lab (CEO)", permisoModulo: "configuracion" },
      {
        href: "/dashboard/engineering/backlog",
        icon: ListTodo,
        label: "Backlog ingeniería",
        permisoModulo: "configuracion",
      },
    ],
  },
  {
    label: "Claver Platform",
    color: "text-slate-400",
    items: [
      { href: "/dashboard/apps", icon: Store, label: "App Store" },
      { href: "/dashboard/nicho", icon: Sparkles, label: "Apps de nicho LATAM" },
      { href: "/dashboard/partner-portal", icon: Users, label: "Portal Partner", claverAnalystOnly: true },
      { href: "/dashboard/contador", icon: Calculator, label: "Pack Contador", skuKey: "core.claver" },
      { href: "/dashboard/cobranza-aas", icon: Wallet, label: "Cobranza as a Service", skuKey: "intang.cobranzas_wa" },
      { href: "/dashboard/hardware-setup", icon: Package, label: "Hardware POS" },
    ],
  },
  {
    label: "Claver Nicho",
    color: "text-violet-500",
    items: [
      // Ítems de apps de nicho activas se inyectan en use-dashboard-shell
    ],
  },
  {
    label: "Clavergrow",
    color: "text-emerald-600",
    moduloKey: "agro",
    items: [
      { href: "/dashboard/agro", icon: Layers, label: "Dashboard Clavergrow", allowedRubros: ["agro_acopio", "agro_cannabis"] },
      { href: "/dashboard/agro/balanza", icon: Truck, label: "Balanza Camiones", featureKey: "agro_balanza_digital", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/contratos", icon: FileText, label: "Contratos Cereales", featureKey: "agro_pizarra_precios", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/liquidaciones", icon: DollarSign, label: "Liquidaciones", featureKey: "retenciones", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/pizarra", icon: BarChart3, label: "Pizarra BCR/Chicago", featureKey: "agro_pizarra_precios", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/lotes", icon: MapPin, label: "Lotes y Mapas", featureKey: "agro_ndvi_mapas", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/iot", icon: Cpu, label: "Agro IoT Center", featureKey: "iot_sensores", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/iot/sensores", icon: Activity, label: "Sensores", featureKey: "iot_sensores", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/iot/riego", icon: TriangleAlert, label: "Riego Inteligente", featureKey: "iot_sensores", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/iot/maquinaria", icon: Wrench, label: "Maquinaria", featureKey: "iot_sensores", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/carta-porte", icon: ClipboardList, label: "Carta de Porte (CPE)", featureKey: "agro_carta_porte", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/productor", icon: Users, label: "Portal Productor", featureKey: "agro_portal_productor", allowedRubros: ["agro_acopio"] },
      { href: "/dashboard/agro/cannabis", icon: Leaf, label: "Cultivo regulado", featureKey: "agro_cannabis", allowedRubros: ["agro_acopio", "agro_cannabis"] },
      { href: "/dashboard/agro/cannabis/ciclos", icon: Sprout, label: "Ciclos de cultivo", featureKey: "agro_cannabis", allowedRubros: ["agro_acopio", "agro_cannabis"] },
      { href: "/dashboard/agro/cannabis/insumos", icon: FlaskConical, label: "Insumos cultivo", featureKey: "agro_cannabis", allowedRubros: ["agro_acopio", "agro_cannabis"] },
      { href: "/dashboard/agro/cannabis/aplicaciones", icon: Beaker, label: "Aplicaciones", featureKey: "agro_cannabis", allowedRubros: ["agro_acopio", "agro_cannabis"] },
      { href: "/dashboard/agro/cannabis/suelo", icon: Layers, label: "Suelo / sustrato", featureKey: "agro_cannabis", allowedRubros: ["agro_acopio", "agro_cannabis"] },
    ],
  },
  {
    label: "Compras",
    color: "text-orange-500",
    moduloKey: "compras",
    items: [
      { href: "/dashboard/compras", icon: ShoppingCart, label: "Facturas de Compra", permisoModulo: "compras" },
      { href: "/dashboard/proveedores", icon: Building2, label: "Proveedores", permisoModulo: "proveedores" },
      { href: "/dashboard/remitos", icon: Truck, label: "Remitos Entrada", permisoModulo: "remitos" },
    ],
  },
  {
    label: "Ventas",
    color: "text-green-500",
    moduloKey: "ventas",
    items: [
      { href: "/dashboard/pos", icon: Store, label: "Punto de Venta (POS)", permisoModulo: "pos", featureKey: "pos" },
      {
        href: "/dashboard/almacen",
        icon: Warehouse,
        label: "Almacén Rosario",
        permisoModulo: "pos",
        allowedRubros: ["ferreteria", "distribuidora", "supermercado", "kiosco"],
      },
      {
        href: "/dashboard/almacen/guia",
        icon: BookOpen,
        label: "Guía Almacén",
        permisoModulo: "pos",
        allowedRubros: ["ferreteria", "distribuidora", "supermercado", "kiosco"],
      },
      { href: "/dashboard/pos/cierre", icon: BarChart3, label: "Cierre X / Z", permisoModulo: "pos" },
      { href: "/dashboard/ventas", icon: Receipt, label: "Facturación", permisoModulo: "ventas" },
      { href: "/dashboard/ventas/pedidos", icon: ClipboardList, label: "Pedidos de Venta", permisoModulo: "pedidos_venta" },
      { href: "/dashboard/ventas/presupuestos", icon: FileCheck, label: "Presupuestos", permisoModulo: "presupuestos" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes", permisoModulo: "clientes" },
      { href: "/dashboard/clientes/retencion", icon: Target, label: "Retención y LTV", permisoModulo: "clientes" },
      { href: "/dashboard/fiado", icon: BookOpen, label: "Libreta Fiado", permisoModulo: "clientes", skuKey: "pos.fiado_barrio" },
      { href: "/dashboard/listas-precio", icon: ListOrdered, label: "Listas de Precio", permisoModulo: "productos" },
      { href: "/dashboard/productos/reexpresar", icon: TrendingUp, label: "Reexpresar Precios", permisoModulo: "productos" },
      { href: "/dashboard/notas-credito", icon: FileMinus, label: "Notas Crédito/Débito", permisoModulo: "notas_credito" },
      { href: "/dashboard/facturacion-recurrente", icon: Repeat, label: "Facturación Recurrente", permisoModulo: "ventas" },
    ],
  },
  {
    label: "Stock",
    color: "text-blue-500",
    moduloKey: "stock",
    items: [
      { href: "/dashboard/productos", icon: Package, label: "Productos", permisoModulo: "productos" },
      { href: "/dashboard/productos/inventario", icon: Warehouse, label: "Inventario", permisoModulo: "stock" },
      { href: "/dashboard/productos/transferencias", icon: Truck, label: "Transferencias Stock", permisoModulo: "stock" },
      { href: "/dashboard/productos/ajustes", icon: Wrench, label: "Ajustes de Stock", permisoModulo: "stock" },
      { href: "/dashboard/productos/movimientos", icon: RefreshCw, label: "Movimientos Stock", permisoModulo: "stock" },
    ],
  },
  {
    label: "Financiero",
    color: "text-violet-500",
    moduloKey: "caja",
    items: [
      { href: "/dashboard/caja", icon: Wallet, label: "Caja", permisoModulo: "caja" },
      { href: "/dashboard/banco", icon: Landmark, label: "Banco", permisoModulo: "cuentas_cobrar" },
      { href: "/dashboard/cuenta-partida", icon: Scale, label: "Cuenta Partida (Socios)", permisoModulo: "caja" },
      { href: "/dashboard/cuentas-cobrar", icon: FilePlus, label: "Cuentas a Cobrar", permisoModulo: "cuentas_cobrar" },
      { href: "/dashboard/cuentas-pagar", icon: FileMinus, label: "Cuentas a Pagar", permisoModulo: "cuentas_pagar" },
      { href: "/dashboard/cheques", icon: Banknote, label: "Cheques", permisoModulo: "cheques" },
      { href: "/dashboard/cashflow", icon: Wallet2, label: "Flujo de Fondos", permisoModulo: "caja" },
      { href: "/dashboard/presupuesto", icon: Calculator, label: "Control Presupuestario", permisoModulo: "caja" },
      { href: "/dashboard/mercadopago", icon: CreditCard, label: "MercadoPago", permisoModulo: "caja" },
    ],
  },
  {
    label: "Contabilidad",
    color: "text-cyan-500",
    moduloKey: "contabilidad",
    items: [
      { href: "/dashboard/contabilidad", icon: BookOpen, label: "Asientos Contables" },
      { href: "/dashboard/contabilidad/plan-cuentas", icon: ClipboardList, label: "Plan de Cuentas" },
      { href: "/dashboard/contabilidad/balance", icon: BarChart3, label: "Balances" },
      { href: "/dashboard/contabilidad/periodos", icon: Clock, label: "Períodos Fiscales" },
      { href: "/dashboard/contabilidad/activos-fijos", icon: TrendingDown, label: "Activos Fijos" },
      { href: "/dashboard/contabilidad/centros-costo", icon: FolderTree, label: "Centros de Costo" },
      { href: "/dashboard/contabilidad/inflacion", icon: TrendingDown, label: "Ajuste por Inflación" },
    ],
  },
  {
    label: "Fiscal / Impuestos",
    color: "text-red-500",
    items: [
      { href: "/dashboard/impuestos",              icon: FileText,      label: "IVA / Libros Fiscales" },
      { href: "/dashboard/impuestos/iibb",          icon: FileText,      label: "Ingresos Brutos", requiredCountryFeature: "showIibb" },
      { href: "/dashboard/impuestos/padron",         icon: Database,      label: "Padrón IIBB", requiredCountryFeature: "showPadron" },
      { href: "/dashboard/impuestos/tes",           icon: Tags,          label: "TES (Tipos de Impuesto)" },
      { href: "/dashboard/impuestos/presentacion",  icon: Receipt,       label: "Presentación AFIP", requiredCountryFeature: "showAfip" },
      { href: "/dashboard/puntos-venta",            icon: Store,         label: "Puntos de Venta" },
      { href: "/dashboard/series",                  icon: Hash,          label: "Series de Comprobantes" },
      { href: "/dashboard/impuestos/citi",        icon: FileSpreadsheet, label: "CITI Ventas/Compras", requiredCountryFeature: "showAfip" },
    ],
  },
  {
    label: "Servicios / Rubro",
    color: "text-pink-500",
    moduloKey: "hospitalidad",
    items: [
      { href: "/dashboard/toma-pedidos", icon: ShoppingCart, label: "Toma de Pedidos", permisoModulo: "hospitalidad" },
      { href: "/dashboard/hospitalidad/kds", icon: Monitor, label: "Pantalla Cocina (KDS)", permisoModulo: "kds", featureKey: "kds" },
      { href: "/dashboard/hospitalidad", icon: UtensilsCrossed, label: "Mesas y Comandas", permisoModulo: "hospitalidad" },
      { href: "/dashboard/hospitalidad/delivery", icon: Bike, label: "Delivery Propio", featureKey: "delivery_propio", allowedRubros: ["bar_restaurant"] },
      { href: "/dashboard/hospitalidad/cartelera", icon: Tv, label: "Cartelera Digital", featureKey: "cartelera_digital", allowedRubros: ["bar_restaurant", "kiosco"] },
      { href: "/dashboard/hospitalidad/platos", icon: ClipboardList, label: "Platos y Recetas", featureKey: "recetas_bom", allowedRubros: ["bar_restaurant"] },
      { href: "/dashboard/agenda", icon: CalendarDays, label: "Agenda de Turnos", permisoModulo: "agenda", featureKey: "turnos_agenda", allowedRubros: ["veterinaria", "clinica", "salon_belleza", "gimnasio", "canchas"] },
      { href: "/dashboard/peluqueria", icon: Scissors, label: "Peluquería móvil", permisoModulo: "agenda", featureKey: "turnos_agenda", allowedRubros: ["salon_belleza"] },
      { href: "/dashboard/historia-clinica", icon: HeartPulse, label: "Historia Clínica", permisoModulo: "historia_clinica", featureKey: "historia_clinica", allowedRubros: ["veterinaria", "clinica"] },
      { href: "/dashboard/membresias", icon: Dumbbell, label: "Membresías", permisoModulo: "membresias", featureKey: "membresias", allowedRubros: ["gimnasio"] },
      { href: "/dashboard/veterinaria", icon: PawPrint, label: "Veterinaria / Mascotas", permisoModulo: "veterinaria", featureKey: "veterinaria", allowedRubros: ["veterinaria"] },
    ],
  },
  {
    label: "Canales Externos",
    color: "text-teal-500",
    moduloKey: "logistica",
    items: [
      { href: "/portal", icon: Globe, label: "Portal B2B (Clientes)", featureKey: "portal_b2b" },
      { href: "/vendedor", icon: ShoppingBag, label: "App Vendedor en Ruta", featureKey: "hojas_ruta" },
    ],
  },
  {
    label: "Onboarding",
    color: "text-amber-500",
    moduloKey: "onboarding",
    items: [
      { href: "/dashboard/onboarding", icon: Sparkles, label: "Onboarding IA", featureKey: "onboarding" },
    ],
  },
  {
    label: "Inteligencia Artificial",
    color: "text-purple-500",
    moduloKey: "ia",
    items: [
      { href: "/dashboard/ia", icon: Bot, label: "Asistente IA", featureKey: "ia" },
      { href: "/dashboard/apps/opo", icon: Network, label: "OPO Studio", skuKey: "bridge.opo_studio" },
    ],
  },
  {
    label: "Logística",
    color: "text-emerald-500",
    moduloKey: "logistica",
    items: [
      { href: "/dashboard/logistica", icon: Truck, label: "Envíos" },
      { href: "/dashboard/logistica", icon: Route, label: "Transportistas" },
      { href: "/dashboard/distribucion", icon: Route, label: "Distribución" },
      { href: "/dashboard/distribucion/pod", icon: CheckSquare, label: "POD / Comprobante entrega" },
    ],
  },
  {
    label: "Industria",
    color: "text-orange-600",
    moduloKey: "industria",
    items: [
      { href: "/dashboard/industria", icon: Factory, label: "Órdenes de Producción" },
      { href: "/dashboard/industria", icon: Layers, label: "Lista de Materiales (BOM)" },
      { href: "/dashboard/industria/corte", icon: Scissors, label: "Órdenes de Corte", allowedRubros: ["textil_fabrica"] },
      { href: "/dashboard/industria/talleres", icon: Building2, label: "Talleres Externos", allowedRubros: ["textil_fabrica"] },
      { href: "/dashboard/mrp", icon: Factory, label: "MRP (Planificación)" },
      { href: "/dashboard/calidad", icon: ClipboardCheck, label: "Control de Calidad" },
      { href: "/dashboard/mantenimiento", icon: Wrench, label: "Mantenimiento Preventivo" },
    ],
  },
  {
    label: "Préstamos",
    color: "text-green-600",
    moduloKey: "prestamos",
    items: [
      { href: "/dashboard/prestamos", icon: Wallet, label: "Panel de Préstamos", allowedRubros: ["prestamista"] },
      { href: "/dashboard/prestamos/pagares", icon: FileText, label: "Pagarés", allowedRubros: ["prestamista"] },
      { href: "/dashboard/prestamos/cobranza", icon: MapPin, label: "Ruteo de Cobranza", allowedRubros: ["prestamista"] },
    ],
  },
  {
    label: "Concesionaria",
    color: "text-blue-600",
    moduloKey: "concesionaria",
    items: [
      { href: "/dashboard/concesionaria", icon: Store, label: "Stock Vehículos", allowedRubros: ["concesionaria"] },
      { href: "/dashboard/concesionaria/crm", icon: Target, label: "CRM Leads", allowedRubros: ["concesionaria"] },
      { href: "/dashboard/concesionaria/revendedores", icon: Users, label: "Red Revendedores", allowedRubros: ["concesionaria"] },
    ],
  },
  {
    label: "Importación",
    color: "text-purple-600",
    moduloKey: "importacion",
    items: [
      { href: "/dashboard/importacion", icon: Calculator, label: "Calculadora ROI CIF", allowedRubros: ["importador"] },
      { href: "/dashboard/importacion/embarques", icon: Globe, label: "Tracking Embarques", allowedRubros: ["importador"] },
    ],
  },
  {
    label: "Reventas TikTok",
    color: "text-pink-600",
    moduloKey: "reventas",
    items: [
      { href: "/dashboard/reventas", icon: TrendingDown, label: "Margen Flash", allowedRubros: ["reventa_tendencias"] },
      { href: "/dashboard/reventas/links", icon: Link2, label: "Links de Pago Rápido", allowedRubros: ["reventa_tendencias"] },
      { href: "/dashboard/reventas/stock", icon: Package, label: "Stock Viral", allowedRubros: ["reventa_tendencias"] },
    ],
  },
  {
    label: "Picking",
    color: "text-violet-500",
    moduloKey: "picking",
    items: [
      { href: "/dashboard/picking", icon: ScanLine, label: "Listas de Picking" },
      { href: "/dashboard/picking", icon: ListChecks, label: "Control de Armado" },
      { href: "/dashboard/picking/tablet", icon: Tablet, label: "Modo Tablet (depósito)" },
    ],
  },
  {
    label: "IoT",
    color: "text-sky-500",
    moduloKey: "iot",
    items: [
      { href: "/dashboard/iot", icon: Cpu, label: "Dispositivos IoT" },
      { href: "/dashboard/iot", icon: Activity, label: "Telemetría & Lecturas" },
      { href: "/dashboard/iot", icon: TriangleAlert, label: "Alertas IoT" },
    ],
  },
  {
    label: "Gestión Comercial",
    color: "text-rose-500",
    items: [
      { href: "/dashboard/crm", icon: Target, label: "CRM / Pipeline" },
      { href: "/dashboard/aprobaciones", icon: Shield, label: "Aprobaciones" },
      { href: "/dashboard/kpis", icon: Activity, label: "Tablero KPIs" },
      { href: "/dashboard/reportes", icon: FileSpreadsheet, label: "Clav Sheets", featureKey: "clav_sheets" },
      { href: "/dashboard/reportes/plantillas", icon: LayoutGrid, label: "Plantillas Sheets", featureKey: "clav_sheets" },
      { href: "/dashboard/alertas", icon: Bell, label: "Alertas Configurables" },
    ],
  },
  {
    label: "RRHH",
    color: "text-lime-500",
    items: [
      { href: "/dashboard/empleados", icon: UserCircle, label: "Empleados / Legajos", permisoModulo: "rrhh" },
      { href: "/dashboard/rrhh/sueldos", icon: Calculator, label: "Liquidación de Sueldos", permisoModulo: "rrhh" },
    ],
  },
  {
    label: "Claver Docs",
    color: "text-indigo-500",
    items: [
      { href: "/dashboard/documentacion", icon: BookOpen, label: "Claver Docs · Room", badge: "Wiki" },
      { href: "/dashboard/documentacion/room/como-funciona-todo", icon: Workflow, label: "Cómo funciona todo" },
      { href: "/dashboard/documentacion/room/requisitos-funcionamiento", icon: Rocket, label: "Requisitos de marcha" },
      { href: "/dashboard/documentacion/room/mapa-grupo", icon: Layers, label: "Mapa del Grupo" },
      { href: "/dashboard/capacitacion", icon: GraduationCap, label: "Centro de Capacitación" },
      { href: "/dashboard/capacitacion/parametrizacion", icon: Settings, label: "Parametrización" },
      { href: "/dashboard/capacitacion/manual-usuario", icon: BookOpen, label: "Manual de Usuario" },
      { href: "/dashboard/capacitacion/diagnostico", icon: Target, label: "Diagnóstico Gaps" },
    ],
  },
  {
    label: "Claver Interno",
    color: "text-violet-500",
    items: [
      { href: "/claver-cloud", icon: Cloud, label: "Claver Cloud", badge: "Torre", claverAnalystOnly: true },
      { href: "/dashboard/claver/operaciones", icon: Server, label: "Flota de clientes", claverAnalystOnly: true },
      { href: "/dashboard/claver/implementaciones", icon: ClipboardList, label: "Implementaciones", claverAnalystOnly: true },
      { href: "/dashboard/claver/asignaciones", icon: Users, label: "Asignaciones", claverAnalystOnly: true },
      { href: "/dashboard/claver/reportes", icon: FileSpreadsheet, label: "Reportes", claverAnalystOnly: true },
    ],
  },
  {
    label: "Configuración",
    color: "text-slate-400",
    items: [
      { href: "/dashboard/configuracion", icon: Settings, label: "Parámetros", permisoModulo: "configuracion" },
      { href: "/dashboard/configuracion/apariencia", icon: Sparkles, label: "Apariencia", permisoModulo: "configuracion" },
      { href: "/dashboard/automatizacion", icon: Bot, label: "Automatización NOP", permisoModulo: "configuracion", featureKey: "automation_n8n" },
      { href: "/dashboard/empleados-digitales", icon: Bot, label: "Empleados digitales", permisoModulo: "configuracion" },
      { href: "/dashboard/cotizaciones", icon: DollarSign, label: "Cotizaciones", permisoModulo: "configuracion" },
      { href: "/dashboard/soporte", icon: Bug, label: "Soporte / Tickets", permisoModulo: "configuracion" },
      { href: "/dashboard/usuarios", icon: Shield, label: "Usuarios y Permisos", permisoModulo: "usuarios" },
      { href: "/dashboard/configuracion/tablas", icon: Database, label: "Tablas del Sistema", permisoModulo: "configuracion" },
      { href: "/dashboard/configuracion/auditoria", icon: Clock, label: "Auditoría / Logs", permisoModulo: "auditoria" },
    ],
  },
]

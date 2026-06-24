export interface SolutionPage {
  slug: string
  icon: "Store" | "Globe" | "Truck" | "UtensilsCrossed" | "Factory" | "Layers" | "Calculator" | "CreditCard" | "Palette"
  emoji: string
  headline: string
  subheadline: string
  heroGradient: string
  accentColor: string
  icp: string
  pains: string[]
  solutions: { title: string; desc: string }[]
  modules: string[]
  metrics: { value: string; label: string }[]
  cta: string
  demoLink?: string
  planFrom: number
  faq: { q: string; a: string }[]
}

export const SOLUTION_SLUGS = [
  "pos-afip",
  "ecommerce",
  "distribuidoras",
  "restaurantes",
  "industria",
  "agro",
  "contadores",
  "precios",
  "marca",
] as const

export type SolutionSlug = (typeof SOLUTION_SLUGS)[number]

export const SOLUTIONS: Record<string, SolutionPage> = {
  "pos-afip": {
    slug: "pos-afip",
    icon: "Store",
    emoji: "🧾",
    headline: "POS y factura AFIP en el mismo turno",
    subheadline:
      "Cobrá en mostrador, emití comprobantes electrónicos con CAE y cerrá caja sin planillas. Pensado para comercios argentinos.",
    heroGradient: "from-blue-600 to-indigo-800",
    accentColor: "text-blue-600",
    icp: "Comercios minoristas, kioscos, ferreterías, farmacias — 1 a 5 puntos de venta.",
    pains: [
      "Facturás en un sistema y vendés en otro",
      "Certificado AFIP vencido y nadie avisa",
      "Cierre de caja que no cierra con la realidad",
      "Precios distintos entre mostrador y lista",
    ],
    solutions: [
      { title: "POS táctil", desc: "Atajos, modo foco, ventas suspendidas y semáforos de estado." },
      { title: "AFIP nativo", desc: "CAE, CAEA contingencia, MiPyME FCE y puntos de venta." },
      { title: "Motor de precios", desc: "Listas, promociones y precio por cliente automático." },
      { title: "Caja integrada", desc: "Arqueo, medios de pago y cierre X/Z en el flujo." },
    ],
    modules: ["POS", "Facturación", "Caja", "Clientes", "Stock", "IVA"],
    metrics: [
      { value: "< 30s", label: "Primera factura con CAE" },
      { value: "21%", label: "IVA calculado automático" },
      { value: "1", label: "Stock para POS y reportes" },
    ],
    cta: "Probar POS demo",
    demoLink: "/login",
    planFrom: 29900,
    faq: [
      { q: "¿Homologación y producción?", a: "Sí. Configurás certificado y entorno desde el panel." },
      { q: "¿Funciona sin internet?", a: "CAEA permite emitir en contingencia offline según normativa." },
    ],
  },
  ecommerce: {
    slug: "ecommerce",
    icon: "Globe",
    emoji: "🛒",
    headline: "Tienda online con el mismo stock que el local",
    subheadline:
      "B2C público, portal B2B con CUIT, Mercado Libre y Mercado Pago. Un pedido online dispara el picking y prepara el comprobante para facturar.",
    heroGradient: "from-teal-600 to-cyan-800",
    accentColor: "text-teal-600",
    icp: "Distribuidoras, mayoristas, retailers que venden por web, Instagram o ML.",
    pains: [
      "Pedidos por WhatsApp sin trazabilidad",
      "Stock del local no coincide con la web",
      "Mercado Libre desconectado del depósito",
      "Mayoristas piden lista de precios actualizada",
    ],
    solutions: [
      { title: "Tienda B2C", desc: "Catálogo, carrito y checkout en /tienda con stock real." },
      { title: "Portal B2B", desc: "Login por CUIT, precios del cliente y cuenta corriente." },
      { title: "Checkout → ERP", desc: "Pedido reserva stock y entra a picking automático." },
      { title: "Canales add-on", desc: "ML, MP y WhatsApp como módulos opcionales." },
    ],
    modules: ["Ecommerce", "Portal B2B", "Picking", "Logística", "MercadoPago", "MercadoLibre"],
    metrics: [
      { value: "0", label: "Doble carga de pedidos" },
      { value: "24/7", label: "Catálogo con stock vivo" },
      { value: "3", label: "Canales unificados" },
    ],
    cta: "Ver tienda demo",
    demoLink: "/tienda?empresaId=1",
    planFrom: 24900,
    faq: [
      { q: "¿Necesito Shopify?", a: "No. La tienda es nativa del ERP." },
      { q: "¿Portal y tienda a la vez?", a: "Sí, podés operar B2C y B2B en paralelo." },
    ],
  },
  distribuidoras: {
    slug: "distribuidoras",
    icon: "Truck",
    emoji: "🚚",
    headline: "Distribución con rutas, picking y cobranza en calle",
    subheadline:
      "Preventa, hojas de ruta, POD y app del vendedor. Del pedido a la entrega con evidencia.",
    heroGradient: "from-emerald-600 to-green-900",
    accentColor: "text-emerald-600",
    icp: "Distribuidoras de alimentos, bebidas, ferretería, repuestos — flota y depósito.",
    pains: [
      "El vendedor anota en papel y en oficina reescriben",
      "No sabés qué entregas fallaron ni por qué",
      "Remitos y facturas desfasados del reparto",
      "Morosos sin alerta antes de despachar",
    ],
    solutions: [
      { title: "App vendedor en ruta", desc: "Pedidos, cobros y consulta de stock móvil." },
      { title: "Hoja de ruta", desc: "Paradas ordenadas, ventanas horarias y chofer asignado." },
      { title: "POD", desc: "Firma, foto y geo en cada entrega." },
      { title: "Picking + remito", desc: "Depósito arma antes de salir la unidad." },
    ],
    modules: ["Distribución", "Picking", "Remitos", "CC", "App Ruta", "Logística"],
    metrics: [
      { value: "OTIF", label: "KPI entregas a tiempo" },
      { value: "100%", label: "Trazabilidad pedido" },
      { value: "-40%", label: "Errores de reparto*" },
    ],
    cta: "Agendar demo logística",
    planFrom: 59900,
    faq: [
      { q: "¿Funciona offline el vendedor?", a: "La app ruta soporta operación offline con sync." },
      { q: "¿COT y remitos?", a: "Circuito remito → envío documentado en el módulo logística." },
    ],
  },
  restaurantes: {
    slug: "restaurantes",
    icon: "UtensilsCrossed",
    emoji: "🍕",
    headline: "Mesas, cocina y caja en tiempo real",
    subheadline:
      "Comandas, KDS, recetas con costo y facturación al cerrar mesa. Para bares y restaurants exigentes.",
    heroGradient: "from-orange-600 to-red-900",
    accentColor: "text-orange-600",
    icp: "Bares, restaurants, cafeterías, dark kitchens — sala y cocina.",
    pains: [
      "Comandas perdidas entre sala y cocina",
      "No sabés el food cost real por plato",
      "Cierre de turno caótico",
      "Mesas abiertas sin control",
    ],
    solutions: [
      { title: "Mesas y comandas", desc: "Estado por mesa, división de cuenta y propinas." },
      { title: "KDS cocina", desc: "Pantalla de preparación con prioridad y tiempos." },
      { title: "Recetas BOM", desc: "Costo por plato y descuento de insumos." },
      { title: "POS + AFIP", desc: "Factura al cerrar con IVA correcto." },
    ],
    modules: ["Hospitalidad", "KDS", "POS", "Recetas", "Stock", "Agenda"],
    metrics: [
      { value: "5s", label: "Polling cocina" },
      { value: "1", label: "Carta = stock" },
      { value: "24/7", label: "Turnos múltiples" },
    ],
    cta: "Demo bar/restaurant",
    demoLink: "/login",
    planFrom: 49900,
    faq: [
      { q: "¿Modificadores y notas?", a: "Sí, en comanda y cocina." },
      { q: "¿Delivery?", a: "Pedidos con canal ecommerce o mostrador." },
    ],
  },
  industria: {
    slug: "industria",
    icon: "Factory",
    emoji: "🏭",
    headline: "Producción, MRP y calidad sin Excel",
    subheadline:
      "Órdenes de producción, lista de materiales, planificación y control de calidad en un flujo.",
    heroGradient: "from-slate-700 to-orange-900",
    accentColor: "text-orange-700",
    icp: "Fabricantes livianos, alimentos procesados, talleres con BOM.",
    pains: [
      "BOM en planilla y stock desactualizado",
      "No sabés costo real de producción",
      "Órdenes sin trazabilidad de lotes",
      "Calidad en papel",
    ],
    solutions: [
      { title: "BOM multi-nivel", desc: "Componentes, mermas y unidades." },
      { title: "MRP", desc: "Qué comprar y cuándo según demanda." },
      { title: "Órdenes de producción", desc: "Estados, consumos y cierre a stock." },
      { title: "Calidad", desc: "Inspecciones con criterios y fotos." },
    ],
    modules: ["Industria", "MRP", "Compras", "Stock", "Calidad", "Mantenimiento"],
    metrics: [
      { value: "BOM", label: "Costo roll-up automático" },
      { value: "MRP", label: "Sugerencias de compra" },
      { value: "ISO-ready", label: "Trazas de calidad" },
    ],
    cta: "Hablar con industria",
    planFrom: 89900,
    faq: [
      { q: "¿Lotes y vencimientos?", a: "Sí, en stock y producción." },
      { q: "¿Contabilidad de costos?", a: "Centros de costo y asientos vinculados." },
    ],
  },
  agro: {
    slug: "agro",
    icon: "Layers",
    emoji: "🌾",
    headline: "Acopio, balanza y liquidaciones conectadas",
    subheadline:
      "Camiones, contratos, pizarra, carta de porte e IoT de campo. Del silo a la liquidación.",
    heroGradient: "from-lime-700 to-emerald-900",
    accentColor: "text-lime-700",
    icp: "Acopios, corredores, productores medianos — cereales y oleaginosas.",
    pains: [
      "Balanza desconectada del sistema",
      "Liquidaciones manuales con retenciones",
      "Contratos y entregas en carpetas",
      "Sin visibilidad de lotes y humedad",
    ],
    solutions: [
      { title: "Balanza digital", desc: "Pesadas vinculadas a contratos y remitos." },
      { title: "Liquidaciones", desc: "Retenciones y certificados integrados." },
      { title: "Carta de porte", desc: "CPE y logística de granos." },
      { title: "Agro IoT", desc: "Sensores, riego y maquinaria." },
    ],
    modules: ["Agro", "Balanza", "Contratos", "IoT", "Portal productor", "Liquidaciones"],
    metrics: [
      { value: "CPE", label: "Carta de porte" },
      { value: "IoT", label: "Telemetría campo" },
      { value: "BCR", label: "Pizarra integrada" },
    ],
    cta: "Demo acopio",
    planFrom: 89900,
    faq: [
      { q: "¿Portal del productor?", a: "Sí, entregas y liquidaciones consultables." },
      { q: "¿Mapas y lotes?", a: "Módulo lotes con NDVI en roadmap." },
    ],
  },
  contadores: {
    slug: "contadores",
    icon: "Calculator",
    emoji: "📊",
    headline: "Programa de partners para estudios contables",
    subheadline:
      "Referí clientes, ellos operan con AFIP ordenado y vos tenés libros IVA y CITI listos.",
    heroGradient: "from-indigo-700 to-violet-900",
    accentColor: "text-indigo-600",
    icp: "Contadores, estudios impositivos, consultores PyME.",
    pains: [
      "Clientes con facturación desordenada",
      "Libros IVA armados a mano",
      "Múltiples sistemas por cliente",
      "Sin ingreso recurrente por software",
    ],
    solutions: [
      { title: "Comisión 20%", desc: "Primer año por cliente referido." },
      { title: "Rol contador", desc: "Dashboard fiscal, no ruido operativo." },
      { title: "Export CITI / IVA", desc: "Presentaciones desde el ERP." },
      { title: "Multi-cliente", desc: "Cada empresa aislada multi-tenant." },
    ],
    modules: ["IVA", "IIBB", "CITI", "Contabilidad", "Auditoría", "Presentación AFIP"],
    metrics: [
      { value: "20%", label: "Comisión referido" },
      { value: "1", label: "Login por cliente" },
      { value: "CITI", label: "Export directo" },
    ],
    cta: "Ser partner contador",
    planFrom: 0,
    faq: [
      { q: "¿Capacitación para el estudio?", a: "Incluimos onboarding y manual por rol contador." },
      { q: "¿White-label?", a: "Disponible en plan Enterprise partner." },
    ],
  },
  precios: {
    slug: "precios",
    icon: "CreditCard",
    emoji: "💳",
    headline: "Planes claros en pesos argentinos",
    subheadline:
      "Trial 14 días. Sin permanencia. Add-ons solo si los necesitás.",
    heroGradient: "from-violet-700 to-fuchsia-900",
    accentColor: "text-violet-600",
    icp: "Toda PyME que evalúa el sistema.",
    pains: [
      "Precios en USD o letra chica",
      "Pagar por módulo suelto sin sentido",
      "No saber qué plan necesito",
    ],
    solutions: [
      { title: "Starter $29.900", desc: "POS, AFIP, stock, 3 usuarios." },
      { title: "Pro $49.900", desc: "+ ecommerce, onboarding IA, KPIs." },
      { title: "Enterprise $89.900", desc: "Multi-sucursal, agro, industria, SLA." },
      { title: "Add-ons", desc: "ML, MP, WhatsApp, Automation desde $7.900." },
    ],
    modules: ["Todos los planes incluyen soporte email", "Pro+ incluye onboarding asistido"],
    metrics: [
      { value: "14", label: "Días de trial" },
      { value: "ARS", label: "Facturación local" },
      { value: "0", label: "Permanencia mínima" },
    ],
    cta: "Empezar trial",
    demoLink: "/login",
    planFrom: 29900,
    faq: [
      { q: "¿Sube el precio?", a: "Ajuste trimestral IPC; aviso 30 días." },
      { q: "¿Implementación?", a: "Incluida en Pro; asistida en Enterprise." },
    ],
  },
  marca: {
    slug: "marca",
    icon: "Palette",
    emoji: "✦",
    headline: "Identidad Claver y ClavERP",
    subheadline:
      "Arquitectura de marca del conglomerado: matriz Claver, producto ClavERP y líneas futuras.",
    heroGradient: "from-slate-800 to-blue-900",
    accentColor: "text-blue-600",
    icp: "Equipo interno, partners y diseñadores.",
    pains: [
      "Producto sin paraguas corporativo claro",
      "Múltiples sistemas sin marca unificada",
      "Cliente no entiende el ecosistema",
    ],
    solutions: [
      { title: "Claver — matriz", desc: "Hub /claver with todas las líneas de negocio." },
      { title: "ClavERP — ERP", desc: "Producto flagship bajo /claver/claverp." },
      { title: "Logo dual", desc: "Isotipo C (grupo) + nodos (ERP)." },
      { title: "Roadmap conglomerado", desc: "ClavPay, ClavLog, ClavAI en expansión." },
    ],
    modules: ["Paleta WCAG AA", "Tipografía Fraunces + Manrope", "Kit partners"],
    metrics: [
      { value: "6", label: "Líneas Claver" },
      { value: "40+", label: "Módulos ClavERP" },
      { value: "1", label: "Hub matriz" },
    ],
    cta: "Ver catálogo ClavERP",
    demoLink: "/claver/claverp/modulos",
    planFrom: 0,
    faq: [
      { q: "¿Marca del cliente?", a: "White-label por empresa en configuración → apariencia." },
      { q: "¿ClavERP vs Claver?", a: "Claver vende; ClavERP es el ERP. Otros productos suman después." },
    ],
  },
}

export function getSolution(slug: string): SolutionPage | null {
  return SOLUTIONS[slug] ?? null
}

export const HUB_SOLUTIONS = Object.values(SOLUTIONS).filter((s) => s.slug !== "marca" && s.slug !== "precios")
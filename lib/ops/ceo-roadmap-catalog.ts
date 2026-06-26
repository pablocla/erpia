/** Catálogo client-safe — roadmap CEO monotributo → conglomerado */

export type CeoFaseId = "f0" | "f1" | "f2" | "f3" | "mkt"

export type CeoTaskCategoria = "setup" | "comercial" | "operaciones" | "legal" | "marketing"

export type CeoTaskPrioridad = "critica" | "alta" | "media" | "baja"

export type CeoTaskDef = {
  codigo: string
  fase: CeoFaseId
  titulo: string
  descripcion: string
  categoria: CeoTaskCategoria
  prioridad: CeoTaskPrioridad
  href?: string
  /** Código de tarea prerequisito */
  requiere?: string
  /** No mostrar como acción hasta tener N clientes pagos */
  requiereClientesPagos?: number
  diferida?: boolean
  estimadoMin?: number
}

export type CeoFaseDef = {
  id: CeoFaseId
  nombre: string
  objetivo: string
  duracion: string
  orden: number
}

export const CEO_FASES: CeoFaseDef[] = [
  {
    id: "f0",
    nombre: "Fase 0 — Setup",
    objetivo: "Podés cobrar y mostrar demo sin fricción",
    duracion: "2 semanas",
    orden: 0,
  },
  {
    id: "f1",
    nombre: "Fase 1 — Primer cliente",
    objetivo: "3 clientes pagando enganche (fiado o cobranzas WA)",
    duracion: "Mes 1–2",
    orden: 1,
  },
  {
    id: "f2",
    nombre: "Fase 2 — Bundle",
    objetivo: "Subir ticket con pool-almacen o POS+AFIP",
    duracion: "Mes 3–5",
    orden: 2,
  },
  {
    id: "f3",
    nombre: "Fase 3 — Escala",
    objetivo: "15+ clientes → evaluar SRL y equipo",
    duracion: "Mes 6–12",
    orden: 3,
  },
  {
    id: "mkt",
    nombre: "Marketing (diferido)",
    objetivo: "Redes y ads — solo después de venta repetible",
    duracion: "Post 3 clientes",
    orden: 4,
  },
]

export const CEO_METAS_F1 = {
  visitasMes: 80,
  visitasSemana: 20,
  visitasDia: 4,
  diagnosticos: 15,
  trials: 8,
  conversiones: 3,
} as const

export const CEO_TAREAS: CeoTaskDef[] = [
  // ── Fase 0 ──
  {
    codigo: "f0.1",
    fase: "f0",
    titulo: "Monotributo al día + factura habilitada",
    descripcion: "Validá categoría con contador. Sin esto no cobrás legal.",
    categoria: "legal",
    prioridad: "critica",
    estimadoMin: 120,
  },
  {
    codigo: "f0.2",
    fase: "f0",
    titulo: "Alias CBU / Mercado Pago para cobros",
    descripcion: "Link de pago listo para mandar por WhatsApp post-visita.",
    categoria: "setup",
    prioridad: "critica",
    requiere: "f0.1",
    estimadoMin: 30,
  },
  {
    codigo: "f0.3",
    fase: "f0",
    titulo: "Acceso Claver Cloud + provisioning de prueba",
    descripcion: "Creá un tenant test en /claver-cloud/provisioning/new.",
    categoria: "operaciones",
    prioridad: "critica",
    href: "/claver-cloud/provisioning/new",
    estimadoMin: 45,
  },
  {
    codigo: "f0.4",
    fase: "f0",
    titulo: "Demo en celular (fiado o cobranzas)",
    descripcion: "Entrá al demo y practicá mostrar UN módulo en 3 minutos.",
    categoria: "comercial",
    prioridad: "alta",
    href: "/dashboard/documentacion/comercial/roadmap-venta-vendedor",
    requiere: "f0.3",
    estimadoMin: 60,
  },
  {
    codigo: "f0.5",
    fase: "f0",
    titulo: "Plantilla WhatsApp post-visita + orden de servicio",
    descripcion: "PDF 1 página: SKU, precio, trial 14 días, fecha inicio.",
    categoria: "comercial",
    prioridad: "alta",
    estimadoMin: 90,
  },
  {
    codigo: "f0.6",
    fase: "f0",
    titulo: "Zona piloto definida (30 comercios / 10 cuadras)",
    descripcion: "Mapa mental o Google Maps: almacenes, kioscos, indumentaria.",
    categoria: "comercial",
    prioridad: "alta",
    estimadoMin: 45,
  },

  // ── Fase 1 — vender YA ──
  {
    codigo: "f1.1",
    fase: "f1",
    titulo: "Primera visita hoy",
    descripcion: "15 min máx. Una pregunta diagnóstico + demo fiado O cobranzas WA.",
    categoria: "comercial",
    prioridad: "critica",
    requiere: "f0.6",
    estimadoMin: 20,
  },
  {
    codigo: "f1.2",
    fase: "f1",
    titulo: "5 visitas esta semana",
    descripcion: "Ritmo mínimo antes de pensar en marketing. Anotá cada una en pipeline.",
    categoria: "comercial",
    prioridad: "critica",
    requiere: "f1.1",
    estimadoMin: 100,
  },
  {
    codigo: "f1.3",
    fase: "f1",
    titulo: "Cargar prospectos en pipeline",
    descripcion: "Cada visita → tarjeta en Centro de mando, aunque digan 'lo pienso'.",
    categoria: "comercial",
    prioridad: "alta",
    estimadoMin: 5,
  },
  {
    codigo: "f1.4",
    fase: "f1",
    titulo: "Primer trial activado (14 días)",
    descripcion: "Libreta Fiado ($4.990) o Cobranzas WA ($20.000). Un SKU, un problema.",
    categoria: "comercial",
    prioridad: "alta",
    href: "/dashboard/documentacion/marketplace/12-enganches-comerciales",
    estimadoMin: 30,
  },
  {
    codigo: "f1.5",
    fase: "f1",
    titulo: "Primer cliente pagando",
    descripcion: "Cobro + factura monotributo ANTES o junto con activación tenant.",
    categoria: "comercial",
    prioridad: "critica",
    requiere: "f1.4",
    estimadoMin: 60,
  },
  {
    codigo: "f1.6",
    fase: "f1",
    titulo: "Provisioning del cliente en <24h",
    descripcion: "Cloud → nueva org → SKU enganche → capacitación 30 min.",
    categoria: "operaciones",
    prioridad: "alta",
    href: "/claver-cloud/provisioning/new",
    requiere: "f1.5",
    estimadoMin: 45,
  },
  {
    codigo: "f1.7",
    fase: "f1",
    titulo: "Follow-up día 12 del trial",
    descripcion: "WhatsApp conversión antes de que venza el trial.",
    categoria: "comercial",
    prioridad: "alta",
    estimadoMin: 15,
  },

  // ── Fase 2 ──
  {
    codigo: "f2.1",
    fase: "f2",
    titulo: "Upsell pool-almacen-barrio a cliente fiado",
    descripcion: "Solo a quien ya usa enganche. Ticket $39.900–$44.900.",
    categoria: "comercial",
    prioridad: "media",
    requiereClientesPagos: 3,
    href: "/dashboard/documentacion/marketplace/14-pack-almacen-rosario",
  },
  {
    codigo: "f2.2",
    fase: "f2",
    titulo: "Primer POS + AFIP homologación",
    descripcion: "Comercio que quiere facturar formal. Setup único $80k–$150k.",
    categoria: "comercial",
    prioridad: "media",
    requiereClientesPagos: 3,
  },

  // ── Fase 3 ──
  {
    codigo: "f3.1",
    fase: "f3",
    titulo: "Evaluar SRL / SAS (>15 clientes)",
    descripcion: "Contador + contrato marco para cadenas.",
    categoria: "legal",
    prioridad: "baja",
    requiereClientesPagos: 15,
  },

  // ── Marketing DIFERIDO — no tocar al inicio ──
  {
    codigo: "mkt.1",
    fase: "mkt",
    titulo: "Instagram / redes sociales",
    descripcion: "⏸️ Diferido: sin venta repetible, las redes no convierten en retail local.",
    categoria: "marketing",
    prioridad: "baja",
    requiereClientesPagos: 3,
    diferida: true,
  },
  {
    codigo: "mkt.2",
    fase: "mkt",
    titulo: "Campañas Meta / Google Ads",
    descripcion: "⏸️ Diferido: costo alto sin testimonios ni caso de éxito local.",
    categoria: "marketing",
    prioridad: "baja",
    requiereClientesPagos: 5,
    diferida: true,
  },
  {
    codigo: "mkt.3",
    fase: "mkt",
    titulo: "Landing + SEO",
    descripcion: "⏸️ Diferido: /claver ya existe; primero boca a boca en zona piloto.",
    categoria: "marketing",
    prioridad: "baja",
    requiereClientesPagos: 3,
    diferida: true,
    href: "/claver",
  },
]

export const CEO_RUTINA_DIARIA = [
  { id: "dia.visitas", texto: "4 visitas presenciales (o 2 si es lunes post-setup)", icono: "map" },
  { id: "dia.pipeline", texto: "Actualizar pipeline antes de las 18hs", icono: "list" },
  { id: "dia.wa", texto: "Follow-up WhatsApp a trials y prospectos tibios", icono: "message" },
  { id: "dia.cloud", texto: "5 min en Cloud: alertas + MRR", icono: "cloud" },
] as const

export function getTareaByCodigo(codigo: string): CeoTaskDef | undefined {
  return CEO_TAREAS.find((t) => t.codigo === codigo)
}

export function getFaseById(id: CeoFaseId): CeoFaseDef | undefined {
  return CEO_FASES.find((f) => f.id === id)
}
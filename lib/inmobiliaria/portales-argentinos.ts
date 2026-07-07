/** Catálogo de portales inmobiliarios argentinos — credenciales vía ConexionIntegracion */

export interface PortalInmobiliarioDef {
  integracionId: string
  nombre: string
  emoji: string
  descripcion: string
  /** Campos de credencial que el tenant configura */
  campos: Array<{ key: string; label: string; tipo: "text" | "password"; requerido?: boolean }>
  estado: "disponible" | "beta" | "proximamente"
  syncEntidades: string[]
}

export const PORTALES_INMOBILIARIOS_AR: PortalInmobiliarioDef[] = [
  {
    integracionId: "portal_zonaprop",
    nombre: "Zonaprop",
    emoji: "🏠",
    descripcion: "Publicá y sincronizá avisos en Zonaprop desde tu cartera.",
    campos: [
      { key: "apiKey", label: "API Key", tipo: "password", requerido: true },
      { key: "publisherId", label: "ID publicador", tipo: "text", requerido: true },
    ],
    estado: "beta",
    syncEntidades: ["publicaciones", "consultas", "precios"],
  },
  {
    integracionId: "portal_argenprop",
    nombre: "Argenprop",
    emoji: "🔑",
    descripcion: "Feed XML o API partner para mantener precios y fotos al día.",
    campos: [
      { key: "apiKey", label: "API Key", tipo: "password", requerido: true },
      { key: "feedUrl", label: "URL feed (opcional)", tipo: "text" },
    ],
    estado: "beta",
    syncEntidades: ["publicaciones", "estado"],
  },
  {
    integracionId: "portal_properati",
    nombre: "Properati",
    emoji: "📍",
    descripcion: "Sincronización REST con oficina y cartera de inmuebles.",
    campos: [
      { key: "apiKey", label: "API Key", tipo: "password", requerido: true },
      { key: "officeId", label: "ID oficina", tipo: "text", requerido: true },
    ],
    estado: "beta",
    syncEntidades: ["publicaciones", "leads"],
  },
  {
    integracionId: "mercado_libre",
    nombre: "Mercado Libre Inmuebles",
    emoji: "🛒",
    descripcion: "Categoría Inmuebles de ML — reutiliza OAuth Mercado Libre.",
    campos: [],
    estado: "disponible",
    syncEntidades: ["publicaciones", "consultas"],
  },
  {
    integracionId: "portal_clarin",
    nombre: "Inmuebles Clarín",
    emoji: "📰",
    descripcion: "Feed de publicaciones para portales del grupo Clarín.",
    campos: [{ key: "feedUrl", label: "URL feed XML", tipo: "text", requerido: true }],
    estado: "proximamente",
    syncEntidades: ["publicaciones"],
  },
]

export function getPortalInmobiliario(id: string): PortalInmobiliarioDef | undefined {
  return PORTALES_INMOBILIARIOS_AR.find((p) => p.integracionId === id)
}
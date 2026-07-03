import type { MarketplaceSku } from "@/lib/marketplace/marketplace-catalog"
import type { AutopoolEntry } from "@/lib/marketplace/autopool-manifest"
import { CABALLOS_CALLE_APP_IDS, NICHE_APPS } from "./niche-apps-catalog"

const POOL_SINCE = "2026-07-02"

/** Sub-nicho secundario (tags); filtro principal = nicho_latam */
const APP_NICHO_SEC: Record<string, AutopoolEntry["nicho"]> = {
  consorcios: "cobra",
  club: "cobra",
  mutuo: "cobra",
  prestamista: "cobra",
  garantia: "cobra",
  feria: "mide",
  obras: "ordena",
  remis: "ordena",
  acopio: "mide",
  plancha: "atiende",
  consultorio: "ordena",
  escuela: "cobra",
  cancha: "cobra",
  gimnasio: "cobra",
  colonia: "cobra",
  pena: "cobra",
  taller: "atiende",
  delivery: "ordena",
  peluqueria: "atiende",
  salon: "atiende",
  veterinaria: "ordena",
}

const APP_TAGS: Record<string, string[]> = {
  consorcios: ["consorcio", "expensas", "inquilinos", "administracion", "propiedad"],
  club: ["club", "cuotas", "futbol", "barrio"],
  feria: ["feria", "puesto", "permisionario"],
  prestamista: ["prestamo", "financiera", "cuotas"],
  obras: ["obra", "jornales", "changas", "construccion"],
  acopio: ["acopio", "grano", "agro", "productor"],
  remis: ["remis", "taxi", "chofer"],
  plancha: ["tintoreria", "lavadero", "ticket"],
  consultorio: ["consultorio", "turnos", "medico"],
  garantia: ["inmobiliaria", "alquiler", "contrato"],
  mutuo: ["cooperativa", "mutual", "socios"],
  escuela: ["escuela", "colegio", "cuotas", "padres"],
  cancha: ["cancha", "futbol", "padel", "alquiler"],
  taller: ["taller", "mecanico", "auto", "service"],
  delivery: ["delivery", "repartidor", "pedidos"],
  peluqueria: ["peluqueria", "barberia", "estetica", "turnos"],
  gimnasio: ["gimnasio", "fitness", "membresia", "socios"],
  colonia: ["colonia", "campamento", "verano", "niños"],
  salon: ["salon", "eventos", "fiestas", "quince"],
  veterinaria: ["veterinaria", "mascotas", "vacunas"],
  pena: ["peña", "folklore", "cultural", "musica"],
}

export const NICHE_MARKETPLACE_CATALOG: MarketplaceSku[] = NICHE_APPS.map((app) => ({
  sku: app.sku,
  nombre: app.nombre,
  categoria: "Claver Nicho LATAM",
  precioArs: app.precioArs,
  tipoCobro: "recurrente" as const,
  autoCertLevel: "GLOBAL_AUTO" as const,
  paisesHabilitados: ["AR", "UY", "MX", "CL"],
  i18n: {
    "es-AR": {
      nombre: app.nombre,
      descripcion: app.dolorResuelve,
      packOnboardSubject: `${app.nombre} activada — ${app.wowMoment}`,
    },
  },
  segmentoAds: ["nicho_latam", "pyme", "barrio", app.appId],
  playbookId: `playbook.${app.sku}`,
  dependeDe: app.engine === "libreta" ? ["pos.fiado_barrio"] : undefined,
  status: "disponible" as const,
  trialDias: 14,
}))

export const NICHE_AUTOPOOL_ENTRIES: AutopoolEntry[] = NICHE_APPS.map((app) => ({
  sku: app.sku,
  nombre: app.nombre,
  lema: app.lema,
  tipo: "intangible" as const,
  nicho: "nicho_latam",
  vibeTags: [
    "nicho_latam",
    "claver_nicho",
    app.appId,
    APP_NICHO_SEC[app.appId] ?? "cobra",
    ...(APP_TAGS[app.appId] ?? []),
  ],
  autoCertLevel: "GLOBAL_AUTO" as const,
  remotoDesdeCasa: true,
  precioDesdeArs: app.precioArs,
  tipoCobro: "mensual" as const,
  maturity: "growing" as const,
  poolSince: POOL_SINCE,
  poolVersion: "1.0.0",
  impactoUniversal: 4 as const,
  activacionMinutos: 3,
  descripcionCorta: app.dolorResuelve,
  playbookId: `playbook.${app.sku}`,
  destacado:
    (CABALLOS_CALLE_APP_IDS as readonly string[]).includes(app.appId) ||
    ["escuela", "gimnasio", "taller", "peluqueria"].includes(app.appId),
}))
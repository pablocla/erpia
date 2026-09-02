/**
 * Packs de implementación 1 a 1 — SKU de servicio, no de software.
 * Márgenes internos (no se exponen al cliente). Alcance cerrado para que
 * el 70%+ sea entregable, no consultoría infinita.
 *
 * Unifica svc.implementacion (docs/comercial/puertas/SKU_IMPLEMENTACION_HORAS.md)
 * con el attach PLG de puesta a punto.
 */

export type PackEspecialistaTipo = "one_shot" | "recurrente"

export interface PackEspecialista {
  id: string
  sku: string
  nombre: string
  precioARS: number
  /** Referencia comercial, no tipo de cambio vivo */
  precioUsdRef: number
  duracionHoras: number
  icono: "Rocket" | "Database" | "ShieldCheck"
  popular?: boolean
  tipo: PackEspecialistaTipo
  descripcionCorta: string
  entregables: string[]
  /** Qué NO incluye — evita scope creep que come el margen */
  exclusiones: string[]
  sla: string
  /** Costo variable estimado al implementador (interno) */
  costoImplementadorARS: number
  /** Margen bruto estimado precio − costo implementador (interno) */
  margenEstimadoPct: number
  /** Tope de catálogo si aplica */
  maxArticulos?: number
}

export function margenBrutoPct(precioARS: number, costoImplementadorARS: number): number {
  if (precioARS <= 0) return 0
  return Math.round(((precioARS - costoImplementadorARS) / precioARS) * 100)
}

export const PACKS_ESPECIALISTAS: PackEspecialista[] = [
  {
    id: "puesta_a_punto_express",
    sku: "svc.implementacion.express",
    nombre: "Puesta a Punto Express",
    precioARS: 35000,
    precioUsdRef: 35,
    duracionHoras: 1,
    icono: "Rocket",
    popular: true,
    tipo: "one_shot",
    descripcionCorta: "1 hora por videollamada: tickets, precios y una prueba de cobro. Arrancás el mismo día.",
    entregables: [
      "Videollamada de 1 hora en horario hábil (lun–vie 9–18 ART)",
      "Configuración de punto de venta y ticket interno",
      "Carga inicial de hasta 80 productos o 1 lista corta",
      "Prueba de un cobro (efectivo / QR si ya tenés MP)",
      "Checklist grabado de 10 minutos para tu encargado",
    ],
    exclusiones: [
      "Certificado ARCA / clave fiscal",
      "Migración masiva de Excel",
      "Soporte 15 minutos ni WhatsApp 24/7",
    ],
    sla: "Turno en las próximas 48 h hábiles. Sin SLA de minutos.",
    costoImplementadorARS: 10000,
    margenEstimadoPct: 71,
    maxArticulos: 80,
  },
  {
    id: "migracion_arca_total",
    sku: "svc.implementacion.estandar",
    nombre: "Catálogo + guía ARCA",
    precioARS: 75000,
    precioUsdRef: 75,
    duracionHoras: 4,
    icono: "Database",
    tipo: "one_shot",
    descripcionCorta: "Hasta 1.000 artículos limpios y una sesión para dejar el certificado ARCA listo. Vos traés la clave fiscal.",
    entregables: [
      "4 horas de implementación (2 sesiones de 2 h o 1 bloque)",
      "Limpieza y carga de hasta 1.000 artículos con código de barras",
      "Guía en vivo del certificado AFIP/ARCA (el CUIT y la clave fiscal son tuyos)",
      "Listas minorista / mayorista si las tenés en Excel",
      "Canal de seguimiento 7 días hábiles, respuesta en 1 día hábil",
    ],
    exclusiones: [
      "Más de 1.000 SKUs (se cotiza extra)",
      "Tramitar clave fiscal nivel 3 por vos",
      "Desarrollo a medida o integraciones legacy",
      "WhatsApp con respuesta en 15 minutos",
    ],
    sla: "Primera sesión en 5 días hábiles. Seguimiento 7 días, 1 día hábil de respuesta.",
    costoImplementadorARS: 22000,
    margenEstimadoPct: 71,
    maxArticulos: 1000,
  },
  {
    id: "soporte_vip_mensual",
    sku: "svc.soporte.operativo",
    nombre: "Horas de soporte operativo",
    precioARS: 29000,
    precioUsdRef: 29,
    duracionHoras: 2,
    icono: "ShieldCheck",
    tipo: "recurrente",
    descripcionCorta: "Hasta 2 horas/mes para listas, caja y consultas. Horario hábil, no call center.",
    entregables: [
      "Hasta 2 horas mensuales acumulables (no se pasan al mes siguiente)",
      "Canal WhatsApp en horario hábil (lun–vie 9–18 ART)",
      "Actualización de una lista de precios por mes",
      "Exportación de Libro IVA Digital 1 vez al mes",
    ],
    exclusiones: [
      "Respuesta en 15 minutos",
      "Guardia 24/7 ni fines de semana",
      "Gestoría impositiva ni presentación ante AFIP",
      "Horas extra: se cotizan aparte",
    ],
    sla: "Respuesta en 1 día hábil. No es un SLA de minutos.",
    costoImplementadorARS: 8000,
    margenEstimadoPct: 72,
  },
]

export type PackEspecialistaPublico = Omit<
  PackEspecialista,
  "costoImplementadorARS" | "margenEstimadoPct"
>

export function packPublico(pack: PackEspecialista): PackEspecialistaPublico {
  const { costoImplementadorARS: _c, margenEstimadoPct: _m, ...rest } = pack
  return rest
}

export function getPackEspecialista(id: string | null | undefined): PackEspecialista | null {
  if (!id) return null
  return PACKS_ESPECIALISTAS.find((p) => p.id === id || p.sku === id) ?? null
}

export function packsPublicos(): PackEspecialistaPublico[] {
  return PACKS_ESPECIALISTAS.map(packPublico)
}

export const ORIGEN_ESPECIALISTA = "svc.especialista" as const

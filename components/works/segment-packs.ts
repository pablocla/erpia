/** Copy packs for Works SegmentLanding — Energy full; Infra/Blockchain thin.
 * Source of truth: docs/comercial/LANDINGS_WORKS_ENERGY_INFRA_BLOCKCHAIN.md
 * Soft doors (/software, Ads Soft, landing-home-puertas) MUST NOT be edited from here.
 */

export type WorksSegmentKey = "energy" | "infra" | "blockchain"

export type FaqItem = { q: string; a: string }

export type SegmentPack = {
  segmento: WorksSegmentKey
  eyebrow: string
  h1: string
  h2: string
  promiseLine: string
  bullets: string[]
  ctaPrimary: string
  ctaMicro: string
  ctaSecondaryLabel: string
  ctaSecondaryHref: string
  title: string
  ogTitle: string
  ogDescription: string
  formTitle: string
  formSuccess: string
  requireZona: boolean
  requireKwp: boolean
  requireNotas: boolean
  showEnergyFields: boolean
  showInfraExtras: boolean
  showBlockchainDisclaimer: boolean
  queHacemos: string[]
  queHacePartner: string[]
  flujo: { n: number; label: string }[]
  social: { title: string; body: string }
  faq: FaqItem[]
  softUpsell: { title: string; body: string; href: string; linkLabel: string }
}

const FLUJO_ENERGY: SegmentPack["flujo"] = [
  { n: 1, label: "Nos contás el proyecto" },
  { n: 2, label: "Calificamos kWp + zona" },
  { n: 3, label: "Presupuesto orientativo" },
  { n: 4, label: "Seña (reserva match)" },
  { n: 5, label: "Te asignamos partner" },
  { n: 6, label: "Obra del partner" },
  { n: 7, label: "Cierre y comisión" },
]

const FLUJO_THIN: SegmentPack["flujo"] = [
  { n: 1, label: "Nos contás el proyecto" },
  { n: 2, label: "Calificamos alcance + zona" },
  { n: 3, label: "Presupuesto orientativo" },
  { n: 4, label: "Seña (reserva match)" },
  { n: 5, label: "Te asignamos partner" },
  { n: 6, label: "Ejecución del partner" },
  { n: 7, label: "Cierre y comisión" },
]

export const SEGMENT_PACKS: Record<WorksSegmentKey, SegmentPack> = {
  energy: {
    segmento: "energy",
    eyebrow: "Works · Energy · Solar con partners",
    h1: "Solar con partner. Cotizás y cobrás seña con nosotros.",
    h2: "Armamos el alcance, te conectamos con un instalador de la zona y seguimos los hitos. Claver orquesta; el EPC instala.",
    promiseLine: "Lead → presupuesto → seña → match EPC → obra del partner → cobro/comisión.",
    bullets: [
      "Cotización orientativa y seña con Claver",
      "Match a EPC matriculado (no somos el instalador)",
      "Hitos claros; comisión transparente",
    ],
    ctaPrimary: "Pedir cotización solar",
    ctaMicro: "Sin compromiso · Respondemos por WhatsApp · No instalamos paneles",
    ctaSecondaryLabel: "Ya tengo consulta / Soft",
    ctaSecondaryHref: "/software",
    title: "Claver Energy — Solar con partners EPC",
    ogTitle: "Solar con partner · Claver Energy",
    ogDescription: "Cotizás y cobrás seña con Claver. El EPC instala. Orquestamos el proyecto.",
    formTitle: "Pedir cotización solar",
    formSuccess:
      "Listo. Te contactamos por WhatsApp o mail. Recordá: Claver orquesta; no instalamos paneles.",
    requireZona: true,
    requireKwp: true,
    requireNotas: false,
    showEnergyFields: true,
    showInfraExtras: false,
    showBlockchainDisclaimer: false,
    queHacemos: [
      "Captamos tu consulta y armamos alcance (kWp + zona).",
      "Presupuesto orientativo en Soft (servicios) y seña.",
      "Match a EPC de shortlist (ej. GenSolar / Amperio / Solarpool — sin sobre-prometer marca fija hasta deal).",
      "Seguimos hitos y cobro; comisión Claver 15–30% sobre lo acordado.",
      "No ejecutamos obra ni firmamos matrícula.",
    ],
    queHacePartner: [
      "Relevamiento e instalación.",
      "Matrícula / trámites eléctricos (Ley 27.424 etc.) a cargo del EPC salvo pacto.",
      "Oferta firme post-relevamiento y garantías de obra/equipos.",
      'Cliente queda informado: "Ejecuta EPC X; Claver orquesta."',
    ],
    flujo: FLUJO_ENERGY,
    social: {
      title: "Partners EPC en registry",
      body: "Shortlist Research (GenSolar / Amperio / Solarpool…). Sin logos hasta acuerdo escrito.",
    },
    faq: [
      {
        q: "¿Claver instala los paneles?",
        a: "No. Orquestamos el proyecto y matcheamos un EPC. El instalador ejecuta.",
      },
      {
        q: "¿Qué pago primero?",
        a: "Una seña a Claver (orientativa 10–20% del ticket) para reservar gestión y match. El resto sigue hitos con el partner.",
      },
      {
        q: "¿En cuánto tiempo me responden?",
        a: "Primer contacto comercial en horario hábil; match típico 48–72 h hábiles post-seña si hay partner en zona.",
      },
      {
        q: "¿Trabajan en mi zona?",
        a: "Depende del partner. Por eso pedimos zona en el form.",
      },
      {
        q: "¿Esto es el software Claver (Soft)?",
        a: "No. Esta página es Works (proyectos con partners). Soft (POS, presupuestos, cobro) lo podés sumar después del proyecto.",
      },
      {
        q: "¿Hacen Ads de Energy?",
        a: "No por ahora. Inbound / red / consulta directa.",
      },
    ],
    softUpsell: {
      title: "¿Ya cerraste el proyecto?",
      body: "Si además querés ordenar caja y cobros del día a día → Claver Soft. Es otra línea; no reemplaza al EPC.",
      href: "/software",
      linkLabel: "Ver Claver Soft",
    },
  },
  infra: {
    segmento: "infra",
    eyebrow: "Works · Infra · Obra / naves / colo",
    h1: "Obra e infra con partners. Nosotros orquestamos.",
    h2: "Civil, naves o colo liviano: armamos alcance, seña y match. No somos constructora ni operamos un data center propio.",
    promiseLine: "Lead → presupuesto → seña → match partner → obra → cobro/comisión.",
    bullets: [
      "Form → lead Works",
      "Partners civil/DC en registry",
      "Sin OT Field en este MVP",
    ],
    ctaPrimary: "Pedir consulta Infra",
    ctaMicro: "Broker de obra · Sin DC propio Claver",
    ctaSecondaryLabel: "Soft / Holding",
    ctaSecondaryHref: "/software",
    title: "Claver Infra — Obra con partners",
    ogTitle: "Obra e infra con partners · Claver Infra",
    ogDescription: "Armamos alcance, seña y match. No somos constructora ni operamos DC propio.",
    formTitle: "Pedir consulta Infra",
    formSuccess: "Listo. Te contactamos a la brevedad. Claver orquesta; el partner ejecuta.",
    requireZona: true,
    requireKwp: false,
    requireNotas: true,
    showEnergyFields: false,
    showInfraExtras: true,
    showBlockchainDisclaimer: false,
    queHacemos: [
      "Captamos la consulta y armamos alcance (civil / nave / colo).",
      "Seña y match a partner del registry.",
      "Seguimos hitos y comisión. No construimos ni operamos DC propio.",
    ],
    queHacePartner: [
      "Ejecuta obra civil, nave o colo según alcance.",
      "Matrículas y permisos a cargo del partner salvo pacto.",
      "Cliente informado: ejecuta partner; Claver orquesta.",
    ],
    flujo: FLUJO_THIN,
    social: {
      title: "Próximos partners · placeholder",
      body: "Registry civil/DC en armado. Sin logos inventados.",
    },
    faq: [
      {
        q: "¿Claver construye o opera un data center?",
        a: "No. Orquestamos con partners. No hay DC propio Claver ni OT Field en este MVP.",
      },
      {
        q: "¿Qué necesito para arrancar?",
        a: "Nombre, contacto (mail o WhatsApp), zona y una nota de alcance (civil / nave / colo).",
      },
      {
        q: "¿Esto es Soft?",
        a: "No. Esta puerta es Works. Soft lo sumás después si querés ordenar caja y cobros.",
      },
    ],
    softUpsell: {
      title: "¿Ya cerraste el proyecto?",
      body: "Si querés ordenar presupuestos y cobros del día a día → Claver Soft.",
      href: "/software",
      linkLabel: "Ver Claver Soft",
    },
  },
  blockchain: {
    segmento: "blockchain",
    eyebrow: "Works · Blockchain · Pros externos",
    h1: "Solidity, audit y nodos con partners. Sin custody.",
    h2: "Te conectamos con estudios y firms. Claver orquesta seña y hitos. No custodiamos cripto ni somos exchange.",
    promiseLine: "Lead → seña → match firm → entrega partner → cobro/comisión.",
    bullets: [
      "Form → lead",
      "Partners audit/solidity",
      "Anti-scope: no tokens / no custody",
    ],
    ctaPrimary: "Pedir consulta Blockchain",
    ctaMicro: "Sin custody · Sin exchange · Partner firma lo técnico",
    ctaSecondaryLabel: "Soft / Holding",
    ctaSecondaryHref: "/software",
    title: "Claver Blockchain — Partners técnicos",
    ogTitle: "Solidity, audit y nodos con partners · Claver",
    ogDescription: "Orquestamos seña y hitos. Sin custody ni exchange.",
    formTitle: "Pedir consulta Blockchain",
    formSuccess: "Listo. Te contactamos. Sin custody · Sin exchange · Partner firma lo técnico.",
    requireZona: false,
    requireKwp: false,
    requireNotas: true,
    showEnergyFields: false,
    showInfraExtras: false,
    showBlockchainDisclaimer: true,
    queHacemos: [
      "Captamos la consulta (solidity / audit / nodos / security).",
      "Seña y match a firm o estudio partner.",
      "Seguimos hitos. No custodiamos cripto ni somos exchange.",
    ],
    queHacePartner: [
      "Entrega técnica (código, audit, nodos) firmada por el partner.",
      "Responsabilidad técnica del partner nombrado.",
      "Cliente informado: ejecuta partner; Claver orquesta.",
    ],
    flujo: FLUJO_THIN,
    social: {
      title: "Próximos partners · placeholder",
      body: "Firms audit/solidity en registry. Sin logos inventados.",
    },
    faq: [
      {
        q: "¿Custodian cripto o son exchange?",
        a: "No. Sin custody y sin exchange. Partners externos firman lo técnico.",
      },
      {
        q: "¿Emiten tokens Claver?",
        a: "No. Anti-scope: sin tokens propios en este MVP.",
      },
      {
        q: "¿Esto es Soft?",
        a: "No. Esta puerta es Works. Soft es otra línea (POS / cobros).",
      },
    ],
    softUpsell: {
      title: "¿Ya cerraste el proyecto?",
      body: "Si querés ordenar caja y cobros del día a día → Claver Soft.",
      href: "/software",
      linkLabel: "Ver Claver Soft",
    },
  },
}

export function getSegmentPack(segmento: WorksSegmentKey): SegmentPack {
  return SEGMENT_PACKS[segmento]
}

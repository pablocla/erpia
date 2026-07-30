/**
 * US product catalog — English PLG apps mapped onto existing Claver core (sub-SaaS / shells / SKUs).
 * Activation reuses the same SKUs + modoLite + product shells as Argentina.
 *
 * Docs: docs/comercial/US_MARKET_APPS_MULTINATIONAL.md
 */

import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"
import type { SubSaasEstado, SubSaasPlataforma } from "@/lib/comercial/sub-saas-catalog"

/** Core slug already implemented in AR catalog / product-shell */
export type UsCoreSlug =
  | "cobra"
  | "fiado"
  | "turnos"
  | "sena"
  | "puntos"
  | "renta"
  | "expensas"
  | "abono"
  | "reactiva"
  | "ruta"
  | "portal-b2b"
  | "pos"
  | "menu-qr"
  | "tienda"
  | "presupuestos"
  | "caja"
  | "reputacion-google"
  | "health"
  | "logistica-fleet"
  | "franchise-hub"
  | "bi-executive"

export type UsCollectiveId = "get-paid" | "book" | "counter" | "field"

export interface UsSaasApp {
  slug: string
  /** Existing AR/core product used for shell, SKU activation, dashboard */
  coreSlug: UsCoreSlug
  marca: string
  nombre: string
  lema: string
  descripcion: string
  /** Same SKU as core — entitlement + trial work unchanged */
  sku: string
  skusAdicionales?: string[]
  precioUsd: number
  anclaGratis: boolean
  trialDias: number
  modoLite: ModoLite
  dashboardPath: string
  publicPath?: string
  estado: SubSaasEstado
  listoPct: number
  plataforma: SubSaasPlataforma
  collective: UsCollectiveId
  wave: 1 | 2 | 3 | 4
  rubros: string[]
  pains: string[]
  outcomes: string[]
  pasosActivacion: string[]
  gatilloPago: string
  roiCopy: string
  freeLimit: string
  messagingNote: string
  upsellSkus?: string[]
}

export const US_COLLECTIVES: Record<
  UsCollectiveId,
  { id: UsCollectiveId; name: string; tagline: string; leaderSlug: string }
> = {
  "get-paid": {
    id: "get-paid",
    name: "Claver Get Paid",
    tagline: "Get paid faster — tabs, invoices, deposits, recurring.",
    leaderSlug: "collect",
  },
  book: {
    id: "book",
    name: "Claver Book",
    tagline: "Fill the calendar. Kill no-shows.",
    leaderSlug: "confirm",
  },
  counter: {
    id: "counter",
    name: "Claver Counter",
    tagline: "Front-of-house POS, menu, and reviews.",
    leaderSlug: "pos",
  },
  field: {
    id: "field",
    name: "Claver Field",
    tagline: "Routes, B2B orders, rentals, and fleets.",
    leaderSlug: "route",
  },
}

/**
 * W1–W4 US apps. SKUs intentionally match AR core for zero-friction activation.
 */
export const US_SAAS_APPS: UsSaasApp[] = [
  // ── Wave 1 ──────────────────────────────────────────────────────────────
  {
    slug: "collect",
    coreSlug: "cobra",
    marca: "Claver Collect",
    nombre: "Automated collections",
    lema: "The message collects. You keep selling.",
    descripcion:
      "AR aging, SMS sequences, and Stripe payment links. Fewer awkward calls, more recovered cash.",
    sku: "intang.cobranzas_wa",
    skusAdicionales: ["com.whatsapp", "fiscal.clavpay_link"],
    precioUsd: 39,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "cobranza",
    dashboardPath: "/dashboard/cuentas-cobrar",
    estado: "disponible",
    listoPct: 85,
    plataforma: "ambos",
    collective: "get-paid",
    wave: 1,
    rubros: ["smb", "wholesale", "services", "freelance"],
    pains: ["Overdue invoices with no follow-up", "Time wasted calling debtors", "Unclear recoverable balance"],
    outcomes: ["D+1 / D+7 SMS sequences", "Recoverable balance panel", "One-tap payment links"],
    pasosActivacion: [
      "Activate Claver Collect (14-day trial)",
      "Import or add customers with balances",
      "Set reminder cadence and daily cap",
      "Approve or auto-send collection messages",
    ],
    gatilloPago: "Automatic SMS sequences + Stripe payment links",
    roiCopy: "One invoice paid on time covers a full year of Collect",
    freeLimit: "Trial 14 days; then manual AR only",
    messagingNote: "SMS (Twilio) primary; WhatsApp optional",
    upsellSkus: ["pos.fiado_barrio", "fiscal.clavpay_link", "core.claver"],
  },
  {
    slug: "house-tab",
    coreSlug: "fiado",
    marca: "Claver House Tab",
    nombre: "Digital house accounts",
    lema: "Free forever. Put it on their tab from your phone.",
    descripcion:
      "Neighborhood house tabs with per-customer limits, history, and balance. Upgrade to Collect for auto reminders and payment links.",
    sku: "pos.fiado_barrio",
    precioUsd: 0,
    anclaGratis: true,
    trialDias: 14,
    modoLite: "fiado",
    dashboardPath: "/dashboard/fiado",
    estado: "disponible",
    listoPct: 90,
    plataforma: "ambos",
    collective: "get-paid",
    wave: 1,
    rubros: ["corner-store", "bar", "deli", "gym"],
    pains: ["Paper tabs get lost", "Customers exceed limits", "No idea who owes what"],
    outcomes: ["Per-customer limits", "Live tab ledger", "Path to Collect upsell"],
    pasosActivacion: [
      "Activate House Tab (free)",
      "Add neighborhood customers",
      "Set credit limits",
      "Log the first tab charge",
    ],
    gatilloPago: "SMS reminders + payment links → Collect",
    roiCopy: "One recovered tab pays 3–6 months of Collect",
    freeLimit: "Unlimited tabs; 0 automatic collection messages",
    messagingNote: "Free tier is in-app only; paid Collect adds SMS",
    upsellSkus: ["intang.cobranzas_wa", "com.whatsapp", "fiscal.clavpay_link"],
  },
  {
    slug: "confirm",
    coreSlug: "turnos",
    marca: "Claver Confirm",
    nombre: "Bookings that confirm themselves",
    lema: "Fewer no-shows. More chairs filled.",
    descripcion:
      "Public booking link plus day-before SMS. Clients confirm or free the slot automatically.",
    sku: "micro.confirma_turnos",
    skusAdicionales: ["niche.peluqueria_barrio", "com.whatsapp"],
    precioUsd: 29,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/agenda",
    publicPath: "/agenda-online/{empresaId}",
    estado: "disponible",
    listoPct: 80,
    plataforma: "ambos",
    collective: "book",
    wave: 1,
    rubros: ["barber", "medspa", "clinic", "tutor", "trainer"],
    pains: ["No-shows kill the day", "Manual confirmation calls", "Empty slots stay empty"],
    outcomes: ["Public booking link in minutes", "Auto reconfirm / release", "Higher utilization"],
    pasosActivacion: [
      "Activate Claver Confirm",
      "Set services and staff hours",
      "Share your public booking link",
      "Turn on day-before confirmations",
    ],
    gatilloPago: "Auto SMS night-before + confirm/cancel",
    roiCopy: "One avoided no-show per week pays ~4 months",
    freeLimit: "Manual calendar in trial; 0 auto reminders without paid",
    messagingNote: "SMS primary for US no-show reduction",
  },
  {
    slug: "deposit",
    coreSlug: "sena",
    marca: "Claver Deposit",
    nombre: "Quotes with deposits",
    lema: "Lock the job with a deposit link.",
    descripcion:
      "Professional PDF quotes for trades and events, with a Stripe deposit link (30–50%) and balance reminders.",
    sku: "micro.sena_reserva",
    precioUsd: 24,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "servicios",
    dashboardPath: "/dashboard/ventas/presupuestos",
    estado: "disponible",
    listoPct: 70,
    plataforma: "ambos",
    collective: "get-paid",
    wave: 1,
    rubros: ["photographer", "cleaner", "handyman", "venue", "caterer"],
    pains: ["Verbal quotes disappear", "Clients ghost after estimate", "No deposit = empty day"],
    outcomes: ["Branded quote PDF", "Deposit paid online", "Balance reminder before the job"],
    pasosActivacion: [
      "Activate Claver Deposit",
      "Create first quote with deposit %",
      "Send payment link",
      "Mark deposit received",
    ],
    gatilloPago: "Deposit link + balance reminder automation",
    roiCopy: "One deposit collected pays months of software",
    freeLimit: "Manual quotes in trial",
    messagingNote: "Email + SMS for deposit links",
  },

  // ── Wave 2 ──────────────────────────────────────────────────────────────
  {
    slug: "memberships",
    coreSlug: "puntos",
    marca: "Claver Memberships",
    nombre: "Members, plans, and dues",
    lema: "Who paid. Who’s late. Who walks in today.",
    descripcion:
      "Membership plans, check-in at the counter, and SMS when dues expire — built for boutique gyms and clubs.",
    sku: "niche.gimnasio_barrio",
    precioUsd: 39,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/membresias",
    estado: "disponible",
    listoPct: 70,
    plataforma: "ambos",
    collective: "book",
    wave: 2,
    rubros: ["gym", "pilates", "martial-arts", "kids-club"],
    pains: ["Spreadsheets for members", "Forgotten renewals", "Door check is manual"],
    outcomes: ["Plan + due date per member", "Counter check-in", "Late-fee SMS sequences"],
    pasosActivacion: [
      "Activate Memberships",
      "Define plans and prices",
      "Import members",
      "Enable renewal reminders",
    ],
    gatilloPago: "Dues expiry SMS + payment link",
    roiCopy: "Two recovered memberships pay the month",
    freeLimit: "Member list in trial; auto dues messaging on paid",
    messagingNote: "SMS for renewals",
  },
  {
    slug: "recurring",
    coreSlug: "abono",
    marca: "Claver Recurring",
    nombre: "Recurring billing",
    lema: "Never forget to invoice the month again.",
    descripcion:
      "Monthly retainers for coaches, therapists, lawn care, and AC maintenance — auto issue + collect.",
    sku: "micro.abono_recurrente",
    precioUsd: 39,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "cobranza",
    dashboardPath: "/dashboard/facturacion-recurrente",
    estado: "disponible",
    listoPct: 65,
    plataforma: "ambos",
    collective: "get-paid",
    wave: 2,
    rubros: ["coach", "therapist", "lawn", "hvac-service", "mutual"],
    pains: ["Manual monthly invoices", "Missed cycles", "Chasing retainers"],
    outcomes: ["Cycle templates", "Auto AR generation", "Collection on the same rail as Collect"],
    pasosActivacion: [
      "Activate Recurring",
      "Define billing cycle templates",
      "Attach customers",
      "Run first cycle",
    ],
    gatilloPago: "Auto cycle + collection sequence",
    roiCopy: "One recovered retainer pays 2 months",
    freeLimit: "Template list free/trial; auto issue on paid",
    messagingNote: "Email invoice + SMS link",
  },
  {
    slug: "rent",
    coreSlug: "renta",
    marca: "Claver Rent",
    nombre: "Small landlord rentals",
    lema: "1–20 units. Due dates. Payment links.",
    descripcion:
      "Contracts, due dates, receipts, and tenant payment links — for small landlords, not enterprise PropTech.",
    sku: "micro.renta_dueno",
    precioUsd: 29,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "cobranza",
    dashboardPath: "/dashboard/cuentas-cobrar",
    estado: "disponible",
    listoPct: 70,
    plataforma: "ambos",
    collective: "field",
    wave: 2,
    rubros: ["landlord", "str-host", "duplex-owner"],
    pains: ["Rent tracked in notes apps", "Awkward late reminders", "No receipt trail"],
    outcomes: ["Lease due list", "Auto rent reminder", "Payment link + receipt"],
    pasosActivacion: [
      "Activate Claver Rent",
      "Add units and leases",
      "Set due day",
      "Send first rent link",
    ],
    gatilloPago: "Rent-due SMS + Stripe link",
    roiCopy: "One rent paid 5 days early = 10× ROI",
    freeLimit: "Contract list in trial",
    messagingNote: "SMS + email to tenants",
  },
  {
    slug: "hoa",
    coreSlug: "expensas",
    marca: "Claver HOA",
    nombre: "Small HOA / building dues",
    lema: "Monthly dues without the spreadsheet chaos.",
    descripcion:
      "Units, monthly assessments, mass reminders to delinquents, and collection links for informal boards.",
    sku: "niche.consorcios",
    precioUsd: 39,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "cobranza",
    dashboardPath: "/dashboard/cuentas-cobrar",
    estado: "disponible",
    listoPct: 70,
    plataforma: "ambos",
    collective: "field",
    wave: 2,
    rubros: ["hoa", "condo-board", "co-op"],
    pains: ["Excel for assessments", "Treasurer burnout", "Late payers ignored"],
    outcomes: ["Unit roster", "Mass monthly dues run", "Delinquent SMS batch"],
    pasosActivacion: [
      "Activate Claver HOA",
      "Load units and owners",
      "Post this month’s assessment",
      "Send collection batch",
    ],
    gatilloPago: "Mass liquidation + delinquent messaging",
    roiCopy: "One assessment collected on time pays 2–3 months",
    freeLimit: "Units on screen in trial",
    messagingNote: "SMS/email to owners",
  },
  {
    slug: "winback",
    coreSlug: "reactiva",
    marca: "Claver Win-Back",
    nombre: "Reactivate + review funnel",
    lema: "Wake sleeping customers. Route 5-star reviews to Google.",
    descripcion:
      "Find dormant customers, SMS a win-back offer, and after visits route happy reviews to Google while private-routing detractors.",
    sku: "intang.reactivador_clientes",
    skusAdicionales: ["mkt.reputacion_google"],
    precioUsd: 24,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/clientes",
    estado: "beta",
    listoPct: 65,
    plataforma: "ambos",
    collective: "counter",
    wave: 2,
    rubros: ["salon", "vet", "retail", "dental"],
    pains: ["Cold customer list", "No review system", "Bad reviews go public first"],
    outcomes: ["Dormant segment", "Offer campaign", "5★ → Google, 1–3 → private inbox"],
    pasosActivacion: [
      "Activate Win-Back",
      "Review dormant list",
      "Launch first SMS campaign",
      "Connect Google review URL",
    ],
    gatilloPago: "Campaign send + review routing",
    roiCopy: "One reactivated customer (avg ticket) pays 3 months",
    freeLimit: "Dormant filter UI in trial",
    messagingNote: "SMS campaigns",
  },

  // ── Wave 3 ──────────────────────────────────────────────────────────────
  {
    slug: "pos",
    coreSlug: "pos",
    marca: "Claver POS",
    nombre: "Counter point of sale",
    lema: "Fast checkout for kiosks, trucks, and pop-ups.",
    descripcion:
      "Touch-friendly POS, cash drawer shifts, barcodes, and house tabs — without enterprise complexity.",
    sku: "pos.caja",
    precioUsd: 39,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/pos",
    estado: "disponible",
    listoPct: 100,
    plataforma: "ambos",
    collective: "counter",
    wave: 3,
    rubros: ["kiosk", "food-truck", "thrift", "market-stall"],
    pains: ["Slow checkout", "No shift control", "Tabs scattered"],
    outcomes: ["Fast tickets", "Open/close drawer", "Same tenant as House Tab"],
    pasosActivacion: [
      "Activate POS trial",
      "Load counter products",
      "Ring first sale",
      "Close cash shift",
    ],
    gatilloPago: "Multi-register + alerts after trial",
    roiCopy: "Faster lines = fewer walkaways",
    freeLimit: "14-day full POS trial",
    messagingNote: "Optional receipt via SMS",
  },
  {
    slug: "menu-qr",
    coreSlug: "menu-qr",
    marca: "Claver Menu",
    nombre: "QR menu + kitchen tickets",
    lema: "Phone menu in minutes. Tickets to the line.",
    descripcion:
      "Public QR menu and hospitality routing for food trucks, cafés, and small kitchens.",
    sku: "core.claver",
    precioUsd: 49,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/hospitalidad/platos",
    publicPath: "/menu/{empresaId}",
    estado: "beta",
    listoPct: 70,
    plataforma: "ambos",
    collective: "counter",
    wave: 3,
    rubros: ["food-truck", "cafe", "pop-up", "ghost-kitchen"],
    pains: ["Printed menus go stale", "Orders shouted to kitchen", "No digital presence"],
    outcomes: ["Live QR menu", "Kitchen ticket path", "Self-order ready"],
    pasosActivacion: [
      "Activate Menu QR",
      "Add dishes and prices",
      "Print QR to tables",
      "Route tickets to kitchen",
    ],
    gatilloPago: "Self-order + multi-station KDS",
    roiCopy: "One extra table turn pays the month",
    freeLimit: "Static menu in trial",
    messagingNote: "Guest-facing public URL",
  },
  {
    slug: "route",
    coreSlug: "ruta",
    marca: "Claver Route",
    nombre: "Field sales routes",
    lema: "Today’s stops. History. Collect on the street.",
    descripcion:
      "Day route map, customer history, and field collections for beverage, bakery wholesale, and parts sellers.",
    sku: "micro.claver_ruta",
    precioUsd: 59,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/vendedor",
    estado: "disponible",
    listoPct: 75,
    plataforma: "celular",
    collective: "field",
    wave: 3,
    rubros: ["beverage", "bakery-wholesale", "hvac-parts", "snack-vendor"],
    pains: ["Routes in the sales rep’s head", "Forgotten balances in the field", "No stock visibility"],
    outcomes: ["Stop list + map", "Field collection", "Upsell while on site"],
    pasosActivacion: [
      "Activate Route",
      "Load customers with geo",
      "Build today’s route",
      "Collect first field payment",
    ],
    gatilloPago: "Route optimize + auto installment collection",
    roiCopy: "One extra stop order pays the month",
    freeLimit: "Manual stop list in trial",
    messagingNote: "SMS to customers before arrival (optional)",
  },
  {
    slug: "b2b-portal",
    coreSlug: "portal-b2b",
    marca: "Claver B2B",
    nombre: "Wholesale self-service portal",
    lema: "Customers order 24/7 and see their balance.",
    descripcion:
      "B2B catalog, open account balance, and orders that feed picking — without custom portal builds.",
    sku: "premium.b2b_portal",
    precioUsd: 99,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "cobranza",
    dashboardPath: "/dashboard/cuentas-cobrar",
    publicPath: "/portal?empresa={empresaId}",
    estado: "disponible",
    listoPct: 95,
    plataforma: "ambos",
    collective: "field",
    wave: 3,
    rubros: ["foodservice", "building-materials", "florist-wholesale"],
    pains: ["Orders by voice note", "Price lists on WhatsApp", "No self-serve balance"],
    outcomes: ["24/7 ordering", "Live AR for buyers", "Picking-ready orders"],
    pasosActivacion: [
      "Activate B2B Portal",
      "Publish catalog",
      "Share portal link with buyers",
      "Process first self-serve order",
    ],
    gatilloPago: "Full portal + AR sync after trial",
    roiCopy: "Replaces a $20k custom portal for SMB wholesale",
    freeLimit: "14-day trial",
    messagingNote: "Email order confirmations",
  },
  {
    slug: "storefront",
    coreSlug: "tienda",
    marca: "Claver Storefront",
    nombre: "Simple online store",
    lema: "Catalog + checkout linked to your stock.",
    descripcion:
      "Lightweight B2C storefront reusing inventory — for local retail that needs online without Shopify complexity.",
    sku: "ECOM-B2C-01",
    precioUsd: 39,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/ecommerce",
    publicPath: "/tienda/{slug}",
    estado: "disponible",
    listoPct: 70,
    plataforma: "ambos",
    collective: "counter",
    wave: 3,
    rubros: ["boutique", "local-retail", "specialty"],
    pains: ["No online catalog", "Double stock entry", "Checkout scattered"],
    outcomes: ["Public store URL", "Stock-aware products", "Order inbox"],
    pasosActivacion: [
      "Activate Storefront",
      "Pick store slug",
      "Publish products",
      "Share store link",
    ],
    gatilloPago: "Stripe checkout + abandoned cart later",
    roiCopy: "One online order can pay the month",
    freeLimit: "Catalog in trial",
    messagingNote: "Email order receipts",
  },

  // ── Wave 4 ──────────────────────────────────────────────────────────────
  {
    slug: "clinic",
    coreSlug: "health",
    marca: "Claver Clinic",
    nombre: "Clinic front desk",
    lema: "Patients, visits, and schedules — self-serve start.",
    descripcion:
      "Scheduling + patient charts adapted from Claver clinical modules. Insurance deep-links are optional later; day-one is cash-pay clinics.",
    sku: "health.enterprise",
    precioUsd: 149,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/agenda",
    estado: "beta",
    listoPct: 55,
    plataforma: "ambos",
    collective: "book",
    wave: 4,
    rubros: ["clinic", "dental", "physio"],
    pains: ["Paper charts", "No-show heavy calendars", "No single patient view"],
    outcomes: ["Patient + visit log", "Booking link", "Upgrade path to full clinical"],
    pasosActivacion: [
      "Activate Clinic Desk trial",
      "Add practitioners",
      "Import patients",
      "Book first visit",
    ],
    gatilloPago: "Full clinical module + multi-location",
    roiCopy: "Replaces fragmented tools for small practices",
    freeLimit: "Lite scheduling in trial",
    messagingNote: "SMS appointment reminders",
  },
  {
    slug: "fleet",
    coreSlug: "logistica-fleet",
    marca: "Claver Fleet",
    nombre: "Delivery POD & routes",
    lema: "Proof of delivery on the driver’s phone.",
    descripcion:
      "Routes, remitos/POD, and geo distance — software-first fleet control without telematics hardware required.",
    sku: "logistics.fleet_enterprise",
    precioUsd: 149,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard",
    estado: "beta",
    listoPct: 50,
    plataforma: "ambos",
    collective: "field",
    wave: 4,
    rubros: ["last-mile", "wholesale-delivery", "field-service"],
    pains: ["Paper POD", "No stop visibility", "Disputes on delivery"],
    outcomes: ["Mobile POD", "Route sheet", "Delivery history"],
    pasosActivacion: [
      "Activate Fleet trial",
      "Add vehicles/drivers",
      "Create first route",
      "Capture first POD",
    ],
    gatilloPago: "Multi-vehicle + analytics",
    roiCopy: "One avoided delivery dispute pays months",
    freeLimit: "Single route trial",
    messagingNote: "SMS ETA optional",
  },
  {
    slug: "cash-drawer",
    coreSlug: "caja",
    marca: "Claver Cash Drawer",
    nombre: "Shift control & blind count",
    lema: "Know if the drawer is short before tomorrow.",
    descripcion:
      "Open/close shifts, movement log, long-open alerts, and variance — for multi-shift counters.",
    sku: "micro.caja_control",
    precioUsd: 24,
    anclaGratis: false,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/caja",
    estado: "disponible",
    listoPct: 75,
    plataforma: "ambos",
    collective: "counter",
    wave: 2,
    rubros: ["retail", "franchise-unit", "cafe"],
    pains: ["Drawer left open overnight", "No blind count", "Cash gaps unexplained"],
    outcomes: ["Shift open/close", "Variance report", "Open >12h alerts"],
    pasosActivacion: [
      "Activate Cash Drawer",
      "Open first shift",
      "Record movements",
      "Close with blind count",
    ],
    gatilloPago: "Alerts + multi-register after trial",
    roiCopy: "Catching one $200 variance pays a year",
    freeLimit: "Basic open/close in trial",
    messagingNote: "Owner alert SMS optional",
  },
]

export const US_SAAS_SLUGS = US_SAAS_APPS.map((a) => a.slug) as readonly string[]

export const US_DESTACADOS = [
  "house-tab",
  "collect",
  "confirm",
  "deposit",
  "memberships",
  "pos",
  "route",
  "rent",
] as const

export function getUsSaasApp(slug: string): UsSaasApp | null {
  return US_SAAS_APPS.find((a) => a.slug === slug) ?? null
}

export function getUsAppByCoreSlug(coreSlug: string): UsSaasApp | null {
  return US_SAAS_APPS.find((a) => a.coreSlug === coreSlug) ?? null
}

export function getUsAppBySku(sku: string): UsSaasApp | null {
  return (
    US_SAAS_APPS.find((a) => a.sku === sku || a.skusAdicionales?.includes(sku)) ?? null
  )
}

export function usAppsByWave(wave: 1 | 2 | 3 | 4): UsSaasApp[] {
  return US_SAAS_APPS.filter((a) => a.wave === wave)
}

export function usAppsByCollective(id: UsCollectiveId): UsSaasApp[] {
  return US_SAAS_APPS.filter((a) => a.collective === id)
}

export function usMarketplaceGroups(): {
  activas: UsSaasApp[]
  beta: UsSaasApp[]
  proximamente: UsSaasApp[]
} {
  const sorted = [...US_SAAS_APPS].sort((a, b) => a.wave - b.wave || a.nombre.localeCompare(b.nombre))
  return {
    activas: sorted.filter((a) => a.estado === "disponible" && a.listoPct >= 65),
    beta: sorted.filter((a) => a.estado === "beta"),
    proximamente: sorted.filter((a) => a.estado === "proximamente"),
  }
}

export function fmtPrecioUsd(n: number): string {
  if (n === 0) return "Free"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

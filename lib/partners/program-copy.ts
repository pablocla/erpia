/**
 * Programa Partner Claver — reglas oficiales y marketing agresivo.
 * Fuente de verdad para landing, docs Clavernet y portal.
 */

import { AFILIADO_RATES, normalizeReferralCode } from "@/lib/partners/affiliate-config"

export const PARTNER_PROGRAM = {
  name: "Red de Partners Claver",
  heroBadge: "El gratis es tu gancho. La comisión es del extra.",
  tagline: "Dejá la libreta gratis. Cobrás cuando el comercio activa Cobrá, AFIP o una 2ª caja.",
  oneLiner:
    "Entrás sin pagar. Te llevás el 100% del primer mes de cada extra que el comercio pague, y el 30% mientras siga pagando. La ancla $0 no genera comisión: es el gancho que nadie más puede regalar.",
  maxLevels: 2,
  rates: {
    sellerN1: Math.round(AFILIADO_RATES.sellerNivel1 * 100),
    sellerN2: Math.round(AFILIADO_RATES.sellerNivel2 * 100),
    implementerN1: Math.round(AFILIADO_RATES.implementerNivel1 * 100),
    implementerN2: Math.round(AFILIADO_RATES.implementerNivel2 * 100),
  },
  roles: [
    {
      id: "vendedor_campo",
      title: "Vendedor de campo",
      forWho: "Comerciales de calle, independientes, gente con llegada a kioscos y almacenes.",
      earns:
        "100% del primer mes de cada extra pago (Cobrá, AFIP, 2ª caja) + 30% recurrente de esos extras. La libreta gratis no paga comisión: es tu gancho. Entrás $0.",
      n2: "Tu laburo es dejar el QR en el local, que anoten fiados, y volver cuando duela el cobro. Sin jefes ni inversión.",
    },
    {
      id: "coordinador_celula",
      title: "Coordinador de célula",
      forWho: "Quien arma equipo: agencia, líder de vendedores, implementador con gente a cargo.",
      earns: "5% de lo que paguen los comercios de tu red (N2) + tus comisiones directas de extra.",
      n2: "Célula = mérito (20 comercios que paguen extra) o canon $500.000 ARS. 20 fiados gratis no cuentan.",
    },
  ],
  rules: [
    "Comisión solo cuando el comercio paga un extra o un setup. Fiado $0 = $0 para vos.",
    "Hasta 2 niveles. N1 sobre el extra del comercio; N2 sobre lo que cierre quien vos invitaste.",
    "Bounty: 100% del primer mes de cada extra nuevo. Después, 30% seller / 20% implementer mientras pague.",
    "Sin membresía ni stock. Ser partner es gratis.",
    "Crédito interno 60 días (pagás tu Claver sin MP). Después, retiro cash manual. Clawback 30 días si hay reembolso.",
  ],
  notThis: [
    "No es pirámide: no se cobra por reclutar, se cobra si el comercio paga un extra real.",
    "No hay $50.000 por pegar un QR. Ese número, si aparece, es setup de quien implementa AFIP/hardware.",
    "No prometemos comisión sobre la libreta gratis. El gancho es tuyo; la plata, del extra.",
  ],
  howItWorks: [
    {
      step: 1,
      title: "Activá tu código",
      body: "Entrá al portal y copiá tu link: claver.com.ar/f?ref=TUCODIGO",
    },
    {
      step: 2,
      title: "Dejá el gancho",
      body: "Calco, QR o WhatsApp. El comercio arranca la libreta (y la caja) sin tarjeta.",
    },
    {
      step: 3,
      title: "Cuando duele, cobra el extra",
      body: "Cobrá, AFIP o 2ª caja. Ahí se acredita tu comisión — no antes.",
    },
    {
      step: 4,
      title: "Crédito, después cash",
      body: "Los primeros 60 días el saldo paga tu Claver. Después pedís retiro. Un analista liquida.",
    },
  ],
  ctaPortal: "/dashboard/partner-portal",
  ctaRegister: "/login/register",
  ctaLogin: "/login?next=/dashboard/partner-portal",
  paths: {
    landing: "/claver/partners",
    portal: "/dashboard/partner-portal",
    docs: "/claver/partners#reglas",
  },
} as const

export const PARTNER_PROGRAM_US = {
  name: "Claver Partner Network",
  heroBadge: "Free House Tab is the hook. You earn on the paid extra.",
  tagline: "Give shops a free ledger. Earn when they turn on Collect, invoicing, or a second register.",
  oneLiner:
    "Join free. You keep 100% of month 1 on each paid extra, then 30% while they keep paying. Free House Tab does not pay commission — it is the door.",
  maxLevels: 2,
  rates: {
    sellerN1: Math.round(AFILIADO_RATES.sellerNivel1 * 100),
    sellerN2: Math.round(AFILIADO_RATES.sellerNivel2 * 100),
    implementerN1: Math.round(AFILIADO_RATES.implementerNivel1 * 100),
    implementerN2: Math.round(AFILIADO_RATES.implementerNivel2 * 100),
  },
  roles: [
    {
      id: "field_seller",
      title: "🔥 Field Seller (Street Direct)",
      forWho: "Independent sales reps, field agents, and local B2B hustlers.",
      earns: "100% of month 1 on each paid extra (Collect, invoicing, extra register) + 30% recurring on those extras. Free House Tab pays $0 commission — it is your hook. Joining is free.",
      n2: "Your focus is hitting the streets, closing local shops (bars, salons, trades, gyms) and getting paid. No bosses, no upfront inventory.",
    },
    {
      id: "cell_lead",
      title: "👑 Cell Lead (Team Builder)",
      forWho: "Experienced sales pros, agency owners, or team builders.",
      earns: "5% passive on everything your cell (Level 2) sells + your direct commissions.",
      n2: "Cell = merit (20 shops that PAY an extra) or $799 cell license. Twenty free ledgers do not count.",
    },
  ],
  rules: [
    "Commission only when the shop pays an extra or a setup fee. Free House Tab = $0 for you.",
    "Two levels max. L1 on the shop extra; L2 on extras closed by partners you invited.",
    "Bounty: 100% of month 1 on each new extra. Then 30% seller / 20% implementer while they pay.",
    "No membership, no inventory. Joining is free.",
    "Internal credit for 60 days (pay your own Claver). Then manual cash-out. 30-day clawback on refunds.",
  ],
  notThis: [
    "Not a pyramid scheme: this is a real product with real value and real customers.",
    "We don't charge you a membership fee to join, nor force you to buy initial stock.",
    "You don't rely on empty promises: if your network sells and the software is used, you get real money.",
  ],
  howItWorks: [
    {
      step: 1,
      title: "Activate your code",
      body: "Open the portal and copy your street link: /f?ref=YOURCODE",
    },
    {
      step: 2,
      title: "Build your network",
      body: "Share your link with local businesses and add sub-partners under your wing to earn passive L2 commissions.",
    },
    {
      step: 3,
      title: "They pay the extra",
      body: "House Tab starts free. Commission credits when they pay Collect, invoicing, or another extra — not before.",
    },
    {
      step: 4,
      title: "Get paid",
      body: "Use the balance to pay your own Claver account, or request a cash payout to your bank account.",
    },
  ],
  ctaPortal: "/dashboard/partner-portal",
  ctaRegister: "/login/register",
  ctaLogin: "/login?next=/dashboard/partner-portal",
  paths: {
    landing: "/claver/partners",
    portal: "/dashboard/partner-portal",
    docs: "/claver/partners#rules",
  },
} as const

function appBaseUrl(baseUrl?: string): string {
  return (baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://claver.com.ar").replace(/\/$/, "")
}

/** QR de calle y link del portal: landing `/f`, no el formulario de alta. */
export function buildReferralStreetUrl(code: string, opts?: { baseUrl?: string }): string {
  const params = new URLSearchParams({ ref: normalizeReferralCode(code) })
  return `${appBaseUrl(opts?.baseUrl)}/f?${params.toString()}`
}

export function buildReferralRegisterUrl(
  code: string,
  opts?: { baseUrl?: string; activar?: string; market?: string },
): string {
  const isUs = opts?.market === "us"
  const defaultActivar = isUs ? "house-tab" : "pos.fiado_barrio"

  const params = new URLSearchParams({ ref: normalizeReferralCode(code) })
  params.set("activar", opts?.activar ?? defaultActivar)
  if (isUs) params.set("market", "us")

  return `${appBaseUrl(opts?.baseUrl)}/login/register?${params.toString()}`
}

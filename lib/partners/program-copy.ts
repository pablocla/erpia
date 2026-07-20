/**
 * Programa Partner Claver — reglas oficiales y marketing agresivo.
 * Fuente de verdad para landing, docs Clavernet y portal.
 */

import { AFILIADO_RATES } from "@/lib/partners/affiliate-config"

export const PARTNER_PROGRAM = {
  name: "Red de Partners Claver",
  tagline: "Construí tu propia red de ingresos pasivos recurrentes con el ERP N°1 de Argentina.",
  oneLiner:
    "Ganá comisiones todos los meses vendiendo el software que los comercios y distribuidoras necesitan para no perder plata. Si tus referidos crecen, vos cobrás más.",
  maxLevels: 2,
  rates: {
    sellerN1: Math.round(AFILIADO_RATES.sellerNivel1 * 100),
    sellerN2: Math.round(AFILIADO_RATES.sellerNivel2 * 100),
    implementerN1: Math.round(AFILIADO_RATES.implementerNivel1 * 100),
    implementerN2: Math.round(AFILIADO_RATES.implementerNivel2 * 100),
  },
  roles: [
    {
      id: "seller",
      title: "Líder de Red (Vendedor / Afiliado)",
      forWho: "Comerciales independientes, influencers, y emprendedores de calle.",
      earns: `${Math.round(AFILIADO_RATES.sellerNivel1 * 100)}% mensual recurrente de por vida por cada comercio que traigas (Nivel 1).`,
      n2: `${Math.round(AFILIADO_RATES.sellerNivel2 * 100)}% mensual de toda la facturación de los sub-partners que sumes a tu red (Nivel 2).`,
    },
    {
      id: "implementer",
      title: "Socio Tecnológico (Implementador / Contador)",
      forWho: "Técnicos de PC, instaladores, y estudios contables.",
      earns: `100% de la tasa de configuración inicial ($50.000 de Setup) + 15% del abono mensual del cliente.`,
      n2: `5% en Nivel 2. Contadores: Traé 3 clientes activos y tu Pack Contador de Claver es GRATIS de por vida.`,
    },
  ],
  rules: [
    "Comisión real sobre suscripciones pagadas. Se liquida mes a mes cuando el cliente abona.",
    "Estructura transparente de hasta 2 niveles. Cobrás por tu venta y por las ventas de tu red de invitados.",
    "El cliente adquiere un software real de alta demanda (caja, stock, AFIP, Libreta Fiado).",
    "Sin costo de ingreso. Convertirse en partner de Claver es gratis y se activa en 10 segundos.",
    "Billetera de comisiones: primero podés pagar tu propia suscripción Claver con el crédito (sin Mercado Pago). También pedís retiro cash (liquidación manual).",
  ],
  notThis: [
    "No es una pirámide de humo: acá hay un producto real con valor y clientes reales.",
    "No te cobramos membresía para ingresar, ni te obligamos a comprar stock inicial.",
    "No dependés de promesas: si tu red vende y usa el sistema, vos cobrás plata de verdad.",
  ],
  howItWorks: [
    {
      step: 1,
      title: "Activá tu código",
      body: "Entrás al portal y obtenés tu link de referidos único de forma inmediata.",
    },
    {
      step: 2,
      title: "Armá tu red",
      body: "Compartí tu link con comercios y sumá sub-partners bajo tu ala para ganar comisiones pasivas N2.",
    },
    {
      step: 3,
      title: "El cliente paga",
      body: "Los comercios tienen 14 días de prueba. Cuando pagan su primera suscripción, tu comisión se acredita.",
    },
    {
      step: 4,
      title: "Cobrás (crédito o cash)",
      body: "Usá el saldo para pagar tu Claver al instante, o solicitá retiro cash para que un analista te liquide por transferencia.",
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

export function buildReferralRegisterUrl(
  code: string,
  opts?: { baseUrl?: string; activar?: string },
): string {
  const base = (opts?.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://claver.com.ar").replace(
    /\/$/,
    "",
  )
  const params = new URLSearchParams({ ref: code })
  params.set("activar", opts?.activar ?? "fiado")
  return `${base}/login/register?${params.toString()}`
}

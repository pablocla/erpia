/**
 * Onboarding post-activación pool-propiedad — checklist "Aha!" (PLG + SLG).
 * Los demo seeds los inyecta industry-demo-seeds (Gemini); acá solo el estado del embudo.
 */

import { prisma } from "@/lib/prisma"

export const PROPIEDAD_ONBOARDING_STEPS = [
  {
    id: "abrir_consorcios",
    label: "Revisá tu edificio y unidades",
    href: "/dashboard/nicho/consorcios",
  },
  {
    id: "liquidar_pdf",
    label: "Liquidá expensas o descargá el PDF",
    href: "/dashboard/nicho/consorcios",
  },
  {
    id: "primer_wa",
    label: "Enviá el primer aviso por WhatsApp",
    href: "/dashboard/nicho/consorcios",
  },
  {
    id: "ver_cartera",
    label: "Explorá la cartera inmobiliaria",
    href: "/dashboard/nicho/inmobiliaria",
  },
] as const

export type PropiedadOnboardingStepId = (typeof PROPIEDAD_ONBOARDING_STEPS)[number]["id"]

const CLAVE = "onboarding_propiedad"

export type PropiedadOnboardingState = {
  origen: string
  iniciadoAt: string
  completados: PropiedadOnboardingStepId[]
  dismissed: boolean
}

export async function iniciarOnboardingPropiedad(
  empresaId: number,
  origen: string,
): Promise<PropiedadOnboardingState> {
  const state: PropiedadOnboardingState = {
    origen,
    iniciadoAt: new Date().toISOString(),
    completados: [],
    dismissed: false,
  }
  await upsertState(empresaId, state)
  return state
}

export async function obtenerOnboardingPropiedad(
  empresaId: number,
): Promise<PropiedadOnboardingState | null> {
  const row = await prisma.parametroFiscal.findFirst({
    where: { empresaId, clave: CLAVE, pais: "AR" },
  })
  if (!row?.descripcion) return null
  try {
    return JSON.parse(row.descripcion) as PropiedadOnboardingState
  } catch {
    return null
  }
}

export async function marcarPasoPropiedad(
  empresaId: number,
  stepId: PropiedadOnboardingStepId,
): Promise<PropiedadOnboardingState | null> {
  const current = (await obtenerOnboardingPropiedad(empresaId)) ?? {
    origen: "manual",
    iniciadoAt: new Date().toISOString(),
    completados: [],
    dismissed: false,
  }
  if (current.dismissed) return current
  if (!current.completados.includes(stepId)) {
    current.completados.push(stepId)
  }
  await upsertState(empresaId, current)
  return current
}

export async function cerrarOnboardingPropiedad(empresaId: number): Promise<void> {
  const current = await obtenerOnboardingPropiedad(empresaId)
  if (!current) return
  current.dismissed = true
  await upsertState(empresaId, current)
}

export function onboardingPropiedadPendiente(state: PropiedadOnboardingState | null): boolean {
  if (!state || state.dismissed) return false
  return state.completados.length < PROPIEDAD_ONBOARDING_STEPS.length
}

async function upsertState(empresaId: number, state: PropiedadOnboardingState) {
  await prisma.parametroFiscal.upsert({
    where: { empresaId_clave_pais: { empresaId, clave: CLAVE, pais: "AR" } },
    update: { descripcion: JSON.stringify(state), valor: state.completados.length },
    create: {
      empresaId,
      clave: CLAVE,
      valor: state.completados.length,
      descripcion: JSON.stringify(state),
      categoria: "comercial",
      pais: "AR",
    },
  })
}
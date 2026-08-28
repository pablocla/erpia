/**
 * Landings de calle — un dolor, un CTA. No es el hub Grupo.
 * `/f` kiosco · `/f/servicios` oficios. Spec: COBRAR_SOLO_PROBLEMA_RESUELTO.md
 */

export const LANDING_F_PATH = "/f"
export const LANDING_F_ACTIVAR = "pos.fiado_barrio"

export const LANDING_F_SERVICIOS_PATH = "/f/servicios"
/** Motor oficios (presupuesto 3 niveles). Ancla $0 de presupuestos = HUM-ancla-oficios. */
export const LANDING_F_SERVICIOS_ACTIVAR = "niche.oficios"

export const LANDING_F_CTA_CLASS =
  "inline-flex h-14 w-full items-center justify-center rounded-xl bg-[var(--landing-cta)] px-8 text-base font-bold uppercase tracking-wide text-[var(--landing-cta-fg)] shadow-lg shadow-orange-500/20 transition hover:bg-[var(--landing-cta-hover)] hover:scale-[1.02] sm:w-auto sm:min-w-[17rem]"

function withRef(activar: string, ref?: string | null): string {
  const params = new URLSearchParams({ activar })
  const code = ref?.trim()
  if (code) params.set("ref", code)
  return `/login/register?${params.toString()}`
}

export function landingFRegisterHref(ref?: string | null): string {
  return withRef(LANDING_F_ACTIVAR, ref)
}

export function landingFServiciosRegisterHref(ref?: string | null): string {
  return withRef(LANDING_F_SERVICIOS_ACTIVAR, ref)
}

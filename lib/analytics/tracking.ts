/**
 * Funciones de tracking y analítica simple para eventos de Sub-SaaS.
 */

export function trackSubSaasSignup(slug: string, empresaId: number) {
  // En una app real, esto enviaría el evento a Mixpanel, PostHog, Google Analytics, etc.
  // Por ahora, simplemente lo logueamos en la consola del servidor.
  console.log(`[TRACKING] Sub-SaaS Signup: ${slug} (Empresa: ${empresaId})`)
}

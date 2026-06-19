/** Copy es-AR alineado con docs/automation/UI_COPY_ES_AR.md */
export const AUTOMATION_ERROR_COPY: Record<string, string> = {
  module_not_entitled:
    "El módulo de automatización no está contratado. Contactá a soporte para activar automation.n8n_hub.",
  usage_limit_exceeded:
    "Plan superado. Tu límite de eventos mensuales para el módulo de automatización se agotó. Actualizá tu suscripción.",
  automation_inactive:
    "La automatización está desactivada. Activá el switch o completá el asistente de configuración.",
  no_event_map:
    "No hay URL de webhook mapeada para este evento. Configurala en la pestaña Eventos.",
  invalid_hmac:
    "Firma HMAC rechazada. Validá que la llave secreta en n8n coincida con la configurada en NOP.",
  n8n_unreachable:
    "n8n no responde. NOP intentó enviar el webhook pero recibió un error de conexión o timeout. Reintentando en background.",
}

export function automationErrorMessage(reason?: string): string {
  if (!reason) return AUTOMATION_ERROR_COPY.n8n_unreachable
  return AUTOMATION_ERROR_COPY[reason] ?? reason
}
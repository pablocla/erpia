export { aiService } from "./ai-service"
export { getAIConfig, AI_MODELS, HARDWARE_PROFILE } from "./ai-config"
export type { AIConfig, AIModelConfig, HardwareReport } from "./ai-config"
export type { AIMessage, AIResponse, AIJsonResponse } from "./ai-service"
export {
  analizarAlertasInteligentes,
  clasificarProducto,
  analizarCobranza,
  predecirCompras,
  responderPregunta,
  detectarAnomalias,
  procesarOnboardingConversacional,
  generarPresupuestoPorTexto,
} from "./analyzers"
export {
  getIAConfigRubro,
  getAllIAFeatures,
  getIAFeaturesForRubro,
  IA_POR_RUBRO,
} from "./valor-agregado-rubro"
export type { IAFeature, IAConfigRubro } from "./valor-agregado-rubro"
// Context & business layer
export { buildEmpresaContexto, invalidateContextCache } from "./context-builder"
export type { EmpresaContexto } from "./context-builder"
export { buildSystemPrompt } from "./system-prompts"
export {
  chatConNegocio,
  generarAlertasInteligentes,
  generarReporte,
  generarMensajesWhatsApp,
  generarProyeccion,
  AlertaSchema,
  ReporteSchema,
  MensajeWhatsAppSchema,
  ProyeccionSchema,
} from "./ai-business"
export type { AlertasResult, ReporteResult, MensajesWAResult, ProyeccionResult } from "./ai-business"
// IA module guard (per-empresa toggle)
export { isIAEnabled } from "./ia-guard"

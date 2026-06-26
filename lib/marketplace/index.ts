export {
  AUTOPOOL_BRAND,
  AUTOPOOL_NICHOS,
  AUTOPOOL_TIPOS,
  AUTOPOOL_ENTRIES,
  AUTOPOOL_ENTRY_TEMPLATE,
  getAutopoolByTipo,
  getAutopoolByNicho,
  getAutopoolDestacados,
  getAutopoolRemotos,
  detectAutopoolNicho,
  type AutopoolEntry,
  type AutopoolNichoId,
  type AutopoolTipoId,
  type AutopoolMaturity,
  type AutopoolCertLevel,
} from "./autopool-manifest"

export { MARKETPLACE_CATALOG, type MarketplaceSku, type AutoCertLevel } from "./marketplace-catalog"
export { MARKETPLACE_BUNDLES, getBundle, type MarketplaceBundle } from "./bundles"
export { resolveSku, type ResolvedSku } from "./catalog-resolver"
export {
  PRODUCT_RUNBOOKS,
  getRunbook,
  getRunbookOrDefault,
  type ProductRunbook,
  type RunbookPaso,
  type EjecutorPaso,
} from "./product-runbooks"
export {
  crearTareaMarketplace,
  listTareasAnalista,
  completarTarea,
  resolverAnalistaEmpresa,
  asegurarAsignacionAnalista,
} from "./analyst-task-service"
export { provisionSku, provisionOrden, finalizarProvisionManual } from "./provision-service"
export {
  activarSecretariaCobranzas,
  resumenCobranzasPendientes,
  DEFAULT_COBRANZAS_WA_CONFIG,
  type CobranzasWaConfig,
} from "./cobranzas-wa-service"
export {
  INTANGIBLES_TOP5,
  INTANGIBLE_PREMIUM_7,
  PREMIUM_7_BUNDLE_ID,
  getIntangibleBySku,
  getIntangiblePrioridadAhora,
  getPremiumIntangibleBySku,
  getPremiumIntangiblesDisponibles,
  type IntangibleServiceMeta,
  type IntangiblePremiumMeta,
} from "./intangible-services"
export { analizarRiesgoPosHoy, type GuardianPosResumen } from "./guardian-pos-service"
export { conciliarLiquidacionPagos, type LiquidacionResumen } from "./liquidacion-pagos-service"
export { generarPropuestasReposicion, type PropuestaReposicion } from "./reponedor-jit-service"
export {
  auditarPercepcionesRecuperables,
  type RecuperadorFiscalResumen,
} from "./recuperador-fiscal-service"
export {
  activarGuardianPos,
  activarLiquidacionPagos,
  activarReponedorJit,
  activarRecuperadorFiscal,
  activarOcrCompras,
  activarReactivadorClientes,
} from "./premium-activators"
export {
  ENGANCHES,
  getEngancheBySku,
  getEnganchesPorNicho,
  getEnganchesPorTier,
  getBundlesEnganche,
  resumenEnganches,
  type EngancheProducto,
  type EngancheTier,
  type EngancheNicho,
  type EngancheResumen,
} from "./enganche-catalog"

export {
  procesarPedidosAutomaticosProveedores,
  type PedidosAutomaticosResult,
} from "./pedido-automatico-service"
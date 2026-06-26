import { activarLibretaFiado } from "@/lib/fiado/fiado-provision"
import { activarSecretariaCobranzas } from "@/lib/marketplace/cobranzas-wa-service"
import {
  activarGuardianPos,
  activarLiquidacionPagos,
  activarReponedorJit,
  activarRecuperadorFiscal,
  activarOcrCompras,
  activarReactivadorClientes,
  desactivarPremiumSku,
  REGLA_GUARDIAN_POS,
  REGLA_LIQUIDACION_PAGOS,
  REGLA_REPONEDOR_JIT,
  REGLA_RECUPERADOR_FISCAL,
  REGLA_OCR_COMPRAS,
  REGLA_REACTIVADOR,
} from "@/lib/marketplace/premium-activators"
import {
  activarMargenGuard,
  activarZeroWaste,
  activarStockCeroAlert,
  activarPromosPago,
  activarListaDistribuidora,
  activarPanicoVecinal,
  activarEnvasesGaseosas,
  activarValeDinero,
  activarRecargasServicios,
  activarBalanzaPeso,
  activarPromosCantidad,
  activarTicketRegalo,
  activarPedidoDistribuidora,
  activarMermasRoturas,
  activarArqueoCiego,
  activarListaMayoristaPos,
  activarChequesCartera,
  activarInventarioExpress,
} from "@/lib/almacen-rosario/activators"
import { prisma } from "@/lib/prisma"
import { provisionOpoDefaults } from "@/lib/opo/opo-config-service"

export type ProductHook = (empresaId: number) => Promise<void>

const REGLA_COBRANZAS = "Secretaria Cobranzas WA (AutoPool)"

const HOOKS: Record<string, { onActivate?: ProductHook; onDeactivate?: ProductHook }> = {
  "pos.fiado_barrio": { onActivate: activarLibretaFiado },
  "intang.cobranzas_wa": {
    onActivate: activarSecretariaCobranzas,
    onDeactivate: async (empresaId) => {
      await prisma.reglaAlerta.updateMany({
        where: { empresaId, nombre: REGLA_COBRANZAS },
        data: { activo: false },
      })
    },
  },
  "intang.guardian_pos": {
    onActivate: activarGuardianPos,
    onDeactivate: (empresaId) => desactivarPremiumSku(empresaId, [REGLA_GUARDIAN_POS]),
  },
  "intang.liquidacion_pagos": {
    onActivate: activarLiquidacionPagos,
    onDeactivate: (empresaId) => desactivarPremiumSku(empresaId, [REGLA_LIQUIDACION_PAGOS]),
  },
  "intang.reponedor_jit": {
    onActivate: activarReponedorJit,
    onDeactivate: (empresaId) => desactivarPremiumSku(empresaId, [REGLA_REPONEDOR_JIT]),
  },
  "intang.recuperador_fiscal": {
    onActivate: activarRecuperadorFiscal,
    onDeactivate: (empresaId) => desactivarPremiumSku(empresaId, [REGLA_RECUPERADOR_FISCAL]),
  },
  "intang.ocr_compras": {
    onActivate: activarOcrCompras,
    onDeactivate: (empresaId) => desactivarPremiumSku(empresaId, [REGLA_OCR_COMPRAS]),
  },
  "intang.reactivador_clientes": {
    onActivate: activarReactivadorClientes,
    onDeactivate: (empresaId) => desactivarPremiumSku(empresaId, [REGLA_REACTIVADOR]),
  },
  "pos.margen_guard": { onActivate: activarMargenGuard },
  "pos.zero_waste": { onActivate: activarZeroWaste },
  "pos.stock_cero_alert": { onActivate: activarStockCeroAlert },
  "pos.promos_pago": { onActivate: activarPromosPago },
  "pos.lista_distribuidora": { onActivate: activarListaDistribuidora },
  "pos.panico_vecinal": { onActivate: activarPanicoVecinal },
  "pos.envases_gaseosas": { onActivate: activarEnvasesGaseosas },
  "pos.vale_dinero": { onActivate: activarValeDinero },
  "pos.recargas_servicios": { onActivate: activarRecargasServicios },
  "pos.balanza_peso": { onActivate: activarBalanzaPeso },
  "pos.promos_cantidad": { onActivate: activarPromosCantidad },
  "pos.ticket_regalo": { onActivate: activarTicketRegalo },
  "pos.pedido_distribuidora": { onActivate: activarPedidoDistribuidora },
  "pos.mermas_roturas": { onActivate: activarMermasRoturas },
  "pos.arqueo_ciego": { onActivate: activarArqueoCiego },
  "pos.lista_mayorista_pos": { onActivate: activarListaMayoristaPos },
  "pos.cheques_cartera": { onActivate: activarChequesCartera },
  "pos.inventario_express": { onActivate: activarInventarioExpress },
  "bridge.opo_studio": { onActivate: provisionOpoDefaults },
}

export function getProductHooks(sku: string) {
  return HOOKS[sku]
}
/**
 * TipoMovimientoService — Catálogo y Validación de Tipos de Movimiento Transversales
 *
 * Parametriza el comportamiento de transacciones operativas en:
 * - Stock (signoStock: +1, -1, 0)
 * - Caja (signoCaja: +1, -1, 0)
 * - Contabilidad (afectaContabilidad: boolean)
 * - Autorizaciones (requiereAprobacion: boolean)
 * - Políticas de Inventario (permiteSinStock: boolean)
 */

export type ModuloTransaccional = "STOCK" | "CAJA" | "BANCOS" | "VENTAS" | "COMPRAS" | "PRODUCCION"

export interface DefinicionTipoMovimiento {
  codigo: string
  descripcion: string
  moduloOrigen: ModuloTransaccional
  signoStock: 1 | -1 | 0
  signoCaja: 1 | -1 | 0
  afectaContabilidad: boolean
  requiereAprobacion: boolean
  permiteSinStock: boolean
  activo: boolean
}

// Catálogo base predeterminado del sistema (extensible por tenant)
export const TIPOS_MOVIMIENTO_BASE: Record<string, DefinicionTipoMovimiento> = {
  // Ventas
  VENTA_CONTADO: {
    codigo: "VENTA_CONTADO",
    descripcion: "Venta al Contado en Mostrador / POS",
    moduloOrigen: "VENTAS",
    signoStock: -1,
    signoCaja: 1,
    afectaContabilidad: true,
    requiereAprobacion: false,
    permiteSinStock: false,
    activo: true,
  },
  VENTA_CUENTA_CORRIENTE: {
    codigo: "VENTA_CUENTA_CORRIENTE",
    descripcion: "Venta a Crédito / Cuenta Corriente",
    moduloOrigen: "VENTAS",
    signoStock: -1,
    signoCaja: 0,
    afectaContabilidad: true,
    requiereAprobacion: false,
    permiteSinStock: false,
    activo: true,
  },
  NOTA_CREDITO_DEVOLUCION: {
    codigo: "NOTA_CREDITO_DEVOLUCION",
    descripcion: "Nota de Crédito con Reingreso de Mercadería",
    moduloOrigen: "VENTAS",
    signoStock: 1,
    signoCaja: -1,
    afectaContabilidad: true,
    requiereAprobacion: true,
    permiteSinStock: true,
    activo: true,
  },

  // Compras
  COMPRA_MERCADERIA: {
    codigo: "COMPRA_MERCADERIA",
    descripcion: "Recepción de Mercadería para Reventa",
    moduloOrigen: "COMPRAS",
    signoStock: 1,
    signoCaja: 0,
    afectaContabilidad: true,
    requiereAprobacion: false,
    permiteSinStock: true,
    activo: true,
  },
  COMPRA_GASTO_SERVICIO: {
    codigo: "COMPRA_GASTO_SERVICIO",
    descripcion: "Compra de Insumos o Servicios Generales",
    moduloOrigen: "COMPRAS",
    signoStock: 0,
    signoCaja: 0,
    afectaContabilidad: true,
    requiereAprobacion: false,
    permiteSinStock: true,
    activo: true,
  },

  // Stock / Inventario
  AJUSTE_SOBRANTE_STOCK: {
    codigo: "AJUSTE_SOBRANTE_STOCK",
    descripcion: "Ajuste de Inventario Físico Positivo",
    moduloOrigen: "STOCK",
    signoStock: 1,
    signoCaja: 0,
    afectaContabilidad: true,
    requiereAprobacion: true,
    permiteSinStock: true,
    activo: true,
  },
  AJUSTE_MERMA_ROTURA: {
    codigo: "AJUSTE_MERMA_ROTURA",
    descripcion: "Baja por Merma, Rotura o Vencimiento",
    moduloOrigen: "STOCK",
    signoStock: -1,
    signoCaja: 0,
    afectaContabilidad: true,
    requiereAprobacion: true,
    permiteSinStock: false,
    activo: true,
  },
  TRANSFERENCIA_ENTRE_DEPOSITOS: {
    codigo: "TRANSFERENCIA_ENTRE_DEPOSITOS",
    descripcion: "Traspaso de Mercadería entre Almacenes",
    moduloOrigen: "STOCK",
    signoStock: 0, // Neutro a nivel global; -1 origen y +1 destino
    signoCaja: 0,
    afectaContabilidad: false,
    requiereAprobacion: false,
    permiteSinStock: false,
    activo: true,
  },

  // Caja & Bancos
  COBRO_CLIENTE_EFECTIVO: {
    codigo: "COBRO_CLIENTE_EFECTIVO",
    descripcion: "Recibo de Cobranza en Efectivo",
    moduloOrigen: "CAJA",
    signoStock: 0,
    signoCaja: 1,
    afectaContabilidad: true,
    requiereAprobacion: false,
    permiteSinStock: true,
    activo: true,
  },
  PAGO_PROVEEDOR_TRANSFERENCIA: {
    codigo: "PAGO_PROVEEDOR_TRANSFERENCIA",
    descripcion: "Orden de Pago por Transferencia Bancaria",
    moduloOrigen: "BANCOS",
    signoStock: 0,
    signoCaja: 0,
    afectaContabilidad: true,
    requiereAprobacion: true,
    permiteSinStock: true,
    activo: true,
  },
}

export class TipoMovimientoService {
  /**
   * Obtiene la definición de un tipo de movimiento por su código.
   */
  getTipoMovimiento(codigo: string): DefinicionTipoMovimiento {
    const tipo = TIPOS_MOVIMIENTO_BASE[codigo]
    if (!tipo) {
      throw new Error(`Tipo de movimiento no reconocido: ${codigo}`)
    }
    return tipo
  }

  /**
   * Lista todos los tipos de movimientos disponibles, opcionalmente filtrados por módulo.
   */
  listar(modulo?: ModuloTransaccional): DefinicionTipoMovimiento[] {
    const list = Object.values(TIPOS_MOVIMIENTO_BASE).filter((t) => t.activo)
    if (modulo) {
      return list.filter((t) => t.moduloOrigen === modulo)
    }
    return list
  }

  /**
   * Valida si un movimiento puede ejecutarse según las restricciones operativas.
   */
  validarOperacion(
    codigo: string,
    params: {
      cantidad?: number
      stockDisponible?: number
      monto?: number
      usuarioEsSupervisor?: boolean
    }
  ): { valido: boolean; motivo?: string } {
    const tipo = this.getTipoMovimiento(codigo)

    // 1. Aprobación requerida
    if (tipo.requiereAprobacion && !params.usuarioEsSupervisor) {
      return {
        valido: false,
        motivo: `El movimiento ${tipo.descripcion} requiere autorización de un supervisor.`,
      }
    }

    // 2. Control de stock negativo
    if (
      tipo.signoStock === -1 &&
      !tipo.permiteSinStock &&
      params.cantidad !== undefined &&
      params.stockDisponible !== undefined
    ) {
      if (params.stockDisponible < params.cantidad) {
        return {
          valido: false,
          motivo: `Stock insuficiente: disponible ${params.stockDisponible}, solicitado ${params.cantidad}.`,
        }
      }
    }

    return { valido: true }
  }
}

export const tipoMovimientoService = new TipoMovimientoService()

import { prisma } from "@/lib/prisma"

const DEFAULT_EMPRESA_ID = 1

type MaestroModel =
  | "rubroContable"
  | "tipoAsiento"
  | "tipoComprobanteMaestro"
  | "tipoRetencion"
  | "regimenRetencion"
  | "tipoMovimientoBancario"
  | "conceptoCobroPago"
  | "entidadFinanciera"
  | "sucursal"
  | "cobrador"
  | "tipoOperacionComercial"
  | "cajaTipo"

/**
 * Servicio genérico de maestros empresa-scoped.
 * CRUD uniforme para cualquier tabla maestro paramétrica.
 */
export const maestroService = {
  async listar(modelo: MaestroModel, empresaId = DEFAULT_EMPRESA_ID) {
    return (prisma[modelo] as any).findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
    })
  },

  async obtener(modelo: MaestroModel, id: number) {
    return (prisma[modelo] as any).findUnique({ where: { id } })
  },

  async crear(modelo: MaestroModel, data: Record<string, unknown>, empresaId = DEFAULT_EMPRESA_ID) {
    return (prisma[modelo] as any).create({ data: { ...data, empresaId } })
  },

  async actualizar(modelo: MaestroModel, id: number, data: Record<string, unknown>) {
    return (prisma[modelo] as any).update({ where: { id }, data })
  },

  async desactivar(modelo: MaestroModel, id: number) {
    return (prisma[modelo] as any).update({ where: { id }, data: { activo: false } })
  },
}

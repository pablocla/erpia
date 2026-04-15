import { prisma } from "@/lib/prisma"

const DEFAULT_EMPRESA_ID = 1

/**
 * Servicio de tablas auxiliares genéricas.
 * Permite crear catálogos dinámicos sin migrar schema (ej: "Motivos de Anulación",
 * "Categorías Proveedor", "Tipos de Embalaje", etc.).
 */
export const tablaAuxiliarService = {
  async listarTablas(empresaId = DEFAULT_EMPRESA_ID) {
    return prisma.tablaAuxiliar.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
      include: { _count: { select: { valores: true } } },
    })
  },

  async obtenerTabla(id: number) {
    return prisma.tablaAuxiliar.findUnique({
      where: { id },
      include: { valores: { where: { activo: true }, orderBy: { orden: "asc" } } },
    })
  },

  async obtenerTablaPorCodigo(codigo: string, empresaId = DEFAULT_EMPRESA_ID) {
    return prisma.tablaAuxiliar.findUnique({
      where: { empresaId_codigo: { empresaId, codigo } },
      include: { valores: { where: { activo: true }, orderBy: { orden: "asc" } } },
    })
  },

  async crearTabla(data: { codigo: string; nombre: string; descripcion?: string }, empresaId = DEFAULT_EMPRESA_ID) {
    return prisma.tablaAuxiliar.create({ data: { ...data, empresaId } })
  },

  async actualizarTabla(id: number, data: { nombre?: string; descripcion?: string }) {
    return prisma.tablaAuxiliar.update({ where: { id }, data })
  },

  async eliminarTabla(id: number) {
    return prisma.tablaAuxiliar.update({ where: { id }, data: { activo: false } })
  },

  // ─── VALORES ────────────────────────────────────────────────────────
  async agregarValor(tablaId: number, data: { codigo: string; valor: string; descripcion?: string; orden?: number }) {
    return prisma.valorAuxiliar.create({ data: { ...data, nombre: data.valor, tablaAuxiliarId: tablaId } })
  },

  async actualizarValor(id: number, data: { valor?: string; descripcion?: string; orden?: number }) {
    return prisma.valorAuxiliar.update({ where: { id }, data })
  },

  async eliminarValor(id: number) {
    return prisma.valorAuxiliar.update({ where: { id }, data: { activo: false } })
  },
}

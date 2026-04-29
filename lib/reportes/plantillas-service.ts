import { prisma } from "@/lib/prisma"

const PLANTILLA_TABLA_CODIGO = "PLANTILLAS_REPORTES"
const PLANTILLA_TABLA_NOMBRE = "Plantillas de Reportes"

export interface ReportePlantillaData {
  id?: number
  codigo: string
  nombre: string
  descripcion?: string
  tipo: string
  motor: string
  contenido: string
  version?: number
  orden?: number
  activo?: boolean
}

export const plantillasReportesService = {
  async obtenerTabla(empresaId: number) {
    let tabla = await prisma.tablaAuxiliar.findUnique({
      where: { empresaId_codigo: { empresaId, codigo: PLANTILLA_TABLA_CODIGO } },
    })
    if (!tabla) {
      tabla = await prisma.tablaAuxiliar.create({
        data: {
          empresaId,
          codigo: PLANTILLA_TABLA_CODIGO,
          nombre: PLANTILLA_TABLA_NOMBRE,
          descripcion: "Catálogo de plantillas de reporte configurables para este ERP",
        },
      })
    }
    return tabla
  },

  async listar(empresaId: number) {
    const tabla = await this.obtenerTabla(empresaId)
    return prisma.valorAuxiliar.findMany({
      where: { tablaAuxiliarId: tabla.id, activo: true },
      orderBy: { orden: "asc" },
    })
  },

  async obtener(id: number, empresaId: number) {
    return prisma.valorAuxiliar.findFirst({
      where: {
        id,
        activo: true,
        tablaAuxiliar: {
          empresaId,
        },
      },
      include: {
        tablaAuxiliar: true,
      },
    })
  },

  async crear(data: ReportePlantillaData, empresaId: number) {
    const tabla = await this.obtenerTabla(empresaId)
    return prisma.valorAuxiliar.create({
      data: {
        tablaAuxiliarId: tabla.id,
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        orden: data.orden ?? 0,
        metadata: {
          tipo: data.tipo,
          motor: data.motor,
          contenido: data.contenido,
          version: data.version ?? 1,
        },
        activo: data.activo ?? true,
      },
    })
  },

  async actualizar(id: number, data: Partial<ReportePlantillaData>) {
    const payload: any = {}
    if (data.nombre !== undefined) payload.nombre = data.nombre
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion
    if (data.orden !== undefined) payload.orden = data.orden
    if (data.codigo !== undefined) payload.codigo = data.codigo
    if (data.activo !== undefined) payload.activo = data.activo

    if (data.tipo || data.motor || data.contenido || data.version !== undefined) {
      const metadataPayload: Record<string, unknown> = {}
      if (data.tipo !== undefined) metadataPayload.tipo = data.tipo
      if (data.motor !== undefined) metadataPayload.motor = data.motor
      if (data.contenido !== undefined) metadataPayload.contenido = data.contenido
      if (data.version !== undefined) metadataPayload.version = data.version
      payload.metadata = metadataPayload
    }

    return prisma.valorAuxiliar.update({
      where: { id },
      data: payload,
    })
  },

  async eliminar(id: number) {
    return prisma.valorAuxiliar.update({
      where: { id },
      data: { activo: false },
    })
  },
}

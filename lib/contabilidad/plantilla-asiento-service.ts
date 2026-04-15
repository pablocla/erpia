import { prisma } from "@/lib/prisma"

const DEFAULT_EMPRESA_ID = 1

export const plantillaAsientoService = {
  async listar(empresaId = DEFAULT_EMPRESA_ID) {
    return prisma.plantillaAsiento.findMany({
      where: { empresaId, activo: true },
      include: { lineas: { orderBy: { orden: "asc" } }, tipoAsiento: true },
      orderBy: { nombre: "asc" },
    })
  },

  async obtener(id: number) {
    return prisma.plantillaAsiento.findUnique({
      where: { id },
      include: { lineas: { orderBy: { orden: "asc" } }, tipoAsiento: true },
    })
  },

  async crear(data: {
    codigo: string
    nombre: string
    descripcion?: string
    periodicidad?: string
    tipoAsientoId?: number
    lineas: { cuentaCodigo: string; cuentaNombre?: string; debeFormula?: string; haberFormula?: string; orden?: number }[]
  }, empresaId = DEFAULT_EMPRESA_ID) {
    const { lineas, ...plantillaData } = data
    return prisma.plantillaAsiento.create({
      data: {
        ...plantillaData,
        empresaId,
        lineas: { create: lineas },
      },
      include: { lineas: true },
    })
  },

  async actualizar(id: number, data: {
    nombre?: string
    descripcion?: string
    periodicidad?: string
    tipoAsientoId?: number
    lineas?: { cuentaCodigo: string; cuentaNombre?: string; debeFormula?: string; haberFormula?: string; orden?: number }[]
  }) {
    const { lineas, ...plantillaData } = data
    if (lineas) {
      await prisma.lineaPlantillaAsiento.deleteMany({ where: { plantillaId: id } })
    }
    return prisma.plantillaAsiento.update({
      where: { id },
      data: {
        ...plantillaData,
        ...(lineas ? { lineas: { create: lineas } } : {}),
      },
      include: { lineas: { orderBy: { orden: "asc" } } },
    })
  },

  async eliminar(id: number) {
    return prisma.plantillaAsiento.update({ where: { id }, data: { activo: false } })
  },

  /**
   * Genera un asiento contable a partir de una plantilla, reemplazando parámetros.
   * @param plantillaId ID de la plantilla
   * @param parametros Map de nombre -> valor numérico (ej: { "PARAM_MONTO": 50000 })
   * @param fecha Fecha del asiento
   * @param descripcion Descripción adicional
   */
  async generarDesdePlantilla(
    plantillaId: number,
    parametros: Record<string, number>,
    fecha: Date,
    descripcion: string,
    empresaId = DEFAULT_EMPRESA_ID,
  ) {
    const plantilla = await prisma.plantillaAsiento.findUnique({
      where: { id: plantillaId },
      include: { lineas: { orderBy: { orden: "asc" } } },
    })
    if (!plantilla) throw new Error("Plantilla no encontrada")

    const resolverFormula = (formula: string | null): number => {
      if (!formula) return 0
      if (parametros[formula] !== undefined) return parametros[formula]
      const num = parseFloat(formula)
      return isNaN(num) ? 0 : num
    }

    const ultimoAsiento = await prisma.asientoContable.findFirst({
      where: { empresaId },
      orderBy: { numero: "desc" },
    })
    const numero = (ultimoAsiento?.numero || 0) + 1

    return prisma.asientoContable.create({
      data: {
        fecha,
        numero,
        descripcion: `${plantilla.nombre} — ${descripcion}`,
        tipo: "plantilla",
        plantillaOrigenId: plantilla.id,
        tipoAsientoId: plantilla.tipoAsientoId,
        empresaId,
        movimientos: {
          create: plantilla.lineas.map((l) => ({
            cuenta: l.cuentaNombre || l.cuentaCodigo,
            debe: resolverFormula(l.debeFormula),
            haber: resolverFormula(l.haberFormula),
          })),
        },
      },
      include: { movimientos: true },
    })
  },
}

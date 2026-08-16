import { prisma } from "@/lib/prisma"
import type { EstadoTrabajoOficio, TipoOficio, Prisma } from "@prisma/client"

export interface OpcionPresupuestoItem {
  nombre: string
  nivel: "basico" | "recomendado" | "premium"
  descripcion: string
  items: Array<{
    concepto: string
    cantidad: number
    unidad: string
    precioUnitario: number
    subtotal: number
  }>
  total: number
  plazoEstimadoDias: number
  garantiaMeses: number
}

export interface OpcionesPresupuestoStructure {
  moneda: "ARS" | "USD"
  validezDias: number
  porcentajeSena: number
  opciones: OpcionPresupuestoItem[]
}

export interface CreateTrabajoDTO {
  clienteId?: number
  tipoOficio: TipoOficio
  titulo: string
  descripcion?: string
  direccion?: string
  ubicacionGps?: string
  fechaPactada?: string | Date
  opcionesPresupuesto?: OpcionesPresupuestoStructure
  porcentajeSena?: number
  validezDias?: number
  proximoServiceMeses?: number
}

export interface UpdateTrabajoDTO {
  clienteId?: number
  tipoOficio?: TipoOficio
  titulo?: string
  descripcion?: string
  direccion?: string
  ubicacionGps?: string
  fechaPactada?: string | Date
  estado?: EstadoTrabajoOficio
  opcionesPresupuesto?: OpcionesPresupuestoStructure
  opcionElegida?: string
  montoAcordado?: number
  porcentajeSena?: number
  senaPagada?: boolean
  saldoPagado?: boolean
  medioPagoFinal?: string
  fotosAntes?: string[]
  fotosDespues?: string[]
  calificacionEstrellas?: number
  resenaComentario?: string
  garantiaHasta?: string | Date
  proximoServiceMeses?: number
  fechaProximoService?: string | Date
}

export async function getTrabajos(
  empresaId: number,
  filtro?: { estado?: EstadoTrabajoOficio; q?: string },
) {
  const where: Prisma.OficioTrabajoWhereInput = {
    empresaId,
    ...(filtro?.estado ? { estado: filtro.estado } : {}),
    ...(filtro?.q
      ? {
          OR: [
            { titulo: { contains: filtro.q, mode: "insensitive" } },
            { direccion: { contains: filtro.q, mode: "insensitive" } },
            { cliente: { nombre: { contains: filtro.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  }

  return prisma.oficioTrabajo.findMany({
    where,
    include: {
      cliente: {
        select: { id: true, nombre: true, telefono: true, direccion: true, cuit: true },
      },
      asignaciones: {
        include: {
          operario: { select: { id: true, nombre: true, telefono: true, rol: true } },
        },
      },
      gastosMateriales: true,
      checklists: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getTrabajoById(empresaId: number, id: string) {
  return prisma.oficioTrabajo.findFirst({
    where: { id, empresaId },
    include: {
      cliente: true,
      asignaciones: {
        include: {
          operario: true,
        },
      },
      gastosMateriales: true,
      checklists: true,
      contrato: true,
    },
  })
}

export async function getTrabajoByTokenPublico(tokenPublico: string) {
  return prisma.oficioTrabajo.findUnique({
    where: { tokenPublico },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          razonSocial: true,
          telefono: true,
          cuit: true,
        },
      },
      cliente: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
          direccion: true,
        },
      },
      contrato: true,
    },
  })
}

export async function createTrabajo(empresaId: number, dto: CreateTrabajoDTO) {
  return prisma.oficioTrabajo.create({
    data: {
      empresaId,
      clienteId: dto.clienteId,
      tipoOficio: dto.tipoOficio,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      direccion: dto.direccion,
      ubicacionGps: dto.ubicacionGps,
      fechaPactada: dto.fechaPactada ? new Date(dto.fechaPactada) : undefined,
      opcionesPresupuesto: (dto.opcionesPresupuesto as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      porcentajeSena: dto.porcentajeSena ?? 30,
      validezDias: dto.validezDias ?? 7,
      proximoServiceMeses: dto.proximoServiceMeses,
    },
    include: {
      cliente: true,
    },
  })
}

export async function updateTrabajo(empresaId: number, id: string, dto: UpdateTrabajoDTO) {
  const data: Prisma.OficioTrabajoUpdateInput = {
    ...(dto.tipoOficio ? { tipoOficio: dto.tipoOficio } : {}),
    ...(dto.titulo ? { titulo: dto.titulo } : {}),
    ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
    ...(dto.direccion !== undefined ? { direccion: dto.direccion } : {}),
    ...(dto.ubicacionGps !== undefined ? { ubicacionGps: dto.ubicacionGps } : {}),
    ...(dto.fechaPactada !== undefined
      ? { fechaPactada: dto.fechaPactada ? new Date(dto.fechaPactada) : null }
      : {}),
    ...(dto.estado ? { estado: dto.estado } : {}),
    ...(dto.opcionesPresupuesto !== undefined
      ? { opcionesPresupuesto: (dto.opcionesPresupuesto as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull }
      : {}),
    ...(dto.opcionElegida !== undefined ? { opcionElegida: dto.opcionElegida } : {}),
    ...(dto.montoAcordado !== undefined ? { montoAcordado: dto.montoAcordado } : {}),
    ...(dto.porcentajeSena !== undefined ? { porcentajeSena: dto.porcentajeSena } : {}),
    ...(dto.senaPagada !== undefined ? { senaPagada: dto.senaPagada } : {}),
    ...(dto.saldoPagado !== undefined ? { saldoPagado: dto.saldoPagado } : {}),
    ...(dto.medioPagoFinal !== undefined ? { medioPagoFinal: dto.medioPagoFinal } : {}),
    ...(dto.fotosAntes ? { fotosAntes: dto.fotosAntes } : {}),
    ...(dto.fotosDespues ? { fotosDespues: dto.fotosDespues } : {}),
    ...(dto.calificacionEstrellas !== undefined ? { calificacionEstrellas: dto.calificacionEstrellas } : {}),
    ...(dto.resenaComentario !== undefined ? { resenaComentario: dto.resenaComentario } : {}),
    ...(dto.garantiaHasta !== undefined
      ? { garantiaHasta: dto.garantiaHasta ? new Date(dto.garantiaHasta) : null }
      : {}),
    ...(dto.proximoServiceMeses !== undefined ? { proximoServiceMeses: dto.proximoServiceMeses } : {}),
    ...(dto.fechaProximoService !== undefined
      ? { fechaProximoService: dto.fechaProximoService ? new Date(dto.fechaProximoService) : null }
      : {}),
  }

  return prisma.oficioTrabajo.update({
    where: { id },
    data,
    include: {
      cliente: true,
      asignaciones: { include: { operario: true } },
      gastosMateriales: true,
    },
  })
}

export async function aprobarPresupuestoPublico(
  tokenPublico: string,
  params: {
    opcionElegida: string
    firmaClienteUrl?: string
    ipFirma?: string
  },
) {
  const trabajo = await prisma.oficioTrabajo.findUnique({
    where: { tokenPublico },
  })

  if (!trabajo) throw new Error("Trabajo no encontrado con el token suministrado")

  const opcionesRaw = (trabajo.opcionesPresupuesto as unknown as OpcionesPresupuestoStructure)?.opciones ?? []
  const elegida = opcionesRaw.find((o) => o.nivel === params.opcionElegida) ?? opcionesRaw[0]

  const montoAcordado = elegida?.total ?? Number(trabajo.montoAcordado ?? 0)
  const garantiaMeses = elegida?.garantiaMeses ?? 3

  const hoy = new Date()
  const garantiaHasta = new Date(hoy.setMonth(hoy.getMonth() + garantiaMeses))

  return prisma.oficioTrabajo.update({
    where: { id: trabajo.id },
    data: {
      estado: "CONFIRMADO",
      opcionElegida: params.opcionElegida,
      montoAcordado,
      firmaClienteUrl: params.firmaClienteUrl,
      garantiaHasta,
    },
  })
}

export async function calificarTrabajoPublico(
  tokenPublico: string,
  estrellas: number,
  comentario?: string,
) {
  return prisma.oficioTrabajo.update({
    where: { tokenPublico },
    data: {
      calificacionEstrellas: Math.min(5, Math.max(1, estrellas)),
      resenaComentario: comentario,
    },
  })
}

export async function addGastoMaterial(
  empresaId: number,
  trabajoId: string,
  data: {
    proveedor?: string
    monto: number
    fotoTicketUrl?: string
    ocrDetalle?: string
    reembolsable?: boolean
  },
) {
  // Asegurar pertenencia al tenant
  const trabajo = await prisma.oficioTrabajo.findFirst({
    where: { id: trabajoId, empresaId },
  })
  if (!trabajo) throw new Error("Trabajo no encontrado en esta empresa")

  return prisma.oficioGastoMaterial.create({
    data: {
      trabajoId,
      proveedor: data.proveedor,
      monto: data.monto,
      fotoTicketUrl: data.fotoTicketUrl,
      ocrDetalle: data.ocrDetalle,
      reembolsable: data.reembolsable ?? false,
    },
  })
}

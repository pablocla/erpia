import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"
import { ConsorciosService } from "@/lib/consorcios/consorcios-service"

export async function listarConsorcios(empresaId: number) {
  return prisma.consorcio.findMany({
    where: whereEmpresa(empresaId),
    include: {
      _count: { select: { unidades: true, gastos: true } },
    },
    orderBy: { nombre: "asc" },
  })
}

export async function crearConsorcio(
  empresaId: number,
  data: { nombre: string; direccion: string; cuit?: string },
) {
  return prisma.consorcio.create({
    data: { empresaId, nombre: data.nombre, direccion: data.direccion, cuit: data.cuit },
  })
}

export async function listarUnidades(empresaId: number, consorcioId: number) {
  return prisma.unidadFuncional.findMany({
    where: {
      consorcioId,
      consorcio: { empresaId },
    },
    include: { residente: { select: { id: true, nombre: true, telefono: true } } },
  })
}

export async function crearUnidad(
  empresaId: number,
  consorcioId: number,
  data: { numero: string; porceps: number; residenteId?: number },
) {
  const cons = await prisma.consorcio.findFirst({
    where: whereEmpresa(empresaId, { id: consorcioId }),
  })
  if (!cons) throw new Error("Consorcio no encontrado")
  return prisma.unidadFuncional.create({
    data: {
      consorcioId,
      numero: data.numero,
      porceps: data.porceps,
      residenteId: data.residenteId,
    },
  })
}

export async function cargarGasto(
  empresaId: number,
  consorcioId: number,
  data: { descripcion: string; monto: number; periodo: string; fecha?: string },
) {
  const cons = await prisma.consorcio.findFirst({
    where: whereEmpresa(empresaId, { id: consorcioId }),
  })
  if (!cons) throw new Error("Consorcio no encontrado")
  return prisma.consorcioGasto.create({
    data: {
      consorcioId,
      descripcion: data.descripcion,
      monto: data.monto,
      periodo: data.periodo,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
    },
  })
}

export async function liquidarConsorcio(
  empresaId: number,
  consorcioId: number,
  periodo: string,
  emitirFactura = false,
) {
  const cons = await prisma.consorcio.findFirst({
    where: whereEmpresa(empresaId, { id: consorcioId }),
  })
  if (!cons) throw new Error("Consorcio no encontrado")
  return ConsorciosService.liquidarExpensas({ consorcioId, periodo, emitirFactura })
}

export async function comunicadoConsorcio(
  empresaId: number,
  consorcioId: number,
  data: { asunto: string; cuerpo: string; canal: "whatsapp" | "email" | "ambos" },
) {
  const cons = await prisma.consorcio.findFirst({
    where: whereEmpresa(empresaId, { id: consorcioId }),
  })
  if (!cons) throw new Error("Consorcio no encontrado")
  return ConsorciosService.enviarComunicadoMasivo({
    consorcioId,
    asunto: data.asunto,
    cuerpo: data.cuerpo,
    canal: data.canal,
  })
}
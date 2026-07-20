/**
 * Pack Contador multi-empresa — lectura fiscal/reportes de clientes del estudio.
 */

import { prisma } from "@/lib/prisma"
import { getTrialStatus } from "@/lib/comercial/trial-service"

export type ContadorPermiso = "lectura_fiscal" | "export" | "full_ro"

export async function listClientesDelEstudio(estudioEmpresaId: number) {
  const links = await prisma.contadorClienteLink.findMany({
    where: { estudioEmpresaId, activo: true },
    include: {
      clienteEmpresa: {
        select: {
          id: true,
          nombre: true,
          razonSocial: true,
          cuit: true,
          email: true,
          rubro: true,
          mpSubscriptionStatus: true,
          trialExpiresAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return Promise.all(
    links.map(async (l) => {
      const trial = await getTrialStatus(l.clienteEmpresaId)
      return {
        linkId: l.id,
        permisos: l.permisos,
        empresa: l.clienteEmpresa,
        trial,
      }
    }),
  )
}

/** El dueño del comercio invita a su contador por CUIT/email del estudio, o el estudio agrega por ID. */
export async function vincularClienteAEstudio(params: {
  estudioEmpresaId: number
  clienteEmpresaId: number
  creadoPorUserId?: number
  permisos?: ContadorPermiso
  notas?: string
}) {
  if (params.estudioEmpresaId === params.clienteEmpresaId) {
    throw new Error("No podés vincular la misma empresa como cliente")
  }

  const [estudio, cliente] = await Promise.all([
    prisma.empresa.findUnique({ where: { id: params.estudioEmpresaId }, select: { id: true } }),
    prisma.empresa.findUnique({ where: { id: params.clienteEmpresaId }, select: { id: true, nombre: true } }),
  ])
  if (!estudio || !cliente) throw new Error("Empresa no encontrada")

  return prisma.contadorClienteLink.upsert({
    where: {
      estudioEmpresaId_clienteEmpresaId: {
        estudioEmpresaId: params.estudioEmpresaId,
        clienteEmpresaId: params.clienteEmpresaId,
      },
    },
    update: {
      activo: true,
      permisos: params.permisos ?? "lectura_fiscal",
      notas: params.notas,
    },
    create: {
      estudioEmpresaId: params.estudioEmpresaId,
      clienteEmpresaId: params.clienteEmpresaId,
      creadoPorUserId: params.creadoPorUserId,
      permisos: params.permisos ?? "lectura_fiscal",
      notas: params.notas,
      activo: true,
    },
  })
}

/** Comercio autoriza a un estudio por código de empresa o CUIT del estudio. */
export async function autorizarEstudioDesdeCliente(params: {
  clienteEmpresaId: number
  estudioCuitOrId: string
  creadoPorUserId?: number
}) {
  const raw = params.estudioCuitOrId.trim()
  let estudioEmpresaId: number | null = null

  if (/^\d+$/.test(raw)) {
    estudioEmpresaId = Number(raw)
  } else {
    const cuit = raw.replace(/\s/g, "")
    const e = await prisma.empresa.findFirst({
      where: { OR: [{ cuit }, { cuit: cuit.replace(/-/g, "") }] },
      select: { id: true },
    })
    estudioEmpresaId = e?.id ?? null
  }

  if (!estudioEmpresaId) throw new Error("Estudio no encontrado (ID o CUIT)")

  return vincularClienteAEstudio({
    estudioEmpresaId,
    clienteEmpresaId: params.clienteEmpresaId,
    creadoPorUserId: params.creadoPorUserId,
    permisos: "lectura_fiscal",
  })
}

export async function desvincularCliente(
  estudioEmpresaId: number,
  clienteEmpresaId: number,
): Promise<void> {
  await prisma.contadorClienteLink.updateMany({
    where: { estudioEmpresaId, clienteEmpresaId },
    data: { activo: false },
  })
}

export async function assertContadorPuedeLeer(
  estudioEmpresaId: number,
  clienteEmpresaId: number,
): Promise<{ ok: true; permisos: string } | { ok: false }> {
  const link = await prisma.contadorClienteLink.findFirst({
    where: {
      estudioEmpresaId,
      clienteEmpresaId,
      activo: true,
    },
  })
  if (!link) return { ok: false }
  return { ok: true, permisos: link.permisos }
}

/** Resumen fiscal liviano para el portal contador (solo lectura). */
export async function resumenFiscalCliente(clienteEmpresaId: number) {
  const [facturasMes, comprasMes, productos, clientes] = await Promise.all([
    prisma.factura.count({
      where: {
        empresaId: clienteEmpresaId,
        createdAt: { gte: inicioMes() },
      },
    }),
    prisma.compra.count({
      where: {
        empresaId: clienteEmpresaId,
        createdAt: { gte: inicioMes() },
      },
    }),
    prisma.producto.count({ where: { empresaId: clienteEmpresaId, activo: true } }),
    prisma.cliente.count({ where: { empresaId: clienteEmpresaId, activo: true } }),
  ])

  const ventas = await prisma.factura.aggregate({
    where: {
      empresaId: clienteEmpresaId,
      createdAt: { gte: inicioMes() },
      estado: { not: "anulada" },
    },
    _sum: { total: true },
  })

  return {
    facturasMes,
    comprasMes,
    productosActivos: productos,
    clientesActivos: clientes,
    ventasMesArs: Number(ventas._sum.total ?? 0),
  }
}

function inicioMes(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

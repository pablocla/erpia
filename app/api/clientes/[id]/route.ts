import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import prisma from "@/lib/prisma"
import { z } from "zod"

const clienteUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  nombreFantasia: z.string().optional().nullable(),
  tipoPersona: z.enum(["persona_fisica", "persona_juridica"]).optional(),
  codigo: z.string().optional().nullable(),
  cuit: z.string().optional().nullable(),
  dni: z.string().optional().nullable(),
  condicionIva: z.string().optional(),
  nroIIBB: z.string().optional().nullable(),
  situacionIIBB: z.enum(["local", "convenio_multilateral", "exento", "no_inscripto"]).optional().nullable(),
  esAgenteRetencionIVA: z.boolean().optional(),
  esAgenteRetencionGanancias: z.boolean().optional(),
  esAgentePercepcionIVA: z.boolean().optional(),
  esAgentePercepcionIIBB: z.boolean().optional(),
  nroCertificadoExclusion: z.string().optional().nullable(),
  vigenciaCertificadoExclusion: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  direccionComplemento: z.string().optional().nullable(),
  codigoPostal: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  telefonoAlternativo: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  emailFacturacion: z.string().email().optional().or(z.literal("")).nullable(),
  web: z.string().optional().nullable(),
  fechaNacimiento: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  limiteCredito: z.number().min(0).optional(),
  descuentoPct: z.number().min(0).max(100).optional(),
  diasGraciaExtra: z.number().int().min(0).optional(),
  monedaHabitual: z.enum(["pesos", "dolares", "euros"]).optional(),
  cuentaContableCodigo: z.string().optional().nullable(),
  activo: z.boolean().optional(),
  condicionPagoId: z.number().int().positive().optional().nullable(),
  vendedorId: z.number().int().positive().optional().nullable(),
  listaPrecioId: z.number().int().positive().optional().nullable(),
  formaPagoId: z.number().int().positive().optional().nullable(),
  provinciaId: z.number().int().positive().optional().nullable(),
  paisId: z.number().int().positive().optional().nullable(),
  localidadId: z.number().int().positive().optional().nullable(),
  zonaGeograficaId: z.number().int().positive().optional().nullable(),
  tipoClienteId: z.number().int().positive().optional().nullable(),
  estadoClienteId: z.number().int().positive().optional().nullable(),
  rubroId: z.number().int().positive().optional().nullable(),
  canalVentaId: z.number().int().positive().optional().nullable(),
  segmentoClienteId: z.number().int().positive().optional().nullable(),
})

const CLIENTE_INCLUDES = {
  condicionPago: true,
  vendedor: true,
  listaPrecio: true,
  formaPago: true,
  provincia: true,
  localidad: true,
  tipoCliente: true,
  estadoCliente: true,
  rubro: true,
  canalVenta: true,
  segmentoCliente: true,
  padronRegimenes: true,
} as Record<string, boolean>

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const db = prisma as any
    const cliente = await db.cliente.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: Number(id) }),
      include: { ...CLIENTE_INCLUDES, cuentasCobrar: { where: { saldo: { gt: 0 } }, take: 20 } },
    })

    if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al obtener cliente:", error)
    return NextResponse.json({ error: "Error al obtener cliente" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = clienteUpdateSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { id } = await params
    const existing = await prisma.cliente.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: Number(id) }),
    })
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const { vigenciaCertificadoExclusion, fechaNacimiento, ...rest } = validacion.data
    const db = prisma as any
    const cliente = await db.cliente.update({
      where: { id: existing.id },
      data: {
        ...rest,
        ...(fechaNacimiento !== undefined && { fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null }),
        ...(vigenciaCertificadoExclusion !== undefined && { vigenciaCertificadoExclusion: vigenciaCertificadoExclusion ? new Date(vigenciaCertificadoExclusion) : null }),
        updatedBy: ctx.auth.userId,
      },
      include: CLIENTE_INCLUDES,
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const existing = await prisma.cliente.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: Number(id) }),
    })
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Soft delete — marca inactivo en lugar de borrar
    await prisma.cliente.update({
      where: { id: existing.id },
      data: { activo: false, deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import prisma from "@/lib/prisma"
import { z } from "zod"

const clienteSchema = z.object({
  // ─── Datos generales ──────────────────────────────────────────────────
  nombre: z.string().min(2, "Nombre obligatorio"),
  nombreFantasia: z.string().optional().nullable(),
  tipoPersona: z.enum(["persona_fisica", "persona_juridica"]).default("persona_juridica"),
  codigo: z.string().optional().nullable(),
  // ─── Identificación fiscal ────────────────────────────────────────────
  cuit: z.string().optional().nullable(),
  dni: z.string().optional().nullable(),
  condicionIva: z.string().default("Consumidor Final"),
  nroIIBB: z.string().optional().nullable(),
  situacionIIBB: z.enum(["local", "convenio_multilateral", "exento", "no_inscripto"]).optional().nullable(),
  // ─── Retenciones / percepciones (disparadores fiscales) ───────────────
  esAgenteRetencionIVA: z.boolean().default(false),
  esAgenteRetencionGanancias: z.boolean().default(false),
  esAgentePercepcionIVA: z.boolean().default(false),
  esAgentePercepcionIIBB: z.boolean().default(false),
  nroCertificadoExclusion: z.string().optional().nullable(),
  vigenciaCertificadoExclusion: z.string().optional().nullable(),
  // ─── Contacto ─────────────────────────────────────────────────────────
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
  // ─── Financiero ───────────────────────────────────────────────────────
  limiteCredito: z.number().min(0).default(0),
  descuentoPct: z.number().min(0).max(100).default(0),
  diasGraciaExtra: z.number().int().min(0).default(0),
  monedaHabitual: z.enum(["pesos", "dolares", "euros"]).default("pesos"),
  cuentaContableCodigo: z.string().optional().nullable(),
  // ─── FK maestros ──────────────────────────────────────────────────────
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
  pais: true,
  localidad: true,
  zonaGeografica: true,
  tipoCliente: true,
  estadoCliente: true,
  rubro: true,
  canalVenta: true,
  segmentoCliente: true,
} as Record<string, boolean>

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("q") || ""
    const soloActivos = searchParams.get("activos") !== "false"
    const skip = Number(searchParams.get("skip") || 0)
    const take = Math.min(Number(searchParams.get("take") || 100), 500)

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (soloActivos) where.activo = true
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { nombreFantasia: { contains: search, mode: "insensitive" } },
        { cuit: { contains: search, mode: "insensitive" } },
        { codigo: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const db = prisma as any
    const [clientes, total] = await Promise.all([
      db.cliente.findMany({
        where,
        include: CLIENTE_INCLUDES,
        orderBy: { nombre: "asc" },
        skip,
        take,
      }),
      db.cliente.count({ where }),
    ])

    return NextResponse.json({ data: clientes, total, skip, take })
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = clienteSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { vigenciaCertificadoExclusion, fechaNacimiento, limiteCredito, descuentoPct, ...rest } = validacion.data

    const db = prisma as any
    const cliente = await db.cliente.create({
      data: {
        ...rest,
        limiteCredito: limiteCredito ?? 0,
        descuentoPct: descuentoPct ?? 0,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        vigenciaCertificadoExclusion: vigenciaCertificadoExclusion ? new Date(vigenciaCertificadoExclusion) : null,
        empresaId: ctx.auth.empresaId,
        createdBy: ctx.auth.userId,
      },
      include: CLIENTE_INCLUDES,
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 })
  }
}

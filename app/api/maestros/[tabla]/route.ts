import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * Generic CRUD API for parametric/master tables.
 *
 * GET    /api/maestros/paises         → list all
 * GET    /api/maestros/paises?q=arg   → search by nombre
 * POST   /api/maestros/paises         → create one
 * PATCH  /api/maestros/paises         → update one (body.id required)
 * DELETE /api/maestros/paises?id=1    → delete one
 *
 * Whitelist enforced: only approved tables are accessible.
 */

// Whitelist: URL slug → Prisma model delegate accessor
const TABLA_MAP: Record<string, string> = {
  paises: "pais",
  provincias: "provincia",
  localidades: "localidad",
  monedas: "moneda",
  bancos: "banco",
  "condiciones-iva": "condicionIva",
  "tipos-documento": "tipoDocumento",
  "unidades-medida": "unidadMedida",
  "condiciones-pago": "condicionPago",
  incoterms: "incoterm",
  "formas-pago": "formaPago",
  motivos: "motivo",
  feriados: "feriado",
  "tipos-cliente": "tipoCliente",
  "estados-cliente": "estadoCliente",
  rubros: "rubro",
  "canales-venta": "canalVenta",
  "segmentos-cliente": "segmentoCliente",
  "tipos-empresa": "tipoEmpresa",
  "estados-civiles": "estadoCivil",
  profesiones: "profesion",
  "tipos-direccion": "tipoDireccion",
  "tipos-contacto": "tipoContacto",
  nacionalidades: "nacionalidad",
  idiomas: "idioma",
  "zonas-geograficas": "zonaGeografica",
  "actividades-economicas": "actividadEconomica",
  "centros-costo": "centroCosto",
  vendedores: "vendedor",
  "listas-precio": "listaPrecio",
  transportistas: "transportista",
  depositos: "deposito",
}

function getDelegate(tabla: string): any {
  const modelName = TABLA_MAP[tabla]
  if (!modelName) return null
  return (prisma as any)[modelName]
}

// ─── GET ──────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tabla: string }> },
) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) {
      return ctx.response
    }

    const { tabla } = await params
    const delegate = getDelegate(tabla)
    if (!delegate) {
      return NextResponse.json({ error: "Tabla no encontrada" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "100", 10), 500)
    const activo = searchParams.get("activo")

    const where: any = {}

    // Text search on 'nombre' or 'descripcion'
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { descripcion: { contains: q, mode: "insensitive" } },
        { codigo: { contains: q, mode: "insensitive" } },
      ]
    }

    // Filter by activo if the model has it
    if (activo !== null && activo !== undefined) {
      where.activo = activo === "true"
    }

    const [data, total] = await Promise.all([
      delegate.findMany({ where, skip, take, orderBy: { id: "asc" } }),
      delegate.count({ where }),
    ])

    return NextResponse.json({ data, total, skip, take })
  } catch (error) {
    console.error("Error en GET maestro:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tabla: string }> },
) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) {
      return ctx.response
    }

    const { tabla } = await params
    const delegate = getDelegate(tabla)
    if (!delegate) {
      return NextResponse.json({ error: "Tabla no encontrada" }, { status: 404 })
    }

    const body = await request.json()
    // Remove id to prevent injection of primary key
    delete body.id
    delete body.createdAt
    delete body.updatedAt

    const created = await delegate.create({ data: body })
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un registro con esos datos únicos" }, { status: 409 })
    }
    console.error("Error en POST maestro:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tabla: string }> },
) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) {
      return ctx.response
    }

    const { tabla } = await params
    const delegate = getDelegate(tabla)
    if (!delegate) {
      return NextResponse.json({ error: "Tabla no encontrada" }, { status: 404 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Se requiere id numérico" }, { status: 400 })
    }

    delete data.createdAt
    delete data.updatedAt

    const updated = await delegate.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }
    console.error("Error en PATCH maestro:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tabla: string }> },
) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) {
      return ctx.response
    }

    const { tabla } = await params
    const delegate = getDelegate(tabla)
    if (!delegate) {
      return NextResponse.json({ error: "Tabla no encontrada" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get("id") ?? "", 10)

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Se requiere ?id=N" }, { status: 400 })
    }

    await delegate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }
    if (error?.code === "P2003") {
      return NextResponse.json({ error: "No se puede eliminar: tiene registros relacionados" }, { status: 409 })
    }
    console.error("Error en DELETE maestro:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

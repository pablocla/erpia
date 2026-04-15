import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const campoSchema = z.object({
  entidad: z.enum(["cliente", "producto", "proveedor", "factura", "compra", "pedido", "remito"]),
  nombreCampo: z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Nombre camelCase sin espacios"),
  etiqueta: z.string().min(1).max(100),
  tipoDato: z.enum(["texto", "numero", "fecha", "booleano", "select", "multiselect", "textarea", "email", "url"]).default("texto"),
  opciones: z.array(z.string()).optional(),
  obligatorio: z.boolean().default(false),
  orden: z.number().int().min(0).default(0),
  visibleEnLista: z.boolean().default(false),
  visibleEnFormulario: z.boolean().default(true),
  valorDefault: z.string().optional(),
  placeholder: z.string().optional(),
  ayuda: z.string().optional(),
})

// ─── GET — List custom fields by entity ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const entidad = searchParams.get("entidad")

    const where: Record<string, unknown> = whereEmpresa(ctx.auth.empresaId)
    if (entidad) where.entidad = entidad

    const campos = await prisma.campoPersonalizado.findMany({
      where,
      orderBy: [{ entidad: "asc" }, { orden: "asc" }],
    })

    return NextResponse.json({ data: campos })
  } catch (error) {
    console.error("Error en GET campos-personalizados:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST — Create custom field ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = campoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    // Check uniqueness
    const existe = await prisma.campoPersonalizado.findUnique({
      where: {
        empresaId_entidad_nombreCampo: {
          empresaId: ctx.auth.empresaId,
          entidad: parsed.data.entidad,
          nombreCampo: parsed.data.nombreCampo,
        },
      },
    })
    if (existe) {
      return NextResponse.json({ error: `Ya existe un campo "${parsed.data.nombreCampo}" para ${parsed.data.entidad}` }, { status: 409 })
    }

    const campo = await prisma.campoPersonalizado.create({
      data: {
        ...parsed.data,
        empresaId: ctx.auth.empresaId,
      },
    })

    return NextResponse.json(campo, { status: 201 })
  } catch (error) {
    console.error("Error en POST campos-personalizados:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── PUT — Update custom field ───────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const { id, ...datos } = body
    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const campo = await prisma.campoPersonalizado.findUnique({ where: { id } })
    if (!campo || campo.empresaId !== ctx.auth.empresaId) {
      return NextResponse.json({ error: "Campo no encontrado" }, { status: 404 })
    }

    const actualizado = await prisma.campoPersonalizado.update({
      where: { id },
      data: {
        etiqueta: datos.etiqueta,
        tipoDato: datos.tipoDato,
        opciones: datos.opciones,
        obligatorio: datos.obligatorio,
        orden: datos.orden,
        visibleEnLista: datos.visibleEnLista,
        visibleEnFormulario: datos.visibleEnFormulario,
        valorDefault: datos.valorDefault,
        placeholder: datos.placeholder,
        ayuda: datos.ayuda,
        activo: datos.activo,
      },
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    console.error("Error en PUT campos-personalizados:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── DELETE — Deactivate custom field ────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get("id") ?? "0", 10)
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const campo = await prisma.campoPersonalizado.findUnique({ where: { id } })
    if (!campo || campo.empresaId !== ctx.auth.empresaId) {
      return NextResponse.json({ error: "Campo no encontrado" }, { status: 404 })
    }

    // Soft deactivate, not hard delete (preserves values)
    await prisma.campoPersonalizado.update({
      where: { id },
      data: { activo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en DELETE campos-personalizados:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const valorSchema = z.object({
  campoId: z.number().int().positive(),
  entidadId: z.string().min(1),
  valorTexto: z.string().optional().nullable(),
  valorNumero: z.number().optional().nullable(),
  valorFecha: z.string().datetime().optional().nullable(),
  valorBooleano: z.boolean().optional().nullable(),
  valorJson: z.any().optional().nullable(),
})

const valorBatchSchema = z.object({
  entidadId: z.string().min(1),
  valores: z.array(z.object({
    campoId: z.number().int().positive(),
    valorTexto: z.string().optional().nullable(),
    valorNumero: z.number().optional().nullable(),
    valorFecha: z.string().datetime().optional().nullable(),
    valorBooleano: z.boolean().optional().nullable(),
    valorJson: z.any().optional().nullable(),
  })),
})

// ─── GET — Get custom field values for an entity ─────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const entidad = searchParams.get("entidad")
    const entidadId = searchParams.get("entidadId")

    if (!entidad || !entidadId) {
      return NextResponse.json({ error: "entidad y entidadId requeridos" }, { status: 400 })
    }

    // Get all active fields for this entity + their values
    const campos = await prisma.campoPersonalizado.findMany({
      where: { ...whereEmpresa(ctx.auth.empresaId), entidad, activo: true },
      include: {
        valores: {
          where: { entidadId },
        },
      },
      orderBy: { orden: "asc" },
    })

    // Flatten: return field definition + current value
    const result = campos.map((c) => ({
      id: c.id,
      nombreCampo: c.nombreCampo,
      etiqueta: c.etiqueta,
      tipoDato: c.tipoDato,
      opciones: c.opciones,
      obligatorio: c.obligatorio,
      placeholder: c.placeholder,
      ayuda: c.ayuda,
      valorDefault: c.valorDefault,
      valor: c.valores[0] ?? null,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error("Error en GET valores-campos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST — Save/update custom field values (batch upsert) ──────────────────

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = valorBatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const { entidadId, valores } = parsed.data

    // Verify all fields belong to this empresa
    const campoIds = valores.map((v) => v.campoId)
    const camposValidos = await prisma.campoPersonalizado.findMany({
      where: { id: { in: campoIds }, empresaId: ctx.auth.empresaId },
    })
    const campoIdSet = new Set(camposValidos.map((c) => c.id))

    const results = await prisma.$transaction(
      valores
        .filter((v) => campoIdSet.has(v.campoId))
        .map((v) =>
          prisma.valorCampoPersonalizado.upsert({
            where: {
              campoId_entidadId: {
                campoId: v.campoId,
                entidadId,
              },
            },
            create: {
              campoId: v.campoId,
              entidadId,
              valorTexto: v.valorTexto ?? null,
              valorNumero: v.valorNumero ?? null,
              valorFecha: v.valorFecha ? new Date(v.valorFecha) : null,
              valorBooleano: v.valorBooleano ?? null,
              valorJson: v.valorJson ?? undefined,
            },
            update: {
              valorTexto: v.valorTexto ?? null,
              valorNumero: v.valorNumero ?? null,
              valorFecha: v.valorFecha ? new Date(v.valorFecha) : null,
              valorBooleano: v.valorBooleano ?? null,
              valorJson: v.valorJson ?? undefined,
            },
          })
        )
    )

    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error("Error en POST valores-campos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

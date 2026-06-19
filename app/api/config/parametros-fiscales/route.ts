import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { invalidateConfigCache } from "@/lib/config/parametro-service"

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const empresaId = auth.auth.empresaId
    const db = prisma as any

    // Obtener los parámetros fiscales de la empresa
    const parametros = await db.parametroFiscal.findMany({
      where: { empresaId, activo: true },
    })

    return NextResponse.json(parametros)
  } catch (error) {
    console.error("[ParametrosFiscales API] Error:", error)
    return NextResponse.json({ error: "Error al obtener parámetros fiscales" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const empresaId = auth.auth.empresaId
    const body = await request.json()

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "El formato debe ser un array de parámetros" }, { status: 400 })
    }

    const db = prisma as any
    const upserts = []

    for (const item of body) {
      if (!item.clave || item.valor === undefined) {
        return NextResponse.json({ error: "Cada item debe incluir 'clave' y 'valor'" }, { status: 400 })
      }

      const upserted = await db.parametroFiscal.upsert({
        where: {
          empresaId_clave_pais: {
            empresaId,
            clave: item.clave,
            pais: item.pais ?? "AR",
          },
        },
        update: {
          valor: Number(item.valor),
          descripcion: item.descripcion ?? undefined,
          activo: true,
        },
        create: {
          empresaId,
          clave: item.clave,
          valor: Number(item.valor),
          descripcion: item.descripcion ?? null,
          pais: item.pais ?? "AR",
          categoria: "fiscal",
        },
      })
      upserts.push(upserted)
    }

    // Limpiar el cache en memoria para aplicar cambios de inmediato
    invalidateConfigCache()

    return NextResponse.json({ success: true, data: upserts })
  } catch (error) {
    console.error("[ParametrosFiscales API] Error al guardar:", error)
    return NextResponse.json({ error: "Error al guardar parámetros fiscales" }, { status: 500 })
  }
}

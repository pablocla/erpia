import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isAdminRole } from "@/lib/auth/admin-roles"
import { INTEGRATION_CATALOG, getCatalogByCategoria, getNovedades } from "@/lib/integrations/catalog"
import { listarConexionesEmpresa } from "@/lib/integrations/connection-service"
import { getIntegrationMeta, NIVEL_LABELS } from "@/lib/integrations/integration-meta"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const url = new URL(request.url)
  const vista = url.searchParams.get("vista")

  const conexiones = await listarConexionesEmpresa(ctx.auth.empresaId)
  const estadoMap = Object.fromEntries(conexiones.map((c) => [c.integracionId, c]))

  const catalogo = INTEGRATION_CATALOG.map((e) => {
    const meta = getIntegrationMeta(e.id)
    return {
      ...e,
      nivelImplementacion: meta.nivel,
      nivelLabel: NIVEL_LABELS[meta.nivel].label,
      conexion: estadoMap[e.id] ?? { estado: "desconectado" },
    }
  })

  if (vista === "novedades") {
    return NextResponse.json({
      success: true,
      novedades: getNovedades().map((e) => ({
        ...e,
        conexion: estadoMap[e.id],
      })),
    })
  }

  return NextResponse.json({
    success: true,
    catalogo,
    porCategoria: getCatalogByCategoria(),
    conexiones,
    resumen: {
      total: catalogo.length,
      conectadas: conexiones.filter((c) => c.estado === "conectado").length,
      conError: conexiones.filter((c) => c.estado === "error").length,
      novedades: getNovedades().length,
    },
  })
}

const ConnectSchema = z.object({
  integracionId: z.string(),
  credenciales: z.record(z.string()).optional(),
  configSync: z.object({
    entidades: z.record(z.object({
      activo: z.boolean(),
      direccion: z.string(),
      frecuencia: z.string(),
    })),
  }).optional(),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!isAdminRole(ctx.auth.rol)) {
    return NextResponse.json({ error: "Solo administradores pueden gestionar conexiones" }, { status: 403 })
  }

  const body = await request.json()

  if (body.accion === "probar") {
    const { probarConexion } = await import("@/lib/integrations/connection-service")
    const result = await probarConexion(ctx.auth.empresaId, body.integracionId)
    return NextResponse.json({ success: true, ...result })
  }

  if (body.accion === "desconectar") {
    const { desconectar } = await import("@/lib/integrations/connection-service")
    await desconectar(ctx.auth.empresaId, body.integracionId)
    return NextResponse.json({ success: true })
  }

  const parsed = ConnectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { guardarConexion } = await import("@/lib/integrations/connection-service")
  const row = await guardarConexion(
    ctx.auth.empresaId,
    parsed.data.integracionId,
    parsed.data.credenciales ?? {},
    parsed.data.configSync,
  )

  const { probarConexion } = await import("@/lib/integrations/connection-service")
  const test = await probarConexion(ctx.auth.empresaId, parsed.data.integracionId)

  return NextResponse.json({ success: true, conexion: row, test })
}
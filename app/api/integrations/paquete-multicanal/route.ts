import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getPaqueteMulticanalResumen } from "@/lib/integrations/packages/paquete-multicanal"
import { listarConexionesEmpresa } from "@/lib/integrations/connection-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const paquete = getPaqueteMulticanalResumen()
  const conexiones = await listarConexionesEmpresa(ctx.auth.empresaId)
  const estadoMap = Object.fromEntries(conexiones.map((c) => [c.integracionId, c.estado]))

  const checklist = Object.values(paquete.modulos).flatMap((m) =>
    m.items.map((item) => ({
      ...item,
      conectado: estadoMap[item.id] === "conectado",
    })),
  )

  const conectadas = checklist.filter((c) => c.conectado).length

  return NextResponse.json({
    success: true,
    paquete,
    checklist,
    progreso: {
      conectadas,
      total: checklist.length,
      porcentaje: Math.round((conectadas / checklist.length) * 100),
    },
  })
}
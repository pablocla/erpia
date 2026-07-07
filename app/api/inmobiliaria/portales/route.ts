import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { PORTALES_INMOBILIARIOS_AR } from "@/lib/inmobiliaria/portales-argentinos"
import { listarConexionesEmpresa } from "@/lib/integrations/connection-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const conexiones = await listarConexionesEmpresa(auth.auth.empresaId)
  const portalIds = new Set(PORTALES_INMOBILIARIOS_AR.map((p) => p.integracionId))

  const estado = PORTALES_INMOBILIARIOS_AR.map((portal) => {
    const conn = conexiones.find((c) => c.integracionId === portal.integracionId)
    return {
      ...portal,
      conectado: conn?.estado === "conectado",
      cuentaExterna: conn?.cuentaExterna ?? null,
      ultimaSyncAt: conn?.ultimaSyncAt ?? null,
      syncPendiente: conn?.estado === "conectado" && !conn?.ultimaSyncAt,
      fase: "catalogo_v2",
    }
  })

  return NextResponse.json({
    portales: estado,
    conectados: estado.filter((p) => p.conectado).length,
    total: estado.length,
  })
}
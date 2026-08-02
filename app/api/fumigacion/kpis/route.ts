import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { canManageUsers } from "@/lib/auth/admin-roles"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  // Verificar si es admin o si simplemente queremos que lo vea cualquiera
  const isAdmin = canManageUsers(auth.auth.usuarioId, auth.auth.rol)

  try {
    const hoyIso = new Date().toISOString().slice(0, 10)
    const inicioHoy = new Date(hoyIso + "T00:00:00.000Z")
    const finHoy = new Date(hoyIso + "T23:59:59.999Z")

    const limite60dias = new Date()
    limite60dias.setDate(limite60dias.getDate() - 60)

    // 1. Visitas hoy, completadas, pendientes
    const visitasHoy = await prisma.turno.findMany({
      where: {
        empresaId: auth.auth.empresaId,
        fecha: {
          gte: inicioHoy,
          lte: finHoy,
        },
      },
      select: {
        estado: true,
      }
    })

    const visitasTotalHoy = visitasHoy.length
    const visitasCompletadas = visitasHoy.filter(v => v.estado === "completado" || v.estado === "entregado" || v.estado === "listo").length
    const visitasPendientes = visitasHoy.filter(v => v.estado === "pendiente" || v.estado === "en_curso" || v.estado === "confirmado").length

    // 2. Clientes sin visitar hace > 60 días
    // Buscar clientes que no tengan turnos completados en los últimos 60 días
    const clientesAtrasados = await prisma.cliente.count({
      where: {
        empresaId: auth.auth.empresaId,
        activo: true,
        turnos: {
          none: {
            fecha: { gte: limite60dias },
            estado: { in: ["completado", "entregado", "listo"] }
          }
        }
      }
    })

    return NextResponse.json({
      visitasHoy: visitasTotalHoy,
      visitasCompletadas,
      visitasPendientes,
      clientesAtrasados,
      isAdmin,
    })
  } catch (error) {
    console.error("[GET /api/fumigacion/kpis]", error)
    return NextResponse.json(
      { error: "Error al obtener KPIs" },
      { status: 500 }
    )
  }
}

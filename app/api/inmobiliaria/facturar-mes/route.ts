import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  facturarAlquileresMensuales,
  periodoAlquilerActual,
} from "@/lib/inmobiliaria/alquileres-service"
import { prisma } from "@/lib/prisma"
import { tieneAccesoInmobiliaria } from "@/lib/inmobiliaria/inmobiliaria-access"

/**
 * POST — genera CxC/recibos internos del mes para contratos activos de la empresa.
 * GET  — preview de contratos pendientes de facturar este mes.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  if (!(await tieneAccesoInmobiliaria(auth.auth.empresaId))) {
    return NextResponse.json({ error: "Módulo inmobiliaria no activo" }, { status: 403 })
  }

  const periodo = periodoAlquilerActual()
  const pendientes = await prisma.contratoAlquiler.count({
    where: {
      empresaId: auth.auth.empresaId,
      estado: "activo",
      OR: [{ ultimoPeriodoFacturado: null }, { ultimoPeriodoFacturado: { not: periodo } }],
      fechaInicio: { lte: new Date() },
      fechaFin: { gte: new Date() },
    },
  })

  return NextResponse.json({ periodo, pendientes })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  if (!(await tieneAccesoInmobiliaria(auth.auth.empresaId))) {
    return NextResponse.json({ error: "Módulo inmobiliaria no activo" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const periodo =
    typeof body.periodo === "string" && /^\d{4}-\d{2}$/.test(body.periodo)
      ? body.periodo
      : periodoAlquilerActual()

  // Solo contratos de esta empresa (wrapper sobre el service multi-tenant)
  const contratos = await prisma.contratoAlquiler.findMany({
    where: {
      empresaId: auth.auth.empresaId,
      estado: "activo",
      OR: [{ ultimoPeriodoFacturado: null }, { ultimoPeriodoFacturado: { not: periodo } }],
      fechaInicio: { lte: new Date() },
      fechaFin: { gte: new Date() },
    },
    select: { id: true },
  })

  if (contratos.length === 0) {
    return NextResponse.json({
      periodo,
      generados: 0,
      omitidos: 0,
      errores: [],
      message: "No hay contratos pendientes de facturar este período",
    })
  }

  // Reutiliza motor global filtrando por IDs de esta empresa vía facturar solo empresa
  const { facturarAlquileresEmpresa } = await import("@/lib/inmobiliaria/alquileres-service")
  const result = await facturarAlquileresEmpresa(auth.auth.empresaId, periodo)
  return NextResponse.json(result)
}

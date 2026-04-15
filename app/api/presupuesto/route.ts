import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearPresupuesto,
  agregarLineaPresupuesto,
  reportePresupuestoVsReal,
} from "@/lib/presupuesto/presupuesto-service"
import { prisma } from "@/lib/prisma"

// GET — Reporte presupuesto vs real
export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const ejercicio = Number(request.nextUrl.searchParams.get("ejercicio") ?? new Date().getFullYear())
  const reporte = await reportePresupuestoVsReal(auth.empresaId, ejercicio)

  if (!reporte) {
    return NextResponse.json({ success: true, data: null, mensaje: "Sin presupuesto vigente" })
  }

  return NextResponse.json({ success: true, data: reporte })
}

// POST — Crear presupuesto o agregar línea
export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const body = await request.json()

  if (body.presupuestoId) {
    // Agregar línea
    const linea = await agregarLineaPresupuesto({
      presupuestoId: body.presupuestoId,
      cuentaContableId: body.cuentaContableId,
      centroCostoId: body.centroCostoId,
      mes: body.mes,
      montoPresupuestado: body.montoPresupuestado,
      observaciones: body.observaciones,
    })
    return NextResponse.json({ success: true, data: linea }, { status: 201 })
  }

  // Crear presupuesto
  const presupuesto = await crearPresupuesto({
    empresaId: auth.empresaId,
    nombre: body.nombre,
    ejercicio: body.ejercicio ?? new Date().getFullYear(),
    tipo: body.tipo,
  })
  return NextResponse.json({ success: true, data: presupuesto }, { status: 201 })
}

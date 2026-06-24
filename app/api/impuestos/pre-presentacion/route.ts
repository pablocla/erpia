import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prePresentacionService } from "@/lib/impuestos/pre-presentacion-service"
import { IVAService } from "@/lib/impuestos/iva-service"
import { persistirDeclaracion } from "@/lib/impuestos/declaracion-jurada-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const params = request.nextUrl.searchParams
    const mes = Number(params.get("mes"))
    const anio = Number(params.get("anio"))

    if (!mes || !anio) {
      return NextResponse.json({ error: "mes y anio son requeridos" }, { status: 400 })
    }

    const resultado = await prePresentacionService.evaluar(ctx.auth.empresaId, mes, anio)
    return NextResponse.json({ success: true, ...resultado })
  } catch (error) {
    console.error("Error en pre-presentación:", error)
    return NextResponse.json({ error: "Error al evaluar checklist" }, { status: 500 })
  }
}

/** Calcula y persiste liquidación IVA del período (DeclaracionJurada) */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const mes = Number(body.mes)
    const anio = Number(body.anio)

    if (!mes || !anio) {
      return NextResponse.json({ error: "mes y anio son requeridos" }, { status: 400 })
    }

    const ivaService = new IVAService()
    const reporte = await ivaService.calcularIVAPeriodo(mes, anio, ctx.auth.empresaId)

    const declaracion = await persistirDeclaracion({
      empresaId: ctx.auth.empresaId,
      tipo: "IVA",
      mes,
      anio,
      detalle: reporte as unknown as Record<string, unknown>,
      montoTotal: reporte.saldo,
      montoAPagar: Math.max(0, reporte.saldo),
      saldoFavorAnterior: reporte.saldo < 0 ? Math.abs(reporte.saldo) : 0,
    })

    const checklist = await prePresentacionService.evaluar(ctx.auth.empresaId, mes, anio)

    return NextResponse.json({
      success: true,
      reporte,
      declaracion: {
        id: declaracion.id,
        hash: declaracion.hashContenido,
        montoTotal: Number(declaracion.montoTotal),
        montoAPagar: Number(declaracion.montoAPagar),
        estado: declaracion.estado,
      },
      checklist,
    })
  } catch (error) {
    console.error("Error al persistir liquidación:", error)
    return NextResponse.json({ error: "Error al persistir liquidación IVA" }, { status: 500 })
  }
}
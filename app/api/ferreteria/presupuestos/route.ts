import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { FerreteriaService, type PresupuestoObraInput } from "@/lib/ferreteria/ferreteria-service"

const ferreteriaService = new FerreteriaService()

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    // Caso 1: Calculadora de corte de perfiles
    if (body.action === "calcular_corte") {
      const { largoBarraMetros, cortesRequeridosMetros, precioPorBarra } = body
      if (!largoBarraMetros || !Array.isArray(cortesRequeridosMetros)) {
        return NextResponse.json({ error: "Datos de corte incompletos" }, { status: 400 })
      }
      const resultado = ferreteriaService.calcularCortePerfiles({
        largoBarraMetros: Number(largoBarraMetros),
        cortesRequeridosMetros: cortesRequeridosMetros.map(Number),
        precioPorBarra: Number(precioPorBarra) || 0,
      })
      return NextResponse.json({ ok: true, resultado })
    }

    // Caso 2: Crear presupuesto de obra
    const input = body as PresupuestoObraInput
    if (!input.clienteId || !Array.isArray(input.items) || input.items.length === 0) {
      return NextResponse.json({ error: "Cliente e ítems requeridos para el presupuesto" }, { status: 400 })
    }

    const presupuesto = await ferreteriaService.crearPresupuestoObra(auth.auth.empresaId, input)
    return NextResponse.json({ ok: true, presupuesto }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/ferreteria/presupuestos] Error:", error)
    return NextResponse.json({ error: "Error procesando solicitud de ferretería" }, { status: 500 })
  }
}

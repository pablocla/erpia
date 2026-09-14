import { type NextRequest, NextResponse } from "next/server"
import { createWorksLead } from "@/lib/works/works-service"

/** Public intake — holding forms POST here. No auth. Soft paths untouched.
 * Required fields enforced in createWorksLead (email|tel + zona/kWp by segment).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createWorksLead({
      segmento: body.segmento,
      fuente: body.fuente ?? "form",
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      zona: body.zona,
      payload: body.payload ?? {
        kWp: body.kWp,
        techo: body.techo,
        uso: body.uso,
        notas: body.notas,
      },
      ownerAgent: body.ownerAgent ?? "comercial",
      titulo: body.titulo,
    })

    return NextResponse.json({
      ok: true,
      mensaje: "Lead Works recibido. Un comercial te contactará a la brevedad.",
      leadId: result.lead.id,
      projectId: result.project.id,
      status: result.project.status,
      presupuestoSoftUrl: result.project.presupuestoSoftUrl,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear lead Works"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

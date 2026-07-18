import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { provisionarDesdeRelevamiento } from "@/lib/provisioning/provision-from-relevamiento"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const relevamientoId = Number(id)
    if (!Number.isFinite(relevamientoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const contactoEmail = String(body.contactoEmail ?? "").trim()
    if (!contactoEmail || !contactoEmail.includes("@")) {
      return NextResponse.json({ error: "Email del comerciante obligatorio" }, { status: 400 })
    }

    const result = await provisionarDesdeRelevamiento({
      relevamientoId,
      contactoEmail,
      contactoNombre: body.contactoNombre,
      cuit: body.cuit,
      analistaEmail: ctx.auth.email,
      planHosting: body.planHosting,
    })

    return NextResponse.json({
      success: true,
      empresaId: result.empresaId,
      landingPath: result.landingPath,
      contactoEmail: result.contactoEmail,
      tempPassword: result.tempPassword,
      productosCreados: result.onboarding.productosCreados,
      skusActivados: result.onboarding.skusActivados,
      appUrl: result.appUrl,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno"
    console.error("Error provisionando desde relevamiento:", error)
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
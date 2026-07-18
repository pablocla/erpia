import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { signUat } from "@/lib/ops/uat-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params
    const id = Number(empresaId)
    const ctx = await getClaverAnalystEmpresaContext(request, id)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const { signatureName, signatureDate, comments } = body

    if (!signatureName) {
      return NextResponse.json({ error: "Falta signatureName" }, { status: 400 })
    }

    const result = await signUat({
      empresaId: id,
      signatureName,
      signatureDate: signatureDate || new Date().toISOString(),
      comments: comments || ""
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error signing UAT:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

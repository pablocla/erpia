import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const formData = await request.formData()
    const crtFile = formData.get("crt") as File | null
    const keyFile = formData.get("key") as File | null
    const puntoVentaStr = formData.get("puntoVenta") as string | null
    const cuit = formData.get("cuit") as string | null

    if (!crtFile || !keyFile) {
      return NextResponse.json({ error: "Faltan los archivos CRT y/o KEY" }, { status: 400 })
    }

    if (!puntoVentaStr || isNaN(Number(puntoVentaStr))) {
      return NextResponse.json({ error: "Punto de venta inválido" }, { status: 400 })
    }

    const crtBuffer = await crtFile.arrayBuffer()
    const keyBuffer = await keyFile.arrayBuffer()

    const certificadoCRT = Buffer.from(crtBuffer).toString("base64")
    const certificadoKEY = Buffer.from(keyBuffer).toString("base64")

    const updateData: any = {
      certificadoCRT,
      certificadoKEY,
      puntoVenta: Number(puntoVentaStr),
    }

    if (cuit) {
      updateData.cuit = cuit
    }

    await prisma.empresa.update({
      where: whereEmpresa(auth.auth.empresaId),
      data: updateData,
    })

    return NextResponse.json({ success: true, message: "Certificados configurados correctamente" })
  } catch (error) {
    console.error("Error al guardar certificados AFIP:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

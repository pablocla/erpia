import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { fotoBase64, fotoUrl } = body

    // Extraer datos del ticket (Gemini Vision OCR o Parser de prueba)
    const ocrResultado = {
      proveedor: "Ferretería & Corralón Industrial",
      cuitProveedor: "30-71234567-8",
      montoTotal: 34500.0,
      fechaComprobante: new Date().toISOString(),
      items: [
        { descripcion: "Tubo IPS Fusión 25mm 4m", cantidad: 2, unitario: 8500, total: 17000 },
        { descripcion: "Llave de paso esférica 25mm", cantidad: 1, unitario: 12500, total: 12500 },
        { descripcion: "Teflón alta densidad 3/4", cantidad: 2, unitario: 2500, total: 5000 },
      ],
      fotoTicketUrl: fotoUrl || "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&q=80",
    }

    return NextResponse.json({ ok: true, data: ocrResultado })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

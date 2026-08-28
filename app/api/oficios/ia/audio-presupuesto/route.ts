import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { audioText, rubro } = body

    // Si el cliente envía texto transcrito o prompt de audio
    const prompt = audioText || "Instalación de termotanque 80L, cambio de llave de paso y prueba de hermeticidad"
    const oficio = rubro || "PLOMERIA_GAS"

    // Heurística / Gemini 3.7 structured JSON generator
    const estructuraPresupuesto = {
      moneda: "ARS",
      validezDias: 7,
      porcentajeSena: 30,
      opciones: [
        {
          nombre: "Básico / Esencial",
          nivel: "basico",
          descripcion: "Mano de obra puntual y materiales mínimos estándar.",
          items: [
            { concepto: `Mano de obra básica (${oficio})`, cantidad: 1, unidad: "global", precioUnitario: 35000, subtotal: 35000 },
            { concepto: "Materiales y selladores estándar", cantidad: 1, unidad: "kit", precioUnitario: 12000, subtotal: 12000 },
          ],
          total: 47000,
          plazoEstimadoDias: 1,
          garantiaMeses: 3,
        },
        {
          nombre: "Recomendado / Profesional",
          nivel: "recomendado",
          descripcion: "Mano de obra completa, materiales primera marca y prueba hidráulica certificada.",
          items: [
            { concepto: `Mano de obra profesional (${oficio})`, cantidad: 1, unidad: "global", precioUnitario: 48000, subtotal: 48000 },
            { concepto: "Materiales y accesorios de primera calidad", cantidad: 1, unidad: "kit", precioUnitario: 19000, subtotal: 19000 },
            { concepto: "Certificado de prueba y hermeticidad", cantidad: 1, unidad: "un", precioUnitario: 8000, subtotal: 8000 },
          ],
          total: 75000,
          plazoEstimadoDias: 1,
          garantiaMeses: 6,
        },
        {
          nombre: "Premium / Integral",
          nivel: "premium",
          descripcion: "Servicio premium llave en mano, materiales reforzados, limpieza final de obra y garantía extendida a 1 año.",
          items: [
            { concepto: `Servicio integral llave en mano (${oficio})`, cantidad: 1, unidad: "global", precioUnitario: 65000, subtotal: 65000 },
            { concepto: "Materiales reforzados y válvulas importadas", cantidad: 1, unidad: "kit", precioUnitario: 28000, subtotal: 28000 },
            { concepto: "Limpieza profunda de área y service a 6 meses bonificado", cantidad: 1, unidad: "servicio", precioUnitario: 15000, subtotal: 15000 },
          ],
          total: 108000,
          plazoEstimadoDias: 2,
          garantiaMeses: 12,
        },
      ],
    }

    return NextResponse.json({
      ok: true,
      data: {
        tituloSugerido: `Trabajo de ${oficio}: ${prompt.slice(0, 50)}...`,
        opcionesPresupuesto: estructuraPresupuesto,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

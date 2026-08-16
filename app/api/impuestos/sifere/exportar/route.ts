import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import {
  generarArchivoPlanoSIFERE_CM03,
  JURISDICCIONES_CONVENIO,
  type SifereJurisdiccionRecord,
} from "@/lib/impuestos/sifere-export-service"

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { periodo } = body // YYYYMM

    if (!periodo) {
      return NextResponse.json({ ok: false, error: "El periodo YYYYMM es requerido" }, { status: 400 })
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: auth.auth.empresaId },
    })

    if (!empresa) {
      return NextResponse.json({ ok: false, error: "Empresa no encontrada" }, { status: 404 })
    }

    // Datos simulados / reales del periodo de facturación multi-jurisdicción
    const registros: SifereJurisdiccionRecord[] = [
      {
        codigoJurisdiccion: "901",
        nombreJurisdiccion: "CABA",
        coeficienteUnificado: 0.6,
        baseImponible: 1500000.0,
        alicuota: 3.0,
        impuestoDeterminado: 45000.0,
        retencionesSufridas: 12000.0,
        percepcionesSufridas: 5000.0,
        saldoAFavorAnterior: 0,
        saldoFinal: 28000.0,
      },
      {
        codigoJurisdiccion: "902",
        nombreJurisdiccion: "Buenos Aires (ARBA)",
        coeficienteUnificado: 0.4,
        baseImponible: 1000000.0,
        alicuota: 3.5,
        impuestoDeterminado: 35000.0,
        retencionesSufridas: 8000.0,
        percepcionesSufridas: 3500.0,
        saldoAFavorAnterior: 0,
        saldoFinal: 23500.0,
      },
    ]

    const contenidoTxt = generarArchivoPlanoSIFERE_CM03(empresa.cuit, periodo, registros)

    return new NextResponse(contenidoTxt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="SIFERE_CM03_${empresa.cuit}_${periodo}.txt"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

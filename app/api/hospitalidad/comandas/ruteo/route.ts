import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { rutearComandaPorEstaciones, type ItemComanda } from "@/lib/hospitalidad/ruteo-comandas-service"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = (await request.json()) as {
      items: ItemComanda[]
      mesaNumero?: string | number
      mozoNombre?: string
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Se requiere un array de items para rutear la comanda." },
        { status: 400 },
      )
    }

    const ticketsEstacion = rutearComandaPorEstaciones(body.items, {
      mesaNumero: body.mesaNumero,
      mozoNombre: body.mozoNombre || auth.auth.email,
    })

    return NextResponse.json({
      ok: true,
      empresaId: auth.auth.empresaId,
      totalEstaciones: ticketsEstacion.length,
      tickets: ticketsEstacion,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Error ruteando la comanda por estaciones" },
      { status: 500 },
    )
  }
}

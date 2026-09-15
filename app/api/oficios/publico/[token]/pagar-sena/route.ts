import { NextRequest, NextResponse } from "next/server"
import { getTrabajoByTokenPublico } from "@/lib/oficios/oficios-service"
import { crearPreferenciaPago, obtenerConfigMP } from "@/lib/mercadopago/mercadopago-service"
import { getPublicAppUrl } from "@/lib/config/public-app-url"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ token: string }> },
) {
  const params = await props.params
  try {
    const trabajo = await getTrabajoByTokenPublico(params.token)
    if (!trabajo) {
      return NextResponse.json({ ok: false, error: "Trabajo no encontrado" }, { status: 404 })
    }

    if (trabajo.senaPagada) {
      return NextResponse.json({ ok: false, error: "La seña ya está registrada como pagada" }, { status: 409 })
    }

    const montoAcordado = Number(trabajo.montoAcordado || 0)
    if (montoAcordado <= 0) {
      return NextResponse.json({ ok: false, error: "El trabajo no tiene un monto acordado" }, { status: 400 })
    }

    const montoSena = Math.round((montoAcordado * (trabajo.porcentajeSena || 30)) / 100)
    const baseUrl = getPublicAppUrl()

    const config = await obtenerConfigMP(trabajo.empresaId)
    if (!config?.activo || !config.accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Mercado Pago no está configurado para esta empresa. No se puede cobrar la seña online (no se simula cobro).",
        },
        { status: 503 },
      )
    }

    try {
      const pref = await crearPreferenciaPago({
        empresaId: trabajo.empresaId,
        titulo: `Seña ${trabajo.porcentajeSena}% - ${trabajo.titulo.slice(0, 40)}`,
        monto: montoSena,
        takeRatePercentage: 2.5,
        externalReference: `OFICIO_SENA_${trabajo.id}`,
        backUrls: {
          success: `${baseUrl}/p/trabajo/${trabajo.tokenPublico}?pago=exitoso`,
          failure: `${baseUrl}/p/trabajo/${trabajo.tokenPublico}?pago=fallido`,
          pending: `${baseUrl}/p/trabajo/${trabajo.tokenPublico}?pago=pendiente`,
        },
      })

      const preferenceId = pref.id ?? pref.preference_id ?? null
      if (preferenceId) {
        await prisma.oficioTrabajo.update({
          where: { id: trabajo.id },
          data: { mpPreferenceIdSena: String(preferenceId) },
        })
      }

      return NextResponse.json({
        ok: true,
        data: {
          initPoint: pref.initPoint,
          montoSena,
          preferenceId,
        },
      })
    } catch (mpError: any) {
      return NextResponse.json(
        {
          ok: false,
          error: mpError?.message ?? "No se pudo crear la preferencia de Mercado Pago",
        },
        { status: 502 },
      )
    }
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

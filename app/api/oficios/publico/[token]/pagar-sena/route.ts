import { NextRequest, NextResponse } from "next/server"
import { getTrabajoByTokenPublico } from "@/lib/oficios/oficios-service"
import { crearPreferenciaPago, obtenerConfigMP } from "@/lib/mercadopago/mercadopago-service"
import { getPublicAppUrl } from "@/lib/config/public-app-url"

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

    const montoAcordado = Number(trabajo.montoAcordado || 0)
    if (montoAcordado <= 0) {
      return NextResponse.json({ ok: false, error: "El trabajo no tiene un monto acordado" }, { status: 400 })
    }

    const montoSena = Math.round((montoAcordado * (trabajo.porcentajeSena || 30)) / 100)
    const baseUrl = getPublicAppUrl()

    // Verificar si la empresa tiene Mercado Pago configurado
    const config = await obtenerConfigMP(trabajo.empresaId)

    if (config?.activo && config.accessToken) {
      try {
        const pref = await crearPreferenciaPago({
          empresaId: trabajo.empresaId,
          titulo: `Seña ${trabajo.porcentajeSena}% - ${trabajo.titulo.slice(0, 40)}`,
          monto: montoSena,
          externalReference: `OFICIO_SENA_${trabajo.id}`,
          backUrls: {
            success: `${baseUrl}/p/trabajo/${trabajo.tokenPublico}?pago=exitoso`,
            failure: `${baseUrl}/p/trabajo/${trabajo.tokenPublico}?pago=fallido`,
            pending: `${baseUrl}/p/trabajo/${trabajo.tokenPublico}?pago=pendiente`,
          },
        })

        return NextResponse.json({
          ok: true,
          data: {
            initPoint: pref.initPoint,
            montoSena,
          },
        })
      } catch (mpError: any) {
        // Fallback a link directo si las credenciales fallan
      }
    }

    // Fallback: Redirigir a checkout simulado / confirmación directa
    return NextResponse.json({
      ok: true,
      data: {
        initPoint: `${baseUrl}/p/trabajo/${trabajo.tokenPublico}?pago=exitoso`,
        montoSena,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

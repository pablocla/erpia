import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { parametrizarEmpresa, MODULOS_POR_RUBRO } from "@/lib/config/parametrizacion-rubro"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * GET /api/config/parametrizacion — Get current parametrization status
 * POST /api/config/parametrizacion — Run parametrization for empresa (by rubro)
 */

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const empresa = await prisma.empresa.findUnique({
    where: { id: ctx.auth.empresaId },
    select: { id: true, nombre: true, rubro: true },
  })

  const [modulos, cuentas, numeradores, parametros, comprobantes] = await Promise.all([
    prisma.configuracionModulo.count({ where: { empresaId: ctx.auth.empresaId } }),
    prisma.cuentaContable.count({ where: { empresaId: ctx.auth.empresaId } }),
    prisma.numerador.count({ where: { empresaId: ctx.auth.empresaId } }),
    prisma.parametroFiscal.count({ where: { empresaId: ctx.auth.empresaId } }),
    prisma.tipoComprobanteMaestro.count({ where: { empresaId: ctx.auth.empresaId } }),
  ])

  const rubrosDisponibles = Object.keys(MODULOS_POR_RUBRO)

  return NextResponse.json({
    success: true,
    empresa,
    parametrizacion: {
      modulosConfigurados: modulos,
      cuentasContables: cuentas,
      numeradores,
      parametrosFiscales: parametros,
      tiposComprobante: comprobantes,
      estaParametrizada: modulos > 0 && cuentas > 0 && numeradores > 0,
    },
    rubrosDisponibles,
  })
}

const parametrizarSchema = z.object({
  rubro: z.string().min(1).optional(),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  // Only admin can parametrize
  if (ctx.auth.rol !== "admin" && ctx.auth.rol !== "contador") {
    return NextResponse.json({ error: "Solo administradores pueden parametrizar" }, { status: 403 })
  }

  const body = await request.json()
  const { rubro } = parametrizarSchema.parse(body)

  // Get empresa rubro (use provided or from empresa record)
  const empresa = await prisma.empresa.findUnique({
    where: { id: ctx.auth.empresaId },
    select: { rubro: true },
  })

  const rubroFinal = rubro ?? empresa?.rubro ?? "comercio"

  // Update empresa rubro if changed
  if (rubro && rubro !== empresa?.rubro) {
    await prisma.empresa.update({
      where: { id: ctx.auth.empresaId },
      data: { rubro: rubroFinal },
    })
  }

  await parametrizarEmpresa(ctx.auth.empresaId, rubroFinal)

  return NextResponse.json({
    success: true,
    mensaje: `Empresa parametrizada exitosamente para rubro "${rubroFinal}"`,
    rubro: rubroFinal,
  })
}

import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { isFeatureActiva, FEATURES } from "@/lib/config/rubro-config-service"
import { getParametro } from "@/lib/config/parametro-service"
import { validateCbu, type TipoTransferenciaFce } from "@/lib/afip/mipyme-fce"

const putSchema = z.object({
  cbuFce: z.string().nullable().optional(),
  tipoTransferenciaFce: z.enum(["SCA", "ADC"]).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const empresaId = auth.auth.empresaId
  const config = await prisma.configFiscalEmpresa.findUnique({
    where: { empresaId },
  })

  const moduloActivo = await isFeatureActiva(empresaId, FEATURES.FACTURA_MIPYMES)
  const umbralMipyme = await getParametro(empresaId, "umbral_mipyme", 5_468_127, "AR")

  return NextResponse.json({
    moduloActivo,
    umbralMipyme,
    cbuFce: config?.cbuFce ?? null,
    tipoTransferenciaFce: (config?.tipoTransferenciaFce ?? "SCA") as TipoTransferenciaFce,
    cbuConfigurado: Boolean(config?.cbuFce && validateCbu(config.cbuFce)),
  })
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.cbuFce && !validateCbu(parsed.data.cbuFce)) {
    return NextResponse.json(
      { error: "CBU inválido: debe contener exactamente 22 dígitos" },
      { status: 400 }
    )
  }

  const empresaId = auth.auth.empresaId
  const config = await prisma.configFiscalEmpresa.upsert({
    where: { empresaId },
    create: {
      empresaId,
      cbuFce: parsed.data.cbuFce ?? null,
      tipoTransferenciaFce: parsed.data.tipoTransferenciaFce ?? "SCA",
    },
    update: {
      cbuFce: parsed.data.cbuFce,
      tipoTransferenciaFce: parsed.data.tipoTransferenciaFce,
    },
  })

  return NextResponse.json({
    cbuFce: config.cbuFce,
    tipoTransferenciaFce: config.tipoTransferenciaFce,
    cbuConfigurado: Boolean(config.cbuFce && validateCbu(config.cbuFce)),
  })
}
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { auditService } from "@/lib/config/audit-service"
import { z } from "zod"

const MODULOS_VALIDOS = [
  "compras",
  "ventas",
  "stock",
  "caja",
  "contabilidad",
  "hospitalidad",
  "agenda",
  "historia_clinica",
  "membresias",
  "onboarding",
  "ia",
  "logistica",
  "industria",
  "picking",
  "iot",
] as const

// GET — return all module configs for the user's empresa
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  const auth = ctx.auth

  const configs = await prisma.configuracionModulo.findMany({
    where: { empresaId: auth.empresaId },
    orderBy: { modulo: "asc" },
  })

  // Build a complete map (modules not in DB default to true)
  const resultado: Record<string, boolean> = {}
  for (const m of MODULOS_VALIDOS) {
    const found = configs.find((c) => c.modulo === m)
    resultado[m] = found ? found.habilitado : true
  }

  return NextResponse.json(resultado)
}

const patchSchema = z.object({
  modulos: z.record(z.enum(MODULOS_VALIDOS), z.boolean()),
})

// PATCH — upsert module configs
export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  const auth = ctx.auth

  // Only admin can change module config
  if (auth.rol !== "administrador") {
    return NextResponse.json({ error: "Solo administradores pueden cambiar módulos" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const ops = Object.entries(parsed.data.modulos).map(([modulo, habilitado]) =>
    prisma.configuracionModulo.upsert({
      where: { empresaId_modulo: { empresaId: auth.empresaId, modulo } },
      update: { habilitado },
      create: { empresaId: auth.empresaId, modulo, habilitado },
    })
  )

  await prisma.$transaction(ops)

  // Audit trail for each module toggle
  for (const [modulo, habilitado] of Object.entries(parsed.data.modulos)) {
    await auditService.logModuloToggle({
      moduloNombre: modulo,
      activo: habilitado,
      usuarioId: auth.userId,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}

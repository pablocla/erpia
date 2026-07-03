import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { canUseSku } from "@/lib/platform/entitlements"
import { NICHE_APPS } from "@/lib/niche/niche-apps-catalog"

const schema = z.object({
  nombre: z.string().min(2),
  telefono: z.string().min(6, "Teléfono obligatorio para WhatsApp"),
  email: z.string().email().optional().or(z.literal("")),
})

async function tieneAlgunaAppNicho(empresaId: number): Promise<boolean> {
  for (const app of NICHE_APPS) {
    const acceso = await canUseSku(empresaId, app.sku)
    if (acceso.ok) return true
  }
  return false
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const licenciado = await tieneAlgunaAppNicho(ctx.auth.empresaId)
  if (!licenciado) {
    return NextResponse.json({ error: "NICHE_SKU_REQUIRED" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  const { nombre, telefono, email } = parsed.data

  const cliente = await prisma.cliente.create({
    data: {
      empresaId: ctx.auth.empresaId,
      nombre,
      telefono,
      email: email || null,
      cuit: `NICHO-${Date.now().toString(36).toUpperCase()}`,
      condicionIva: "Consumidor Final",
      tipoPersona: "persona_fisica",
    },
  })

  return NextResponse.json(cliente, { status: 201 })
}
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { addZona, ensureIoTSeeds, listEventos, listProgramas, listZonas } from "@/lib/agro/iot-stub-store"

const createZonaSchema = z.object({
  nombre: z.string().min(1),
  loteId: z.coerce.number().int().positive(),
  tipoRiego: z.enum(["GOTEO", "ASPERSION", "PIVOTE"]),
  caudal: z.union([z.coerce.number(), z.null()]).optional(),
})

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const loteIdParam = searchParams.get("loteId")
  const loteId = loteIdParam ? Number(loteIdParam) : undefined
  if (loteIdParam && (!Number.isInteger(loteId) || loteId <= 0)) {
    return NextResponse.json({ error: "loteId inválido" }, { status: 400 })
  }

  const lotes = await prisma.agroLote.findMany({
    where: { ...whereEmpresa(auth.auth.empresaId), activo: true },
    select: { id: true },
    orderBy: { id: "asc" },
    take: 10,
  })
  ensureIoTSeeds(auth.auth.empresaId, lotes.map((l) => l.id))

  const zonas = listZonas(auth.auth.empresaId, loteId).map((z) => ({
    ...z,
    programas: listProgramas(z.id, auth.auth.empresaId),
    eventos: listEventos(z.id, auth.auth.empresaId).slice(0, 5),
  }))

  return NextResponse.json({ zonas })
}

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response
  const body = await request.json()

  const parsed = createZonaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "payload invalido", issues: parsed.error.flatten() }, { status: 400 })
  }
  const { nombre, loteId, tipoRiego, caudal } = parsed.data

  const lote = await prisma.agroLote.findFirst({
    where: { id: loteId, ...whereEmpresa(auth.auth.empresaId), activo: true },
    select: { id: true },
  })
  if (!lote) {
    return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 })
  }

  const zona = addZona({
    nombre: String(nombre).trim(),
    loteId: Number(loteId),
    empresaId: auth.auth.empresaId,
    activa: false,
    tipoRiego,
    caudal: caudal == null ? null : Number(caudal),
  })

  return NextResponse.json(zona, { status: 201 })
}

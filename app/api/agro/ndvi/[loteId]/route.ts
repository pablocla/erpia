import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function score(cultivo?: string | null) {
  const c = (cultivo ?? "").toLowerCase()
  if (c.includes("soja")) return 0.68
  if (c.includes("ma") || c.includes("maiz")) return 0.72
  if (c.includes("trigo")) return 0.63
  if (c.includes("girasol")) return 0.6
  return 0.57
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ loteId: string }> }) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { loteId } = await params
  const id = Number(loteId)
  if (!id) return NextResponse.json({ error: "loteId inválido" }, { status: 400 })

  const lote = await prisma.agroLote.findFirst({
    where: { id, ...whereEmpresa(auth.auth.empresaId), activo: true },
    select: { id: true, nombre: true, cultivoActual: true, superficieHa: true },
  })

  if (!lote) return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 })

  const base = score(lote.cultivoActual)
  const ajuste = Math.min(0.06, lote.superficieHa / 5000)
  const jitter = ((lote.id % 9) - 4) * 0.008
  const ndviMedio = clamp(base + ajuste + jitter, 0.28, 0.89)
  const ndviMin = clamp(ndviMedio - 0.08, 0.2, 0.86)
  const ndviMax = clamp(ndviMedio + 0.07, 0.25, 0.92)

  return NextResponse.json({
    loteId: lote.id,
    lote: lote.nombre,
    ndviMedio: Number(ndviMedio.toFixed(3)),
    ndviMin: Number(ndviMin.toFixed(3)),
    ndviMax: Number(ndviMax.toFixed(3)),
    fuente: "ESTIMADO",
    cached: false,
    fecha: new Date().toISOString().slice(0, 10),
    imageUrl: null,
  })
}

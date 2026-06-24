import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validarFirmaWebhook } from "@/lib/auth/webhook-guard"

const normalizePhone = (value: string | null) => {
  if (!value) return null
  return value.replace(/[^0-9]/g, "")
}

export async function POST(request: NextRequest) {
  const clonedReq = request.clone()
  const rawBody = await clonedReq.text()

  if (!validarFirmaWebhook(request, rawBody)) {
    return NextResponse.json({ error: "Firma de webhook inválida o ausente" }, { status: 401 })
  }

  const formData = await request.formData()
  const body = String(formData.get("Body") ?? "").trim().toLowerCase()
  const from = String(formData.get("From") ?? "").trim()
  const to = String(formData.get("To") ?? "").trim()

  if (!body || !from || !to) {
    return NextResponse.json({ error: "Body, From o To no enviados" }, { status: 400 })
  }

  const normalizedFrom = normalizePhone(from)
  const normalizedTo = normalizePhone(to)

  if (!normalizedFrom || !normalizedTo) {
    return NextResponse.json({ error: "Número de teléfono inválido" }, { status: 400 })
  }

  const empresa = await prisma.empresa.findFirst({
    where: { telefono: { contains: normalizedTo } },
    select: { id: true },
  })

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada para el número de destino" }, { status: 404 })
  }

  const cliente = await prisma.cliente.findFirst({
    where: {
      telefono: { contains: normalizedFrom },
      empresaId: empresa.id,
    },
    orderBy: { updatedAt: "desc" },
  })

  if (!cliente) {
    return NextResponse.json({ success: false, message: "Cliente no encontrado para este número en esta empresa" }, { status: 404 })
  }

  const turno = await prisma.turno.findFirst({
    where: {
      clienteId: cliente.id,
      estado: { in: ["pendiente", "confirmado"] },
    },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    include: { profesional: true },
  })

  if (!turno) {
    return NextResponse.json({ success: false, message: "No se encontró un turno activo para este cliente" }, { status: 404 })
  }

  if (body.includes("confirmar")) {
    await prisma.turno.update({ where: { id: turno.id }, data: { estado: "confirmado" } })
    return NextResponse.json({ success: true, message: "Turno confirmado" })
  }

  if (body.includes("cancelar") || body.includes("cancelado")) {
    await prisma.turno.update({ where: { id: turno.id }, data: { estado: "cancelado" } })
    return NextResponse.json({ success: true, message: "Turno cancelado" })
  }

  return NextResponse.json({ success: false, message: "No se reconoció la acción. Escribí CONFIRMAR o CANCELAR." })
}


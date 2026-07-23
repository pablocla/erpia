import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validarFirmaWebhook } from "@/lib/auth/webhook-guard"
import { handleLeoInboundWhatsApp } from "@/lib/empleados-digitales/inbound-whatsapp"

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

  // Re-parse form from raw is hard; use original request formData after clone text
  // NextRequest formData may need fresh body — reconstruct from raw if application/x-www-form-urlencoded
  let body = ""
  let from = ""
  let to = ""

  const contentType = request.headers.get("content-type") || ""
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    try {
      const formData = await new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: rawBody,
      }).formData()
      body = String(formData.get("Body") ?? "").trim().toLowerCase()
      from = String(formData.get("From") ?? "").trim()
      to = String(formData.get("To") ?? "").trim()
    } catch {
      /* fallthrough */
    }
  }

  if (!body || !from || !to) {
    return NextResponse.json({ error: "Body, From o To no enviados" }, { status: 400 })
  }

  const normalizedFrom = normalizePhone(from)
  const normalizedTo = normalizePhone(to)

  if (!normalizedFrom || !normalizedTo) {
    return NextResponse.json({ error: "Número de teléfono inválido" }, { status: 400 })
  }

  const empresa = await prisma.empresa.findFirst({
    where: { telefono: { contains: normalizedTo.slice(-8) } },
    select: { id: true },
  })

  if (!empresa) {
    return NextResponse.json(
      { error: "Empresa no encontrada para el número de destino" },
      { status: 404 },
    )
  }

  // ED-16: Leo inbound (ya pagué / ver deuda) antes de turnos
  try {
    const leo = await handleLeoInboundWhatsApp({
      empresaId: empresa.id,
      fromPhone: from,
      body,
    })
    if (leo.handled) {
      return NextResponse.json({
        success: true,
        channel: "leo",
        action: leo.action,
        message: leo.message,
        tareaId: "tareaId" in leo ? leo.tareaId : undefined,
      })
    }
  } catch (err) {
    console.warn("[whatsapp webhook] leo inbound:", err)
  }

  const cliente = await prisma.cliente.findFirst({
    where: {
      telefono: { contains: normalizedFrom.slice(-8) },
      empresaId: empresa.id,
    },
    orderBy: { updatedAt: "desc" },
  })

  if (!cliente) {
    return NextResponse.json(
      {
        success: false,
        message: "Cliente no encontrado para este número en esta empresa",
      },
      { status: 404 },
    )
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
    return NextResponse.json({
      success: false,
      message:
        "No se encontró turno activo. Si es sobre fiado, escribí YA PAGUE o VER DEUDA.",
    })
  }

  if (body.includes("confirmar")) {
    await prisma.turno.update({ where: { id: turno.id }, data: { estado: "confirmado" } })
    return NextResponse.json({ success: true, message: "Turno confirmado" })
  }

  if (body.includes("cancelar") || body.includes("cancelado")) {
    await prisma.turno.update({ where: { id: turno.id }, data: { estado: "cancelado" } })
    return NextResponse.json({ success: true, message: "Turno cancelado" })
  }

  return NextResponse.json({
    success: false,
    message: "No se reconoció la acción. Escribí CONFIRMAR, CANCELAR, YA PAGUE o VER DEUDA.",
  })
}

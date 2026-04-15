import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { eventBus } from "@/lib/events/event-bus"
import { z } from "zod"

const patchSchema = z.object({
  estado: z.enum(["cartera", "depositado", "endosado", "rechazado", "debitado", "anulado"]).optional(),
  observaciones: z.string().optional(),
  cuentaDepositoId: z.number().int().positive().optional().nullable(),
  endosadoA: z.string().optional(),
})

// Valid state transitions for cheque lifecycle
const TRANSITIONS: Record<string, string[]> = {
  cartera: ["depositado", "endosado", "anulado"],
  depositado: ["debitado", "rechazado"],
  endosado: ["rechazado"],
  rechazado: ["cartera"], // Re-entry to portfolio
  debitado: [],
  anulado: [],
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const cheque = await prisma.cheque.findFirst({
      where: {
        id: parseInt(id),
        OR: [
          { cliente: { empresaId: ctx.auth.empresaId } },
          { proveedor: { empresaId: ctx.auth.empresaId } },
          { cuentaDeposito: { empresaId: ctx.auth.empresaId } },
          { cuentaEmisor: { empresaId: ctx.auth.empresaId } },
        ],
      },
      include: {
        cliente: { select: { id: true, nombre: true, cuit: true } },
        proveedor: { select: { id: true, nombre: true, cuit: true } },
        cuentaDeposito: { select: { id: true, banco: true, numeroCuenta: true } },
        cuentaEmisor: { select: { id: true, banco: true, numeroCuenta: true } },
      },
    })

    if (!cheque) {
      return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })
    }

    // Available transitions from current state
    const transicionesDisponibles = TRANSITIONS[cheque.estado] ?? []

    return NextResponse.json({
      ...cheque,
      monto: Number(cheque.monto),
      transicionesDisponibles,
    })
  } catch (error) {
    console.error("cheques GET [id]:", error)
    return NextResponse.json({ error: "Error al obtener cheque" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    // Validate state transition
    if (parsed.data.estado) {
      const current = await prisma.cheque.findUnique({ where: { id: parseInt(id) }, select: { estado: true } })
      if (!current) return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })

      const allowed = TRANSITIONS[current.estado] ?? []
      if (!allowed.includes(parsed.data.estado)) {
        return NextResponse.json({
          error: `Transición inválida: ${current.estado} → ${parsed.data.estado}. Permitidas: ${allowed.join(", ")}`,
        }, { status: 400 })
      }
    }

    const cheque = await prisma.cheque.update({
      where: { id: parseInt(id) },
      data: {
        estado: parsed.data.estado,
        observaciones: parsed.data.observaciones,
        cuentaDepositoId: parsed.data.cuentaDepositoId,
        updatedAt: new Date(),
      },
    })

    // Emit events for key transitions
    if (parsed.data.estado === "depositado") {
      eventBus.emit({
        type: "CHEQUE_DEPOSITADO",
        payload: { chequeId: cheque.id, monto: Number(cheque.monto), cuentaDepositoId: parsed.data.cuentaDepositoId },
        timestamp: new Date(),
      })
    } else if (parsed.data.estado === "rechazado") {
      eventBus.emit({
        type: "CHEQUE_RECHAZADO",
        payload: { chequeId: cheque.id, monto: Number(cheque.monto), clienteId: cheque.clienteId },
        timestamp: new Date(),
      })
    }

    return NextResponse.json({ ...cheque, monto: Number(cheque.monto) })
  } catch (error) {
    console.error("cheques PATCH:", error)
    return NextResponse.json({ error: "Error al actualizar cheque" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const cheque = await prisma.cheque.findFirst({
      where: {
        id: parseInt(id),
        OR: [
          { cliente: { empresaId: ctx.auth.empresaId } },
          { proveedor: { empresaId: ctx.auth.empresaId } },
          { cuentaDeposito: { empresaId: ctx.auth.empresaId } },
          { cuentaEmisor: { empresaId: ctx.auth.empresaId } },
        ],
      },
    })

    if (!cheque) {
      return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })
    }

    // Only allow anulación from cartera state
    if (!["cartera"].includes(cheque.estado)) {
      return NextResponse.json({
        error: `No se puede anular un cheque en estado '${cheque.estado}'. Solo cheques en cartera.`,
      }, { status: 400 })
    }

    await prisma.cheque.update({
      where: { id: parseInt(id) },
      data: { estado: "anulado", observaciones: `${cheque.observaciones ?? ""}\n[Anulado: ${new Date().toISOString()}]`.trim() },
    })

    return NextResponse.json({ success: true, message: "Cheque anulado" })
  } catch (error) {
    console.error("cheques DELETE:", error)
    return NextResponse.json({ error: "Error al anular cheque" }, { status: 500 })
  }
}

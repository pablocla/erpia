import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { chequeService, TRANSICIONES_CHEQUE } from "@/lib/cheques/cheque-service"
import { chequeEmpresaWhere } from "@/lib/auth/tenant-validate"
import { z } from "zod"

const patchSchema = z.object({
  estado: z.enum(["cartera", "depositado", "endosado", "rechazado", "debitado", "anulado"]).optional(),
  observaciones: z.string().optional(),
  cuentaDepositoId: z.number().int().positive().optional().nullable(),
  endosadoA: z.string().optional(),
})

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
          { recibo: { cliente: { empresaId: ctx.auth.empresaId } } },
          { ordenPago: { proveedor: { empresaId: ctx.auth.empresaId } } },
        ],
      },
      include: {
        cliente: { select: { id: true, nombre: true, cuit: true } },
        proveedor: { select: { id: true, nombre: true, cuit: true } },
        cuentaDeposito: { select: { id: true, banco: true, numeroCuenta: true } },
        cuentaEmisor: { select: { id: true, banco: true, numeroCuenta: true } },
        recibo: { select: { id: true, numero: true } },
        ordenPago: { select: { id: true, numero: true } },
      },
    })

    if (!cheque) {
      return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })
    }

    const transicionesDisponibles = TRANSICIONES_CHEQUE[cheque.estado] ?? []

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
    const chequeId = parseInt(id)
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const empresaId = ctx.auth.empresaId

    // Depósito con circuito contable completo
    if (parsed.data.estado === "depositado") {
      if (!parsed.data.cuentaDepositoId) {
        return NextResponse.json({ error: "cuentaDepositoId requerida para depositar" }, { status: 400 })
      }
      const cheque = await chequeService.depositar(chequeId, parsed.data.cuentaDepositoId, empresaId)
      return NextResponse.json(cheque)
    }

    // Rechazo con re-débito CC
    if (parsed.data.estado === "rechazado") {
      const cheque = await chequeService.rechazar(chequeId, empresaId, parsed.data.observaciones)
      return NextResponse.json(cheque)
    }

    // Débito cheque propio
    if (parsed.data.estado === "debitado") {
      const cheque = await chequeService.debitarPropio(chequeId, empresaId)
      return NextResponse.json(cheque)
    }

    // Transiciones simples (endosado, anulado, etc.)
    if (parsed.data.estado) {
      const current = await prisma.cheque.findFirst({
        where: { id: chequeId, ...chequeEmpresaWhere(empresaId) },
        select: { estado: true },
      })
      if (!current) return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })

      if (!chequeService.validarTransicion(current.estado, parsed.data.estado)) {
        const allowed = TRANSICIONES_CHEQUE[current.estado] ?? []
        return NextResponse.json({
          error: `Transición inválida: ${current.estado} → ${parsed.data.estado}. Permitidas: ${allowed.join(", ")}`,
        }, { status: 400 })
      }
    }

    const owned = await prisma.cheque.findFirst({
      where: { id: chequeId, ...chequeEmpresaWhere(empresaId) },
    })
    if (!owned) return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })

    const cheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        estado: parsed.data.estado,
        observaciones: parsed.data.observaciones,
        cuentaDepositoId: parsed.data.cuentaDepositoId,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ ...cheque, monto: Number(cheque.monto) })
  } catch (error: any) {
    console.error("cheques PATCH:", error)
    return NextResponse.json({ error: error?.message ?? "Error al actualizar cheque" }, { status: 500 })
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
          { recibo: { cliente: { empresaId: ctx.auth.empresaId } } },
          { ordenPago: { proveedor: { empresaId: ctx.auth.empresaId } } },
        ],
      },
    })

    if (!cheque) {
      return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })
    }

    if (cheque.estado !== "cartera") {
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
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const abrirCajaSchema = z.object({
  saldoInicial: z.number().min(0).default(0),
  empresaId: z.number().int().positive(),
  observaciones: z.string().optional(),
  turno: z.enum(["mañana", "tarde", "noche"]).optional(),
})

const cerrarCajaSchema = z.object({
  cajaId: z.number().int().positive(),
  observaciones: z.string().optional(),
  // Arqueo fields — cashier declares totals per payment method
  arqueoEfectivo: z.number().min(0).optional(),
  arqueoTarjeta: z.number().min(0).optional(),
  arqueoTransferencia: z.number().min(0).optional(),
  arqueoCheque: z.number().min(0).optional(),
  arqueoQR: z.number().min(0).optional(),
  diferenciaJustif: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (estado) where.estado = estado

    const cajas = await prisma.caja.findMany({
      where,
      include: {
        movimientos: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    return NextResponse.json(cajas)
  } catch (error) {
    console.error("Error al obtener cajas:", error)
    logError("api/caja:GET", error, request)
    return NextResponse.json({ error: "Error al obtener cajas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = abrirCajaSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }
    const { saldoInicial, empresaId, observaciones } = validacion.data

    // Verificar si hay una caja abierta para esta empresa
    const cajaAbierta = await prisma.caja.findFirst({
      where: { empresaId, estado: "abierta" },
    })

    if (cajaAbierta) {
      return NextResponse.json(
        { error: "Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva." },
        { status: 409 }
      )
    }

    const caja = await prisma.caja.create({
      data: { saldoInicial, empresaId, observaciones, turno: body.turno, abiertoPor: ctx.auth.userId },
      include: { movimientos: true },
    })

    return NextResponse.json(caja, { status: 201 })
  } catch (error) {
    console.error("Error al abrir caja:", error)
    return NextResponse.json({ error: "Error al abrir caja" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = cerrarCajaSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }
    const {
      cajaId, observaciones,
      arqueoEfectivo, arqueoTarjeta, arqueoTransferencia, arqueoCheque, arqueoQR,
      diferenciaJustif,
    } = validacion.data

    const caja = await prisma.caja.findUnique({
      where: { id: cajaId },
      include: { movimientos: true },
    })

    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 })
    if (caja.estado === "cerrada") return NextResponse.json({ error: "La caja ya está cerrada" }, { status: 400 })

    // Calcular saldo final del sistema
    const ingresos = caja.movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + m.monto, 0)
    const egresos = caja.movimientos
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + m.monto, 0)
    const saldoFinal = caja.saldoInicial + ingresos - egresos

    // Calcular totales del sistema por medio de pago
    const porMedio = (medio: string, tipo?: string) =>
      caja.movimientos
        .filter((m) => m.medioPago === medio && (!tipo || m.tipo === tipo))
        .reduce((s, m) => s + (m.tipo === "ingreso" ? m.monto : -m.monto), 0)

    const sistemaEfectivo = caja.saldoInicial + porMedio("efectivo")
    const sistemaTarjeta = porMedio("tarjeta_debito") + porMedio("tarjeta_credito")
    const sistemaTransferencia = porMedio("transferencia")
    const sistemaCheque = porMedio("cheque")
    const sistemaQR = porMedio("qr")

    // Calcular diferencia (declarado vs sistema)
    const totalDeclarado =
      (arqueoEfectivo ?? sistemaEfectivo) +
      (arqueoTarjeta ?? sistemaTarjeta) +
      (arqueoTransferencia ?? sistemaTransferencia) +
      (arqueoCheque ?? sistemaCheque) +
      (arqueoQR ?? sistemaQR)
    const totalSistema = sistemaEfectivo + sistemaTarjeta + sistemaTransferencia + sistemaCheque + sistemaQR
    const diferencia = totalDeclarado - totalSistema

    // Require justification for variance > $100
    if (Math.abs(diferencia) > 100 && !diferenciaJustif) {
      return NextResponse.json(
        {
          error: "Diferencia significativa detectada",
          diferencia,
          sistemaEfectivo,
          sistemaTarjeta,
          sistemaTransferencia,
          sistemaCheque,
          sistemaQR,
          mensaje: "Debe justificar la diferencia para cerrar la caja",
        },
        { status: 422 },
      )
    }

    const cajaCerrada = await prisma.caja.update({
      where: { id: caja.id },
      data: {
        estado: "cerrada",
        saldoFinal,
        observaciones,
        arqueoEfectivo,
        arqueoTarjeta,
        arqueoTransferencia,
        arqueoCheque,
        arqueoQR,
        diferencia,
        diferenciaJustif,
        cerradoPor: ctx.auth.userId,
      },
      include: { movimientos: true },
    })

    return NextResponse.json({
      ...cajaCerrada,
      resumenArqueo: {
        sistemaEfectivo,
        sistemaTarjeta,
        sistemaTransferencia,
        sistemaCheque,
        sistemaQR,
        totalSistema,
        totalDeclarado,
        diferencia,
      },
    })
  } catch (error) {
    console.error("Error al cerrar caja:", error)
    return NextResponse.json({ error: "Error al cerrar caja" }, { status: 500 })
  }
}

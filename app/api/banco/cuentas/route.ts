import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// ─── GET — List accounts & available banks ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const [cuentas, bancos] = await Promise.all([
      prisma.cuentaBancaria.findMany({
        where: { empresaId: ctx.auth.empresaId, activo: true },
        include: {
          banco: { select: { id: true, nombre: true, codigoBcra: true } },
          moneda: { select: { id: true, codigo: true, nombre: true, simbolo: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.banco.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      }),
    ])

    return NextResponse.json({ cuentas, bancos })
  } catch (error) {
    console.error("Error en GET /api/banco/cuentas:", error)
    logError("api/banco/cuentas:GET", error, request)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// ─── POST — Create new bank account ──────────────────────────────────────────

const cuentaSchema = z.object({
  bancoId: z.number().int().positive().optional(),
  bancoNombre: z.string().optional(),
  cbu: z.string().max(22).optional().nullable(),
  alias: z.string().max(40).optional().nullable(),
  numeroCuenta: z.string().max(50).optional().nullable(),
  tipo: z.enum(["CC", "CA", "virtual"]).default("CC"),
  monedaId: z.number().int().positive().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = cuentaSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { bancoId, bancoNombre, cbu, alias, numeroCuenta, tipo, monedaId } = validacion.data

    let effectiveBancoId = bancoId
    if (!effectiveBancoId) {
      if (bancoNombre) {
        let b = await prisma.banco.findFirst({
          where: { nombre: { equals: bancoNombre.trim(), mode: "insensitive" } },
        })
        if (!b) {
          b = await prisma.banco.create({
            data: { nombre: bancoNombre.trim(), activo: true },
          })
        }
        effectiveBancoId = b.id
      } else {
        const defaultBanco = await prisma.banco.findFirst({ where: { activo: true } })
        if (!defaultBanco) {
          const created = await prisma.banco.create({
            data: { nombre: "Banco Genérico / Mercado Pago", activo: true },
          })
          effectiveBancoId = created.id
        } else {
          effectiveBancoId = defaultBanco.id
        }
      }
    }

    let effectiveMonedaId = monedaId
    if (!effectiveMonedaId) {
      const defaultMoneda = await prisma.moneda.findFirst({
        where: { codigo: { in: ["ARS", "PES", "019"] } },
      })
      if (defaultMoneda) {
        effectiveMonedaId = defaultMoneda.id
      } else {
        const anyMoneda = await prisma.moneda.findFirst()
        if (anyMoneda) {
          effectiveMonedaId = anyMoneda.id
        } else {
          const created = await prisma.moneda.create({
            data: { codigo: "ARS", nombre: "Peso Argentino", simbolo: "$", decimales: 2, cotizacion: 1 },
          })
          effectiveMonedaId = created.id
        }
      }
    }

    const cuenta = await prisma.cuentaBancaria.create({
      data: {
        empresaId: ctx.auth.empresaId,
        bancoId: effectiveBancoId,
        monedaId: effectiveMonedaId,
        tipo,
        cbu: cbu?.trim() || null,
        alias: alias?.trim() || null,
        numeroCuenta: numeroCuenta?.trim() || null,
        activo: true,
      },
      include: {
        banco: { select: { id: true, nombre: true } },
        moneda: { select: { id: true, codigo: true, simbolo: true } },
      },
    })

    return NextResponse.json(cuenta, { status: 201 })
  } catch (error) {
    console.error("Error al crear cuenta bancaria:", error)
    logError("api/banco/cuentas:POST", error, request)
    return NextResponse.json({ error: "Error al crear la cuenta bancaria" }, { status: 500 })
  }
}

/**
 * /api/config/plan-cuentas — CRUD plan de cuentas contables por empresa
 *
 * GET  ?empresaId=1               → lista todas las cuentas de la empresa
 * GET  ?empresaId=1&tipo=activo   → filtrar por tipo
 * POST { empresaId, codigo, nombre, tipo, categoria, nivel?, imputable?, parentId? }
 * POST { action: "seed", empresaId, rubro }  → seed plan base por rubro
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { obtenerPlanCuentasPorRubro, obtenerConfigAsientosPorDefecto, obtenerParametrosFiscalesPorDefecto, obtenerNumeradoresPorDefecto } from "@/lib/contabilidad/plan-cuentas-seeds"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = Number(searchParams.get("empresaId") || "1")
    const tipo = searchParams.get("tipo")

    const cuentas = await prisma.cuentaContable.findMany({
      where: {
        empresaId,
        ...(tipo ? { tipo } : {}),
        activo: true,
      },
      orderBy: { codigo: "asc" },
    })

    return NextResponse.json({ cuentas })
  } catch (error) {
    console.error("Error al obtener plan de cuentas:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ─── SEED: populate plan de cuentas + config asientos + parámetros + numeradores ───
    if (body.action === "seed") {
      const { empresaId, rubro, pais } = body
      if (!empresaId || !rubro) {
        return NextResponse.json({ error: "empresaId y rubro requeridos" }, { status: 400 })
      }

      // Check if already seeded
      const existing = await prisma.cuentaContable.count({ where: { empresaId } })
      if (existing > 0) {
        return NextResponse.json({ error: "Plan de cuentas ya existe para esta empresa. Use PUT/DELETE para modificar." }, { status: 409 })
      }

      const planCuentas = obtenerPlanCuentasPorRubro(rubro)
      const configAsientos = obtenerConfigAsientosPorDefecto(rubro)
      const parametros = obtenerParametrosFiscalesPorDefecto(pais ?? "AR")
      const numeradores = obtenerNumeradoresPorDefecto()

      await prisma.$transaction(async (tx) => {
        // 1. Plan de cuentas
        for (const cuenta of planCuentas) {
          await tx.cuentaContable.create({
            data: {
              empresaId,
              codigo: cuenta.codigo,
              nombre: cuenta.nombre,
              tipo: cuenta.tipo,
              categoria: cuenta.categoria,
              nivel: cuenta.nivel,
              imputable: cuenta.imputable,
            },
          })
        }

        // 2. Config asientos
        for (const cfg of configAsientos) {
          await tx.configAsientoCuenta.create({
            data: {
              empresaId,
              tipoTransaccion: cfg.tipoTransaccion,
              campo: cfg.campo,
              cuentaCodigo: cfg.cuentaCodigo,
              cuentaNombre: cfg.cuentaNombre,
            },
          })
        }

        // 3. Parámetros fiscales
        for (const param of parametros) {
          await tx.parametroFiscal.create({
            data: {
              empresaId,
              clave: param.clave,
              valor: param.valor,
              descripcion: param.descripcion,
              categoria: param.categoria,
              pais: param.pais,
              normativa: param.normativa,
            },
          })
        }

        // 4. Numeradores
        for (const num of numeradores) {
          await tx.numerador.create({
            data: {
              empresaId,
              tipoDocumento: num.tipoDocumento,
              prefijo: num.prefijo,
              digitos: num.digitos,
            },
          })
        }
      })

      return NextResponse.json({
        message: "Configuración inicializada",
        cuentas: planCuentas.length,
        configAsientos: configAsientos.length,
        parametros: parametros.length,
        numeradores: numeradores.length,
      })
    }

    // ─── CREATE: single account ───
    const { empresaId, codigo, nombre, tipo, categoria, nivel, imputable, parentId } = body

    if (!empresaId || !codigo || !nombre || !tipo || !categoria) {
      return NextResponse.json({ error: "empresaId, codigo, nombre, tipo, categoria requeridos" }, { status: 400 })
    }

    const cuenta = await prisma.cuentaContable.create({
      data: {
        empresaId,
        codigo,
        nombre,
        tipo,
        categoria,
        nivel: nivel ?? 3,
        imputable: imputable ?? true,
        parentId: parentId ?? null,
      },
    })

    return NextResponse.json({ cuenta }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una cuenta con ese código para esta empresa" }, { status: 409 })
    }
    console.error("Error al crear cuenta contable:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

import { prisma } from "@/lib/prisma"

/* ═══════════════════════════════════════════════════════════════════════════
   AJUSTE POR INFLACIÓN (RT 6 / NIC 29) — Reexpresión en moneda homogénea
   Obligatorio en Argentina para estados contables
   Diferenciador vs Colppy/Xubio que no lo implementan
   ═══════════════════════════════════════════════════════════════════════════ */

// Coeficientes IPC mensuales (se cargan desde INDEC o manualmente)
// El servicio calcula el RECPAM y genera asiento contable automático

// ─── Registrar coeficiente de ajuste ────────────────────────────────────────

export async function registrarCoeficiente(params: {
  empresaId: number
  periodo: string // "2026-03"
  coeficiente: number
  indice?: string
}) {
  return prisma.ajusteInflacion.create({
    data: {
      periodo: params.periodo,
      coeficiente: params.coeficiente,
      indice: params.indice ?? "IPC",
      totalAjuste: 0,
      estado: "borrador",
      empresaId: params.empresaId,
    },
  })
}

// ─── Calcular ajuste por inflación de un período ────────────────────────────

export async function calcularAjusteInflacion(empresaId: number, periodo: string) {
  // 1. Obtener coeficiente del período
  const ajuste = await prisma.ajusteInflacion.findFirst({
    where: { empresaId, periodo, estado: "borrador" },
  })
  if (!ajuste) throw new Error(`No hay coeficiente registrado para ${periodo}`)

  // 2. Obtener cuentas NO monetarias (rubros expuestos a inflación)
  // En RT 6: Bienes de uso, Intangibles, Capital, RNA, Reservas
  const cuentasNoMonetarias = await prisma.cuentaContable.findMany({
    where: {
      empresaId,
      tipo: { in: ["activo_no_corriente", "patrimonio_neto"] },
      // Las cuentas monetarias (caja, bancos, CxC, CxP) NO se reexpresan
    },
  })

  // 3. Obtener saldos actuales de cada cuenta
  let totalAjuste = 0

  const detalles: Array<{
    cuentaId: number
    codigo: string
    nombre: string
    saldoOriginal: number
    ajuste: number
    saldoReexpresado: number
  }> = []

  for (const cuenta of cuentasNoMonetarias) {
    // Sumar movimientos del debe y haber
    const movimientos = await prisma.movimientoContable.aggregate({
      where: {
        asiento: { empresaId },
        cuentaId: cuenta.id,
      },
      _sum: { debe: true, haber: true },
    })

    const saldo = (movimientos._sum.debe ?? 0) - (movimientos._sum.haber ?? 0)

    // Ajuste = saldo * (coeficiente - 1)
    // Si coeficiente = 1.05 (5% inflación), ajuste = saldo * 0.05
    const montoAjuste = saldo * (ajuste.coeficiente - 1)
    totalAjuste += montoAjuste

    detalles.push({
      cuentaId: cuenta.id,
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      saldoOriginal: Math.round(saldo * 100) / 100,
      ajuste: Math.round(montoAjuste * 100) / 100,
      saldoReexpresado: Math.round((saldo + montoAjuste) * 100) / 100,
    })
  }

  // 4. Actualizar el registro de ajuste
  await prisma.ajusteInflacion.update({
    where: { id: ajuste.id },
    data: { totalAjuste: Math.round(totalAjuste * 100) / 100 },
  })

  return {
    ajusteId: ajuste.id,
    periodo,
    coeficiente: ajuste.coeficiente,
    totalAjuste: Math.round(totalAjuste * 100) / 100,
    // RECPAM = Resultado por Exposición al Cambio en el Poder Adquisitivo de la Moneda
    recpam: Math.round(-totalAjuste * 100) / 100,
    detalles,
  }
}

// ─── Aplicar ajuste (generar asiento contable) ──────────────────────────────

export async function aplicarAjuste(empresaId: number, ajusteId: number) {
  const ajuste = await prisma.ajusteInflacion.findFirst({
    where: { id: ajusteId, empresaId, estado: "borrador" },
  })
  if (!ajuste) throw new Error("Ajuste no encontrado o ya aplicado")

  // Generar asiento de ajuste
  const [anio, mes] = ajuste.periodo.split("-").map(Number)
  const fechaAsiento = new Date(anio, mes - 1, 28) // Último día hábil aprox

  const asiento = await prisma.asientoContable.create({
    data: {
      fecha: fechaAsiento,
      descripcion: `Ajuste por inflación — ${ajuste.periodo} (${ajuste.indice} coef. ${ajuste.coeficiente})`,
      tipo: "ajuste_inflacion",
      estado: "confirmado",
      empresaId,
    },
  })

  // Buscar cuenta RECPAM (resultado por tenencia)
  const cuentaRECPAM = await prisma.cuentaContable.findFirst({
    where: {
      empresaId,
      codigo: { contains: "RECPAM" },
    },
  })

  if (cuentaRECPAM) {
    // Movimiento contrapartida RECPAM
    if (ajuste.totalAjuste > 0) {
      await prisma.movimientoContable.create({
        data: {
          asientoId: asiento.id,
          cuentaId: cuentaRECPAM.id,
          debe: 0,
          haber: ajuste.totalAjuste,
          detalle: `RECPAM ${ajuste.periodo}`,
        },
      })
    } else {
      await prisma.movimientoContable.create({
        data: {
          asientoId: asiento.id,
          cuentaId: cuentaRECPAM.id,
          debe: Math.abs(ajuste.totalAjuste),
          haber: 0,
          detalle: `RECPAM ${ajuste.periodo}`,
        },
      })
    }
  }

  // Marcar como aplicado
  await prisma.ajusteInflacion.update({
    where: { id: ajusteId },
    data: { estado: "aplicado", asientoId: asiento.id },
  })

  return { asientoId: asiento.id, totalAjuste: ajuste.totalAjuste }
}

// ─── Listar ajustes ─────────────────────────────────────────────────────────

export async function listarAjustes(empresaId: number) {
  return prisma.ajusteInflacion.findMany({
    where: { empresaId },
    orderBy: { periodo: "desc" },
  })
}

/**
 * Tool: leer_deudas — 0 tokens, multi-tenant vía cliente.empresaId
 * ED-01: fiado con saldoCuentaCorriente < 0 (deuda)
 * ED-03: linkPago best-effort Mercado Pago
 */

import { prisma } from "@/lib/prisma"
import { resolverLinkPagoDeudor } from "@/lib/mercadopago/deudor-pago-link"
import { assertToolScope } from "../security"
import { scoreDeudas } from "../runtime/router"
import type { DeudaItem, EmpleadoLeoCobranzaConfig, ToolContext } from "../types"

export async function leerDeudas(
  ctx: ToolContext,
  config: EmpleadoLeoCobranzaConfig,
): Promise<DeudaItem[]> {
  assertToolScope(ctx, ctx.empresaId, "leer_deudas")

  const empresa = await prisma.empresa.findFirst({
    where: { id: ctx.empresaId },
    select: { id: true, nombre: true },
  })
  if (!empresa) return []

  const now = new Date()
  const items: Array<Omit<DeudaItem, "score"> & { cuentaIds: number[] }> = []

  if (config.fuentes.includes("cxc")) {
    const cuentas = await prisma.cuentaCobrar.findMany({
      where: {
        estado: { in: ["pendiente", "vencida", "parcial"] },
        saldo: { gt: 0 },
        fechaVencimiento: { lt: now },
        cliente: {
          empresaId: ctx.empresaId,
          activo: true,
          deletedAt: null,
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            telefonoAlternativo: true,
            email: true,
          },
        },
      },
      orderBy: { fechaVencimiento: "asc" },
      take: 200,
    })

    const byCliente = new Map<
      number,
      {
        nombre: string
        telefono: string
        email: string | null
        monto: number
        maxDias: number
        cuentaIds: number[]
      }
    >()

    for (const c of cuentas) {
      const saldo = Number(c.saldo)
      if (saldo <= 0) continue
      const dias = Math.max(
        0,
        Math.floor((now.getTime() - new Date(c.fechaVencimiento).getTime()) / 86_400_000),
      )
      const tel = (c.cliente.telefono || c.cliente.telefonoAlternativo || "").trim()
      const prev = byCliente.get(c.clienteId)
      if (!prev) {
        byCliente.set(c.clienteId, {
          nombre: c.cliente.nombre,
          telefono: tel,
          email: c.cliente.email,
          monto: saldo,
          maxDias: dias,
          cuentaIds: [c.id],
        })
      } else {
        prev.monto += saldo
        prev.maxDias = Math.max(prev.maxDias, dias)
        prev.cuentaIds.push(c.id)
        if (!prev.telefono && tel) prev.telefono = tel
      }
    }

    for (const [clienteId, v] of byCliente) {
      items.push({
        clienteId,
        clienteNombre: v.nombre,
        telefono: v.telefono,
        montoArs: Math.round(v.monto * 100) / 100,
        diasVencido: v.maxDias,
        cuentaIds: v.cuentaIds,
        empresaNombre: empresa.nombre,
      })
    }
  }

  // Fiado: convención ERP — saldoCuentaCorriente < 0 = deuda del cliente (ED-01)
  if (config.fuentes.includes("fiado")) {
    const clientesFiado = await prisma.cliente.findMany({
      where: {
        empresaId: ctx.empresaId,
        activo: true,
        deletedAt: null,
        fiadoHabilitado: true,
        saldoCuentaCorriente: { lt: 0 },
      },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        telefonoAlternativo: true,
        email: true,
        saldoCuentaCorriente: true,
      },
      take: 100,
    })

    for (const cl of clientesFiado) {
      if (items.some((i) => i.clienteId === cl.id)) continue
      const monto = Math.abs(Number(cl.saldoCuentaCorriente))
      if (monto < config.montoMinArs) continue
      items.push({
        clienteId: cl.id,
        clienteNombre: cl.nombre,
        telefono: (cl.telefono || cl.telefonoAlternativo || "").trim(),
        montoArs: Math.round(monto * 100) / 100,
        diasVencido: config.diasVencidoMin,
        cuentaIds: [],
        empresaNombre: empresa.nombre,
      })
    }
  }

  // ED-03: link de pago MP (best-effort, no rompe el run)
  const scored = scoreDeudas(items)
  const withLinks = await Promise.all(
    scored.map(async (d) => {
      try {
        const cuentaCobrarId = d.cuentaIds[0]
        const linkPago = await resolverLinkPagoDeudor({
          empresaId: ctx.empresaId,
          clienteId: d.clienteId,
          clienteNombre: d.clienteNombre,
          monto: d.montoArs,
          titulo: `Cobranza ${d.clienteNombre}`.slice(0, 120),
          facturaId: null,
          cuentaCobrarId: cuentaCobrarId && cuentaCobrarId > 0 ? cuentaCobrarId : null,
          emailPagador: null,
        })
        return { ...d, linkPago: linkPago ?? undefined }
      } catch {
        return d
      }
    }),
  )

  return withLinks
}

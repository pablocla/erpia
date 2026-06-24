import { prisma } from "@/lib/prisma"
import { importarPedidosML, sincronizarStock as syncStockML, listarPublicaciones } from "@/lib/mercadolibre/mercadolibre-service"
import { importarPedidosTN, sincronizarStockTN, listarProductosTN } from "@/lib/tiendanube/tiendanube-service"
import { importarPedidosShopify, sincronizarStockShopify, listarProductosShopify } from "@/lib/shopify/shopify-service"
import { importarPedidosWoo, sincronizarStockWoo, listarProductosWoo } from "@/lib/woocommerce/woocommerce-service"
import { sincronizarTrackingEmpresa } from "@/lib/logistica/shipping-orchestrator"
import type { SyncConfigForm } from "./types"

export interface SyncResult {
  entidad: string
  ok: boolean
  mensaje: string
  registrosOk?: number
  registrosError?: number
}

async function registrarLog(
  conexionId: number,
  entidad: string,
  ok: boolean,
  okCount: number,
  errCount: number,
  mensaje: string,
) {
  await prisma.integracionSyncLog.create({
    data: {
      conexionId,
      direccion: "outbound",
      entidad,
      estado: ok ? "ok" : "error",
      registrosOk: okCount,
      registrosError: errCount,
      mensaje,
    },
  })
}

export async function ejecutarSincronizacion(
  empresaId: number,
  integracionId: string,
  configSync?: SyncConfigForm,
  entidadesForzadas?: string[],
): Promise<{ ok: boolean; resultados: SyncResult[] }> {
  const row = await prisma.conexionIntegracion.findUnique({
    where: { empresaId_integracionId: { empresaId, integracionId } },
  })

  const config = configSync ?? (row?.configSync as SyncConfigForm | null) ?? { entidades: {} }
  const activas = entidadesForzadas ?? Object.entries(config.entidades)
    .filter(([, v]) => v.activo)
    .map(([k]) => k)

  const resultados: SyncResult[] = []

  if (integracionId === "mercado_libre") {
    if (activas.includes("stock")) {
      const r = (await syncStockML(empresaId)) as any
      resultados.push({
        entidad: "stock",
        ok: r.ok,
        mensaje: r.ok ? (r.mensaje ?? `${r.sincronizados} items`) : (r.error ?? "Error"),
        registrosOk: r.ok ? r.sincronizados : 0,
      })
    }
    if (activas.includes("ventas") || activas.includes("pedidos")) {
      const r = (await importarPedidosML(empresaId)) as any
      resultados.push({
        entidad: "ventas",
        ok: r.ok,
        mensaje: r.ok ? `${r.importados} pedido(s) importados` : (r.error ?? "Error"),
        registrosOk: r.ok ? r.importados : 0,
      })
    }
    if (activas.includes("publicaciones")) {
      try {
        const pubs = await listarPublicaciones(empresaId)
        resultados.push({
          entidad: "publicaciones",
          ok: true,
          mensaje: `${pubs.length} publicación(es) listadas`,
          registrosOk: pubs.length,
        })
      } catch (e) {
        resultados.push({
          entidad: "publicaciones",
          ok: false,
          mensaje: e instanceof Error ? e.message : "Error",
        })
      }
    }
  }

  if (integracionId === "tienda_nube") {
    if (activas.includes("stock")) {
      const r = (await sincronizarStockTN(empresaId)) as any
      resultados.push({
        entidad: "stock",
        ok: r.ok,
        mensaje: r.ok ? (r.mensaje ?? `${r.sincronizados} items`) : (r.error ?? "Error"),
        registrosOk: r.ok ? r.sincronizados : 0,
      })
    }
    if (activas.includes("pedidos")) {
      const r = (await importarPedidosTN(empresaId)) as any
      resultados.push({
        entidad: "pedidos",
        ok: r.ok,
        mensaje: r.ok ? `${r.importados} pedido(s) importados` : (r.error ?? "Error"),
        registrosOk: r.ok ? r.importados : 0,
      })
    }
    if (activas.includes("productos")) {
      try {
        const prods = await listarProductosTN(empresaId)
        resultados.push({
          entidad: "productos",
          ok: true,
          mensaje: `${prods.length} producto(s) listados`,
          registrosOk: prods.length,
        })
      } catch (e) {
        resultados.push({
          entidad: "productos",
          ok: false,
          mensaje: e instanceof Error ? e.message : "Error",
        })
      }
    }
  }

  if (integracionId === "shopify") {
    if (activas.includes("stock")) {
      const r = (await sincronizarStockShopify(empresaId)) as any
      resultados.push({
        entidad: "stock",
        ok: r.ok,
        mensaje: r.ok ? (r.mensaje ?? `${r.sincronizados} items`) : (r.error ?? "Error"),
        registrosOk: r.ok ? r.sincronizados : 0,
      })
    }
    if (activas.includes("pedidos")) {
      const r = (await importarPedidosShopify(empresaId)) as any
      resultados.push({
        entidad: "pedidos",
        ok: r.ok,
        mensaje: r.ok ? `${r.importados} pedido(s) importados` : (r.error ?? "Error"),
        registrosOk: r.ok ? r.importados : 0,
      })
    }
    if (activas.includes("productos")) {
      try {
        const prods = await listarProductosShopify(empresaId)
        resultados.push({
          entidad: "productos",
          ok: true,
          mensaje: `${prods.length} producto(s) listados`,
          registrosOk: prods.length,
        })
      } catch (e) {
        resultados.push({
          entidad: "productos",
          ok: false,
          mensaje: e instanceof Error ? e.message : "Error",
        })
      }
    }
  }

  if (integracionId === "woocommerce") {
    if (activas.includes("stock")) {
      const r = (await sincronizarStockWoo(empresaId)) as any
      resultados.push({
        entidad: "stock",
        ok: r.ok,
        mensaje: r.ok ? (r.mensaje ?? `${r.sincronizados} items`) : (r.error ?? "Error"),
        registrosOk: r.ok ? r.sincronizados : 0,
      })
    }
    if (activas.includes("pedidos")) {
      const r = (await importarPedidosWoo(empresaId)) as any
      resultados.push({
        entidad: "pedidos",
        ok: r.ok,
        mensaje: r.ok ? `${r.importados} pedido(s) importados` : (r.error ?? "Error"),
        registrosOk: r.ok ? r.importados : 0,
      })
    }
    if (activas.includes("productos")) {
      try {
        const prods = await listarProductosWoo(empresaId)
        resultados.push({
          entidad: "productos",
          ok: true,
          mensaje: `${prods.length} producto(s) listados`,
          registrosOk: prods.length,
        })
      } catch (e) {
        resultados.push({
          entidad: "productos",
          ok: false,
          mensaje: e instanceof Error ? e.message : "Error",
        })
      }
    }
  }

  const CARRIERS = ["andreani", "oca", "correo_argentino"]
  if (CARRIERS.includes(integracionId)) {
    if (activas.includes("tracking")) {
      const r = (await sincronizarTrackingEmpresa(empresaId)) as any
      resultados.push({
        entidad: "tracking",
        ok: true,
        mensaje: `${r.actualizados} envío(s) actualizados de ${r.total}`,
        registrosOk: r.actualizados,
      })
    }
    if (activas.includes("cotizaciones") || activas.includes("envios")) {
      resultados.push({
        entidad: "logistica",
        ok: true,
        mensaje: "Cotización y alta de envíos vía API /api/logistica/cotizar y /carrier",
        registrosOk: 1,
      })
    }
  }

  if (resultados.length === 0) {
    resultados.push({
      entidad: "general",
      ok: false,
      mensaje: "Sin entidades activas para sincronizar",
    })
  }

  const allOk = resultados.every((r) => r.ok)
  const totalOk = resultados.reduce((s, r) => s + (r.registrosOk ?? 0), 0)
  const totalErr = resultados.filter((r) => !r.ok).length

  if (row) {
    for (const r of resultados) {
      await registrarLog(
        row.id,
        r.entidad,
        r.ok,
        r.registrosOk ?? (r.ok ? 1 : 0),
        r.ok ? 0 : 1,
        r.mensaje,
      )
    }
    await prisma.conexionIntegracion.update({
      where: { id: row.id },
      data: {
        ultimaSyncAt: new Date(),
        ultimoError: allOk ? null : resultados.filter((r) => !r.ok).map((r) => r.mensaje).join("; "),
        estado: allOk ? "conectado" : "error",
      },
    })
  }

  return { ok: allOk, resultados }
}

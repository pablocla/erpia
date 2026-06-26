import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { RETAIL_EXTENSION_SKUS } from "@/lib/almacen-rosario/retail-skus"
import { assertRetailSku } from "@/lib/almacen-rosario/guard-retail-sku"
import { registrarRecargaServicio, RECARGAS_DEFAULT } from "@/lib/almacen-rosario/recargas-servicios-service"
import { calcularPrecioPorPeso } from "@/lib/almacen-rosario/balanza-peso-service"
import { listarPromosCantidadActivas } from "@/lib/almacen-rosario/promos-cantidad-service"
import { emitirTicketRegalo } from "@/lib/almacen-rosario/ticket-regalo-service"
import { crearPedidoDistribuidoraRapido } from "@/lib/almacen-rosario/pedido-distribuidora-service"
import { registrarMermaRotura } from "@/lib/almacen-rosario/mermas-roturas-service"
import {
  obtenerMediosParaArqueoCiego,
  registrarArqueoCiego,
} from "@/lib/almacen-rosario/arqueo-ciego-service"
import { resolverListaMayorista, precioMayoristaProducto } from "@/lib/almacen-rosario/lista-mayorista-pos-service"
import {
  registrarChequeCarteraPos,
  listarChequesCarteraProximos,
} from "@/lib/almacen-rosario/cheques-cartera-pos-service"
import {
  iniciarInventarioExpress,
  registrarConteoExpress,
  cerrarInventarioExpress,
} from "@/lib/almacen-rosario/inventario-express-service"

const postSchema = z.discriminatedUnion("modulo", [
  z.object({
    modulo: z.literal("recargas"),
    servicioId: z.string(),
    monto: z.number().positive(),
    referencia: z.string().optional(),
  }),
  z.object({
    modulo: z.literal("balanza"),
    precioPorKg: z.number().positive(),
    pesoKg: z.number().positive(),
  }),
  z.object({
    modulo: z.literal("ticket_regalo"),
    monto: z.number().positive(),
    titularNombre: z.string().optional(),
    facturaOrigenId: z.number().int().positive().optional(),
  }),
  z.object({
    modulo: z.literal("pedido_distribuidora"),
    maxLineas: z.number().int().min(1).max(50).optional(),
  }),
  z.object({
    modulo: z.literal("merma"),
    productoId: z.number().int().positive(),
    cantidad: z.number().positive(),
    motivo: z.enum(["vencimiento", "rotura", "robo", "muestra", "otro"]),
    observaciones: z.string().optional(),
  }),
  z.object({
    modulo: z.literal("arqueo_ciego"),
    cajaId: z.number().int().positive(),
    efectivoDeclarado: z.number().min(0),
    tarjetaDeclarado: z.number().min(0),
    transferenciaDeclarado: z.number().min(0),
    chequeDeclarado: z.number().min(0),
    qrDeclarado: z.number().min(0),
    justificacion: z.string().optional(),
  }),
  z.object({
    modulo: z.literal("inventario_iniciar"),
    categoriaId: z.number().int().positive().optional(),
  }),
  z.object({
    modulo: z.literal("inventario_conteo"),
    tomaId: z.number().int().positive(),
    conteos: z.array(z.object({ lineaId: z.number().int().positive(), stockContado: z.number().min(0) })),
  }),
  z.object({
    modulo: z.literal("inventario_cerrar"),
    tomaId: z.number().int().positive(),
  }),
  z.object({
    modulo: z.literal("cheque"),
    numero: z.string().min(1),
    monto: z.number().positive(),
    fechaVencimiento: z.string(),
    bancoNombre: z.string().optional(),
    cuitLibrador: z.string().optional(),
    clienteId: z.number().int().positive().optional(),
  }),
])

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const empresaId = ctx.auth.empresaId
  const activaciones = await Promise.all(
    RETAIL_EXTENSION_SKUS.map(async (sku) => ({
      sku,
      activo: (await canUseSku(empresaId, sku)).ok,
    })),
  )

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")

  if (q === "recargas") {
    await assertRetailSku(empresaId, "pos.recargas_servicios")
    return NextResponse.json(RECARGAS_DEFAULT)
  }
  if (q === "promos_cantidad") {
    await assertRetailSku(empresaId, "pos.promos_cantidad")
    return NextResponse.json(await listarPromosCantidadActivas(empresaId))
  }
  if (q === "lista_mayorista") {
    await assertRetailSku(empresaId, "pos.lista_mayorista_pos")
    const lista = await resolverListaMayorista(empresaId)
    const productoId = Number(searchParams.get("productoId"))
    if (lista && productoId) {
      const precio = await precioMayoristaProducto(empresaId, productoId, lista.listaPrecioId)
      return NextResponse.json({ lista, precio })
    }
    return NextResponse.json({ lista })
  }
  if (q === "arqueo_ciego") {
    await assertRetailSku(empresaId, "pos.arqueo_ciego")
    return NextResponse.json(await obtenerMediosParaArqueoCiego(empresaId))
  }
  if (q === "cheques_proximos") {
    await assertRetailSku(empresaId, "pos.cheques_cartera")
    return NextResponse.json(await listarChequesCarteraProximos(empresaId))
  }

  return NextResponse.json({ activaciones })
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const empresaId = ctx.auth.empresaId
    const data = parsed.data

    switch (data.modulo) {
      case "recargas":
        await assertRetailSku(empresaId, "pos.recargas_servicios")
        return NextResponse.json(
          await registrarRecargaServicio({ empresaId, ...data }),
          { status: 201 },
        )
      case "balanza":
        await assertRetailSku(empresaId, "pos.balanza_peso")
        return NextResponse.json(calcularPrecioPorPeso(data))
      case "ticket_regalo":
        await assertRetailSku(empresaId, "pos.ticket_regalo")
        return NextResponse.json(
          await emitirTicketRegalo({ empresaId, ...data }),
          { status: 201 },
        )
      case "pedido_distribuidora":
        await assertRetailSku(empresaId, "pos.pedido_distribuidora")
        return NextResponse.json(await crearPedidoDistribuidoraRapido(empresaId, { maxLineas: data.maxLineas }))
      case "merma":
        await assertRetailSku(empresaId, "pos.mermas_roturas")
        return NextResponse.json(
          await registrarMermaRotura({ empresaId, ...data }),
          { status: 201 },
        )
      case "arqueo_ciego":
        await assertRetailSku(empresaId, "pos.arqueo_ciego")
        return NextResponse.json(await registrarArqueoCiego(empresaId, data))
      case "inventario_iniciar":
        await assertRetailSku(empresaId, "pos.inventario_express")
        return NextResponse.json(await iniciarInventarioExpress(empresaId, data.categoriaId))
      case "inventario_conteo":
        await assertRetailSku(empresaId, "pos.inventario_express")
        return NextResponse.json(await registrarConteoExpress(empresaId, data.tomaId, data.conteos))
      case "inventario_cerrar":
        await assertRetailSku(empresaId, "pos.inventario_express")
        return NextResponse.json(await cerrarInventarioExpress(empresaId, data.tomaId))
      case "cheque":
        await assertRetailSku(empresaId, "pos.cheques_cartera")
        return NextResponse.json(
          await registrarChequeCarteraPos({ empresaId, ...data }),
          { status: 201 },
        )
      default:
        return NextResponse.json({ error: "Módulo no soportado" }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    const status = msg.includes("no activo") ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
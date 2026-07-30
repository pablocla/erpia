/**
 * Emisión de Factura de Exportación (E) vía WSFEX.
 */
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "./soap-client"
import { WSFEXClient, UMED_UNIDADES } from "./wsfex-client"
import { decryptPrivateKeyIfNeeded } from "./cert-utils"

export interface EmitirExportacionInput {
  empresaId: number
  clienteId: number
  puntoVenta: number
  /** 19 FC E, 20 ND E, 21 NC E */
  tipoCbte?: number
  /** 1=Bienes, 2=Servicios, 4=Otros */
  tipoExpo?: 1 | 2 | 4
  incoterm?: string
  monedaId?: string
  monedaCtz?: number
  /** Código país AFIP destino */
  dstCmp?: number
  cuitPaisCliente?: number
  idiomaCbte?: 1 | 2 | 3
  formaPago?: string
  obs?: string
  items: Array<{
    descripcion: string
    cantidad: number
    precioUnitario: number
    codigo?: string
    umed?: number
  }>
  /** NC/ND asociada */
  facturaAsociadaId?: number
  permisoExistente?: "S" | "N" | ""
  permisos?: Array<{ Id_permiso: string; Dst_merc: number }>
}

export interface EmitirExportacionResult {
  ok: boolean
  facturaId?: number
  cae?: string
  vencimientoCAE?: string
  numero?: number
  qrBase64?: string
  error?: string
  raw?: unknown
}

function formatearFecha(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function parsearFechaCAE(fechaStr: string): Date {
  if (!fechaStr || fechaStr.length < 8) return new Date()
  return new Date(
    Number(fechaStr.slice(0, 4)),
    Number(fechaStr.slice(4, 6)) - 1,
    Number(fechaStr.slice(6, 8)),
  )
}

/**
 * Emite factura de exportación completa (persistencia + WSFEX + QR).
 */
export async function emitirFacturaExportacion(
  input: EmitirExportacionInput,
): Promise<EmitirExportacionResult> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: input.empresaId },
  })

  if (!empresa?.certificadoCRT || !empresa.certificadoKEY) {
    return {
      ok: false,
      error: "La empresa no posee certificados AFIP cargados para WSFEX",
    }
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id: input.clienteId, empresaId: input.empresaId },
    include: {
      pais: true,
    },
  })

  if (!cliente) {
    return { ok: false, error: "Cliente no encontrado" }
  }

  const tipoCbte = input.tipoCbte ?? 19
  if (![19, 20, 21].includes(tipoCbte)) {
    return { ok: false, error: "tipoCbte de exportación debe ser 19, 20 o 21" }
  }

  const itemsCalc = input.items.map((it) => {
    const total = Math.round(it.cantidad * it.precioUnitario * 100) / 100
    return {
      Pro_codigo: it.codigo ?? "",
      Pro_ds: it.descripcion,
      Pro_qty: it.cantidad,
      Pro_umed: it.umed ?? UMED_UNIDADES,
      Pro_precio_uni: it.precioUnitario,
      Pro_bonificacion: 0,
      Pro_total_item: total,
    }
  })

  const impTotal =
    Math.round(itemsCalc.reduce((s, i) => s + i.Pro_total_item, 0) * 100) / 100

  const entorno =
    ((empresa.entornoAfip || empresa.entorno) as "homologacion" | "produccion") ??
    "homologacion"

  const soapClient = new AFIPSoapClient(entorno)
  const key = decryptPrivateKeyIfNeeded(empresa.certificadoKEY)
  const auth = await soapClient.authenticate(
    empresa.cuit,
    empresa.certificadoCRT,
    key,
    "wsfex",
  )

  const wsfex = new WSFEXClient(entorno)
  const ultimo = await wsfex.getLastCmp(
    auth,
    empresa.cuit,
    tipoCbte,
    input.puntoVenta,
  )
  const nuevoNumero = ultimo + 1
  const lastId = await wsfex.getLastId(auth, empresa.cuit)
  const reqId = lastId + 1

  // Código país: preferir input → pais.codigoAfip si existiera → 200 genérico
  const dstCmp =
    input.dstCmp ??
    (cliente.pais as { codigoAfip?: number } | null)?.codigoAfip ??
    212

  const domicilio =
    [cliente.direccion, cliente.direccionComplemento, cliente.codigoPostal]
      .filter(Boolean)
      .join(", ") || "Exterior"

  let cbtesAsoc:
    | Array<{
        Cbte_tipo: number
        Cbte_punto_vta: number
        Cbte_nro: number
        Cbte_cuit?: string
      }>
    | undefined

  if (input.facturaAsociadaId) {
    const orig = await prisma.factura.findFirst({
      where: { id: input.facturaAsociadaId, empresaId: input.empresaId },
    })
    if (orig) {
      cbtesAsoc = [
        {
          Cbte_tipo: orig.tipoCbte,
          Cbte_punto_vta: orig.puntoVenta,
          Cbte_nro: orig.numero,
          Cbte_cuit: empresa.cuit.replace(/\D/g, ""),
        },
      ]
    }
  }

  // Persist draft
  const factura = await prisma.factura.create({
    data: {
      tipo: "E",
      tipoCbte,
      numero: nuevoNumero,
      puntoVenta: input.puntoVenta,
      estado: "pendiente_cae",
      subtotal: impTotal,
      iva: 0,
      total: impTotal,
      monedaOrigen: input.monedaId ?? "DOL",
      tipoCambio: input.monedaCtz ?? 1,
      modalidadAuth: "CAE",
      concepto: input.tipoExpo === 2 ? 2 : 1,
      netoExento: impTotal,
      netoNoGravado: 0,
      condicionIvaReceptor: "Cliente del Exterior",
      empresaId: empresa.id,
      clienteId: cliente.id,
      lineas: {
        create: input.items.map((it) => ({
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          porcentajeIva: 0,
          codigoAfipIva: "3",
          subtotal: Math.round(it.cantidad * it.precioUnitario * 100) / 100,
          iva: 0,
          total: Math.round(it.cantidad * it.precioUnitario * 100) / 100,
        })),
      },
    },
  })

  try {
    const result = await wsfex.authorize(
      auth,
      empresa.cuit,
      {
        id: reqId,
        fechaCbte: formatearFecha(new Date()),
        tipoCbte,
        puntoVenta: input.puntoVenta,
        cbteNro: nuevoNumero,
        tipoExpo: input.tipoExpo ?? 1,
        permisoExistente: input.permisoExistente,
        permisos: input.permisos,
        dstCmp,
        cliente: cliente.nombre || cliente.nombreFantasia || "Cliente exterior",
        cuitPaisCliente: input.cuitPaisCliente ?? 0,
        domicilioCliente: domicilio,
        idImpositivo: cliente.cuit ?? undefined,
        monedaId: input.monedaId ?? "DOL",
        monedaCtz: input.monedaCtz ?? 1,
        impTotal,
        formaPago: input.formaPago,
        incoterms: input.incoterm ?? "FOB",
        idiomaCbte: input.idiomaCbte ?? 1,
        obs: input.obs,
        items: itemsCalc,
        cbtesAsoc,
      },
      empresa.id,
      factura.id,
    )

    if (!result.ok || !result.cae) {
      await prisma.factura.update({
        where: { id: factura.id },
        data: { estado: "rechazada_afip" },
      })
      return {
        ok: false,
        facturaId: factura.id,
        numero: nuevoNumero,
        error: `WSFEX rechazó: ${JSON.stringify(result.observaciones ?? result.errores)}`,
        raw: result.raw,
      }
    }

    const venc = result.caeFchVto
      ? parsearFechaCAE(result.caeFchVto)
      : new Date()

    const qrPayload = {
      ver: 1,
      fecha: new Date().toISOString().split("T")[0],
      cuit: Number(empresa.cuit.replace(/\D/g, "")),
      ptoVta: input.puntoVenta,
      tipoCmp: tipoCbte,
      nroCmp: nuevoNumero,
      importe: impTotal,
      moneda: input.monedaId ?? "DOL",
      ctz: input.monedaCtz ?? 1,
      tipoDocRec: 80,
      nroDocRec: Number(String(cliente.cuit ?? "0").replace(/\D/g, "")) || 0,
      tipoCodAut: "E",
      codAut: Number(result.cae),
    }
    const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(JSON.stringify(qrPayload)).toString("base64url")}`
    const qrBase64 = await QRCode.toDataURL(qrUrl)

    await prisma.factura.update({
      where: { id: factura.id },
      data: {
        cae: result.cae,
        fechaCAE: new Date(),
        vencimientoCAE: venc,
        qrBase64,
        estado: "emitida",
      },
    })

    return {
      ok: true,
      facturaId: factura.id,
      cae: result.cae,
      vencimientoCAE: venc.toISOString(),
      numero: nuevoNumero,
      qrBase64,
      raw: result.raw,
    }
  } catch (err) {
    await prisma.factura.update({
      where: { id: factura.id },
      data: { estado: "pendiente_cae" },
    })
    return {
      ok: false,
      facturaId: factura.id,
      numero: nuevoNumero,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Compat: firma corta legacy del stub anterior.
 * @deprecated Preferir emitirFacturaExportacion(input completo)
 */
export async function emitirFacturaExportacionLegacy(
  empresaId: number,
  clienteId: number,
  incoterm: string,
  total: number,
): Promise<EmitirExportacionResult> {
  return emitirFacturaExportacion({
    empresaId,
    clienteId,
    puntoVenta: 1,
    tipoCbte: 19,
    tipoExpo: 1,
    incoterm,
    items: [
      {
        descripcion: "Exportación",
        cantidad: 1,
        precioUnitario: total,
      },
    ],
  })
}

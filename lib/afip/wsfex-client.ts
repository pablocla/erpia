/**
 * WSFEX — Facturación electrónica de exportación (Factura E).
 * Manual desarrollador WSFEX / FEXAuthorize.
 */

import soap from "soap"
import type { AFIPAuthResponse, AfipEntorno } from "./wsaa-service"
import { logAfip, serializeAfipPayload } from "./afip-log"

export interface WsfexItem {
  Pro_codigo?: string
  Pro_ds: string
  Pro_qty: number
  Pro_umed: number
  Pro_precio_uni: number
  Pro_bonificacion?: number
  Pro_total_item: number
}

export interface WsfexPermiso {
  Id_permiso: string
  Dst_merc: number
}

export interface WsfexAuthorizeInput {
  /** Id de requerimiento (único por request) */
  id: number
  fechaCbte: string // YYYYMMDD
  tipoCbte: number // 19, 20, 21
  puntoVenta: number
  cbteNro: number
  /** 1=Bienes, 2=Servicios, 4=Otros */
  tipoExpo: 1 | 2 | 4
  /** S / N — permiso de embarque existente */
  permisoExistente?: "S" | "N" | ""
  permisos?: WsfexPermiso[]
  /** Código país destino AFIP */
  dstCmp: number
  cliente: string
  cuitPaisCliente: number
  domicilioCliente: string
  idImpositivo?: string
  monedaId: string
  monedaCtz: number
  obsComerciales?: string
  impTotal: number
  obs?: string
  formaPago?: string
  incoterms?: string
  incotermsDs?: string
  /** 1=Español, 2=Inglés, 3=Portugués */
  idiomaCbte?: 1 | 2 | 3
  items: WsfexItem[]
  /** Para NC/ND: comprobante asociado */
  cbtesAsoc?: Array<{
    Cbte_tipo: number
    Cbte_punto_vta: number
    Cbte_nro: number
    Cbte_cuit?: string
  }>
}

export interface WsfexAuthorizeResult {
  ok: boolean
  cae?: string
  caeFchVto?: string
  resultado?: string
  observaciones?: unknown
  errores?: unknown
  raw?: unknown
}

function wsfexUrl(entorno: AfipEntorno): string {
  return entorno === "produccion"
    ? "https://servicios1.afip.gov.ar/wsfexv1/service.asmx?wsdl"
    : "https://wswhomo.afip.gov.ar/wsfexv1/service.asmx?wsdl"
}

export class WSFEXClient {
  private url: string
  private entorno: AfipEntorno

  constructor(entorno: AfipEntorno = "homologacion") {
    this.entorno = entorno
    this.url = wsfexUrl(entorno)
  }

  private auth(auth: AFIPAuthResponse, cuit: string) {
    return {
      Token: auth.token,
      Sign: auth.sign,
      Cuit: cuit.replace(/\D/g, ""),
    }
  }

  async getLastId(auth: AFIPAuthResponse, cuit: string): Promise<number> {
    const client = await soap.createClientAsync(this.url)
    const [result] = await client.FEXGetLast_IDAsync({
      Auth: this.auth(auth, cuit),
    })
    return Number(result?.FEXGetLast_IDResult?.FEXResultGet?.Id ?? 0)
  }

  async getLastCmp(
    auth: AFIPAuthResponse,
    cuit: string,
    tipoCbte: number,
    puntoVenta: number,
  ): Promise<number> {
    const client = await soap.createClientAsync(this.url)
    const [result] = await client.FEXGetLast_CMPAsync({
      Auth: this.auth(auth, cuit),
      Cmp: { Cbte_Tipo: tipoCbte, Pto_venta: puntoVenta },
    })
    return Number(result?.FEXGetLast_CMPResult?.FEXResult_LastCMP?.Cbte_nro ?? 0)
  }

  async authorize(
    auth: AFIPAuthResponse,
    cuit: string,
    input: WsfexAuthorizeInput,
    empresaId?: number,
    facturaId?: number,
  ): Promise<WsfexAuthorizeResult> {
    const t0 = Date.now()
    const Cmp: Record<string, unknown> = {
      Id: input.id,
      Fecha_cbte: input.fechaCbte,
      Cbte_Tipo: input.tipoCbte,
      Punto_vta: input.puntoVenta,
      Cbte_nro: input.cbteNro,
      Tipo_expo: input.tipoExpo,
      Permiso_existente: input.permisoExistente ?? (input.tipoExpo === 1 ? "N" : ""),
      Dst_cmp: input.dstCmp,
      Cliente: input.cliente,
      Cuit_pais_cliente: input.cuitPaisCliente,
      Domicilio_cliente: input.domicilioCliente,
      Id_impositivo: input.idImpositivo ?? "",
      Moneda_Id: input.monedaId,
      Moneda_ctz: input.monedaCtz,
      Obs_comerciales: input.obsComerciales ?? "",
      Imp_total: input.impTotal,
      Obs: input.obs ?? "",
      Forma_pago: input.formaPago ?? "",
      Incoterms: input.incoterms ?? "FOB",
      Incoterms_Ds: input.incotermsDs ?? "",
      Idioma_cbte: input.idiomaCbte ?? 1,
      Items: {
        Item: input.items.map((it) => ({
          Pro_codigo: it.Pro_codigo ?? "",
          Pro_ds: it.Pro_ds,
          Pro_qty: it.Pro_qty,
          Pro_umed: it.Pro_umed,
          Pro_precio_uni: it.Pro_precio_uni,
          Pro_bonificacion: it.Pro_bonificacion ?? 0,
          Pro_total_item: it.Pro_total_item,
        })),
      },
    }

    if (input.permisos?.length) {
      Cmp.Permisos = {
        Permiso: input.permisos.map((p) => ({
          Id_permiso: p.Id_permiso,
          Dst_merc: p.Dst_merc,
        })),
      }
    }

    if (input.cbtesAsoc?.length) {
      Cmp.Cmps_asoc = {
        Cmp_asoc: input.cbtesAsoc,
      }
    }

    const requestPayload = {
      Auth: this.auth(auth, cuit),
      Cmp,
    }

    try {
      const client = await soap.createClientAsync(this.url)
      const [result] = await client.FEXAuthorizeAsync(requestPayload)
      const wsResult = result?.FEXAuthorizeResult
      const get = wsResult?.FEXResultAuth
      const cae = get?.Cae
      const resultado = get?.Resultado

      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFEX",
          operacion: "FEXAuthorize",
          requestBody: serializeAfipPayload(requestPayload),
          responseBody: serializeAfipPayload(wsResult),
          statusCode: resultado ?? "?",
          cae: cae || undefined,
          facturaId,
          duracionMs: Date.now() - t0,
        })
      }

      if (resultado === "A" && cae) {
        return {
          ok: true,
          cae: String(cae),
          caeFchVto: get?.Fch_venc_Cae,
          resultado,
          observaciones: wsResult?.FEXErr ?? get?.Motivos_Obs,
          raw: wsResult,
        }
      }

      return {
        ok: false,
        resultado,
        observaciones: get?.Motivos_Obs ?? wsResult?.FEXErr,
        errores: wsResult?.FEXErr,
        raw: wsResult,
      }
    } catch (error) {
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFEX",
          operacion: "FEXAuthorize",
          requestBody: serializeAfipPayload(requestPayload),
          statusCode: "ERROR",
          errorMsg: error instanceof Error ? error.message : String(error),
          facturaId,
          duracionMs: Date.now() - t0,
        })
      }
      throw new Error(
        `WSFEX FEXAuthorize: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async getCmp(
    auth: AFIPAuthResponse,
    cuit: string,
    tipoCbte: number,
    puntoVenta: number,
    cbteNro: number,
  ): Promise<unknown> {
    const client = await soap.createClientAsync(this.url)
    const [result] = await client.FEXGetCMPAsync({
      Auth: this.auth(auth, cuit),
      Cmp: {
        Cbte_tipo: tipoCbte,
        Punto_vta: puntoVenta,
        Cbte_nro: cbteNro,
      },
    })
    return result?.FEXGetCMPResult
  }

  async dummy(): Promise<unknown> {
    const client = await soap.createClientAsync(this.url)
    const [result] = await client.FEXDummyAsync({})
    return result?.FEXDummyResult
  }
}

/**
 * Códigos país AFIP frecuentes (tabla destinos WSFEX).
 * Validar siempre contra FEParamGetTipos / FEXGetPARAM_DST_pais en homologación.
 */
export const AFIP_PAISES_COMUNES: Record<string, number> = {
  BR: 212,
  US: 212,
  UY: 225,
  CL: 208,
  PY: 221,
  BO: 202,
  PE: 220,
  MX: 218,
  ES: 410,
  DE: 438,
  CN: 310,
  AR: 200,
}

/** Unidad de medida AFIP más usada: 7 = unidades */
export const UMED_UNIDADES = 7

/**
 * PadronA5 — Consulta de Contribuyentes ARCA/AFIP
 *
 * Permite consultar datos fiscales de un contribuyente por CUIT:
 *  - Denominación / Razón Social
 *  - Condición IVA (RI, Monotributista, Exento, CF)
 *  - Actividades económicas
 *  - Domicilio fiscal
 *  - Inscripciones activas (Ganancias, IVA, Monotributo, etc.)
 *
 * Webservice: https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5?wsdl
 * Homologación: https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5?wsdl
 *
 * Método principal: getPersona
 * Requiere: WSAA token/sign (servicio "ws_sr_padron_a5")
 */

import soap from "soap"
import type { AFIPAuthResponse } from "./soap-client"

export interface PadronPersona {
  /** CUIT consultado */
  cuit: string
  /** Razón social o Apellido y Nombre */
  denominacion: string
  /** "AC" = Activo, "IN" = Inactivo */
  estadoClave: string
  /** Condición IVA legible */
  condicionIva: string
  /** Código de condición IVA AFIP (1=RI, 4=Exento, 6=Monotributo, 5=CF) */
  condicionIvaCodigo: number
  /** Domicilio fiscal */
  domicilioFiscal?: {
    direccion: string
    localidad: string
    provincia: string
    codigoPostal: string
  }
  /** Actividad principal */
  actividadPrincipal?: {
    codigo: string
    descripcion: string
  }
  /** Si está inscripto en IVA, Ganancias, Monotributo, etc. */
  inscripciones: { impuesto: string; estado: string }[]
}

const CONDICION_IVA_MAP: Record<number, string> = {
  1: "Responsable Inscripto",
  4: "Exento",
  5: "Consumidor Final",
  6: "Monotributista",
  10: "IVA Liberado - Ley Nº 19.640",
  11: "Responsable Inscripto - Agente de Percepción",
  13: "Pequeño Contribuyente Eventual",
}

export class PadronA5Client {
  private padronUrl: string

  constructor(entorno: "homologacion" | "produccion") {
    this.padronUrl =
      entorno === "produccion"
        ? "https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5?wsdl"
        : "https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5?wsdl"
  }

  /**
   * Consultar datos de un contribuyente por CUIT.
   * Returns null if the CUIT is not found.
   */
  async getPersona(
    auth: AFIPAuthResponse,
    cuitConsultante: string,
    cuitConsultado: string,
  ): Promise<PadronPersona | null> {
    const client = await soap.createClientAsync(this.padronUrl)

    const [result] = await client.getPersonaAsync({
      token: auth.token,
      sign: auth.sign,
      cuitRepresentada: cuitConsultante,
      idPersona: cuitConsultado,
    })

    const persona = result?.personaReturn?.datosGenerales
    if (!persona) return null

    // Determine condición IVA from impuestos array
    const impuestos = result.personaReturn?.datosRegimenGeneral?.impuesto
    const categorias = result.personaReturn?.datosMonotributo?.categoriaMonotributo

    let condicionIvaCodigo = 5 // Default: Consumidor Final
    if (impuestos) {
      const impArray = Array.isArray(impuestos) ? impuestos : [impuestos]
      const ivaInsc = impArray.find((i: any) => i.idImpuesto === 30 && i.estado === "AC")
      if (ivaInsc) condicionIvaCodigo = 1 // RI
      const exento = impArray.find((i: any) => i.idImpuesto === 32 && i.estado === "AC")
      if (exento) condicionIvaCodigo = 4 // Exento
    }
    if (categorias) condicionIvaCodigo = 6 // Monotributo

    const inscripciones: { impuesto: string; estado: string }[] = []
    if (impuestos) {
      const impArray = Array.isArray(impuestos) ? impuestos : [impuestos]
      for (const imp of impArray) {
        inscripciones.push({
          impuesto: String(imp.idImpuesto),
          estado: imp.estado,
        })
      }
    }

    return {
      cuit: cuitConsultado,
      denominacion: persona.nombre
        ? `${persona.apellido ?? ""} ${persona.nombre}`.trim()
        : persona.razonSocial ?? "",
      estadoClave: persona.estadoClave ?? "AC",
      condicionIva: CONDICION_IVA_MAP[condicionIvaCodigo] ?? "Consumidor Final",
      condicionIvaCodigo,
      domicilioFiscal: persona.domicilioFiscal
        ? {
            direccion: persona.domicilioFiscal.direccion ?? "",
            localidad: persona.domicilioFiscal.localidad ?? "",
            provincia: persona.domicilioFiscal.descripcionProvincia ?? "",
            codigoPostal: persona.domicilioFiscal.codPostal ?? "",
          }
        : undefined,
      actividadPrincipal: persona.actividadPrincipal
        ? {
            codigo: String(persona.actividadPrincipal.idActividad),
            descripcion: persona.actividadPrincipal.descripcionActividad ?? "",
          }
        : undefined,
      inscripciones,
    }
  }

  /**
   * Validate a CUIT exists and is active.
   * Quick check used during client/supplier creation.
   */
  async validarCuit(
    auth: AFIPAuthResponse,
    cuitConsultante: string,
    cuitAValidar: string,
  ): Promise<{ valido: boolean; condicionIva: string; denominacion: string }> {
    const persona = await this.getPersona(auth, cuitConsultante, cuitAValidar)
    if (!persona || persona.estadoClave !== "AC") {
      return { valido: false, condicionIva: "", denominacion: "" }
    }
    return {
      valido: true,
      condicionIva: persona.condicionIva,
      denominacion: persona.denominacion,
    }
  }
}

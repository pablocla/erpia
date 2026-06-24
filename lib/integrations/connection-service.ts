import { prisma } from "@/lib/prisma"
import { obtenerConfigMP } from "@/lib/mercadopago/mercadopago-service"
import { obtenerConfigML } from "@/lib/mercadolibre/mercadolibre-service"
import { obtenerConfigTN } from "@/lib/tiendanube/tiendanube-service"
import { obtenerConfigShopify } from "@/lib/shopify/shopify-service"
import { obtenerConfigWoo } from "@/lib/woocommerce/woocommerce-service"
import { getIntegrationMeta } from "./integration-meta"
import { TelegramService } from "@/lib/telegram/telegram-service"
import { WhatsappService } from "@/lib/whatsapp/whatsapp-service"
import { INTEGRATION_CATALOG, getCatalogEntry } from "./catalog"
import { decryptCredentials, encryptCredentials, maskSecret } from "./core/credential-vault"
import { getConnector } from "./connectors/registry"
import type { ConnectionSummary, IntegrationStatus, SyncConfigForm } from "./types"

function defaultSyncFor(integracionId: string): SyncConfigForm {
  const entry = getCatalogEntry(integracionId)
  const entidades: SyncConfigForm["entidades"] = {}
  for (const e of entry?.entidadesSync ?? []) {
    entidades[e.id] = {
      activo: true,
      direccion: e.defaultDireccion,
      frecuencia: e.defaultFrecuencia,
    }
  }
  return { entidades }
}

/** Estado inferido de integraciones legacy sin fila en ConexionIntegracion */
async function inferLegacyStatus(empresaId: number, integracionId: string): Promise<ConnectionSummary | null> {
  if (integracionId === "mercado_pago") {
    const cfg = await obtenerConfigMP(empresaId)
    if (cfg?.accessToken) {
      return {
        integracionId,
        estado: cfg.activo ? "conectado" : "pausado",
        cuentaExterna: cfg.nombreCuenta ?? "Mercado Pago",
      }
    }
  }
  if (integracionId === "mercado_libre") {
    const cfg = await obtenerConfigML(empresaId)
    if (cfg?.accessToken) {
      return { integracionId, estado: "conectado", cuentaExterna: cfg.sellerId ?? "Mercado Libre" }
    }
  }
  if (integracionId === "tienda_nube") {
    const cfg = await obtenerConfigTN(empresaId)
    if (cfg?.accessToken) {
      return { integracionId, estado: "conectado", cuentaExterna: cfg.storeId ? `TN #${cfg.storeId}` : "Tienda Nube" }
    }
  }
  if (integracionId === "shopify") {
    const cfg = await obtenerConfigShopify(empresaId)
    if (cfg?.shopDomain) {
      return { integracionId, estado: "conectado", cuentaExterna: cfg.shopDomain }
    }
  }
  if (integracionId === "woocommerce") {
    const cfg = await obtenerConfigWoo(empresaId)
    if (cfg?.siteUrl) {
      return { integracionId, estado: "conectado", cuentaExterna: cfg.siteUrl }
    }
  }
  if (integracionId === "telegram" && TelegramService.isConfigured()) {
    return { integracionId, estado: "conectado", cuentaExterna: `@${TelegramService.getBotUsername() ?? "bot"}` }
  }
  if (integracionId === "whatsapp" && WhatsappService.isConfigured()) {
    return { integracionId, estado: "conectado", cuentaExterna: "Twilio WhatsApp" }
  }
  if (integracionId === "afip") {
    const emp = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { certificadoCRT: true, cuit: true },
    })
    if (emp?.certificadoCRT) {
      return { integracionId, estado: "conectado", cuentaExterna: `CUIT ${emp.cuit}` }
    }
  }
  return null
}

export async function listarConexionesEmpresa(empresaId: number) {
  const rows = await prisma.conexionIntegracion.findMany({
    where: { empresaId },
    orderBy: { updatedAt: "desc" },
  })

  const map = new Map(rows.map((r) => [r.integracionId, r]))

  const conexiones: ConnectionSummary[] = []
  for (const entry of INTEGRATION_CATALOG) {
    const row = map.get(entry.id)
    if (row) {
      conexiones.push({
        integracionId: entry.id,
        estado: row.estado as IntegrationStatus,
        cuentaExterna: row.cuentaExterna,
        ultimaSyncAt: row.ultimaSyncAt?.toISOString() ?? null,
        ultimoError: row.ultimoError,
        conexionId: row.id,
      })
    } else {
      const legacy = await inferLegacyStatus(empresaId, entry.id)
      conexiones.push(
        legacy ?? { integracionId: entry.id, estado: "desconectado" },
      )
    }
  }

  return conexiones
}

export async function obtenerDetalleConexion(empresaId: number, integracionId: string) {
  const entry = getCatalogEntry(integracionId)
  if (!entry) throw new Error("Integración no encontrada")

  let row = await prisma.conexionIntegracion.findUnique({
    where: { empresaId_integracionId: { empresaId, integracionId } },
    include: { logs: { orderBy: { createdAt: "desc" }, take: 20 } },
  })

  const credenciales = decryptCredentials(row?.credencialesEnc)
  const masked: Record<string, string> = {}
  for (const [k, v] of Object.entries(credenciales)) {
    masked[k] = entry.campos?.find((c) => c.tipo === "password")?.key === k ? maskSecret(v) : v
  }

  let estado: IntegrationStatus = (row?.estado as IntegrationStatus) ?? "desconectado"
  let cuentaExterna = row?.cuentaExterna

  if (!row) {
    const legacy = await inferLegacyStatus(empresaId, integracionId)
    if (legacy) {
      estado = legacy.estado
      cuentaExterna = legacy.cuentaExterna ?? null
    }
  }

  const meta = getIntegrationMeta(integracionId)

  return {
    catalogo: entry,
    meta: {
      ...meta,
      webhookUrl: meta.webhookPath?.(empresaId),
    },
    conexion: row
      ? {
          id: row.id,
          estado,
          cuentaExterna,
          configSync: (row.configSync as SyncConfigForm | null) ?? defaultSyncFor(integracionId),
          ultimaSyncAt: row.ultimaSyncAt?.toISOString() ?? null,
          ultimoError: row.ultimoError,
          credencialesMasked: masked,
          logs: row.logs,
        }
      : {
          estado,
          cuentaExterna,
          configSync: defaultSyncFor(integracionId),
          credencialesMasked: masked,
          logs: [],
        },
  }
}

export async function guardarConexion(
  empresaId: number,
  integracionId: string,
  credenciales: Record<string, string>,
  configSync?: SyncConfigForm,
) {
  const connector = getConnector(integracionId)
  if (!connector) throw new Error("Conector no implementado")

  const existing = await prisma.conexionIntegracion.findUnique({
    where: { empresaId_integracionId: { empresaId, integracionId } },
  })

  const prev = decryptCredentials(existing?.credencialesEnc)
  const merged = { ...prev, ...credenciales }
  // No sobrescribir con máscaras vacías
  for (const [k, v] of Object.entries(credenciales)) {
    if (v.includes("••")) delete merged[k]
  }

  let cuentaExterna: string | undefined
  let estado: IntegrationStatus = "conectado"

  if (connector.onConnect) {
    const result = await connector.onConnect(empresaId, merged)
    cuentaExterna = result.cuentaExterna
    if (result.estado) estado = result.estado
  }

  const row = await prisma.conexionIntegracion.upsert({
    where: { empresaId_integracionId: { empresaId, integracionId } },
    create: {
      empresaId,
      integracionId,
      estado,
      cuentaExterna,
      credencialesEnc: encryptCredentials(merged),
      configSync: (configSync ?? defaultSyncFor(integracionId)) as object,
      activo: true,
    },
    update: {
      estado,
      cuentaExterna: cuentaExterna ?? undefined,
      credencialesEnc: encryptCredentials(merged),
      ...(configSync && { configSync: configSync as object }),
      ultimoError: null,
      activo: true,
    },
  })

  await registrarLog(row.id, "outbound", "conexion", "ok", 1, 0, "Credenciales guardadas")

  return row
}

export async function probarConexion(empresaId: number, integracionId: string) {
  const connector = getConnector(integracionId)
  if (!connector) throw new Error("Conector no implementado")

  const row = await prisma.conexionIntegracion.findUnique({
    where: { empresaId_integracionId: { empresaId, integracionId } },
  })

  const credenciales = decryptCredentials(row?.credencialesEnc)
  const result = await connector.testConnection({
    empresaId,
    conexionId: row?.id ?? 0,
    credenciales,
    configSync: row?.configSync as Record<string, unknown> | undefined,
  })

  if (row) {
    await prisma.conexionIntegracion.update({
      where: { id: row.id },
      data: {
        estado: result.ok ? "conectado" : "error",
        ultimoError: result.ok ? null : result.mensaje,
      },
    })
    await registrarLog(
      row.id,
      "outbound",
      "test",
      result.ok ? "ok" : "error",
      result.ok ? 1 : 0,
      result.ok ? 0 : 1,
      result.mensaje,
    )
  }

  return result
}

export async function desconectar(empresaId: number, integracionId: string) {
  await prisma.conexionIntegracion.updateMany({
    where: { empresaId, integracionId },
    data: {
      estado: "desconectado",
      credencialesEnc: null,
      cuentaExterna: null,
      ultimoError: null,
      activo: false,
    },
  })
}

export async function guardarSyncConfig(
  empresaId: number,
  integracionId: string,
  configSync: SyncConfigForm,
) {
  return prisma.conexionIntegracion.upsert({
    where: { empresaId_integracionId: { empresaId, integracionId } },
    create: {
      empresaId,
      integracionId,
      estado: "desconectado",
      configSync: configSync as object,
    },
    update: { configSync: configSync as object },
  })
}

async function registrarLog(
  conexionId: number,
  direccion: string,
  entidad: string,
  estado: string,
  ok: number,
  err: number,
  mensaje?: string,
) {
  await prisma.integracionSyncLog.create({
    data: {
      conexionId,
      direccion,
      entidad,
      estado,
      registrosOk: ok,
      registrosError: err,
      mensaje,
    },
  })
}

export async function crearSolicitudIntegracion(
  empresaId: number,
  data: {
    nombreSistema: string
    sitioWeb?: string
    syncItems: string[]
    descripcion?: string
    emailContacto: string
    usuarioId?: number
  },
) {
  return prisma.solicitudIntegracion.create({
    data: {
      empresaId,
      nombreSistema: data.nombreSistema,
      sitioWeb: data.sitioWeb,
      syncItems: data.syncItems,
      descripcion: data.descripcion,
      emailContacto: data.emailContacto,
      usuarioId: data.usuarioId,
    },
  })
}
import { prisma } from "@/lib/prisma"
import { ensureTenantEntornos } from "@/lib/ops/ops-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import type { EntornoCodigo } from "@/lib/ops/ops-types"
import {
  ENTORNO_SYNC_DOMINIOS,
  type EntornoConfigSnapshot,
  type EntornoSyncDominio,
  type EntornoSyncHistoryEntry,
  type EntornoSyncOpciones,
  type EntornoSyncResult,
  type EntornoSyncStatus,
} from "@/lib/ops/entorno-sync-types"

const CODIGOS_VALIDOS: EntornoCodigo[] = ["dev", "val", "prd"]

type EntornoMetadata = {
  configSnapshot?: EntornoConfigSnapshot
  syncHistory?: EntornoSyncHistoryEntry[]
  lastSyncFrom?: EntornoCodigo
  lastSyncAt?: string
}

function db() {
  return prisma as any
}

function dominiosEfectivos(opts?: EntornoSyncOpciones): EntornoSyncDominio[] {
  return opts?.dominios?.length ? opts.dominios : [...ENTORNO_SYNC_DOMINIOS]
}

function parseMetadata(raw: unknown): EntornoMetadata {
  if (!raw || typeof raw !== "object") return {}
  return raw as EntornoMetadata
}

function mergeMetadata(
  actual: unknown,
  patch: Partial<EntornoMetadata>,
): EntornoMetadata {
  return { ...parseMetadata(actual), ...patch }
}

export async function resolverEntorno(empresaId: number, codigo: EntornoCodigo) {
  await ensureTenantEntornos(empresaId)
  const entorno = await db().tenantEntorno.findFirst({
    where: { empresaId, codigo },
  })
  if (!entorno) throw new Error(`Entorno ${codigo} no encontrado`)
  return entorno
}

/** Lee configuración live de la base y arma snapshot. */
export async function capturarConfigLive(
  empresaId: number,
  codigo: EntornoCodigo,
  ejecutadoPor: string,
  dominios?: EntornoSyncDominio[],
): Promise<EntornoConfigSnapshot> {
  const doms = dominios ?? [...ENTORNO_SYNC_DOMINIOS]
  const data: EntornoConfigSnapshot["data"] = {}

  if (doms.includes("empresa_config")) {
    const empresa = await db().empresa.findUnique({
      where: { id: empresaId },
      select: {
        rubro: true,
        rubroId: true,
        condicionIva: true,
        paisFiscal: true,
        puntoVenta: true,
        direccion: true,
        telefono: true,
        email: true,
        temaConfig: true,
        entornoAfip: true,
      },
    })
    if (empresa) {
      data.empresa_config = {
        rubro: empresa.rubro,
        rubroId: empresa.rubroId,
        condicionIva: empresa.condicionIva,
        paisFiscal: empresa.paisFiscal,
        puntoVenta: empresa.puntoVenta,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        email: empresa.email,
        temaConfig: empresa.temaConfig,
        entornoAfip: empresa.entornoAfip ?? "homologacion",
      }
    }
  }

  if (doms.includes("parametros_fiscales")) {
    const params = await db().parametroFiscal.findMany({ where: { empresaId } })
    data.parametros_fiscales = params.map((p: Record<string, unknown>) => ({
      clave: String(p.clave),
      valor: String(p.valor),
      descripcion: (p.descripcion as string | null) ?? null,
      categoria: String(p.categoria ?? "fiscal"),
      pais: (p.pais as string | null) ?? null,
      normativa: (p.normativa as string | null) ?? null,
      activo: Boolean(p.activo),
    }))
  }

  if (doms.includes("features")) {
    const features = await db().featureEmpresa.findMany({ where: { empresaId } })
    data.features = features.map((f: Record<string, unknown>) => ({
      featureKey: String(f.featureKey),
      activado: Boolean(f.activado),
      modoSimplificado: Boolean(f.modoSimplificado),
      parametros: f.parametros ?? null,
      notas: (f.notas as string | null) ?? null,
    }))
  }

  if (doms.includes("suscripciones")) {
    const subs = await db().suscripcionModulo.findMany({ where: { empresaId } })
    data.suscripciones = subs.map((s: Record<string, unknown>) => ({
      sku: String(s.sku),
      activo: Boolean(s.activo),
      limiteEventosMes: (s.limiteEventosMes as number | null) ?? null,
      metadata: s.metadata ?? null,
    }))
  }

  return {
    version: 1,
    capturedAt: new Date().toISOString(),
    capturedBy: ejecutadoPor,
    codigo,
    dominios: doms,
    data,
  }
}

/** Guarda snapshot en metadata del entorno (no toca la base live). */
export async function capturarSnapshotEntorno(
  empresaId: number,
  codigo: EntornoCodigo,
  ejecutadoPor: string,
  opts?: EntornoSyncOpciones,
): Promise<EntornoConfigSnapshot> {
  const entorno = await resolverEntorno(empresaId, codigo)
  const dominios = dominiosEfectivos(opts)
  const snapshot = await capturarConfigLive(empresaId, codigo, ejecutadoPor, dominios)

  const meta = parseMetadata(entorno.metadata)
  const history = meta.syncHistory ?? []

  await db().tenantEntorno.update({
    where: { id: entorno.id },
    data: {
      metadata: mergeMetadata(entorno.metadata, {
        configSnapshot: snapshot,
        syncHistory: history,
      }),
      updatedAt: new Date(),
    },
  })

  await persistSistemaLog({
    empresaId,
    entornoId: entorno.id,
    severidad: "info",
    categoria: "ops",
    contexto: "entorno-sync:capture",
    mensaje: `Snapshot capturado en ${codigo} (${dominios.join(", ")})`,
    metadata: { dominios, capturedBy: ejecutadoPor },
  })

  return snapshot
}

export async function obtenerSnapshotEntorno(
  empresaId: number,
  codigo: EntornoCodigo,
): Promise<EntornoConfigSnapshot | null> {
  const entorno = await resolverEntorno(empresaId, codigo)
  return parseMetadata(entorno.metadata).configSnapshot ?? null
}

function sanitizarSnapshotParaVal(
  snapshot: EntornoConfigSnapshot,
  sanitizarAfip: boolean,
): EntornoConfigSnapshot {
  const clone = structuredClone(snapshot)
  clone.codigo = "val"
  if (sanitizarAfip && clone.data.empresa_config) {
    clone.data.empresa_config.entornoAfip = "homologacion"
  }
  return clone
}

function contarRegistrosSnapshot(snapshot: EntornoConfigSnapshot, dominios: EntornoSyncDominio[]): number {
  let n = 0
  for (const d of dominios) {
    if (d === "empresa_config" && snapshot.data.empresa_config) n += 1
    if (d === "parametros_fiscales") n += snapshot.data.parametros_fiscales?.length ?? 0
    if (d === "features") n += snapshot.data.features?.length ?? 0
    if (d === "suscripciones") n += snapshot.data.suscripciones?.length ?? 0
  }
  return n
}

/** Aplica un snapshot a la base live del tenant. */
export async function aplicarSnapshotALiveDb(
  empresaId: number,
  snapshot: EntornoConfigSnapshot,
  dominios: EntornoSyncDominio[],
  opts?: EntornoSyncOpciones,
): Promise<number> {
  let afectados = 0

  if (dominios.includes("empresa_config") && snapshot.data.empresa_config) {
    const e = snapshot.data.empresa_config
    const update: Record<string, unknown> = {
      rubro: e.rubro,
      rubroId: e.rubroId,
      condicionIva: e.condicionIva,
      paisFiscal: e.paisFiscal,
      puntoVenta: e.puntoVenta,
      direccion: e.direccion,
      telefono: e.telefono,
      email: e.email,
      temaConfig: e.temaConfig,
    }
    if (opts?.incluirCertificadosAfip) {
      update.entornoAfip = e.entornoAfip
      update.entorno = e.entornoAfip
    }
    await db().empresa.update({ where: { id: empresaId }, data: update })
    afectados += 1
  }

  if (dominios.includes("parametros_fiscales") && snapshot.data.parametros_fiscales) {
    for (const p of snapshot.data.parametros_fiscales) {
      await db().parametroFiscal.upsert({
        where: {
          empresaId_clave_pais: {
            empresaId,
            clave: p.clave,
            pais: p.pais ?? "",
          },
        },
        create: {
          empresaId,
          clave: p.clave,
          valor: p.valor,
          descripcion: p.descripcion,
          categoria: p.categoria,
          pais: p.pais,
          normativa: p.normativa,
          activo: p.activo,
        },
        update: {
          valor: p.valor,
          descripcion: p.descripcion,
          categoria: p.categoria,
          normativa: p.normativa,
          activo: p.activo,
        },
      })
      afectados += 1
    }
  }

  if (dominios.includes("features") && snapshot.data.features) {
    for (const f of snapshot.data.features) {
      await db().featureEmpresa.upsert({
        where: { empresaId_featureKey: { empresaId, featureKey: f.featureKey } },
        create: {
          empresaId,
          featureKey: f.featureKey,
          activado: f.activado,
          modoSimplificado: f.modoSimplificado,
          parametros: f.parametros,
          notas: f.notas,
        },
        update: {
          activado: f.activado,
          modoSimplificado: f.modoSimplificado,
          parametros: f.parametros,
          notas: f.notas,
        },
      })
      afectados += 1
    }
  }

  if (dominios.includes("suscripciones") && snapshot.data.suscripciones) {
    for (const s of snapshot.data.suscripciones) {
      await db().suscripcionModulo.upsert({
        where: { empresaId_sku: { empresaId, sku: s.sku } },
        create: {
          empresaId,
          sku: s.sku,
          activo: s.activo,
          limiteEventosMes: s.limiteEventosMes,
          metadata: s.metadata,
        },
        update: {
          activo: s.activo,
          limiteEventosMes: s.limiteEventosMes,
          metadata: s.metadata,
        },
      })
      afectados += 1
    }
  }

  return afectados
}

async function persistirSnapshotEnEntorno(
  empresaId: number,
  codigo: EntornoCodigo,
  snapshot: EntornoConfigSnapshot,
  entry: EntornoSyncHistoryEntry,
  origen: EntornoCodigo,
) {
  const entorno = await resolverEntorno(empresaId, codigo)
  const meta = parseMetadata(entorno.metadata)
  const history = [...(meta.syncHistory ?? []), entry].slice(-20)

  await db().tenantEntorno.update({
    where: { id: entorno.id },
    data: {
      metadata: mergeMetadata(entorno.metadata, {
        configSnapshot: snapshot,
        syncHistory: history,
        lastSyncFrom: origen,
        lastSyncAt: entry.at,
      }),
      updatedAt: new Date(),
    },
  })
}

function validarCodigos(origen: EntornoCodigo, destino: EntornoCodigo) {
  if (!CODIGOS_VALIDOS.includes(origen) || !CODIGOS_VALIDOS.includes(destino)) {
    throw new Error("Código de entorno inválido")
  }
  if (origen === destino) throw new Error("Origen y destino deben ser distintos")
}

/**
 * Sincroniza configuración entre entornos.
 * - Si destino es `prd` y aplicarALiveDb=true (default): aplica a la base live.
 * - Si destino es `val`/`dev`: solo actualiza snapshot del entorno destino.
 */
export async function sincronizarEntornos(
  empresaId: number,
  origen: EntornoCodigo,
  destino: EntornoCodigo,
  ejecutadoPor: string,
  opts?: EntornoSyncOpciones,
): Promise<EntornoSyncResult> {
  validarCodigos(origen, destino)
  const dominios = dominiosEfectivos(opts)
  const aplicarALiveDb = opts?.aplicarALiveDb ?? destino === "prd"

  let snapshotOrigen = await obtenerSnapshotEntorno(empresaId, origen)
  if (!snapshotOrigen) {
    snapshotOrigen = await capturarSnapshotEntorno(empresaId, origen, ejecutadoPor, { dominios })
  }

  let snapshotDestino = structuredClone(snapshotOrigen)
  snapshotDestino.codigo = destino
  snapshotDestino.capturedAt = new Date().toISOString()
  snapshotDestino.capturedBy = ejecutadoPor

  if (destino === "val" && origen === "prd") {
    snapshotDestino = sanitizarSnapshotParaVal(snapshotDestino, opts?.sanitizarAfipEnVal !== false)
  }

  let registrosAfectados = 0
  if (aplicarALiveDb) {
    registrosAfectados = await aplicarSnapshotALiveDb(empresaId, snapshotDestino, dominios, opts)
  } else {
    registrosAfectados = contarRegistrosSnapshot(snapshotDestino, dominios)
  }

  const direccion =
    origen === "val" && destino === "prd"
      ? "val→prd"
      : origen === "prd" && destino === "val"
        ? "prd→val"
        : origen === "dev" && destino === "val"
          ? "dev→val"
          : origen === "val" && destino === "dev"
            ? "val→dev"
            : "custom"

  const entry: EntornoSyncHistoryEntry = {
    direccion,
    origen,
    destino,
    at: new Date().toISOString(),
    by: ejecutadoPor,
    dominios,
    registrosAfectados,
    aplicadoALiveDb: aplicarALiveDb,
  }

  await persistirSnapshotEnEntorno(empresaId, destino, snapshotDestino, entry, origen)

  const entOrigen = await resolverEntorno(empresaId, origen)
  await persistSistemaLog({
    empresaId,
    entornoId: entOrigen.id,
    severidad: "info",
    categoria: "ops",
    contexto: "entorno-sync",
    mensaje: `Sync ${origen} → ${destino}: ${registrosAfectados} registro(s)`,
    metadata: { ...entry },
  })

  return {
    ok: true,
    direccion,
    origen,
    destino,
    dominios,
    registrosAfectados,
    aplicadoALiveDb: aplicarALiveDb,
    snapshotDestino,
  }
}

/** Promueve configuración validada en VAL hacia producción (live DB). */
export async function promoverValAPrd(
  empresaId: number,
  ejecutadoPor: string,
  opts?: EntornoSyncOpciones,
): Promise<EntornoSyncResult> {
  const valSnap = await obtenerSnapshotEntorno(empresaId, "val")
  if (!valSnap) {
    throw new Error(
      "No hay snapshot en VAL. Capturá o parametrizá en VAL antes de promover a PRD.",
    )
  }
  return sincronizarEntornos(empresaId, "val", "prd", ejecutadoPor, {
    ...opts,
    aplicarALiveDb: opts?.aplicarALiveDb ?? true,
  })
}

/**
 * Refresca VAL desde PRD cuando producción avanzó (nuevos parámetros, features, etc.).
 * No modifica la base live: solo actualiza el workspace de VAL para UAT.
 */
export async function refrescarValDesdePrd(
  empresaId: number,
  ejecutadoPor: string,
  opts?: EntornoSyncOpciones,
): Promise<EntornoSyncResult> {
  await capturarSnapshotEntorno(empresaId, "prd", ejecutadoPor, opts)
  return sincronizarEntornos(empresaId, "prd", "val", ejecutadoPor, {
    ...opts,
    aplicarALiveDb: false,
    sanitizarAfipEnVal: opts?.sanitizarAfipEnVal ?? true,
  })
}

/**
 * El analista modifica configuración en el workspace VAL (snapshot) sin tocar PRD.
 * `patch` es un merge parcial sobre dominios del snapshot val.
 */
export async function actualizarConfigEnVal(
  empresaId: number,
  patch: Partial<EntornoConfigSnapshot["data"]>,
  ejecutadoPor: string,
): Promise<EntornoConfigSnapshot> {
  let snapshot = await obtenerSnapshotEntorno(empresaId, "val")
  if (!snapshot) {
    snapshot = await capturarSnapshotEntorno(empresaId, "val", ejecutadoPor)
  }

  if (patch.empresa_config) {
    snapshot.data.empresa_config = {
      ...(snapshot.data.empresa_config ?? {
        rubro: "comercio",
        rubroId: null,
        condicionIva: "Responsable Inscripto",
        paisFiscal: "AR",
        puntoVenta: 1,
        direccion: null,
        telefono: null,
        email: null,
        temaConfig: null,
        entornoAfip: "homologacion",
      }),
      ...patch.empresa_config,
      entornoAfip: "homologacion",
    }
  }
  if (patch.parametros_fiscales) snapshot.data.parametros_fiscales = patch.parametros_fiscales
  if (patch.features) snapshot.data.features = patch.features
  if (patch.suscripciones) snapshot.data.suscripciones = patch.suscripciones

  snapshot.capturedAt = new Date().toISOString()
  snapshot.capturedBy = ejecutadoPor

  const entorno = await resolverEntorno(empresaId, "val")
  await db().tenantEntorno.update({
    where: { id: entorno.id },
    data: {
      metadata: mergeMetadata(entorno.metadata, { configSnapshot: snapshot }),
      updatedAt: new Date(),
    },
  })

  await persistSistemaLog({
    empresaId,
    entornoId: entorno.id,
    severidad: "info",
    categoria: "ops",
    contexto: "entorno-sync:update-val",
    mensaje: "Configuración actualizada en workspace VAL (sin afectar PRD)",
    metadata: { updatedBy: ejecutadoPor, dominios: Object.keys(patch) },
  })

  return snapshot
}

export async function getEntornoSyncStatus(empresaId: number): Promise<EntornoSyncStatus> {
  const entornos = await ensureTenantEntornos(empresaId)
  const mapped = entornos.map((e: { codigo: string; metadata: unknown }) => {
    const meta = parseMetadata(e.metadata)
    const snap = meta.configSnapshot
    return {
      codigo: e.codigo as EntornoCodigo,
      snapshotAt: snap?.capturedAt ?? null,
      snapshotBy: snap?.capturedBy ?? null,
      dominios: snap?.dominios ?? [],
      lastSyncFrom: meta.lastSyncFrom ?? null,
      lastSyncAt: meta.lastSyncAt ?? null,
    }
  })

  const val = mapped.find((e) => e.codigo === "val")
  const prd = mapped.find((e) => e.codigo === "prd")

  const puedePromoverValAPrd = Boolean(val?.snapshotAt)
  const puedeRefrescarValDesdePrd = true

  let mensaje: string | undefined
  if (!val?.snapshotAt) {
    mensaje =
      "VAL sin snapshot: capturá desde live o parametrizá en VAL antes de promover a PRD."
  } else if (prd?.lastSyncAt && val.lastSyncAt && prd.lastSyncAt > val.lastSyncAt) {
    mensaje = "PRD tiene cambios más recientes que VAL. Considerá refrescar VAL desde PRD."
  }

  return {
    empresaId,
    entornos: mapped,
    puedePromoverValAPrd,
    puedeRefrescarValDesdePrd,
    mensaje,
  }
}
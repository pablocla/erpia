import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import type { EntornoCodigo } from "@/lib/ops/ops-types"
import {
  actualizarConfigEnVal,
  capturarSnapshotEntorno,
  getEntornoSyncStatus,
  promoverValAPrd,
  refrescarValDesdePrd,
  sincronizarEntornos,
} from "@/lib/ops/entorno-sync-service"
import type { EntornoSyncOpciones } from "@/lib/ops/entorno-sync-types"

const CODIGOS = new Set(["dev", "val", "prd"])

function parseOpciones(body: Record<string, unknown>): EntornoSyncOpciones | undefined {
  const opts: EntornoSyncOpciones = {}
  if (Array.isArray(body.dominios)) opts.dominios = body.dominios as EntornoSyncOpciones["dominios"]
  if (typeof body.aplicarALiveDb === "boolean") opts.aplicarALiveDb = body.aplicarALiveDb
  if (typeof body.sanitizarAfipEnVal === "boolean") opts.sanitizarAfipEnVal = body.sanitizarAfipEnVal
  if (typeof body.incluirCertificadosAfip === "boolean") {
    opts.incluirCertificadosAfip = body.incluirCertificadosAfip
  }
  return Object.keys(opts).length ? opts : undefined
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId: raw } = await params
    const empresaId = Number(raw)
    const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
    if (!ctx.ok) return ctx.response

    const status = await getEntornoSyncStatus(empresaId)
    return NextResponse.json(status)
  } catch (error) {
    console.error("Error sync status:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId: raw } = await params
    const empresaId = Number(raw)
    const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
    if (!ctx.ok) return ctx.response

    const body = await request.json().catch(() => ({}))
    const action = String(body?.action ?? "status")
    const opts = parseOpciones(body)

    switch (action) {
      case "status": {
        const status = await getEntornoSyncStatus(empresaId)
        return NextResponse.json(status)
      }
      case "capture": {
        const codigo = String(body?.codigo ?? "val") as EntornoCodigo
        if (!CODIGOS.has(codigo)) {
          return NextResponse.json({ error: "Código de entorno inválido" }, { status: 400 })
        }
        const snapshot = await capturarSnapshotEntorno(empresaId, codigo, ctx.auth.email, opts)
        return NextResponse.json({ ok: true, snapshot })
      }
      case "promote_val_prd": {
        const result = await promoverValAPrd(empresaId, ctx.auth.email, opts)
        return NextResponse.json(result)
      }
      case "refresh_val_from_prd": {
        const result = await refrescarValDesdePrd(empresaId, ctx.auth.email, opts)
        return NextResponse.json(result)
      }
      case "sync": {
        const origen = String(body?.origen) as EntornoCodigo
        const destino = String(body?.destino) as EntornoCodigo
        if (!CODIGOS.has(origen) || !CODIGOS.has(destino)) {
          return NextResponse.json({ error: "Origen/destino inválidos" }, { status: 400 })
        }
        const result = await sincronizarEntornos(empresaId, origen, destino, ctx.auth.email, opts)
        return NextResponse.json(result)
      }
      case "update_val": {
        const patch = body?.patch
        if (!patch || typeof patch !== "object") {
          return NextResponse.json({ error: "patch requerido" }, { status: 400 })
        }
        const snapshot = await actualizarConfigEnVal(empresaId, patch, ctx.auth.email)
        return NextResponse.json({ ok: true, snapshot })
      }
      default:
        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    console.error("Error sync entornos:", error)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
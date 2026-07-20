import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  autorizarEstudioDesdeCliente,
  desvincularCliente,
  listClientesDelEstudio,
  vincularClienteAEstudio,
} from "@/lib/contador/multi-empresa-service"

/** GET — lista de empresas cliente del estudio (empresa logueada = estudio) */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const clientes = await listClientesDelEstudio(auth.auth.empresaId)
    return NextResponse.json({ clientes, estudioEmpresaId: auth.auth.empresaId })
  } catch (err) {
    console.error("[contador/clientes GET]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}

/**
 * POST
 * - action: "vincular" { clienteEmpresaId } — estudio agrega cliente
 * - action: "autorizar_estudio" { estudioCuitOrId } — comercio autoriza estudio
 * - action: "desvincular" { clienteEmpresaId }
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const action = body.action as string

    if (action === "vincular") {
      const clienteEmpresaId = Number(body.clienteEmpresaId)
      if (!clienteEmpresaId) {
        return NextResponse.json({ error: "clienteEmpresaId requerido" }, { status: 400 })
      }
      const link = await vincularClienteAEstudio({
        estudioEmpresaId: auth.auth.empresaId,
        clienteEmpresaId,
        creadoPorUserId: auth.auth.userId,
        permisos: body.permisos ?? "lectura_fiscal",
        notas: body.notas,
      })
      return NextResponse.json({ ok: true, link })
    }

    if (action === "autorizar_estudio") {
      const estudioCuitOrId = String(body.estudioCuitOrId ?? "").trim()
      if (!estudioCuitOrId) {
        return NextResponse.json({ error: "estudioCuitOrId requerido" }, { status: 400 })
      }
      const link = await autorizarEstudioDesdeCliente({
        clienteEmpresaId: auth.auth.empresaId,
        estudioCuitOrId,
        creadoPorUserId: auth.auth.userId,
      })
      return NextResponse.json({ ok: true, link })
    }

    if (action === "desvincular") {
      const clienteEmpresaId = Number(body.clienteEmpresaId)
      if (!clienteEmpresaId) {
        return NextResponse.json({ error: "clienteEmpresaId requerido" }, { status: 400 })
      }
      await desvincularCliente(auth.auth.empresaId, clienteEmpresaId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "action inválida" }, { status: 400 })
  } catch (err) {
    console.error("[contador/clientes POST]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  adjuntarDocumento,
  listarDocumentos,
  eliminarDocumento,
} from "@/lib/documentos/documentos-service"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!(await auth).ok) return (await auth as any).response
  const { empresaId } = (await auth as any).auth

  const { searchParams } = new URL(request.url)
  const entidadTipo = searchParams.get("entidad") as any
  const entidadId = Number(searchParams.get("entidadId"))

  if (!entidadTipo || !entidadId) {
    return NextResponse.json({ error: "Parámetros entidad y entidadId requeridos" }, { status: 400 })
  }

  const docs = await listarDocumentos(empresaId, entidadTipo, entidadId)
  return NextResponse.json(docs)
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId, userId } = authResult.auth

  const body = await request.json()
  const doc = await adjuntarDocumento({
    empresaId,
    entidadTipo: body.entidadTipo,
    entidadId: body.entidadId,
    nombreArchivo: body.nombreArchivo,
    mimeType: body.mimeType,
    tamanio: body.tamanio,
    url: body.url,
    storageKey: body.storageKey,
    categoria: body.categoria,
    descripcion: body.descripcion,
    subidoPor: userId,
  })
  return NextResponse.json(doc, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const { searchParams } = new URL(request.url)
  const documentoId = Number(searchParams.get("id"))
  if (!documentoId) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 })
  }

  await eliminarDocumento(empresaId, documentoId)
  return NextResponse.json({ ok: true })
}

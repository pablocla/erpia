import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import {
  canPreviewExperience,
  emitirTokenPreviewRol,
} from "@/lib/auth/preview-experience"
import {
  homePathForPreviewRol,
  isPreviewActorCodigo,
  labelForPreviewActor,
} from "@/lib/auth/preview-experience-catalog"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

/**
 * POST /api/auth/preview-experience
 * Admin/analista emite un JWT de 2h con el rol pedido, misma empresa.
 * El cliente guarda la sesión original y puede volver.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const payload = await verificarToken(request)
  const alreadyPreview = payload?.impersonating === true
  if (
    !alreadyPreview &&
    !canPreviewExperience({ email: auth.auth.email, rol: auth.auth.rol })
  ) {
    return NextResponse.json(
      { error: "Solo el admin o un analista Claver pueden probar otras experiencias" },
      { status: 403 },
    )
  }

  const body = (await request.json().catch(() => ({}))) as { kind?: string; rol?: string }
  if (body.kind !== "rol") {
    return NextResponse.json(
      { error: "kind inválido. Usá kind=rol (el rubro se arma con la demo de industria)." },
      { status: 400 },
    )
  }

  const rol = typeof body.rol === "string" ? body.rol.trim() : ""
  if (!rol || !isPreviewActorCodigo(rol)) {
    return NextResponse.json({ error: "Rol no válido para preview" }, { status: 400 })
  }

  const token = await emitirTokenPreviewRol({
    userId: auth.auth.userId,
    email: auth.auth.email,
    empresaId: auth.auth.empresaId,
    rol,
  })

  const empresa = await prisma.empresa.findUnique({
    where: { id: auth.auth.empresaId },
    select: { nombre: true, modoLite: true },
  })

  const usuario = await prisma.usuario.findUnique({
    where: { id: auth.auth.userId },
    select: { id: true, nombre: true, email: true, avatarUrl: true },
  })

  await persistSistemaLog({
    empresaId: auth.auth.empresaId,
    severidad: "info",
    categoria: "ops",
    contexto: "preview:actor",
    mensaje: `${auth.auth.email} abrió experiencia como ${labelForPreviewActor(rol)}`,
    metadata: { rol, userId: auth.auth.userId },
  })

  return NextResponse.json({
    success: true,
    token,
    usuario: {
      id: usuario?.id ?? auth.auth.userId,
      nombre: usuario?.nombre ?? auth.auth.email,
      email: usuario?.email ?? auth.auth.email,
      rol: rol === "dueno" ? "dueno" : rol,
      empresaId: auth.auth.empresaId,
      empresaNombre: empresa?.nombre,
      empresaModoLite: empresa?.modoLite ?? undefined,
      avatarUrl: usuario?.avatarUrl ?? null,
    },
    redirectUrl: homePathForPreviewRol(rol),
    preview: { kind: "rol", label: labelForPreviewActor(rol) },
  })
}

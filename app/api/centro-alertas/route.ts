import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isIAEnabled } from "@/lib/ai"
import { evaluarReglas } from "@/lib/alertas/alertas-service"
import {
  listarBandejaAlertas,
  listarPreviewNotificaciones,
  obtenerEstadoCanales,
  obtenerResumenCentroAlertas,
  type FiltroBandeja,
} from "@/lib/alertas/centro-alertas-service"
import { prisma } from "@/lib/prisma"

const FiltroSchema = z.enum(["todas", "activas", "no_leidas", "regla", "ia"])

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const url = new URL(request.url)
  const preview = url.searchParams.get("preview") === "true"
  const filtroParam = url.searchParams.get("filtro")
  const incluirWa = url.searchParams.get("whatsapp") === "true"
  const incluirCanales = url.searchParams.get("canales") === "true"

  const filtro: FiltroBandeja = FiltroSchema.safeParse(filtroParam).success
    ? (filtroParam as FiltroBandeja)
    : "activas"

  const [resumen, bandeja, canales] = await Promise.all([
    obtenerResumenCentroAlertas(ctx.auth.empresaId, ctx.auth.userId, ctx.auth.rol),
    preview
      ? listarPreviewNotificaciones(ctx.auth.empresaId, ctx.auth.userId, ctx.auth.rol)
      : listarBandejaAlertas(ctx.auth.empresaId, ctx.auth.userId, ctx.auth.rol, { filtro }),
    incluirCanales ? obtenerEstadoCanales(ctx.auth.empresaId) : Promise.resolve(null),
  ])

  let whatsapp: unknown[] | null = null
  if (incluirWa) {
    whatsapp = await prisma.mensajePendienteWhatsApp.findMany({
      where: {
        empresaId: ctx.auth.empresaId,
        estado: { in: ["pendiente", "aprobado"] },
      },
      orderBy: [{ prioridad: "desc" }, { createdAt: "desc" }],
      take: 50,
    })
  }

  if (preview) {
    return NextResponse.json({
      success: true,
      preview: bandeja,
      resumen,
    })
  }

  return NextResponse.json({
    success: true,
    resumen,
    bandeja,
    whatsapp,
    canales,
    iaHabilitada: await isIAEnabled(ctx.auth.empresaId),
  })
}

const PostSchema = z.object({
  accion: z.enum(["evaluar_reglas", "generar_ia"]),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  }

  if (parsed.data.accion === "evaluar_reglas") {
    const resultado = await evaluarReglas(ctx.auth.empresaId)
    return NextResponse.json({ success: true, resultado })
  }

  if (!(await isIAEnabled(ctx.auth.empresaId))) {
    return NextResponse.json({ error: "Módulo IA no habilitado" }, { status: 403 })
  }

  const { generarAlertasInteligentes } = await import("@/lib/ai")
  const { crearAlertaIAConNotificacion } = await import("@/lib/ai/notificacion-ia-service")

  const resultado = await generarAlertasInteligentes(ctx.auth.empresaId)
  let creadas = 0

  for (const a of resultado.alertas) {
    await crearAlertaIAConNotificacion({
      empresaId: ctx.auth.empresaId,
      tipo: a.tipo,
      prioridad: a.prioridad as "alta" | "media" | "baja",
      titulo: a.titulo,
      descripcion: a.descripcion,
      accion: a.accion_sugerida,
      origen: "manual",
      datosExtra: a.datos ?? undefined,
    })
    creadas++
  }

  return NextResponse.json({
    success: true,
    alertasGeneradas: creadas,
    total: resultado.alertas.length,
  })
}
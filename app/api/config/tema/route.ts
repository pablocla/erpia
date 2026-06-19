import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isAdminRole } from "@/lib/auth/admin-roles"
import { getEmpresaTema, updateEmpresaTema } from "@/lib/theme/theme-service"
import { mergeTemaConfig } from "@/lib/theme/types"

const temaUpdateSchema = z.object({
  mode: z.enum(["light", "dark", "system"]).optional(),
  palette: z.enum(["neutral", "porcelain", "sand", "sage", "mist", "blue", "green", "orange", "rose", "violet", "amber", "teal"]).optional(),
  density: z.enum(["compact", "default", "comfortable"]).optional(),
  sidebarStyle: z.enum(["default", "floating", "inset"]).optional(),
  sidebarPosition: z.enum(["left", "right"]).optional(),
  radius: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
  surface: z.enum(["soft", "clean", "glow"]).optional(),
  blurIntensity: z.enum(["low", "medium", "high"]).optional(),
  canvasStyle: z.enum(["gradient", "solid", "minimal"]).optional(),
  fontFamily: z.enum(["manrope", "inter", "system"]).optional(),
  displayFont: z.enum(["fraunces", "none"]).optional(),
  fontScale: z.enum(["sm", "md", "lg"]).optional(),
  highContrast: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  animationsEnabled: z.boolean().optional(),
  topbarStyle: z.enum(["default", "compact"]).optional(),
  tableStyle: z.enum(["minimal", "zebra", "bordered"]).optional(),
  cardStyle: z.enum(["flat", "elevated", "outlined"]).optional(),
  iconStyle: z.enum(["outline", "filled"]).optional(),
  iconSize: z.enum(["sm", "md", "lg"]).optional(),
  sidebarColor: z.enum(["primary", "neutral", "dark"]).optional(),
  chartPalette: z.enum(["default", "vibrant", "pastel", "mono"]).optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  appName: z.string().max(80).nullable().optional(),
  logoUrl: z.string().max(500).nullable().optional(),
  locale: z.enum(["es-AR", "es-MX", "pt-BR", "en-US"]).optional(),
  touchMode: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const config = await getEmpresaTema(ctx.auth.empresaId)
  return NextResponse.json({
    config,
    canEdit: isAdminRole(ctx.auth.rol),
  })
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!isAdminRole(ctx.auth.rol)) {
      return NextResponse.json(
        { error: "Solo el dueño o administrador puede cambiar la apariencia de la empresa" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = temaUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Configuración inválida", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const config = await updateEmpresaTema(ctx.auth.empresaId, parsed.data)
    return NextResponse.json({ config, canEdit: true })
  } catch (error) {
    console.error("Error al guardar tema:", error)
    return NextResponse.json({ error: "Error al guardar apariencia" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!isAdminRole(ctx.auth.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const config = await updateEmpresaTema(ctx.auth.empresaId, mergeTemaConfig({}))
  return NextResponse.json({ config, canEdit: true })
}
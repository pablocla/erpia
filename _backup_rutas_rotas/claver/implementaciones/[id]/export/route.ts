import { type NextRequest, NextResponse } from "next/server"
import {
  getClaverAnalystContext,
  canAnalystAccessEmpresa,
} from "@/lib/auth/claver-analyst"
import { getProyectoImplementacion } from "@/lib/ops/implementacion-service"
import { exportDossierJson } from "@/lib/ops/dossier-export"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const proyectoId = Number(id)
    const proyecto = await getProyectoImplementacion(proyectoId)
    if (!proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
    }

    const allowed = await canAnalystAccessEmpresa(ctx.auth.email, proyecto.empresaId)
    if (!allowed) {
      return NextResponse.json({ error: "No tenés asignado este cliente" }, { status: 403 })
    }

    const dossier = await exportDossierJson(proyectoId)
    if (!dossier) {
      return NextResponse.json({ error: "No se pudo exportar" }, { status: 500 })
    }

    const download = new URL(request.url).searchParams.get("download") === "1"
    if (download) {
      const filename = `dossier-${proyecto.codigo}.json`
      return new NextResponse(JSON.stringify(dossier, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json(dossier)
  } catch (error) {
    console.error("Error exportar dossier:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { padronService } from "@/lib/impuestos/padron-service"
import type { OrganismoSoportado } from "@/lib/impuestos/padron-service"
import { z } from "zod"

const importarSchema = z.object({
  organismo: z.enum(["ARBA", "AGIP", "DGR_SF", "DGR_CBA", "DGR_MZA"]),
  tipoRegimen: z.string().default("percepcion_iibb"),
  csv: z.string().min(10, "CSV vacío o muy corto"),
})

const consultaSchema = z.object({
  cuit: z.string().regex(/^\d{2}-?\d{8}-?\d$/, "CUIT inválido"),
  organismo: z.enum(["ARBA", "AGIP", "DGR_SF", "DGR_CBA", "DGR_MZA"]).optional(),
})

// ─── GET — Listar padrones / consultar CUIT / estadísticas ─────────────────

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const vista = searchParams.get("vista")

    if (vista === "estadisticas") {
      const stats = await padronService.estadisticas()
      return NextResponse.json(stats)
    }

    if (vista === "consulta") {
      const cuit = searchParams.get("cuit")
      if (!cuit) return NextResponse.json({ error: "CUIT requerido" }, { status: 400 })
      const regimenes = await padronService.consultarTodos(cuit)
      return NextResponse.json({ cuit, regimenes })
    }

    // Default: list with filters
    const organismo = searchParams.get("organismo") ?? undefined
    const jurisdiccion = searchParams.get("jurisdiccion") ?? undefined
    const tipoRegimen = searchParams.get("tipoRegimen") ?? undefined
    const soloVigentes = searchParams.get("soloVigentes") === "true"
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const result = await padronService.listar({
      organismo,
      jurisdiccion,
      tipoRegimen,
      soloVigentes,
      skip,
      take,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error GET padron:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST — Importar CSV / Consultar alícuota específica ───────────────────

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()

    // Action: importar CSV masivo
    if (body.action === "importar") {
      const parsed = importarSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
      }

      const result = await padronService.importarCSV(
        parsed.data.csv,
        parsed.data.organismo as OrganismoSoportado,
        parsed.data.tipoRegimen,
      )

      return NextResponse.json({ ok: true, resultado: result })
    }

    // Action: consultar alícuota de un CUIT para un organismo
    if (body.action === "consultar") {
      const parsed = consultaSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
      }

      if (parsed.data.organismo) {
        const result = await padronService.consultarAlicuota(
          parsed.data.cuit,
          parsed.data.organismo as OrganismoSoportado,
        )
        return NextResponse.json({ cuit: parsed.data.cuit, organismo: parsed.data.organismo, resultado: result })
      }

      const todos = await padronService.consultarTodos(parsed.data.cuit)
      return NextResponse.json({ cuit: parsed.data.cuit, regimenes: todos })
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 })
  } catch (error) {
    console.error("Error POST padron:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

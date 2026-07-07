import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { packContadorService } from "@/lib/impuestos/pack-contador-service"

const schema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  anio: z.coerce.number().int().min(2000).max(2100),
})

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { searchParams } = new URL(request.url)
  const parsed = schema.safeParse({
    mes: searchParams.get("mes"),
    anio: searchParams.get("anio"),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "mes y anio requeridos (1-12, YYYY)" }, { status: 400 })
  }

  try {
    const { buffer, meta, filename } = await packContadorService.generarPack(
      ctx.auth.empresaId,
      parsed.data.mes,
      parsed.data.anio,
    )

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Pack-Periodo": meta.periodo,
        "X-Pack-Archivos": String(meta.archivos.length),
      },
    })
  } catch (error) {
    console.error("Error generando pack contador:", error)
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
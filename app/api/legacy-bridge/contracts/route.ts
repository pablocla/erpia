import { NextRequest, NextResponse } from "next/server"
import {
  CLAVER_APP_BRIDGE_CONTRACTS,
  formatContractForClient,
  getBridgeContractBySku,
} from "@/lib/legacy-bridge/api-contracts"
import { listPrwFilesForSku, readPrwSource } from "@/lib/legacy-bridge/prw-service"
import {
  formatTechnicalBulletin,
  getTechnicalBulletinBySku,
} from "@/lib/legacy-bridge/technical-bulletins"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"

export async function GET(request: NextRequest) {
  const sku = request.nextUrl.searchParams.get("sku")
  const format = request.nextUrl.searchParams.get("format")
  const prwFile = request.nextUrl.searchParams.get("file")

  if (!sku) {
    return NextResponse.json({
      contracts: CLAVER_APP_BRIDGE_CONTRACTS.map((c) => {
        const bulletin = getTechnicalBulletinBySku(c.sku)
        return {
          sku: c.sku,
          nombre: c.nombre,
          tagline: c.tagline,
          requiredCount: c.requiredEndpoints.length,
          optionalCount: c.optionalEndpoints?.length ?? 0,
          prwCount: bulletin?.archivosPrw.length ?? 0,
          bulletinVersion: bulletin?.version,
        }
      }),
    })
  }

  const contract = getBridgeContractBySku(sku)
  const bulletin = getTechnicalBulletinBySku(sku)

  if (!contract) {
    return NextResponse.json({ error: `SKU no encontrado: ${sku}` }, { status: 404 })
  }

  if (format === "bulletin" || format === "boletin") {
    if (!bulletin) {
      return NextResponse.json({ error: "Boletín técnico no disponible" }, { status: 404 })
    }
    const empresaId = Number(request.nextUrl.searchParams.get("empresaId") ?? "0")
    if (empresaId > 0) {
      const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
      if (!ctx.ok) return ctx.response
    }
    return new NextResponse(formatTechnicalBulletin(bulletin), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  }

  if (format === "prw") {
    if (!bulletin) {
      return NextResponse.json({ error: "Boletín técnico no disponible" }, { status: 404 })
    }
    if (prwFile) {
      const source = bulletin.archivosPrw.find((p) => p.archivo === prwFile)
      if (!source) {
        return NextResponse.json({ error: `PRW no encontrado: ${prwFile}` }, { status: 404 })
      }
      try {
        const content = readPrwSource(source.rutaRepo)
        return new NextResponse(content, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${prwFile}"`,
          },
        })
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Error leyendo PRW" },
          { status: 500 },
        )
      }
    }
    return NextResponse.json({
      sku,
      archivos: listPrwFilesForSku(sku),
      ordenCompilacion: bulletin.ordenCompilacion,
      downloadHint: `GET ?sku=${sku}&format=prw&file=CLVEXP01.PRW`,
    })
  }

  if (format === "markdown") {
    const empresaId = Number(request.nextUrl.searchParams.get("empresaId") ?? "0")
    if (empresaId > 0) {
      const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
      if (!ctx.ok) return ctx.response
    }
    return new NextResponse(formatContractForClient(contract), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  }

  return NextResponse.json({
    contract,
    bulletin: bulletin ?? null,
  })
}
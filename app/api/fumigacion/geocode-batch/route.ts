import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { geocodeQuery, buildAddressQuery } from "@/lib/maps/nominatim-geocode"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    // 1. Fetch clients that need geocoding
    const clientes = await prisma.cliente.findMany({
      where: {
        empresaId: auth.auth.empresaId,
        lat: null,
        lon: null,
        OR: [
          { geocodedAt: null },
          { geocodedAt: { lt: new Date(Date.now() - 1000 * 60 * 60) } } // Only retry if failed > 1 hour ago
        ]
      },
      take: 8, // Nominatim allows max 1 req/sec, batch of 8 to avoid timeouts
    })

    let geocodedCount = 0

    for (const cliente of clientes) {
      const direccionCompleta = buildAddressQuery({
        direccion: [cliente.direccion, cliente.direccionComplemento].filter(Boolean).join(" "),
        localidad: null // Default to Rosario fallback built in nominatim-geocode.ts
      })

      if (!direccionCompleta) continue

      const geo = await geocodeQuery(direccionCompleta)
      if (geo) {
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: {
            lat: geo.lat,
            lon: geo.lon,
            geocodedAt: new Date(),
          },
        })
        geocodedCount++
      } else {
        // Even if failed, mark geocodedAt to avoid infinite loops if it's a completely invalid address
        // BUT wait, in this batch, if it's invalid we don't want it stuck.
        // For now we just don't mark it, or mark it and rely on manual reset.
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: {
            geocodedAt: new Date(),
          },
        })
      }
    }

    // 2. Count remaining
    const remaining = await prisma.cliente.count({
      where: {
        empresaId: auth.auth.empresaId,
        lat: null,
        lon: null,
        OR: [
          { geocodedAt: null },
          { geocodedAt: { lt: new Date(Date.now() - 1000 * 60 * 60) } }
        ]
      }
    })

    return NextResponse.json({ geocoded: geocodedCount, remaining, processed: clientes.length })
  } catch (error) {
    console.error("[POST /api/fumigacion/geocode-batch]", error)
    return NextResponse.json(
      { error: "Error al procesar lote de geocodificación" },
      { status: 500 }
    )
  }
}

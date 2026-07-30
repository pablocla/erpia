/**
 * GET  /api/afip/puntos-venta — lista PV locales + sync AFIP opcional
 * POST /api/afip/puntos-venta — sincroniza PV desde FEParamGetPtosVenta
 */
import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "@/lib/afip/soap-client"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const locales = await prisma.puntoVentaConfig.findMany({
      where: { empresaId: ctx.auth.empresaId },
      orderBy: { numero: "asc" },
    })

    return NextResponse.json({ puntosVenta: locales })
  } catch (error) {
    console.error("GET puntos-venta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.auth.empresaId },
      select: {
        cuit: true,
        certificadoCRT: true,
        certificadoKEY: true,
        entorno: true,
        entornoAfip: true,
      },
    })
    if (!empresa?.certificadoCRT || !empresa.certificadoKEY) {
      return NextResponse.json(
        { error: "Certificados AFIP no configurados" },
        { status: 400 },
      )
    }

    const entorno =
      ((empresa.entornoAfip || empresa.entorno) as "homologacion" | "produccion") ??
      "homologacion"
    const client = new AFIPSoapClient(entorno)
    const auth = await client.authenticate(
      empresa.cuit,
      empresa.certificadoCRT,
      empresa.certificadoKEY,
      "wsfe",
    )
    const afipList = await client.consultarPuntosVenta(
      auth,
      empresa.cuit,
      ctx.auth.empresaId,
    )

    const upserted: number[] = []
    for (const pv of afipList) {
      if (!pv.Nro || pv.Bloqueado === "S" || pv.FchBaja) continue
      const tipo =
        pv.EmisionTipo?.toLowerCase().includes("caea")
          ? "electronico"
          : "electronico"
      await prisma.puntoVentaConfig.upsert({
        where: {
          empresaId_numero: {
            empresaId: ctx.auth.empresaId,
            numero: pv.Nro,
          },
        },
        create: {
          empresaId: ctx.auth.empresaId,
          numero: pv.Nro,
          nombre: `PV ${pv.Nro} (${pv.EmisionTipo || "CAE"})`,
          tipo,
          activo: true,
        },
        update: {
          activo: true,
          nombre: `PV ${pv.Nro} (${pv.EmisionTipo || "CAE"})`,
        },
      })
      upserted.push(pv.Nro)
    }

    // Marcar como inactivos los locales no presentes / dados de baja en AFIP
    const activosAfip = new Set(
      afipList.filter((p) => p.Bloqueado !== "S" && !p.FchBaja).map((p) => p.Nro),
    )
    const locales = await prisma.puntoVentaConfig.findMany({
      where: { empresaId: ctx.auth.empresaId },
    })
    for (const loc of locales) {
      if (!activosAfip.has(loc.numero)) {
        await prisma.puntoVentaConfig.update({
          where: { id: loc.id },
          data: { activo: false },
        })
      }
    }

    return NextResponse.json({
      ok: true,
      afip: afipList,
      sincronizados: upserted,
      mensaje: `Sincronizados ${upserted.length} puntos de venta desde AFIP`,
    })
  } catch (error) {
    console.error("POST puntos-venta AFIP:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al sincronizar puntos de venta",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { prisma } from "@/lib/prisma"
import { listSistemaLogs } from "@/lib/ops/sistema-log"
import { getTenantHealth } from "@/lib/ops/tenant-lifecycle-service"

export const dynamic = "force-dynamic"

type CertEstado = "OK" | "POR_VENCER" | "VENCIDO" | "NO_CONFIGURADO"

/**
 * GET /api/claver/tenants/[empresaId]/health
 * Diagnóstico en tiempo real para soporte / Claver Cloud.
 * Solo analistas Claver (no canManageUsers de tenant).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params
    const id = Number(empresaId)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
    }

    const ctx = await getClaverAnalystEmpresaContext(request, id)
    if (!ctx.ok) return ctx.response

    const [empresa, mp, caja, health, logs] = await Promise.all([
      prisma.empresa.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          certificadoCRT: true,
          certificadoKEY: true,
          entorno: true,
          entornoAfip: true,
          caeaVigHasta: true,
        },
      }),
      prisma.mercadoPagoConfig.findUnique({
        where: { empresaId: id },
        select: { accessToken: true, activo: true, qrHabilitado: true },
      }),
      prisma.caja.findFirst({
        where: { empresaId: id, estado: "abierta" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fecha: true,
          abiertoPor: true,
          turno: true,
        },
      }),
      getTenantHealth(id),
      listSistemaLogs(id, 5),
    ])

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const tieneCertificado = Boolean(empresa.certificadoCRT && empresa.certificadoKEY)
    let diasParaVencimiento = 0
    let estadoCertificado: CertEstado = "NO_CONFIGURADO"

    if (tieneCertificado) {
      // No hay fecha de cert en schema; usamos CAEA vig como proxy si existe, sino OK
      if (empresa.caeaVigHasta) {
        const ms = empresa.caeaVigHasta.getTime() - Date.now()
        diasParaVencimiento = Math.ceil(ms / (24 * 3600_000))
        if (diasParaVencimiento < 0) estadoCertificado = "VENCIDO"
        else if (diasParaVencimiento <= 30) estadoCertificado = "POR_VENCER"
        else estadoCertificado = "OK"
      } else {
        estadoCertificado = "OK"
        diasParaVencimiento = 365
      }
    }

    let operadorActual: string | undefined
    if (caja?.abiertoPor) {
      const user = await prisma.usuario.findUnique({
        where: { id: caja.abiertoPor },
        select: { nombre: true, email: true },
      })
      operadorActual = user?.nombre ?? user?.email ?? undefined
    }

    const erroresRecientes = (logs as Array<{
      id?: number
      severidad?: string
      mensaje?: string
      contexto?: string
      createdAt?: Date
    }>)
      .filter((l) => l.severidad === "error" || l.severidad === "fatal" || l.severidad === "warn")
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        severidad: l.severidad,
        mensaje: l.mensaje,
        contexto: l.contexto,
        createdAt: l.createdAt,
      }))

    return NextResponse.json({
      empresaId: id,
      empresaNombre: empresa.nombre,
      health,
      afipStatus: {
        tieneCertificado,
        diasParaVencimiento,
        estadoCertificado,
        entorno: empresa.entornoAfip ?? empresa.entorno,
      },
      mercadopagoStatus: {
        tokenConfigurado: Boolean(mp?.accessToken),
        tokenValido: Boolean(mp?.accessToken && mp.activo),
        qrHabilitado: mp?.qrHabilitado ?? false,
      },
      cajaStatus: {
        cajaAbierta: Boolean(caja),
        ultimaApertura: caja?.fecha ?? null,
        operadorActual,
        turno: caja?.turno ?? null,
      },
      erroresRecientes,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    console.error("[GET /api/claver/tenants/:id/health]", error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

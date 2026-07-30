import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    // Buscar OTs de fumigación (activas y entregadas/listas)
    // Para simplificar, buscamos las que tengan metadata con fechaVencimientoCertificado
    const ots = await prisma.ordenServicio.findMany({
      where: {
        empresaId: auth.auth.empresaId,
        activo: true,
        estado: { in: ["LISTO", "ENTREGADO"] }
      },
      include: {
        cliente: { select: { nombre: true, telefono: true } }
      },
      orderBy: { fechaCreacion: 'desc' },
      take: 500 // Buscar en el último lote
    })

    const alertas = []
    const hoy = new Date()
    const limiteFuturo = new Date()
    limiteFuturo.setDate(limiteFuturo.getDate() + 30) // Próximos 30 días

    for (const ot of ots) {
      if (ot.metadata && typeof ot.metadata === "object") {
        const meta = ot.metadata as Record<string, any>
        if (meta.fechaVencimientoCertificado) {
          const vencimiento = new Date(meta.fechaVencimientoCertificado)
          
          if (!isNaN(vencimiento.getTime())) {
            // Verificar si vence en los próximos 30 días o si ya venció (hace menos de 60 días para no mostrar viejos)
            const limitePasado = new Date()
            limitePasado.setDate(limitePasado.getDate() - 60)

            if (vencimiento >= limitePasado && vencimiento <= limiteFuturo) {
              const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
              
              alertas.push({
                otId: ot.id,
                numero: ot.numero,
                clienteId: ot.clienteId,
                clienteNombre: ot.cliente.nombre,
                telefono: ot.cliente.telefono,
                fechaVencimiento: meta.fechaVencimientoCertificado,
                diasParaVencer,
                plaga: meta.plaga || "Fumigación"
              })
            }
          }
        }
      }
    }

    // Ordenar por fecha de vencimiento (los que vencen antes primero)
    alertas.sort((a, b) => a.diasParaVencer - b.diasParaVencer)

    return NextResponse.json({ alertas: alertas.slice(0, 50) })
  } catch (error) {
    console.error("[GET /api/fumigacion/alertas]", error)
    return NextResponse.json(
      { error: "Error al obtener alertas de fumigación" },
      { status: 500 }
    )
  }
}

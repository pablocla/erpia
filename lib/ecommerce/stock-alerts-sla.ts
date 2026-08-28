import { prisma } from "@/lib/prisma"

/**
 * P3: SLA de sync y alertas automáticas de desfase de stock.
 * Verifica si hay logs de sincronización con fallos repetidos o si hace más de X horas
 * que no hay un sync exitoso para integraciones activas, y crea una TareaPendiente para el usuario.
 */
export async function checkEcommerceStockSLA() {
  const horasSLA = 24

  // Buscar conexiones activas de mercadolibre, tienda_nube, shopify
  const conexiones = await prisma.conexionIntegracion.findMany({
    where: {
      integracionId: { in: ["mercado_libre", "tienda_nube", "shopify"] },
      activo: true,
      estado: "conectado",
    },
    include: {
      empresa: true,
    },
  })

  let alertasGeneradas = 0

  for (const cx of conexiones) {
    const umbralSLA = new Date(Date.now() - horasSLA * 60 * 60 * 1000)

    // Buscar si hay algún sync exitoso de stock reciente
    const recentSyncOk = await prisma.integracionSyncLog.findFirst({
      where: {
        conexionId: cx.id,
        entidad: "stock",
        estado: "ok",
        createdAt: { gte: umbralSLA },
      },
    })

    // Buscar si hay errores recientes (últimas 24hs)
    const erroresRecientes = await prisma.integracionSyncLog.count({
      where: {
        conexionId: cx.id,
        entidad: "stock",
        estado: "error",
        createdAt: { gte: umbralSLA },
      },
    })

    if (!recentSyncOk || erroresRecientes > 5) {
      // Buscar usuario admin/dueño para asignar la tarea
      const usuarioAdmin = await prisma.usuario.findFirst({
        where: { empresaId: cx.empresaId, activo: true },
        select: { id: true },
      })

      if (!usuarioAdmin) continue

      // Verificamos si ya hay una tarea pendiente abierta para evitar spam
      const alertaExistente = await prisma.tareaPendiente.findFirst({
        where: {
          empresaId: cx.empresaId,
          titulo: { contains: `Alerta SLA Sync: ${cx.integracionId}` },
          completada: false,
        },
      })

      if (!alertaExistente) {
        await prisma.tareaPendiente.create({
          data: {
            empresaId: cx.empresaId,
            usuarioId: usuarioAdmin.id,
            titulo: `Alerta SLA Sync: ${cx.integracionId}`,
            descripcion: !recentSyncOk
              ? `Hace más de ${horasSLA} horas que no hay un sync de stock exitoso con ${cx.integracionId}.`
              : `Se detectaron ${erroresRecientes} errores al sincronizar stock con ${cx.integracionId} en las últimas 24 horas.`,
            completada: false,
            prioridad: "alta",
            origen: "system",
          },
        })
        alertasGeneradas++
      }
    }
  }

  return {
    ok: true,
    alertasGeneradas,
    revisadas: conexiones.length
  }
}

/**
 * #19 Botón de pánico silencioso — alerta WA/SMS vía cola interna.
 */
import { prisma } from "@/lib/prisma"
import { getAlmacenRosarioConfig } from "./config"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

export async function dispararAlertaPanico(input: {
  empresaId: number
  usuarioId?: number
  usuarioNombre?: string
  lat?: number
  lng?: number
}) {
  const [empresa, config] = await Promise.all([
    prisma.empresa.findUnique({
      where: { id: input.empresaId },
      select: { nombre: true, direccion: true, telefono: true },
    }),
    getAlmacenRosarioConfig(input.empresaId),
  ])

  const geo =
    input.lat != null && input.lng != null
      ? `https://maps.google.com/?q=${input.lat},${input.lng}`
      : empresa?.direccion ?? "Sin ubicación"

  const mensaje = [
    config.panico.mensaje,
    `Local: ${empresa?.nombre ?? "Comercio"}`,
    input.usuarioNombre ? `Operador: ${input.usuarioNombre}` : null,
    `Ubicación: ${geo}`,
    `Hora: ${new Date().toLocaleString("es-AR")}`,
  ]
    .filter(Boolean)
    .join("\n")

  const telefonos = config.panico.telefonos.filter((t) => t.replace(/\D/g, "").length >= 8)

  for (const tel of telefonos) {
    await prisma.mensajePendienteWhatsApp.create({
      data: {
        empresaId: input.empresaId,
        destinatario: "Vecinos / monitoreo",
        telefono: tel,
        mensaje,
        tipo: "alerta_panico",
        prioridad: 10,
        estado: "pendiente",
      },
    })
  }

  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "critical",
    categoria: "panico_vecinal",
    contexto: "almacen-rosario",
    mensaje: "Botón de pánico activado",
    metadata: { usuarioId: input.usuarioId, geo, telefonos: telefonos.length },
  })

  return { ok: true, encolados: telefonos.length, mensaje }
}
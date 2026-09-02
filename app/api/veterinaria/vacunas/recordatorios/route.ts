import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/veterinaria/vacunas/recordatorios
 * Genera el mensaje y enlace de WhatsApp para recordar una vacuna o control de la mascota.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { pacienteId, tipoVacuna, fechaSugerida } = await request.json()
    if (!pacienteId) {
      return NextResponse.json({ error: "pacienteId es obligatorio" }, { status: 400 })
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: Number(pacienteId) },
      include: {
        cliente: { select: { nombre: true, telefono: true, empresaId: true } },
      },
    })

    if (!paciente || paciente.cliente.empresaId !== auth.auth.empresaId) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    const nombreTutor = paciente.cliente.nombre || "Tutor"
    const nombreMascota = paciente.nombre
    const vacuna = tipoVacuna || "la próxima vacuna / desparasitación"
    const fecha = fechaSugerida ? `el ${new Date(fechaSugerida).toLocaleDateString("es-AR")}` : "estos días"

    const textoWhatsApp = `Hola ${nombreTutor}! 🐾
Te escribimos de la veterinaria para recordarte que a *${nombreMascota}* le toca aplicarse *${vacuna}* (${fecha}). 💉🐶

Cuidar su calendario sanitario al día previene enfermedades y lo mantiene protegido.
¿Querés que te reservemos un turno para esta semana? Respondé este mensaje con el horario que te quede más cómodo.

¡Muchas gracias!`

    const telefonoLimpio = (paciente.cliente.telefono || "").replace(/[^0-9]/g, "")
    const linkWhatsApp = telefonoLimpio
      ? `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(textoWhatsApp)}`
      : `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`

    return NextResponse.json({
      ok: true,
      textoWhatsApp,
      linkWhatsApp,
      tutor: nombreTutor,
      mascota: nombreMascota,
      telefono: paciente.cliente.telefono,
    })
  } catch (error) {
    console.error("[POST /api/veterinaria/vacunas/recordatorios] Error:", error)
    return NextResponse.json({ error: "Error generando recordatorio de vacuna" }, { status: 500 })
  }
}

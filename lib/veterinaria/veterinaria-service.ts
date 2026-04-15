/**
 * Veterinaria Service — Clinical records for animal patients
 */

import { prisma } from "@/lib/prisma"
import { historiaClinicaService } from "@/lib/historia-clinica/historia-clinica-service"

export class VeterinariaService {
  // Delegates patient management to HistoriaClinicaService
  listarPacientes = historiaClinicaService.listarPacientes.bind(historiaClinicaService)
  obtenerPaciente = historiaClinicaService.obtenerPaciente.bind(historiaClinicaService)
  crearPaciente = historiaClinicaService.crearPaciente.bind(historiaClinicaService)
  actualizarPaciente = historiaClinicaService.actualizarPaciente.bind(historiaClinicaService)
  registrarConsulta = historiaClinicaService.registrarConsulta.bind(historiaClinicaService)

  async listarVacunas(pacienteId: number) {
    return prisma.consulta.findMany({
      where: {
        pacienteId,
        motivo: { contains: "vacun", mode: "insensitive" },
      },
      orderBy: { fecha: "desc" },
    })
  }

  async proximosControles(empresaId: number, dias = 7) {
    const desde = new Date()
    const hasta = new Date()
    hasta.setDate(hasta.getDate() + dias)

    return prisma.consulta.findMany({
      where: {
        paciente: { cliente: { empresaId } },
        proximaVisita: { gte: desde, lte: hasta },
      },
      include: {
        paciente: {
          include: { cliente: { select: { id: true, nombre: true, telefono: true } } },
        },
      },
      orderBy: { proximaVisita: "asc" },
    })
  }
}

export const veterinariaService = new VeterinariaService()

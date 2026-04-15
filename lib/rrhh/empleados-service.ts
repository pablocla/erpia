/**
 * Empleados / Legajos RRHH Service
 *
 * CRUD de empleados con datos legales, laborales, ART, obra social, sindicato.
 * No incluye liquidación de sueldos (demasiado complejo para este scope),
 * pero cubre el ABM completo del legajo.
 */

import { prisma } from "@/lib/prisma"

export interface CrearEmpleadoInput {
  empresaId: number
  nombre: string
  cuil: string
  dni?: string
  fechaNacimiento?: Date
  domicilio?: string
  localidad?: string
  provincia?: string
  codigoPostal?: string
  telefono?: string
  email?: string
  fechaIngreso: Date
  cargo?: string
  departamento?: string
  categoriaConvenio?: string
  convenioCCT?: string
  modalidad?: string
  tipoJornada?: string
  sueldoBruto?: number
  cbu?: string
  art?: string
  obraSocial?: string
  nroAfiliadoOS?: string
  sindicato?: string
  nroAfiliadoSind?: string
  observaciones?: string
  usuarioId?: number
}

// Validar CUIL formato XX-XXXXXXXX-X
function validarCUIL(cuil: string): boolean {
  return /^\d{2}-\d{8}-\d{1}$/.test(cuil)
}

export async function crearEmpleado(input: CrearEmpleadoInput) {
  if (!validarCUIL(input.cuil)) {
    throw new Error("CUIL inválido. Formato esperado: XX-XXXXXXXX-X")
  }

  return prisma.empleado.create({
    data: {
      nombre: input.nombre,
      cuil: input.cuil,
      dni: input.dni,
      fechaNacimiento: input.fechaNacimiento,
      domicilio: input.domicilio,
      localidad: input.localidad,
      provincia: input.provincia,
      codigoPostal: input.codigoPostal,
      telefono: input.telefono,
      email: input.email,
      fechaIngreso: input.fechaIngreso,
      cargo: input.cargo,
      departamento: input.departamento,
      categoriaConvenio: input.categoriaConvenio,
      convenioCCT: input.convenioCCT,
      modalidad: input.modalidad ?? "relacion_dependencia",
      tipoJornada: input.tipoJornada ?? "completa",
      sueldoBruto: input.sueldoBruto,
      cbu: input.cbu,
      art: input.art,
      obraSocial: input.obraSocial,
      nroAfiliadoOS: input.nroAfiliadoOS,
      sindicato: input.sindicato,
      nroAfiliadoSind: input.nroAfiliadoSind,
      observaciones: input.observaciones,
      usuarioId: input.usuarioId,
      empresaId: input.empresaId,
    },
  })
}

export async function actualizarEmpleado(
  empresaId: number,
  empleadoId: number,
  data: Partial<Omit<CrearEmpleadoInput, "empresaId">>,
) {
  if (data.cuil && !validarCUIL(data.cuil)) {
    throw new Error("CUIL inválido. Formato esperado: XX-XXXXXXXX-X")
  }

  return prisma.empleado.update({
    where: { id: empleadoId },
    data,
  })
}

export async function listarEmpleados(
  empresaId: number,
  filtros?: { estado?: string; departamento?: string; busqueda?: string },
) {
  return prisma.empleado.findMany({
    where: {
      empresaId,
      ...(filtros?.estado ? { estado: filtros.estado } : {}),
      ...(filtros?.departamento ? { departamento: filtros.departamento } : {}),
      ...(filtros?.busqueda
        ? {
            OR: [
              { nombre: { contains: filtros.busqueda, mode: "insensitive" as const } },
              { cuil: { contains: filtros.busqueda } },
              { dni: { contains: filtros.busqueda } },
            ],
          }
        : {}),
    },
    orderBy: { nombre: "asc" },
  })
}

export async function obtenerEmpleado(empresaId: number, empleadoId: number) {
  return prisma.empleado.findFirst({
    where: { id: empleadoId, empresaId },
  })
}

export async function darBajaEmpleado(empresaId: number, empleadoId: number, fechaEgreso: Date) {
  return prisma.empleado.update({
    where: { id: empleadoId },
    data: { estado: "baja", fechaEgreso },
  })
}

export async function resumenEmpleados(empresaId: number) {
  const [activos, licencia, baja] = await Promise.all([
    prisma.empleado.count({ where: { empresaId, estado: "activo" } }),
    prisma.empleado.count({ where: { empresaId, estado: "licencia" } }),
    prisma.empleado.count({ where: { empresaId, estado: "baja" } }),
  ])

  const porDepartamento = await prisma.empleado.groupBy({
    by: ["departamento"],
    where: { empresaId, estado: "activo" },
    _count: true,
  })

  return {
    activos,
    licencia,
    baja,
    total: activos + licencia + baja,
    porDepartamento: porDepartamento.map((d) => ({
      departamento: d.departamento ?? "Sin asignar",
      cantidad: d._count,
    })),
  }
}

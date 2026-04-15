import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearEmpleado,
  actualizarEmpleado,
  listarEmpleados,
  obtenerEmpleado,
  darBajaEmpleado,
  resumenEmpleados,
} from "@/lib/rrhh/empleados-service"

export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const { searchParams } = new URL(request.url)
  const vista = searchParams.get("vista")
  const id = searchParams.get("id")

  if (vista === "resumen") {
    const resumen = await resumenEmpleados(empresaId)
    return NextResponse.json(resumen)
  }

  if (id) {
    const empleado = await obtenerEmpleado(empresaId, Number(id))
    if (!empleado) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json(empleado)
  }

  const empleados = await listarEmpleados(empresaId, {
    estado: searchParams.get("estado") ?? undefined,
    departamento: searchParams.get("departamento") ?? undefined,
    busqueda: searchParams.get("q") ?? undefined,
  })
  return NextResponse.json(empleados)
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const body = await request.json()

  if (body.accion === "baja") {
    const result = await darBajaEmpleado(empresaId, body.empleadoId, new Date(body.fechaEgreso))
    return NextResponse.json(result)
  }

  const empleado = await crearEmpleado({
    empresaId,
    nombre: body.nombre,
    cuil: body.cuil,
    dni: body.dni,
    fechaNacimiento: body.fechaNacimiento ? new Date(body.fechaNacimiento) : undefined,
    domicilio: body.domicilio,
    localidad: body.localidad,
    provincia: body.provincia,
    codigoPostal: body.codigoPostal,
    telefono: body.telefono,
    email: body.email,
    fechaIngreso: new Date(body.fechaIngreso),
    cargo: body.cargo,
    departamento: body.departamento,
    categoriaConvenio: body.categoriaConvenio,
    convenioCCT: body.convenioCCT,
    modalidad: body.modalidad,
    tipoJornada: body.tipoJornada,
    sueldoBruto: body.sueldoBruto,
    cbu: body.cbu,
    art: body.art,
    obraSocial: body.obraSocial,
    nroAfiliadoOS: body.nroAfiliadoOS,
    sindicato: body.sindicato,
    nroAfiliadoSind: body.nroAfiliadoSind,
    observaciones: body.observaciones,
  })
  return NextResponse.json(empleado, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response

  const body = await request.json()
  const { id, ...data } = body

  const updated = await actualizarEmpleado(authResult.auth.empresaId, id, data)
  return NextResponse.json(updated)
}

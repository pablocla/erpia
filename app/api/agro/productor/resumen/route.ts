import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const proveedorId = Number(searchParams.get("proveedorId") ?? 0)
  if (!proveedorId) {
    return NextResponse.json({ error: "proveedorId es requerido" }, { status: 400 })
  }

  const proveedor = await prisma.proveedor.findFirst({
    where: { id: proveedorId, ...whereEmpresa(auth.auth.empresaId) },
    select: { id: true, nombre: true, cuit: true },
  })

  if (!proveedor) {
    return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
  }

  const [
    contratos,
    liquidaciones,
    tickets,
  ] = await Promise.all([
    prisma.agroContrato.findMany({
      where: { ...whereEmpresa(auth.auth.empresaId), proveedorId },
      include: { grano: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.agroLiquidacion.findMany({
      where: { ...whereEmpresa(auth.auth.empresaId), proveedorId },
      orderBy: { fechaEmision: "desc" },
      take: 10,
    }),
    prisma.agroTicketBalanza.findMany({
      where: { ...whereEmpresa(auth.auth.empresaId), proveedorId, estado: "confirmado" },
      include: { grano: true },
      orderBy: { fecha: "desc" },
      take: 20,
    }),
  ])

  const saldoTn = tickets.reduce((sum, t) => {
    const delta = (t.tipo === "entrada" ? 1 : -1) * (t.pesoNeto / 1000)
    return sum + delta
  }, 0)

  const pendientes = liquidaciones.filter((l) => l.estado === "pendiente")
  const pendientesMonto = pendientes.reduce((sum, l) => sum + Number(l.importeNeto), 0)

  return NextResponse.json({
    proveedor,
    resumen: {
      saldoTn: Number(saldoTn.toFixed(3)),
      contratosActivos: contratos.filter((c) => c.estado === "abierto" || c.estado === "parcial").length,
      liquidacionesPendientes: pendientes.length,
      montoPendiente: Number(pendientesMonto.toFixed(2)),
    },
    contratos,
    liquidaciones,
    tickets,
  })
}

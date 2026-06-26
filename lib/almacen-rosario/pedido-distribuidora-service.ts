/**
 * Pedido rápido al distribuidor desde urgencias de reposición.
 */
import { prisma } from "@/lib/prisma"
import { generarPropuestasReposicion } from "@/lib/marketplace/reponedor-jit-service"

export async function crearPedidoDistribuidoraRapido(
  empresaId: number,
  opts?: { maxLineas?: number; soloUrgenciaAlta?: boolean },
) {
  const maxLineas = opts?.maxLineas ?? 15
  const propuestas = await generarPropuestasReposicion(empresaId, 30)
  const filtradas = propuestas
    .filter((p) => (opts?.soloUrgenciaAlta !== false ? p.urgencia === "alta" : true))
    .slice(0, maxLineas)

  if (filtradas.length === 0) {
    return { ordenCompraId: null, numero: null, lineas: 0, mensaje: "Sin urgencias de reposición" }
  }

  const proveedor = await prisma.proveedor.findFirst({
    where: { empresaId, activo: true, deletedAt: null },
    orderBy: { nombre: "asc" },
  })
  if (!proveedor) throw new Error("Configurá al menos un proveedor/distribuidora")

  const ultima = await prisma.ordenCompra.findFirst({
    where: { empresaId },
    orderBy: { numero: "desc" },
  })
  const numero = (parseInt(ultima?.numero ?? "0", 10) + 1).toString().padStart(8, "0")

  const productos = await prisma.producto.findMany({
    where: { id: { in: filtradas.map((f) => f.productoId) } },
    select: { id: true, precioCompra: true },
  })
  const precioMap = Object.fromEntries(productos.map((p) => [p.id, Number(p.precioCompra)]))

  const lineasData = filtradas.map((f, idx) => {
    const precio = precioMap[f.productoId] ?? 0
    return {
      productoId: f.productoId,
      descripcion: f.nombre,
      cantidad: f.cantidadSugerida,
      precioUnitario: precio,
      subtotal: f.cantidadSugerida * precio,
      orden: idx + 1,
    }
  })
  const subtotal = lineasData.reduce((s, l) => s + l.subtotal, 0)
  const impuestos = subtotal * 0.21
  const total = subtotal + impuestos

  const oc = await prisma.ordenCompra.create({
    data: {
      empresaId,
      proveedorId: proveedor.id,
      numero,
      fechaEmision: new Date(),
      subtotal,
      impuestos,
      total,
      estado: "borrador",
      observaciones: "Pedido rápido Almacén Rosario — urgencias JIT",
      lineas: { create: lineasData },
    },
    include: { lineas: true },
  })

  return {
    ordenCompraId: oc.id,
    numero: oc.numero,
    proveedor: proveedor.nombre,
    lineas: oc.lineas.length,
    productos: filtradas.map((f) => ({ nombre: f.nombre, cantidad: f.cantidadSugerida })),
  }
}
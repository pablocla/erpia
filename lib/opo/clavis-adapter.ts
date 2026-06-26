import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"
import type {
  OpoCanonicalEntity,
  OpoDiscoveryManifest,
  OpoEntityMapping,
  OpoQueryInput,
} from "./types"

export const CLAVIS_ENTITY_MAPPINGS: OpoEntityMapping[] = [
  { canonical: "opo:Customer", nativeReference: "Cliente", confidence: 1 },
  { canonical: "opo:Product", nativeReference: "Producto", confidence: 1 },
  { canonical: "opo:Invoice", nativeReference: "Factura", confidence: 1 },
  { canonical: "opo:Order", nativeReference: "PedidoVenta", confidence: 0.9 },
  { canonical: "opo:Supplier", nativeReference: "Proveedor", confidence: 0.95 },
]

export function buildClavisDiscoveryManifest(
  baseUrl: string,
  organizationName: string,
): OpoDiscoveryManifest {
  return {
    opo_version: "0.1.0",
    system_identity: {
      erp_name: "Clavis ERP",
      version: "2026.1",
      jurisdictions: ["AR"],
      organization_name: organizationName,
    },
    adapter_configuration: {
      base_url: baseUrl,
      authentication_type: "JWT",
      protocol_interface: "REST",
    },
    discovery: {
      context_url: `${baseUrl}/opo-context.jsonld`,
      registry_url: `${baseUrl}/opo-registry.json`,
    },
    endpoints: {
      "opo:Customer": { path: "/api/opo/entities/Customer", methods: ["GET"] },
      "opo:Supplier": { path: "/api/opo/entities/Supplier", methods: ["GET"] },
      "opo:Invoice": { path: "/api/opo/entities/Invoice", methods: ["GET"] },
      "opo:Product": { path: "/api/opo/entities/Product", methods: ["GET"] },
      "opo:Order": { path: "/api/opo/entities/Order", methods: ["GET"] },
    },
    supported_entities: CLAVIS_ENTITY_MAPPINGS,
  }
}

function mapCliente(c: {
  id: number
  nombre: string
  nombreFantasia: string | null
  cuit: string | null
  saldoCuentaCorriente: { toString(): string }
  codigo: string | null
}) {
  return {
    id: String(c.id),
    partyId: c.cuit ?? undefined,
    tradeName: c.nombreFantasia ?? c.nombre,
    legalName: c.nombre,
    outstandingBalance: Number(c.saldoCuentaCorriente),
    code: c.codigo ?? undefined,
    nativeTable: "Cliente",
  }
}

function mapProducto(p: {
  id: number
  codigo: string
  nombre: string
  precioVenta: { toString(): string }
  stock: number
}) {
  return {
    id: String(p.id),
    sku: p.codigo,
    name: p.nombre,
    unitPrice: Number(p.precioVenta),
    stock: p.stock,
    nativeTable: "Producto",
  }
}

function mapFactura(f: {
  id: number
  numero: number
  puntoVenta: number
  total: { toString(): string }
  createdAt: Date
  estado: string
  clienteId: number
}) {
  const pv = String(f.puntoVenta).padStart(4, "0")
  const num = String(f.numero).padStart(8, "0")
  return {
    id: `${pv}-${num}`,
    number: num,
    series: pv,
    issueDate: f.createdAt.toISOString().slice(0, 10),
    grandTotal: Number(f.total),
    customerId: String(f.clienteId),
    status: f.estado,
    nativeTable: "Factura",
  }
}

export async function queryClavisEntity(empresaId: number, input: OpoQueryInput) {
  const limit = Math.min(input.limit ?? 10, 50)
  const search = input.search?.trim()

  switch (input.entity) {
    case "Customer": {
      const rows = await prisma.cliente.findMany({
        where: whereEmpresa(empresaId, {
          deletedAt: null,
          ...(search
            ? {
                OR: [
                  { nombre: { contains: search, mode: "insensitive" as const } },
                  { cuit: { contains: search } },
                ],
              }
            : {}),
        }),
        take: limit,
        orderBy: { id: "desc" },
        select: {
          id: true,
          nombre: true,
          nombreFantasia: true,
          cuit: true,
          saldoCuentaCorriente: true,
          codigo: true,
        },
      })
      return { entity: "Customer", source: "clavis_db", count: rows.length, data: rows.map(mapCliente) }
    }
    case "Product": {
      const rows = await prisma.producto.findMany({
        where: whereEmpresa(empresaId, {
          deletedAt: null,
          ...(search
            ? {
                OR: [
                  { nombre: { contains: search, mode: "insensitive" as const } },
                  { codigo: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        }),
        take: limit,
        orderBy: { id: "desc" },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          precioVenta: true,
          stock: true,
        },
      })
      return { entity: "Product", source: "clavis_db", count: rows.length, data: rows.map(mapProducto) }
    }
    case "Invoice": {
      const rows = await prisma.factura.findMany({
        where: whereEmpresa(empresaId, {
          deletedAt: null,
          ...(search ? { estado: { contains: search, mode: "insensitive" as const } } : {}),
        }),
        take: limit,
        orderBy: { id: "desc" },
        select: {
          id: true,
          numero: true,
          puntoVenta: true,
          total: true,
          createdAt: true,
          estado: true,
          clienteId: true,
        },
      })
      return { entity: "Invoice", source: "clavis_db", count: rows.length, data: rows.map(mapFactura) }
    }
    case "Supplier": {
      const rows = await prisma.proveedor.findMany({
        where: whereEmpresa(empresaId, {
          deletedAt: null,
          ...(search
            ? { nombre: { contains: search, mode: "insensitive" as const } }
            : {}),
        }),
        take: limit,
        orderBy: { id: "desc" },
        select: { id: true, nombre: true, cuit: true },
      })
      return {
        entity: "Supplier",
        source: "clavis_db",
        count: rows.length,
        data: rows.map((p) => ({
          id: String(p.id),
          legalName: p.nombre,
          partyId: p.cuit ?? undefined,
          nativeTable: "Proveedor",
        })),
      }
    }
    case "Order": {
      const rows = await prisma.pedidoVenta.findMany({
        where: whereEmpresa(empresaId),
        take: limit,
        orderBy: { id: "desc" },
        select: { id: true, numero: true, estado: true, total: true, createdAt: true },
      })
      return {
        entity: "Order",
        source: "clavis_db",
        count: rows.length,
        data: rows.map((o) => ({
          id: String(o.id),
          number: String(o.numero),
          status: o.estado,
          grandTotal: Number(o.total),
          issueDate: o.createdAt.toISOString().slice(0, 10),
          nativeTable: "PedidoVenta",
        })),
      }
    }
    default:
      throw new Error(`Entidad no soportada: ${input.entity satisfies never}`)
  }
}
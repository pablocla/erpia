/**
 * Validaciones de pertenencia multi-tenant — usar antes de operar por ID.
 */

import { prisma } from "@/lib/prisma"

export class TenantViolationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TenantViolationError"
  }
}

export async function assertClienteEmpresa(clienteId: number, empresaId: number) {
  const row = await prisma.cliente.findFirst({ where: { id: clienteId, empresaId } })
  if (!row) throw new TenantViolationError("Cliente no encontrado")
  return row
}

export async function assertProveedorEmpresa(proveedorId: number, empresaId: number) {
  const row = await prisma.proveedor.findFirst({ where: { id: proveedorId, empresaId } })
  if (!row) throw new TenantViolationError("Proveedor no encontrado")
  return row
}

export async function assertProductoEmpresa(productoId: number, empresaId: number) {
  const row = await prisma.producto.findFirst({ where: { id: productoId, empresaId } })
  if (!row) throw new TenantViolationError("Producto no encontrado")
  return row
}

export async function assertDepositoEmpresa(depositoId: number, empresaId: number) {
  const row = await prisma.deposito.findFirst({ where: { id: depositoId, empresaId } })
  if (!row) throw new TenantViolationError("Depósito no encontrado")
  return row
}

export async function assertCajaEmpresa(cajaId: number, empresaId: number) {
  const row = await prisma.caja.findFirst({ where: { id: cajaId, empresaId } })
  if (!row) throw new TenantViolationError("Caja no encontrada")
  return row
}

export async function assertOrdenCompraEmpresa(ordenCompraId: number, empresaId: number) {
  const row = await prisma.ordenCompra.findFirst({ where: { id: ordenCompraId, empresaId } })
  if (!row) throw new TenantViolationError("Orden de compra no encontrada")
  return row
}

export async function assertPresupuestoGastoEmpresa(presupuestoId: number, empresaId: number) {
  const row = await prisma.presupuestoGasto.findFirst({ where: { id: presupuestoId, empresaId } })
  if (!row) throw new TenantViolationError("Presupuesto no encontrado")
  return row
}

export async function assertCuentaBancoEmpresa(cuentaId: number, empresaId: number) {
  const row = await prisma.cuentaBancaria.findFirst({
    where: {
      id: cuentaId,
      OR: [
        { empresaId },
        { cliente: { empresaId } },
        { proveedor: { empresaId } },
      ],
    },
  })
  if (!row) throw new TenantViolationError("Cuenta bancaria no encontrada")
  return row
}

/** Filtro OR estándar para cheques por empresa */
export function chequeEmpresaWhere(empresaId: number) {
  return {
    OR: [
      { cliente: { empresaId } },
      { proveedor: { empresaId } },
      { cuentaDeposito: { empresaId } },
      { cuentaEmisor: { empresaId } },
      { recibo: { cliente: { empresaId } } },
      { ordenPago: { proveedor: { empresaId } } },
    ],
  }
}
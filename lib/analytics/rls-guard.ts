import { Prisma } from "@prisma/client";

export type RoleContext = {
  empresaId: number;
  rol: string;
  usuarioId: number;
  sucursalId?: number; // Only for gerente_sucursal
  vendedorId?: number; // Only for vendedor
};

/**
 * Builds a Prisma `where` object for the `Factura` model based on RLS rules.
 */
export function rlsFacturas(ctx: RoleContext): Prisma.FacturaWhereInput {
  const baseWhere: Prisma.FacturaWhereInput = {
    empresaId: ctx.empresaId,
    deletedAt: null,
  };

  if (ctx.rol === "vendedor") {
    if (!ctx.vendedorId) {
      // If a seller has no vendedorId linked, they see nothing
      return { ...baseWhere, id: -1 }; 
    }
    return {
      ...baseWhere,
      vendedorId: ctx.vendedorId,
    };
  }

  if (ctx.rol === "gerente_sucursal") {
    if (!ctx.sucursalId) return { ...baseWhere, id: -1 };
    // TODO: Implement PV mapping.
  }

  // Dueño / Administrador / Contador -> Sees everything in the empresa
  return baseWhere;
}

/**
 * Builds a Prisma `where` object for the `Cliente` model based on RLS rules.
 */
export function rlsClientes(ctx: RoleContext): Prisma.ClienteWhereInput {
  const baseWhere: Prisma.ClienteWhereInput = {
    empresaId: ctx.empresaId,
    deletedAt: null,
  };

  if (ctx.rol === "vendedor") {
    if (!ctx.vendedorId) return { ...baseWhere, id: -1 };
    return {
      ...baseWhere,
      vendedorId: ctx.vendedorId,
    };
  }

  return baseWhere;
}

/**
 * Checks if the user has access to sensitive cost data (precioCompra, historicos).
 */
export function canViewCosts(ctx: RoleContext): boolean {
  if (ctx.rol === "vendedor") return false;
  return true;
}

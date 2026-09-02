import { NextRequest, NextResponse } from "next/server";
import { getAgentContext, requirePermiso } from "@/lib/agents/agent-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await getAgentContext(req);
  if (!auth.ok) return auth.response;

  const permError = requirePermiso(auth.permisos, "READ_STOCK");
  if (permError) return permError;

  const productos = await prisma.producto.findMany({
    where: {
      empresaId: auth.empresaId,
      stockMinimo: { gt: 0 }
    }
  });

  const bajoMinimo = productos.filter(p => p.stock < p.stockMinimo);

  return NextResponse.json({ productos: bajoMinimo });
}

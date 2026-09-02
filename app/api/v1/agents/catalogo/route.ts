import { NextRequest, NextResponse } from "next/server";
import { getAgentContext, requirePermiso } from "@/lib/agents/agent-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await getAgentContext(req);
  if (!auth.ok) return auth.response;

  const permError = requirePermiso(auth.permisos, "READ_CATALOGO");
  if (permError) return permError;

  const productos = await prisma.producto.findMany({
    where: {
      empresaId: auth.empresaId,
    },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      precioVenta: true,
      stock: true,
      unidad: true
    },
    take: 100
  });

  return NextResponse.json({ productos });
}

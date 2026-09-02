import { NextRequest, NextResponse } from "next/server";
import { getAgentContext, requirePermiso } from "@/lib/agents/agent-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await getAgentContext(req);
  if (!auth.ok) return auth.response;

  const permError = requirePermiso(auth.permisos, "READ_AFIP");
  if (permError) return permError;

  const facturasSinCAE = await prisma.factura.findMany({
    where: {
      empresaId: auth.empresaId,
      cae: null
    },
    select: {
      id: true,
      tipo: true,
      numero: true,
      puntoVenta: true,
      subtotal: true,
      total: true
    },
    orderBy: { id: "asc" },
    take: 20
  });

  return NextResponse.json({ facturas: facturasSinCAE });
}

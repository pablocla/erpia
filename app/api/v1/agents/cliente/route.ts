import { NextRequest, NextResponse } from "next/server";
import { getAgentContext, requirePermiso } from "@/lib/agents/agent-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await getAgentContext(req);
  if (!auth.ok) return auth.response;

  const permError = requirePermiso(auth.permisos, "READ_CLIENTE");
  if (permError) return permError;

  const telefono = req.nextUrl.searchParams.get("telefono");
  const cuit = req.nextUrl.searchParams.get("cuit");

  if (!telefono && !cuit) {
    return NextResponse.json({ error: "Debe proveer telefono o cuit" }, { status: 400 });
  }

  const clientes = await prisma.cliente.findMany({
    where: {
      empresaId: auth.empresaId,
      OR: [
        ...(telefono ? [{ telefono: { contains: telefono } }] : []),
        ...(telefono ? [{ telefonoAlternativo: { contains: telefono } }] : []),
        ...(cuit ? [{ cuit }] : []),
      ]
    },
    take: 1
  });

  if (clientes.length === 0) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  return NextResponse.json(clientes[0]);
}

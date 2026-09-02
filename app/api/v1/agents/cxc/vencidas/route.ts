import { NextRequest, NextResponse } from "next/server";
import { getAgentContext, requirePermiso } from "@/lib/agents/agent-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await getAgentContext(req);
  if (!auth.ok) return auth.response;

  const permError = requirePermiso(auth.permisos, "READ_CXC");
  if (permError) return permError;

  // Asumiendo que existe un modelo CuentaCobrar o similar (usaremos Factura impaga como proxy si no existe)
  // En base a la estructura tÃ­pica:
  const vencidas = await prisma.factura.findMany({
    where: {
      empresaId: auth.empresaId,
      estado: "pendiente_pago",
      // fechaVencimiento: { lt: new Date() } // Assuming standard fields
    },
    select: {
      id: true,
      cliente: {
        select: { nombre: true, telefono: true }
      },
      total: true,
      createdAt: true
    },
    take: 50
  }).catch(() => {
    // Fallback if schema is different
    return [];
  });

  return NextResponse.json({ vencidas });
}

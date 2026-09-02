import { NextRequest, NextResponse } from "next/server";
import { getAgentContext, requirePermiso } from "@/lib/agents/agent-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await getAgentContext(req);
  if (!auth.ok) return auth.response;

  const permError = requirePermiso(auth.permisos, "READ_CAJA");
  if (permError) return permError;

  const cajasAbiertas = await prisma.caja.findMany({
    where: {
      empresaId: auth.empresaId,
      estado: "abierta"
    },
    orderBy: { createdAt: "desc" },
    take: 1
  });

  if (cajasAbiertas.length === 0) {
    return NextResponse.json({ caja: null, mensaje: "No hay caja abierta" });
  }

  const caja = cajasAbiertas[0];
  const horasAbierta = Math.abs(new Date().getTime() - caja.createdAt.getTime()) / 3600000;

  return NextResponse.json({
    id: caja.id,
    fecha: caja.fecha,
    saldoInicial: caja.saldoInicial,
    horasAbierta
  });
}

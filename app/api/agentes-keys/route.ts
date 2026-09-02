import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/agents/auth";

// TODO: Replace with actual authentication method used in the ERP
async function getSessionEmpresaId() {
  return 1; // Default mock company ID
}

export async function GET(req: NextRequest) {
  const empresaId = await getSessionEmpresaId();

  const keys = await prisma.agentApiKey.findMany({
    where: { empresaId },
    select: { 
      id: true, 
      agentId: true, 
      floorId: true, 
      activa: true, 
      creadaEn: true, 
      ultimoUso: true, 
      permisos: true 
    }
  });
  
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const empresaId = await getSessionEmpresaId();
  const body = await req.json();
  const { agentId, floorId, permisos } = body;

  const { key, hash } = generateApiKey();

  const apiKey = await prisma.agentApiKey.create({
    data: {
      empresaId,
      agentId,
      floorId,
      keyHash: hash,
      permisos: permisos || [],
      activa: true
    }
  });

  // rawKey is returned ONLY ONCE, it is never stored in plaintext
  return NextResponse.json({ ...apiKey, rawKey: key });
}

export async function DELETE(req: NextRequest) {
  const empresaId = await getSessionEmpresaId();
  const id = req.nextUrl.searchParams.get("id");
  
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.agentApiKey.updateMany({
    where: { id, empresaId },
    data: { activa: false }
  });
  
  return NextResponse.json({ success: true });
}

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { key: string; hash: string } {
  const key = crypto.randomBytes(32).toString("hex");
  const hash = hashApiKey(key);
  return { key, hash };
}

export async function verifyAgentKey(apiKey: string, agentId: string, empresaId: number) {
  const hash = hashApiKey(apiKey);
  const record = await prisma.agentApiKey.findUnique({
    where: { keyHash: hash }
  });

  if (!record) return null;
  if (!record.activa) return null;
  if (record.agentId !== agentId) return null;
  if (record.empresaId !== empresaId) return null;

  // Update last used asynchronously
  prisma.agentApiKey.update({
    where: { id: record.id },
    data: { ultimoUso: new Date() }
  }).catch(console.error);

  return record;
}

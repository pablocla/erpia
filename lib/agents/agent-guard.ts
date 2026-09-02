import { NextRequest, NextResponse } from "next/server";
import { verifyAgentKey } from "./auth";
import { checkRateLimit } from "./rate-limiter";

export async function getAgentContext(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const agentId = req.headers.get("x-agent-id");
  const floorId = req.headers.get("x-floor-id");
  const empresaIdRaw = req.headers.get("x-empresa-id");

  if (!authHeader || !agentId || !empresaIdRaw) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized: Missing headers" }, { status: 401 }) };
  }

  const empresaId = parseInt(empresaIdRaw, 10);
  if (isNaN(empresaId)) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized: Invalid x-empresa-id" }, { status: 400 }) };
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();
  if (!apiKey) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 }) };
  }

  // 1. Verify API Key
  const agentKey = await verifyAgentKey(apiKey, agentId, empresaId);
  if (!agentKey) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden: Invalid or inactive agent key" }, { status: 403 }) };
  }

  // 2. Rate Limiting
  const limit = checkRateLimit(empresaId, agentId);
  if (!limit.allowed) {
    return { 
      ok: false as const, 
      response: NextResponse.json({ error: "Too Many Requests" }, { 
        status: 429,
        headers: { "Retry-After": limit.retryAfter?.toString() ?? "60" } 
      }) 
    };
  }

  return { ok: true as const, agentId, floorId, empresaId, permisos: agentKey.permisos };
}

export function requirePermiso(permisos: string[], permiso: string) {
  if (!permisos.includes(permiso)) {
    return NextResponse.json({ error: `Forbidden: Missing required permission: ${permiso}` }, { status: 403 });
  }
  return null;
}

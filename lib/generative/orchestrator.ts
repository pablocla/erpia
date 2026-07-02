import { generativeRegistry } from "./registry";
import { GenerativeResult } from "./types";

export async function runForEmpresa(empresaId: string, sku: string): Promise<GenerativeResult> {
  const executor = generativeRegistry.get(sku);
  
  if (!executor) {
    return { ok: false, error: `No executor found for SKU: ${sku}` };
  }

  try {
    // Validación de idempotencia y entitlement pendiente de PR-3
    return await executor.execute(empresaId);
  } catch (error: any) {
    return { ok: false, error: error.message || "Unknown error executing SKU" };
  }
}

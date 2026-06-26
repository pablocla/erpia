import { NextRequest, NextResponse } from "next/server"

/**
 * Discovery público del protocolo OPO en Clavis.
 * El manifiesto tenant-específico (con datos reales) está en /api/opo/discovery (JWT).
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin

  return NextResponse.json(
    {
      opo_version: "0.1.0",
      system_identity: {
        erp_name: "Clavis by Claver — OPO Bridge",
        version: "0.1.0",
        jurisdictions: ["AR"],
      },
      discovery: {
        tenant_manifest: `${origin}/api/opo/discovery`,
        context_url: `${origin}/opo-context.jsonld`,
        registry_url: `${origin}/opo-registry.json`,
        studio_panel: `${origin}/dashboard/apps/opo`,
      },
      protocol: {
        query_endpoint: `${origin}/api/opo/query`,
        entities_base: `${origin}/api/opo/entities`,
        auth: "Bearer JWT (tenant)",
      },
      canonical_entities: [
        "opo:Customer",
        "opo:Product",
        "opo:Invoice",
        "opo:Order",
        "opo:Supplier",
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-OPO-Version": "0.1.0",
      },
    },
  )
}
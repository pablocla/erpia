import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/empresa-guard";
import { calculateAnalyticsKpis } from "@/lib/analytics/kpi-engine";
import { logReportAccess } from "@/lib/analytics/audit-logger";
import { RoleContext } from "@/lib/analytics/rls-guard";

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const desde = searchParams.get("desde") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const hasta = searchParams.get("hasta") || new Date().toISOString();
  const metodoCosto = (searchParams.get("metodoCosto") as "PPP" | "REPOSICION") || "PPP";

  // Build the strict RLS context
  const ctx: RoleContext = {
    empresaId: auth.auth.empresaId,
    rol: auth.auth.rol,
    usuarioId: auth.auth.usuarioId,
    vendedorId: auth.auth.vendedorId, // Assuming this is in the auth payload if rol == vendedor
    // sucursalId: auth.auth.sucursalId
  };

  try {
    const kpis = await calculateAnalyticsKpis({
      ctx,
      fechaDesde: new Date(desde),
      fechaHasta: new Date(hasta),
      metodoCosto
    });

    // Auditoría
    await logReportAccess({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      rolSnapshot: ctx.rol,
      reporteCodigo: "kpi.dashboard_principal",
      reporteNombre: "Dashboard de KPIs (VNR, MBR, Ticket)",
      reporteCategoria: "kpi",
      clasificacionCritica: "sensible",
      accion: "api_read",
      periodoDesde: new Date(desde),
      periodoHasta: new Date(hasta),
      filtrosJson: { metodoCosto, desde, hasta },
      origenModulo: "dashboard/analytics",
      origenRuta: request.nextUrl.pathname,
      origenTipo: "api",
      userAgent: request.headers.get("user-agent") || undefined,
      exito: true,
      registrosDevueltos: kpis.countTransaccionesComerciales
    });

    return NextResponse.json(kpis);
  } catch (error: any) {
    // Auditoría de fallo
    await logReportAccess({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      rolSnapshot: ctx.rol,
      reporteCodigo: "kpi.dashboard_principal",
      reporteNombre: "Dashboard de KPIs (VNR, MBR, Ticket)",
      reporteCategoria: "kpi",
      clasificacionCritica: "sensible",
      accion: "api_read",
      filtrosJson: { metodoCosto, desde, hasta },
      origenModulo: "dashboard/analytics",
      origenRuta: request.nextUrl.pathname,
      origenTipo: "api",
      exito: false,
      errorCodigo: error.message
    });

    return NextResponse.json({ error: "Error calculando KPIs" }, { status: 500 });
  }
}

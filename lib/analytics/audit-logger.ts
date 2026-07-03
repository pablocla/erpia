import { prisma } from "@/lib/prisma";

export type AuditLogParams = {
  empresaId: number;
  usuarioId: number;
  rolSnapshot: string;
  reporteCodigo: string;
  reporteNombre: string;
  reporteCategoria: string;
  clasificacionCritica: "critico" | "sensible" | "interno";
  accion: "view" | "export" | "print" | "schedule" | "api_read";
  formatoExport?: "csv" | "xlsx" | "pdf" | "txt_afip" | "json";
  periodoDesde?: Date;
  periodoHasta?: Date;
  filtrosJson: any;
  registrosDevueltos?: number;
  origenModulo: string;
  origenRuta: string;
  origenTipo: "ui" | "api" | "scheduled_job" | "bi_embed";
  userAgent?: string;
  ipOrigen?: string;
  sessionId?: string;
  sucursalId?: number;
  duracionMs?: number;
  exito: boolean;
  errorCodigo?: string;
};

/**
 * Logs an access to an auditable report asynchronously.
 */
export async function logReportAccess(params: AuditLogParams) {
  try {
    const filtrosHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(params.filtrosJson)));
    const hashHex = Array.from(new Uint8Array(filtrosHash)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Ensure we run this without awaiting in the critical path if we want,
    // or just await it normally.
    await prisma.reporteAuditoriaAcceso.create({
      data: {
        empresaId: params.empresaId,
        usuarioId: params.usuarioId,
        rolSnapshot: params.rolSnapshot,
        reporteCodigo: params.reporteCodigo,
        reporteNombre: params.reporteNombre,
        reporteCategoria: params.reporteCategoria,
        clasificacionCritica: params.clasificacionCritica,
        accion: params.accion,
        formatoExport: params.formatoExport,
        periodoDesde: params.periodoDesde,
        periodoHasta: params.periodoHasta,
        filtrosJson: params.filtrosJson,
        filtrosHash: hashHex,
        registrosDevueltos: params.registrosDevueltos,
        origenModulo: params.origenModulo,
        origenRuta: params.origenRuta,
        origenTipo: params.origenTipo,
        userAgent: params.userAgent,
        ipOrigen: params.ipOrigen,
        sessionId: params.sessionId,
        sucursalId: params.sucursalId,
        duracionMs: params.duracionMs,
        exito: params.exito,
        errorCodigo: params.errorCodigo,
      },
    });
  } catch (error) {
    console.error("Failed to log audit access:", error);
    // Do not throw, we don't want to break the report generation if logging fails, 
    // unless strict audit mode is enforced.
  }
}

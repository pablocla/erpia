import { prisma } from "@/lib/prisma";
import { RoleContext, rlsFacturas } from "./rls-guard";
import { Prisma } from "@prisma/client";

export type KpiParams = {
  ctx: RoleContext;
  fechaDesde: Date;
  fechaHasta: Date;
  metodoCosto: "PPP" | "REPOSICION";
};

export async function calculateAnalyticsKpis(params: KpiParams) {
  const baseWhere = rlsFacturas(params.ctx);

  // We fetch facturas to compute metrics in memory or via DB aggregations.
  // Given the complexity of the formulas (subtracting NC, adding ND, only certain comprobantes),
  // doing it in memory is often safer for complex ERPs unless dataset is massive.
  // For production with massive datasets, raw SQL aggregations are preferred.
  // Here we use Prisma to fetch the relevant subset.
  
  const facturas = await prisma.factura.findMany({
    where: {
      ...baseWhere,
      estado: "emitida",
      fechaCAE: {
        gte: params.fechaDesde,
        lte: params.fechaHasta,
      },
      // Exclude anulada, pendiente
      // Only include specific types: Facturas (1,6,11, 201,206,211), ND (2,7,12), NC (3,8,13)
      tipoCbte: {
        in: [1, 6, 11, 201, 206, 211, 2, 7, 12, 3, 8, 13],
      }
    },
    select: {
      id: true,
      tipoCbte: true,
      subtotal: true, // This is neto gravado
      netoExento: true,
      netoNoGravado: true,
      total: true,
      totalPercepciones: true,
      impInternosTotal: true,
      lineas: {
        select: {
          cantidad: true,
          precioUnitario: true,
          descuento: true,
          subtotal: true,
          costoUnitarioHistorico: true,
          costoUnitarioReposicion: true,
        }
      }
    }
  });

  let vnr = 0;
  let costoTotal = 0;
  let totalCobradoComercial = 0;
  let countTransaccionesComerciales = 0;

  for (const f of facturas) {
    let signo = 1;
    let isVenta = false;
    
    // Facturas y FCE
    if ([1, 6, 11, 201, 206, 211].includes(f.tipoCbte)) {
      signo = 1;
      isVenta = true;
    } 
    // Notas de Débito
    else if ([2, 7, 12].includes(f.tipoCbte)) {
      signo = 1;
    }
    // Notas de Crédito
    else if ([3, 8, 13].includes(f.tipoCbte)) {
      signo = -1;
    }

    // 1. VNR = subtotal + netoExento + netoNoGravado
    const netoComprobante = Number(f.subtotal) + Number(f.netoExento) + Number(f.netoNoGravado);
    vnr += signo * netoComprobante;

    // 2. CMV (Costo)
    for (const linea of f.lineas) {
      // Si la linea no tiene costo (ej: factura vieja), asumimos 0 para no romper, 
      // pero el margen será 100%.
      let costo = 0;
      if (params.metodoCosto === "PPP") {
        costo = Number(linea.costoUnitarioHistorico || 0);
      } else {
        costo = Number(linea.costoUnitarioReposicion || 0);
      }
      costoTotal += signo * linea.cantidad * costo;
    }

    // 3. Ticket Promedio (solo ventas comerciales, no NC/ND)
    if (isVenta) {
      countTransaccionesComerciales += 1;
      // total cobrado incluye IVA y percepciones
      totalCobradoComercial += Number(f.total) + Number(f.totalPercepciones) + Number(f.impInternosTotal);
    }
  }

  // 1. VNR
  const ventasNetasReales = vnr;

  // 2. MBR
  const margenBrutoDinero = ventasNetasReales - costoTotal;
  const margenBrutoPorcentaje = ventasNetasReales > 0 ? (margenBrutoDinero / ventasNetasReales) * 100 : 0;

  // 3. Ticket
  const ticketPromedioBruto = countTransaccionesComerciales > 0 ? totalCobradoComercial / countTransaccionesComerciales : 0;
  const ticketPromedioNeto = countTransaccionesComerciales > 0 ? ventasNetasReales / countTransaccionesComerciales : 0;

  return {
    ventasNetasReales,
    margenBrutoDinero,
    margenBrutoPorcentaje,
    ticketPromedioBruto,
    ticketPromedioNeto,
    countTransaccionesComerciales
  };
}

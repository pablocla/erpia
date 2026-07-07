import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"
import { vencimientoExpensaDesdePeriodo } from "@/lib/consorcios/consorcios-morosos-service"

export interface PDFLiquidacionConsorcio {
  html: string
  filename: string
  metadata: {
    consorcioId: number
    periodo: string
    totalGastos: number
    unidades: number
  }
}

const fmtArs = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

export async function generarLiquidacionConsorcioPDF(
  empresaId: number,
  consorcioId: number,
  periodo: string,
): Promise<PDFLiquidacionConsorcio> {
  const consorcio = await prisma.consorcio.findFirst({
    where: whereEmpresa(empresaId, { id: consorcioId }),
    include: {
      empresa: { select: { nombre: true, razonSocial: true, cuit: true, direccion: true } },
      gastos: { where: { periodo }, orderBy: { fecha: "asc" } },
      unidades: {
        include: {
          residente: { select: { nombre: true } },
          expensas: { where: { periodo } },
        },
        orderBy: { numero: "asc" },
      },
    },
  })

  if (!consorcio) throw new Error("Consorcio no encontrado")

  const gastos = consorcio.gastos
  const totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0)
  if (totalGastos === 0) {
    throw new Error(`No hay gastos cargados para el período ${periodo}`)
  }

  const fechaVencimiento = vencimientoExpensaDesdePeriodo(periodo)
  const vtoStr = fechaVencimiento.toLocaleDateString("es-AR")
  const emitido = new Date().toLocaleDateString("es-AR")
  const adminNombre = consorcio.empresa.razonSocial ?? consorcio.empresa.nombre

  const gastosRows = gastos
    .map(
      (g) => `
      <tr>
        <td>${new Date(g.fecha).toLocaleDateString("es-AR")}</td>
        <td>${escapeHtml(g.descripcion)}</td>
        <td class="num">${fmtArs(Number(g.monto))}</td>
      </tr>`,
    )
    .join("")

  const expensaRows = consorcio.unidades
    .map((u) => {
      const expensa = u.expensas[0]
      const monto =
        expensa != null
          ? Number(expensa.montoTotal)
          : (totalGastos * u.porceps) / 100
      const estado = expensa?.estado ?? "proyectado"
      return `
      <tr>
        <td><strong>${escapeHtml(u.numero)}</strong></td>
        <td>${escapeHtml(u.residente?.nombre ?? "—")}</td>
        <td class="num">${u.porceps.toFixed(2)}%</td>
        <td class="num">${fmtArs(monto)}</td>
        <td>${vtoStr}</td>
        <td>${estado}</td>
      </tr>`
    })
    .join("")

  const totalProrrateado = consorcio.unidades.reduce((s, u) => {
    const expensa = u.expensas[0]
    const monto =
      expensa != null ? Number(expensa.montoTotal) : (totalGastos * u.porceps) / 100
    return s + monto
  }, 0)

  const liquidado = consorcio.unidades.some((u) => u.expensas.length > 0)
  const tituloEstado = liquidado ? "Liquidación de expensas" : "Pre-liquidación (gastos cargados)"

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Liquidación ${periodo} — ${escapeHtml(consorcio.nombre)}</title>
  <style>
    @media print { .no-print { display: none !important; } body { margin: 0; padding: 12px; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; max-width: 820px; margin: 0 auto; padding: 24px; font-size: 12px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .sub { color: #6b7280; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; }
    .box h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 11px; border-bottom: 2px solid #d1d5db; }
    td { padding: 7px 8px; border-bottom: 1px solid #eee; }
    td.num, th.num { text-align: right; }
    .total { text-align: right; font-size: 15px; font-weight: bold; margin: 8px 0 20px; }
    .leyenda { font-size: 10px; color: #9ca3af; text-align: center; margin-top: 24px; border-top: 1px solid #eee; padding-top: 10px; }
    .btn-print { position: fixed; top: 10px; right: 10px; background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; z-index: 100; }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">Imprimir / Guardar PDF</button>
  <h1>${tituloEstado}</h1>
  <p class="sub">Período ${periodo} · Emitido ${emitido}</p>
  <div class="grid">
    <div class="box">
      <h2>Administración</h2>
      <div><strong>${escapeHtml(adminNombre)}</strong></div>
      ${consorcio.empresa.cuit ? `<div>CUIT: ${consorcio.empresa.cuit}</div>` : ""}
      ${consorcio.empresa.direccion ? `<div>${escapeHtml(consorcio.empresa.direccion)}</div>` : ""}
    </div>
    <div class="box">
      <h2>Consorcio</h2>
      <div><strong>${escapeHtml(consorcio.nombre)}</strong></div>
      <div>${escapeHtml(consorcio.direccion)}</div>
      ${consorcio.cuit ? `<div>CUIT: ${consorcio.cuit}</div>` : ""}
    </div>
  </div>
  <h2 style="font-size:14px;margin-bottom:8px;">Gastos del período</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Descripción</th><th class="num">Monto</th></tr></thead>
    <tbody>${gastosRows}</tbody>
  </table>
  <div class="total">Total gastos: ${fmtArs(totalGastos)}</div>
  <h2 style="font-size:14px;margin-bottom:8px;">Prorrateo por unidad funcional</h2>
  <table>
    <thead>
      <tr>
        <th>UF</th><th>Residente</th><th class="num">%</th>
        <th class="num">Expensa</th><th>Vencimiento</th><th>Estado</th>
      </tr>
    </thead>
    <tbody>${expensaRows}</tbody>
  </table>
  <div class="total">Total prorrateado: ${fmtArs(totalProrrateado)}</div>
  <p class="leyenda">Comprobante interno generado por Claver · Vencimiento estándar día 10 del mes siguiente.</p>
</body>
</html>`

  const slug = consorcio.nombre.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 30)
  return {
    html,
    filename: `liquidacion-${slug}-${periodo}.html`,
    metadata: {
      consorcioId,
      periodo,
      totalGastos,
      unidades: consorcio.unidades.length,
    },
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
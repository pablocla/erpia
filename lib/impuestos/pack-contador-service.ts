/**
 * Pack cierre mensual contador — Sprint B8.5
 * Bundle ZIP con libros fiscales, GL y checklist del período.
 */

import JSZip from "jszip"
import { prisma } from "@/lib/prisma"
import { AsientoService } from "@/lib/contabilidad/asiento-service"
import { IVAService } from "@/lib/impuestos/iva-service"
import { SICOREService } from "@/lib/impuestos/sicore-service"
import { prePresentacionService } from "@/lib/impuestos/pre-presentacion-service"

export interface PackContadorMeta {
  empresaId: number
  razonSocial: string
  cuit: string | null
  mes: number
  anio: number
  periodo: string
  generadoEn: string
  archivos: string[]
}

function rangoPeriodo(mes: number, anio: number) {
  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes, 0, 23, 59, 59, 999)
  return { desde, hasta }
}

function csvLibroDiario(
  asientos: Awaited<ReturnType<AsientoService["obtenerLibroDiario"]>>,
): string {
  let csv = "Numero,Fecha,Descripcion,Cuenta,Debe,Haber,CentroCostoId\n"
  for (const asiento of asientos) {
    const fecha = asiento.fecha.toISOString().split("T")[0]
    for (const mov of asiento.movimientos) {
      csv += `${asiento.numero},"${fecha}","${asiento.descripcion.replace(/"/g, '""')}","${mov.cuenta}",${Number(mov.debe)},${Number(mov.haber)},${mov.centroCostoId ?? ""}\n`
    }
  }
  return csv
}

function csvRetenciones(
  retenciones: { codigoSicore: string; tipo: string; base: number; alicuota: number; monto: number; fechaRetencion: Date; proveedor?: { nombre: string; cuit: string | null } | null }[],
): string {
  let csv = "Fecha,Codigo,Tipo,Proveedor,CUIT,Base,Alicuota,Monto\n"
  for (const r of retenciones) {
    const fecha = r.fechaRetencion.toISOString().split("T")[0]
    csv += `"${fecha}","${r.codigoSicore}","${r.tipo}","${r.proveedor?.nombre ?? ""}","${r.proveedor?.cuit ?? ""}",${r.base},${r.alicuota},${r.monto}\n`
  }
  return csv
}

function htmlResumenPack(meta: PackContadorMeta, checklist: { listo: boolean; resumen: { ok: number; total: number; criticos: number } }): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Pack Contador ${meta.periodo}</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333}
h1{color:#1e40af}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#eff6ff}.ok{color:#059669}.bad{color:#dc2626}@media print{.no-print{display:none}}</style></head><body>
<button class="no-print" onclick="window.print()" style="float:right;padding:8px 16px;background:#1e40af;color:#fff;border:none;border-radius:6px;cursor:pointer">Imprimir PDF</button>
<h1>Pack Cierre Mensual — Contador</h1>
<p><strong>${meta.razonSocial}</strong> — CUIT ${meta.cuit ?? "—"}</p>
<p>Período: <strong>${meta.periodo}</strong> — Generado: ${meta.generadoEn}</p>
<h2>Checklist pre-presentación</h2>
<p class="${checklist.listo ? "ok" : "bad"}">${checklist.listo ? "✓ Listo para presentar" : `✗ ${checklist.resumen.criticos} bloqueo(s) crítico(s)`}</p>
<p>${checklist.resumen.ok}/${checklist.resumen.total} validaciones OK</p>
<h2>Archivos incluidos</h2>
<ul>${meta.archivos.map((a) => `<li>${a}</li>`).join("")}</ul>
<p style="margin-top:32px;font-size:11px;color:#888">Documento generado por ClavERP. Verificar antes de presentar ante AFIP/ARBA.</p>
</body></html>`
}

export class PackContadorService {
  async generarPack(empresaId: number, mes: number, anio: number): Promise<{ buffer: Buffer; meta: PackContadorMeta; filename: string }> {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { razonSocial: true, nombre: true, cuit: true },
    })
    if (!empresa) throw new Error("Empresa no encontrada")

    const periodo = `${String(mes).padStart(2, "0")}/${anio}`
    const { desde, hasta } = rangoPeriodo(mes, anio)

    const asientoService = new AsientoService()
    const ivaService = new IVAService()
    const sicoreService = new SICOREService()

    const [
      asientos,
      ivaVentasCsv,
      ivaComprasCsv,
      resumenIvaTxt,
      sicoreTxt,
      checklist,
      retenciones,
    ] = await Promise.all([
      asientoService.obtenerLibroDiario(desde, hasta, empresaId),
      ivaService.exportarLibroIVAVentasCSV(mes, anio, empresaId),
      ivaService.exportarLibroIVAComprasCSV(mes, anio, empresaId),
      ivaService.generarArchivoPresentacionAFIP(mes, anio, empresaId),
      sicoreService.generarArchivoSICORE(mes, anio, empresaId),
      prePresentacionService.evaluar(empresaId, mes, anio),
      sicoreService.listarRetenciones({ mes, anio, empresaId }),
    ])

    const archivos = [
      "README.txt",
      "resumen_pack.html",
      "libro_diario.csv",
      "libro_iva_ventas.csv",
      "libro_iva_compras.csv",
      "resumen_iva.txt",
      "sicore_siap.txt",
      "retenciones_detalle.csv",
      "checklist_pre_presentacion.json",
    ]

    const meta: PackContadorMeta = {
      empresaId,
      razonSocial: empresa.razonSocial ?? empresa.nombre,
      cuit: empresa.cuit,
      mes,
      anio,
      periodo,
      generadoEn: new Date().toLocaleString("es-AR"),
      archivos,
    }

    const readme = [
      "PACK CIERRE MENSUAL — CONTADOR",
      "================================",
      `Empresa: ${meta.razonSocial}`,
      `CUIT: ${meta.cuit ?? "—"}`,
      `Período: ${periodo}`,
      `Generado: ${meta.generadoEn}`,
      "",
      "Contenido:",
      ...archivos.map((a) => `  - ${a}`),
      "",
      `Checklist: ${checklist.listo ? "LISTO" : "PENDIENTE"} (${checklist.resumen.ok}/${checklist.resumen.total} OK)`,
    ].join("\r\n")

    const zip = new JSZip()
    zip.file("README.txt", readme)
    zip.file("resumen_pack.html", htmlResumenPack(meta, checklist))
    zip.file("libro_diario.csv", csvLibroDiario(asientos))
    zip.file("libro_iva_ventas.csv", ivaVentasCsv)
    zip.file("libro_iva_compras.csv", ivaComprasCsv)
    zip.file("resumen_iva.txt", resumenIvaTxt)
    zip.file("sicore_siap.txt", sicoreTxt || "(sin retenciones en el período)")
    zip.file("retenciones_detalle.csv", csvRetenciones(retenciones))
    zip.file("checklist_pre_presentacion.json", JSON.stringify(checklist, null, 2))

    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
    const filename = `pack_contador_${meta.razonSocial.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}_${anio}-${String(mes).padStart(2, "0")}.zip`

    return { buffer, meta, filename }
  }
}

export const packContadorService = new PackContadorService()
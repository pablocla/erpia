"use client"

import type { TicketLegalData } from "@/lib/fiscal/ticket-legal"

interface FiscalTicketViewProps {
  data: TicketLegalData
  className?: string
}

function fmtCuit(cuit: string): string {
  const d = cuit.replace(/\D/g, "")
  if (d.length !== 11) return cuit
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`
}

/** Vista 80mm con datos legales — usada en POS (window.print) y preview */
export function FiscalTicketView({ data, className = "" }: FiscalTicketViewProps) {
  const authLabel = data.factura.modalidadAuth === "CAEA" ? "CAEA" : "CAE"

  return (
    <div
      className={`text-left font-mono text-[11px] leading-snug text-black bg-white ${className}`}
      style={{ width: "80mm", maxWidth: "80mm" }}
    >
      <div className="text-center font-bold text-sm">{data.empresa.nombre}</div>
      <div className="text-center">{data.empresa.razonSocial}</div>
      <div className="text-center">CUIT: {fmtCuit(data.empresa.cuit)}</div>
      {data.empresa.iibb && <div className="text-center">IIBB: {data.empresa.iibb}</div>}
      <div className="text-center">
        Cond. IVA: {data.empresa.condicionIva} ({data.empresa.condicionIvaCodigo})
      </div>
      <div className="text-center text-[10px]">{data.empresa.direccion}</div>
      <div className="text-center">P.Vta {String(data.empresa.puntoVenta).padStart(5, "0")}</div>

      <hr className="my-1 border-dashed border-black/40" />

      <div className="font-bold text-center">{data.factura.nombreComprobante}</div>
      <div className="text-center">
        Cód. {String(data.factura.tipoCbte).padStart(2, "0")} · {data.factura.numeroCompleto}
      </div>
      <div className="text-center">
        Fecha: {data.factura.fecha.toLocaleDateString("es-AR")}
      </div>
      {data.factura.esFce && (
        <div className="text-center font-bold text-amber-800">FCE MiPyME</div>
      )}
      {data.factura.esExportacion && (
        <div className="text-center font-bold">EXPORTACIÓN</div>
      )}

      <hr className="my-1 border-dashed border-black/40" />

      <div>Cliente: {data.cliente.nombre}</div>
      {data.cliente.cuit && <div>CUIT: {fmtCuit(data.cliente.cuit)}</div>}
      {data.cliente.dni && !data.cliente.cuit && <div>DNI: {data.cliente.dni}</div>}
      <div>
        Cond. IVA: {data.cliente.condicionIva} ({data.cliente.condicionIvaCodigo})
      </div>

      <hr className="my-1 border-dashed border-black/40" />

      <table className="w-full text-[10px]">
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td className="w-8">{item.cantidad}</td>
              <td>{item.descripcion.slice(0, 22)}</td>
              <td className="text-right">${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="my-1 border-dashed border-black/40" />

      {data.ivaDesglose.map((row) => (
        <div key={row.alicuota} className="flex justify-between text-[10px]">
          <span>IVA {row.alicuota}%</span>
          <span>${row.iva.toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>${data.totales.subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>IVA</span>
        <span>${data.totales.iva.toFixed(2)}</span>
      </div>
      {data.totales.percepciones > 0 && (
        <div className="flex justify-between">
          <span>Percepciones</span>
          <span>${data.totales.percepciones.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-sm mt-1">
        <span>TOTAL</span>
        <span>${data.totales.total.toFixed(2)}</span>
      </div>

      {!data.factura.esTicket && data.factura.cae && (
        <>
          <hr className="my-1 border-dashed border-black/40" />
          <div className="text-center font-bold">COMPROBANTE AUTORIZADO</div>
          <div className="text-center">
            {authLabel}: {data.factura.cae}
          </div>
          <div className="text-center text-[10px]">
            Vto: {data.factura.vencimientoCAE.toLocaleDateString("es-AR")}
          </div>
          {data.qrBase64 && (
            <div className="flex justify-center mt-2">
              <img src={data.qrBase64} alt="QR AFIP" className="h-24 w-24" />
            </div>
          )}
        </>
      )}

      {data.factura.esTicket && (
        <div className="text-center font-bold text-red-700 mt-2">TICKET SIN CAE</div>
      )}

      <div className="text-[9px] text-center mt-2 space-y-0.5 text-gray-600">
        {data.leyendas.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
    </div>
  )
}
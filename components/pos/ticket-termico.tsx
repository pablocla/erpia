"use client"

export type TicketTermicoLinea = {
  descripcion: string
  cantidad: number
  precio: number
}

export type TicketTermicoProps = {
  empresaNombre?: string
  numeroComprobante: string
  fecha?: Date
  lineas?: TicketTermicoLinea[]
  total: number
  medioPago?: string
  vuelto?: number
  cae?: string
  vencimientoCae?: string
  esTicket?: boolean
}

export function PosTicketTermico({
  empresaNombre = "Comercio",
  numeroComprobante,
  fecha = new Date(),
  lineas = [],
  total,
  medioPago,
  vuelto,
  cae,
  vencimientoCae,
  esTicket,
}: TicketTermicoProps) {
  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtQty = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toLocaleString("es-AR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })

  return (
    <div
      className="text-left font-mono text-[11px] leading-snug text-black bg-white"
      style={{ width: "80mm", maxWidth: "80mm" }}
    >
      <div className="text-center font-bold text-sm">{empresaNombre}</div>
      <div className="text-center text-[10px]">
        {fecha.toLocaleString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      <hr className="my-1.5 border-dashed border-black/40" />

      <div className="text-center font-bold">{esTicket ? "TICKET DE VENTA" : "COMPROBANTE"}</div>
      <div className="text-center">{numeroComprobante}</div>

      <hr className="my-1.5 border-dashed border-black/40" />

      {lineas.length > 0 ? (
        <div className="space-y-1">
          {lineas.map((l, i) => (
            <div key={i}>
              <div className="truncate">{l.descripcion}</div>
              <div className="flex justify-between pl-1">
                <span>
                  {fmtQty(l.cantidad)} × ${fmt(l.precio)}
                </span>
                <span>${fmt(l.cantidad * l.precio)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-[10px] text-black/60">Sin detalle de ítems</div>
      )}

      <hr className="my-1.5 border-dashed border-black/40" />

      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL</span>
        <span>${fmt(total)}</span>
      </div>

      {medioPago && (
        <div className="text-[10px] mt-1">Pago: {medioPago}</div>
      )}
      {vuelto != null && vuelto > 0.01 && (
        <div className="text-[10px]">Vuelto: ${fmt(vuelto)}</div>
      )}

      {cae && (
        <>
          <hr className="my-1.5 border-dashed border-black/40" />
          <div className="text-[10px]">CAE: {cae}</div>
          {vencimientoCae && <div className="text-[10px]">Vto CAE: {vencimientoCae}</div>}
        </>
      )}

      <div className="text-center text-[9px] mt-3 text-black/50">Gracias por su compra</div>
    </div>
  )
}
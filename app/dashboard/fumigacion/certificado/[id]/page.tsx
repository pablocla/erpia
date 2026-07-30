"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { Button } from "@/components/ui/button"
import { Printer, Download, ArrowLeft, Send } from "lucide-react"

export default function CertificadoFumigacionPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: ot, isLoading } = useAuthFetch<any>(`/api/ot/${id}`)
  
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando certificado...</div>
  if (!ot) return <div className="p-8 text-center text-red-500">No se encontró la visita.</div>

  const meta = (ot.metadata as Record<string, any>) || {}
  const insumos = Array.isArray(meta.insumosConsumidos) ? meta.insumosConsumidos : []
  
  const handlePrint = () => {
    window.print()
  }

  const handleAFIP = () => {
    // Redirigir a Ventas para emitir AFIP
    router.push(`/dashboard/ventas?clienteId=${ot.clienteId}&monto=${meta.montoCobrado || 0}&descripcion=Fumigacion OT ${ot.numero}`)
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none print:bg-white print:p-0">
        
        {/* Barra de acciones (no se imprime) */}
        <div className="flex flex-wrap gap-2 p-4 border-b bg-neutral-50 print:hidden sticky top-0 z-10">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={handleAFIP} className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <Send className="h-4 w-4 mr-2" /> Emitir a ARCA (AFIP)
          </Button>
          <Button onClick={handlePrint} className="bg-black text-white hover:bg-gray-800">
            <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
          </Button>
        </div>

        {/* Documento */}
        <div className="p-8 md:p-12 space-y-8 text-black" id="certificado-print">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-6">
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter">Certificado</h1>
              <h2 className="text-xl font-medium text-neutral-600 mt-1">Control de Plagas & Desinfección</h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Documento N°</p>
              <p className="text-2xl font-mono">{String(ot.numero).padStart(6, '0')}</p>
              <p className="text-sm text-neutral-500 mt-2">
                Fecha: {new Date(ot.fechaCreacion || ot.fechaPrometida).toLocaleDateString("es-AR")}
              </p>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Cliente / Establecimiento</h3>
              <p className="font-bold text-lg">{ot.cliente?.nombre || "Consumidor Final"}</p>
              <p className="text-sm mt-1">{ot.cliente?.direccion || "Sin dirección registrada"}</p>
              {ot.cliente?.cuit && <p className="text-sm mt-1">CUIT: {ot.cliente.cuit}</p>}
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Detalles del Servicio</h3>
              <p className="text-sm"><span className="font-semibold">Técnico Asignado:</span> {ot.tecnicoAsignado || "No especificado"}</p>
              <p className="text-sm mt-1"><span className="font-semibold">Estado de Pago:</span> {meta.estadoPago === "COBRADO" ? "Cancelado" : "Pendiente"}</p>
              <p className="text-sm mt-1 font-semibold text-red-600">
                Próximo Vencimiento: {meta.fechaVencimientoCertificado ? new Date(meta.fechaVencimientoCertificado).toLocaleDateString("es-AR") : "No especificado"}
              </p>
            </div>
          </div>

          {/* Observaciones y Tratamiento */}
          <div>
            <h3 className="text-sm font-bold text-black border-b border-neutral-200 pb-2 mb-4 uppercase tracking-wider">Tratamiento Realizado</h3>
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-neutral-800 bg-neutral-50 p-4 rounded">
              {meta.observacionesVisita || ot.descripcion || "Sin observaciones específicas registradas en la visita."}
            </p>
          </div>

          {/* Productos Aplicados */}
          {insumos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-black border-b border-neutral-200 pb-2 mb-4 uppercase tracking-wider">Productos Aplicados (Principio Activo)</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 font-semibold">Producto</th>
                    <th className="py-2 font-semibold text-right">Cantidad Autorizada</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((i: any, idx: number) => (
                    <tr key={idx} className="border-b border-neutral-100">
                      <td className="py-2">{i.nombre}</td>
                      <td className="py-2 text-right font-mono">{i.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-12 pt-16">
            <div className="text-center">
              <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
              <p className="text-sm font-semibold">Firma del Director Técnico</p>
              <p className="text-xs text-neutral-500 mt-1">Empresa Fumigadora</p>
            </div>
            <div className="text-center">
              <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
              <p className="text-sm font-semibold">Firma del Establecimiento</p>
              <p className="text-xs text-neutral-500 mt-1">Conformidad del Servicio</p>
            </div>
          </div>

          <div className="pt-8 text-center text-xs text-neutral-400 border-t mt-8">
            Este documento certifica la realización de tareas de saneamiento ambiental y control de plagas.<br/>
            No válido como factura comercial.
          </div>

        </div>
      </div>
    </div>
  )
}

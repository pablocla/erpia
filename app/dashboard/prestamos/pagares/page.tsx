"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft, Landmark } from "lucide-react"

interface Prestamo {
  id: number
  cliente: string
  dni: string
  capital: number
  interes: number
  total: number
  cuotasTotales: number
  cuotasPagas: number
  montoCuota: number
  frecuencia: "Diario" | "Semanal" | "Mensual"
  estado: "Al día" | "Atrasado" | "Vencido"
  fechaInicio: string
  fechaVencimiento: string
}

// Convert numbers to words (simplificado para ARS)
function numeroALetras(num: number): string {
  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
  const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"]
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]

  if (num === 0) return "CERO"
  if (num === 100) return "CIEN"
  
  let letras = ""
  
  if (num >= 100000) {
    // Muy simplificado para la demo
    return num.toLocaleString("es-AR") + " PESOS"
  }
  
  // Miles
  if (num >= 1000) {
    const miles = Math.floor(num / 1000)
    num = num % 1000
    if (miles === 1) {
      letras += "MIL "
    } else {
      letras += numeroALetras(miles) + " MIL "
    }
  }

  // Centenas
  if (num >= 100) {
    const c = Math.floor(num / 100)
    num = num % 100
    letras += centenas[c] + " "
  }

  // Decenas
  if (num >= 20) {
    const d = Math.floor(num / 10)
    num = num % 10
    if (num > 0) {
      letras += decenas[d] + " Y " + unidades[num]
    } else {
      letras += decenas[d]
    }
  } else if (num >= 10) {
    letras += especiales[num - 10]
  } else if (num > 0) {
    letras += unidades[num]
  }

  return letras.trim() + " PESOS"
}

export default function PagarePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idStr = searchParams.get("id")
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("claver:prestamos")
    if (saved && idStr) {
      const list: Prestamo[] = JSON.parse(saved)
      const found = list.find(p => p.id === Number(idStr))
      if (found) setPrestamo(found)
    }
  }, [idStr])

  const handlePrint = () => {
    window.print()
  }

  if (!prestamo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6">
        <Landmark className="h-16 w-16 text-slate-300 mb-4 animate-pulse" />
        <p className="text-slate-600 font-semibold mb-4">No se encontró el pagaré solicitado.</p>
        <Button onClick={() => router.push("/dashboard/prestamos")}>Volver a la cartera</Button>
      </div>
    )
  }

  const totalEnLetras = numeroALetras(prestamo.total)

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:bg-white print:py-0 print:px-0">
      {/* Controles superiores (se ocultan al imprimir) */}
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-6 print:hidden">
        <Button variant="ghost" onClick={() => router.push("/dashboard/prestamos")} className="text-slate-600 hover:bg-slate-200">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Printer className="mr-2 h-4 w-4" /> Imprimir Pagaré
        </Button>
      </div>

      {/* Papel Pagaré */}
      <div className="max-w-2xl mx-auto bg-white p-12 md:p-16 border border-slate-300 shadow-xl print:shadow-none print:border-none print:p-4 font-serif text-slate-900 leading-loose">
        
        {/* Encabezado del Documento */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-widest text-slate-950">PAGARÉ</h1>
            <p className="text-xs font-sans text-slate-400 mt-1 uppercase">Documento Ejecutivo Cambiario</p>
          </div>
          <div className="text-right border border-slate-900 px-4 py-2 bg-slate-50/50">
            <span className="text-xs font-sans text-slate-500 uppercase block">Por valor de:</span>
            <span className="text-xl font-mono font-bold">${prestamo.total.toLocaleString("es-AR")}.-</span>
          </div>
        </div>

        {/* Cuerpo del Pagaré */}
        <div className="text-justify text-base space-y-6">
          <p>
            En la ciudad de <strong>Buenos Aires</strong>, a los <strong>{prestamo.fechaInicio.split("-")[2]}</strong> días del mes de <strong>{new Date(prestamo.fechaInicio).toLocaleString("es-AR", { month: "long" })}</strong> de <strong>{prestamo.fechaInicio.split("-")[0]}</strong>, pagaré libre de protesto a la orden del portador legitimado la cantidad de <strong>{totalEnLetras}</strong> (${prestamo.total.toLocaleString("es-AR")}).
          </p>

          <p>
            El pago de la suma indicada se realizará en cuotas según el plan amortizable convenido de <strong>{prestamo.cuotasTotales} cuotas {prestamo.frecuencia.toLowerCase()}s</strong> de <strong>${prestamo.montoCuota.toLocaleString("es-AR")}</strong> cada una, fijándose como fecha de vencimiento final el <strong>{prestamo.fechaVencimiento.split("-")[2]}/{prestamo.fechaVencimiento.split("-")[1]}/{prestamo.fechaVencimiento.split("-")[0]}</strong>.
          </p>

          <p>
            La falta de pago de una sola de las cuotas mensuales, semanales o diarias pactadas en sus respectivos plazos producirá la caducidad total de los plazos otorgados, haciendo exigible la totalidad del saldo insoluto de manera inmediata y por vía ejecutiva directa.
          </p>
        </div>

        {/* Firmas y Datos del Deudor */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-10">
          <div className="space-y-2 text-sm">
            <h3 className="font-sans font-bold text-xs uppercase text-slate-400 tracking-wider">Firmante / Deudor:</h3>
            <p className="text-lg font-bold">{prestamo.cliente}</p>
            <p className="text-slate-600 font-sans">DNI/CUIT: {prestamo.dni}</p>
            <p className="text-slate-600 font-sans">Domicilio: Calle Ficticia 1234, CABA</p>
          </div>

          <div className="flex flex-col items-center justify-end">
            <div className="w-48 border-b border-slate-900 mb-2"></div>
            <span className="text-xs font-sans text-slate-500 uppercase tracking-widest">Firma del Deudor</span>
          </div>
        </div>

        {/* Disclaimer Legal */}
        <div className="mt-12 text-[10px] text-slate-400 font-sans border-t border-dashed border-slate-200 pt-4 leading-normal">
          Este pagaré se rige según el Decreto Ley 5965/63 de la República Argentina. La firma del presente instrumento obliga al deudor cambiario de manera incondicional.
        </div>
      </div>
    </div>
  )
}

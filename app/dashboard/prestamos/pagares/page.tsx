"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Printer, ArrowLeft, Download, Landmark } from "lucide-react"
import Link from "next/link"
import { authFetch } from "@/lib/stores"

interface PagareItem {
  id: number
  cliente: string
  capital: number
  interes: number
  total: number
  fechaVencimiento: string
  observaciones?: string
}

export default function PagaresPage() {
  const [pagares, setPagares] = useState<PagareItem[]>([])
  const [selected, setSelected] = useState<PagareItem | null>(null)

  useEffect(() => {
    const fetchPagares = async () => {
      try {
        const res = await authFetch("/api/prestamos")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setPagares(data)
            setSelected(data[0])
            return
          }
        }
      } catch (e) {
        console.error(e)
      }
      const fallback = [
        { id: 1, cliente: "Aldo", capital: 318500, interes: 74500, total: 393000, fechaVencimiento: "2026-09-01", observaciones: "Capital $318.500 + $74.500" },
        { id: 2, cliente: "Madera", capital: 50000, interes: 15000, total: 65000, fechaVencimiento: "2026-09-01", observaciones: "Capital $50.000 + $15.000" },
        { id: 3, cliente: "Farana", capital: 250000, interes: 75000, total: 325000, fechaVencimiento: "2026-09-01", observaciones: "Capital $250.000 + $75.000" },
      ]
      setPagares(fallback)
      setSelected(fallback[0])
    }
    void fetchPagares()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Topbar title="Emisión de Pagarés Legales" />
      <MotionPage className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full pb-24">
        
        <div className="flex items-center justify-between">
          <Link href="/dashboard/prestamos">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a Préstamos
            </Button>
          </Link>
          <Button onClick={handlePrint} size="sm" className="gap-2 bg-primary text-primary-foreground">
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de Seleccionables */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Seleccionar Deudor</h3>
            {pagares.map((p) => (
              <Card
                key={p.id}
                onClick={() => setSelected(p)}
                className={`cursor-pointer transition-all ${selected?.id === p.id ? "border-primary bg-primary/5 font-bold shadow-md" : "hover:border-border/80"}`}
              >
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <div className="text-base">{p.cliente}</div>
                    <div className="text-xs text-muted-foreground">Vence: {p.fechaVencimiento}</div>
                  </div>
                  <div className="text-sm font-extrabold">${p.total.toLocaleString("es-AR")}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Vista Previa del Pagaré Imprimible */}
          <div className="md:col-span-2">
            {selected ? (
              <Card className="border-2 border-foreground/20 p-6 md:p-8 bg-card shadow-lg print:border-none print:shadow-none">
                <div className="space-y-6 text-foreground">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Landmark className="h-6 w-6 text-primary" />
                        PAGARÉ
                      </h2>
                      <p className="text-xs text-muted-foreground">Lázaro Préstamos — Documento de Deuda Comercial</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">VALOR ARS</div>
                      <div className="text-2xl font-black text-primary">${selected.total.toLocaleString("es-AR")}</div>
                    </div>
                  </div>

                  <div className="text-sm leading-relaxed space-y-4">
                    <p>
                      Por el presente PAGARÉ, me comprometo a pagar incondicionalmente a la orden de <strong>Lázaro Préstamos</strong> el día <strong>{selected.fechaVencimiento}</strong> la cantidad exacta de:
                    </p>
                    <div className="p-3 bg-muted rounded-md font-mono text-center font-bold text-base">
                      ${selected.total.toLocaleString("es-AR")} (PESOS ARGENTINOS)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Por igual valor recibido a mi entera satisfacción en calidad de préstamo otorgado con fecha de emisión en vigencia.
                    </p>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block">DEUDOR:</span>
                        <strong className="text-base">{selected.cliente}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">VENCIMIENTO:</span>
                        <strong className="text-base">{selected.fechaVencimiento}</strong>
                      </div>
                    </div>

                    <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                      <div className="border-t border-foreground/40 pt-2">
                        Firma del Deudor ({selected.cliente})
                      </div>
                      <div className="border-t border-foreground/40 pt-2">
                        Aclaración y DNI
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="p-12 text-center text-muted-foreground">Seleccioná un deudor para generar su pagaré.</div>
            )}
          </div>
        </div>

      </MotionPage>
    </div>
  )
}

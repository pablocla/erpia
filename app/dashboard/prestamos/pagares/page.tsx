"use client"

import { Suspense, useEffect, useState } from "react"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft, Landmark } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { authFetch, useAuthStore } from "@/lib/stores"
import { fmtArs } from "@/lib/prestamos/prestamos-meta"

interface PagareItem {
  id: number
  cliente: string
  capital: number
  interes: number
  total: number
  fechaVencimiento: string
  notas?: string
}

function formatVence(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export default function PagaresPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
          Cargando…
        </div>
      }
    >
      <PagaresPageInner />
    </Suspense>
  )
}

function PagaresPageInner() {
  const searchParams = useSearchParams()
  const empresaNombre = useAuthStore((s) => s.user?.empresaNombre) || "El prestamista"
  const [pagares, setPagares] = useState<PagareItem[]>([])
  const [selected, setSelected] = useState<PagareItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPagares = async () => {
      try {
        const res = await authFetch("/api/prestamos")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setPagares(data)
            const idParam = searchParams.get("id")
            const pick =
              (idParam && data.find((p: PagareItem) => String(p.id) === idParam)) || data[0] || null
            setSelected(pick)
            setLoading(false)
            return
          }
        }
      } catch (e) {
        console.error(e)
      }
      setPagares([])
      setSelected(null)
      setLoading(false)
    }
    void fetchPagares()
  }, [searchParams])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Topbar />
      <MotionPage className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full pb-24">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/dashboard/prestamos">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a la libreta
            </Button>
          </Link>
          <Button onClick={() => window.print()} size="sm" className="gap-2" disabled={!selected}>
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Cargando…</p>
        ) : pagares.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No hay deudas para emitir pagaré. Anotá un préstamo primero.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 print:hidden">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Deudor
              </h3>
              {pagares.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`cursor-pointer transition-all ${
                    selected?.id === p.id
                      ? "border-primary bg-primary/5 font-bold shadow-md"
                      : "hover:border-border/80"
                  }`}
                >
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <div className="text-base">{p.cliente}</div>
                      <div className="text-xs text-muted-foreground">
                        Vence: {formatVence(p.fechaVencimiento)}
                      </div>
                    </div>
                    <div className="text-sm font-extrabold">{fmtArs(p.total)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

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
                        <p className="text-xs text-muted-foreground">
                          {empresaNombre} — Documento de deuda
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">VALOR ARS</div>
                        <div className="text-2xl font-black text-primary">{fmtArs(selected.total)}</div>
                      </div>
                    </div>

                    <div className="text-sm leading-relaxed space-y-4">
                      <p>
                        Por el presente PAGARÉ, me comprometo a pagar incondicionalmente a la orden de{" "}
                        <strong>{empresaNombre}</strong> el día{" "}
                        <strong>{formatVence(selected.fechaVencimiento)}</strong> la cantidad exacta de:
                      </p>
                      <div className="p-3 bg-muted rounded-md font-mono text-center font-bold text-base">
                        {fmtArs(selected.total)} (PESOS ARGENTINOS)
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Por igual valor recibido a mi entera satisfacción en calidad de préstamo.
                        {selected.capital > 0 && (
                          <>
                            {" "}
                            Capital {fmtArs(selected.capital)}
                            {selected.interes > 0 ? ` + interés ${fmtArs(selected.interes)}` : ""}.
                          </>
                        )}
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
                          <strong className="text-base">{formatVence(selected.fechaVencimiento)}</strong>
                        </div>
                      </div>

                      <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                        <div className="border-t border-foreground/40 pt-2">
                          Firma del Deudor ({selected.cliente})
                        </div>
                        <div className="border-t border-foreground/40 pt-2">Aclaración y DNI</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        )}
      </MotionPage>
    </div>
  )
}

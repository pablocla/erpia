"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { TiendaStorefront } from "@/components/ecommerce/tienda-storefront"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"

function TiendaSlugContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = String(params.slug ?? "")
  const [empresaId, setEmpresaId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/ecommerce/tienda/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Tienda no encontrada")
        }
        return res.json()
      })
      .then((data) => setEmpresaId(data.empresaId))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Tienda no encontrada")
      })
  }, [slug])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md p-6 text-center">
          <CardTitle>Tienda no disponible</CardTitle>
          <CardDescription className="mt-2">{error}</CardDescription>
        </Card>
      </div>
    )
  }

  if (empresaId === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <TiendaStorefront
      empresaId={empresaId}
      slug={slug}
      canalVentaCodigo={searchParams.get("canal") ?? undefined}
      pagoReturn={searchParams.get("pago") ?? undefined}
      pedidoReturn={searchParams.get("pedido") ?? undefined}
    />
  )
}

export default function TiendaSlugPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <TiendaSlugContent />
    </Suspense>
  )
}

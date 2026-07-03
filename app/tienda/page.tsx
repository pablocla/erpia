"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { TiendaStorefront } from "@/components/ecommerce/tienda-storefront"

const defaultEmpresaId = Number(process.env.NEXT_PUBLIC_ECOMMERCE_EMPRESA_ID ?? "1")

function TiendaPageContent() {
  const searchParams = useSearchParams()
  const empresaId = Number(searchParams.get("empresaId") ?? defaultEmpresaId)
  const canal = searchParams.get("canal")
  const pagoReturn = searchParams.get("pago")
  const pedidoReturn = searchParams.get("pedido")

  return (
    <TiendaStorefront
      empresaId={empresaId}
      canalVentaCodigo={canal}
      pagoReturn={pagoReturn}
      pedidoReturn={pedidoReturn}
    />
  )
}

export default function TiendaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <TiendaPageContent />
    </Suspense>
  )
}
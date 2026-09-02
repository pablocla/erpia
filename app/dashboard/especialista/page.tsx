"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, CreditCard, Headphones } from "lucide-react"
import { SolicitarEspecialistaModal } from "@/components/servicios-especialista/solicitar-especialista-modal"
import { authFetch } from "@/lib/stores/auth-store"
import type { PackEspecialistaPublico } from "@/lib/servicios-especialista/especialista-catalog"

type Orden = {
  id: number
  pack: PackEspecialistaPublico
  estadoPago: "pendiente" | "pagado" | "cancelado"
  slotLabel: string | null
  checkoutUrl: string | null
}

function EspecialistaPageContent() {
  const search = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [packs, setPacks] = useState<PackEspecialistaPublico[]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const ordenId = Number(search.get("orden") ?? "")
      const mock = search.get("mp_mock") === "1"
      if (mock && Number.isFinite(ordenId) && ordenId > 0) {
        await authFetch("/api/servicios/especialista", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmarMock: true, ordenId }),
        })
        setMensaje("Pago de prueba acreditado. El pedido quedó en el pipeline comercial.")
      } else if (search.get("status") === "approved" || search.get("collection_status") === "approved") {
        setMensaje("Si Mercado Pago acreditó, el pedido pasa a pagado en unos segundos.")
      }

      const res = await authFetch("/api/servicios/especialista")
      const data = await res.json()
      if (cancelled || !data.ok) return
      setOrdenes(data.ordenes ?? [])
      setPacks(data.packs ?? [])
    })()
    return () => {
      cancelled = true
    }
  }, [search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Especialista 1 a 1"
        description="Horas de implementación con alcance cerrado. El software sigue gratis; esto se paga cuando no querés pelear con Excel o ARCA."
      />

      {mensaje && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          {mensaje}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {packs.map((pack) => (
          <Card key={pack.id} className={pack.popular ? "border-primary/40" : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{pack.nombre}</CardTitle>
                {pack.popular && <Badge>Recomendado</Badge>}
              </div>
              <CardDescription>{pack.descripcionCorta}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold">
                ${pack.precioARS.toLocaleString("es-AR")}
                {pack.tipo === "recurrente" ? <span className="text-sm font-medium text-muted-foreground"> /mes</span> : null}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {pack.duracionHoras} h · {pack.sla}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {pack.entregables.slice(0, 3).map((e) => (
                  <li key={e} className="flex gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {e}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => setModalOpen(true)}>
                <CreditCard className="h-4 w-4 mr-1.5" />
                Contratar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {ordenes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              Tus pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {ordenes.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <div>
                  <p className="font-medium">#{o.id} · {o.pack.nombre}</p>
                  <p className="text-xs text-muted-foreground">{o.slotLabel ?? "Turno a coordinar"}</p>
                </div>
                <Badge variant={o.estadoPago === "pagado" ? "default" : "secondary"}>
                  {o.estadoPago}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <SolicitarEspecialistaModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}

export default function EspecialistaPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Cargando packs…</div>}>
      <EspecialistaPageContent />
    </Suspense>
  )
}

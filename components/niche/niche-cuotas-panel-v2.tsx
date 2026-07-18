"use client"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { NicheAppDefinition } from "@/lib/niche/types"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { toast } from "sonner"

export function NicheCuotasPanelV2({ app }: { app: NicheAppDefinition }) {
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [search, setSearch] = useState("")

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/niche/${app.appId}`, { headers: getAuthHeaders() })
    if (res.ok) {
      const data = await res.json()
      setMovimientos(data.movimientos ?? [])
    }
  }, [app.appId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cobrar = async (id: number) => {
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cobrar_cuota", id }),
    })
    if (res.ok) {
      toast.success("Cuota cobrada, deuda ajustada")
      cargar()
    } else {
      toast.error("Error al cobrar")
    }
  }

  const avisarMorosos = async () => {
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "whatsapp_masivo", soloPendientes: true }),
    })
    if (res.ok) toast.success("Avisos encolados por WA")
  }

  const filtered = movimientos.filter(m => 
    m.titulo.toLowerCase().includes(search.toLowerCase()) ||
    m.cliente?.nombre?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Cuotas V2</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={avisarMorosos}>Avisar Morosos WA</Button>
          <Button>Cuota Masiva</Button>
        </div>
      </div>
      
      <Input 
        placeholder="Buscar socio o título..." 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
        className="max-w-sm"
      />

      <Card>
        <CardHeader><CardTitle>Pendientes y Pagadas</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtered.map(mov => (
              <div key={mov.id} className="flex justify-between items-center p-3 border rounded-md">
                <div>
                  <p className="font-medium">{mov.titulo} - {mov.cliente?.nombre}</p>
                  <p className="text-sm text-muted-foreground">${mov.monto}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={mov.estado === "pagado" ? "secondary" : "destructive"}>
                    {mov.estado}
                  </Badge>
                  {mov.estado === "pendiente" && (
                    <>
                      <Button size="sm" onClick={() => cobrar(mov.id)}>Cobrar Efectivo</Button>
                      <Button size="sm" variant="outline" onClick={() => { window.open(`https://link.mercadopago.com.ar/mock?amount=${mov.monto}&ref=${mov.id}`, "_blank"); toast.info("Link de MP copiado para " + mov.cliente?.nombre) }}>Link MP</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

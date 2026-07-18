"use client"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { NicheAppDefinition } from "@/lib/niche/types"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { toast } from "sonner"
import { NicheClientePicker, type ClienteOption } from "./niche-cliente-picker"

// Mapa de estados sugeridos por nicho
const getDomainStates = (appId: string) => {
  const map: Record<string, string[]> = {
    plancha: ["recibido", "proceso", "listo", "entregado"],
    taller: ["ingreso", "presupuesto", "reparacion", "listo", "entregado"],
    delivery: ["pedido", "en_camino", "entregado", "cerrado"],
    obras: ["jornal", "adelanto", "liquidacion"],
    salon: ["seña", "evento", "saldo"],
  }
  return map[appId] || ["pendiente", "proceso", "listo", "cerrado"]
}

export function NicheMovimientosPanelV2({ app }: { app: NicheAppDefinition }) {
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const estadosDominio = getDomainStates(app.appId)

  // Form states
  const [titulo, setTitulo] = useState("")
  const [categoria, setCategoria] = useState(app.categorias?.[0] || "")
  const [monto, setMonto] = useState("")
  const [cliente, setCliente] = useState<ClienteOption | null>(null)

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

  const cambiarEstado = async (id: number, estado: string) => {
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "marcar_estado", id, estado }),
    })
    if (res.ok) {
      const data = await res.json()
      toast.success(`Estado actualizado a ${estado}`)
      if (data.whatsappEncolado) toast.info("WhatsApp automático enviado")
      cargar()
    }
  }

  const guardar = async () => {
    if (!titulo) return toast.error("El título es obligatorio")
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        categoria,
        monto: Number(monto),
        clienteId: cliente?.id,
        estado: estadosDominio[0] // Entra en el primer estado del pipeline
      }),
    })
    if (res.ok) {
      toast.success("Registro creado con éxito")
      setTitulo(""); setMonto(""); setCliente(null)
      cargar()
    }
  }

  const nextStateMap = (actual: string) => {
    const idx = estadosDominio.indexOf(actual)
    if (idx !== -1 && idx < estadosDominio.length - 1) return estadosDominio[idx + 1]
    return null
  }

  const filtered = movimientos.filter(m => {
    const textMatch = m.titulo.toLowerCase().includes(search.toLowerCase()) ||
                      m.metadata?.numero?.toLowerCase().includes(search.toLowerCase()) ||
                      m.cliente?.nombre?.toLowerCase().includes(search.toLowerCase())
    const stateMatch = filtroEstado === "todos" || m.estado === filtroEstado
    return textMatch && stateMatch
  })

  return (
    <div className="space-y-6">
      <div className="flex gap-4 p-4 border rounded-md bg-muted/20 items-end flex-wrap">
        <div className="flex-1 space-y-1">
          <label className="text-sm">Título / Descripción</label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-sm">Categoría</label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {app.categorias?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32 space-y-1">
          <label className="text-sm">Monto</label>
          <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} />
        </div>
        <div className="flex-1 space-y-1 min-w-[200px]">
          <label className="text-sm">Cliente (Opcional)</label>
          <NicheClientePicker value={cliente?.id ?? null} onChange={setCliente} />
        </div>
        <Button onClick={guardar}>Registrar Nuevo</Button>
      </div>

      <div className="flex gap-4">
        <Input 
          placeholder="Buscar por ticket (TK-), título o teléfono..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="flex-1"
        />
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {estadosDominio.map(e => <SelectItem key={e} value={e}>{e.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filtered.map(mov => {
          const nextState = nextStateMap(mov.estado)
          return (
            <div key={mov.id} className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="font-medium">
                  {mov.metadata?.numero && <span className="text-muted-foreground mr-2">[{mov.metadata.numero}]</span>}
                  {mov.titulo} 
                </p>
                <div className="flex gap-2 items-center text-sm text-muted-foreground">
                  <Badge variant="outline">{mov.categoria}</Badge>
                  {mov.cliente && <span>👤 {mov.cliente.nombre}</span>}
                  <span className="font-semibold text-foreground">${mov.monto}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={mov.estado === "entregado" || mov.estado === "cerrado" ? "secondary" : "default"}>
                  {mov.estado.toUpperCase()}
                </Badge>
                {nextState && (
                  <Button size="sm" variant="outline" onClick={() => cambiarEstado(mov.id, nextState)}>
                    Mover a {nextState} ➔
                  </Button>
                )}
                {mov.estado === "listo" && (
                  <Button size="sm" onClick={() => cambiarEstado(mov.id, "entregado")}>Cobrar y Entregar</Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

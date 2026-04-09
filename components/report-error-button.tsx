"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { Bug, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const MODULOS = [
  "dashboard",
  "ventas",
  "compras",
  "stock",
  "clientes",
  "afip",
  "impuestos",
  "contabilidad",
  "caja",
  "soporte",
]

export function ReportErrorButton() {
  const pathname = usePathname()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [modulo, setModulo] = useState("dashboard")
  const [prioridad, setPrioridad] = useState("media")
  const [hasToken, setHasToken] = useState(false)

  // Only show the button when the user is authenticated
  useEffect(() => {
    setHasToken(!!localStorage.getItem("token"))
    const onStorage = () => setHasToken(!!localStorage.getItem("token"))
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [pathname])

  const moduloSugerido = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean)
    return parts[1] || "dashboard"
  }, [pathname])

  const limpiar = () => {
    setTitulo("")
    setDescripcion("")
    setPrioridad("media")
    setModulo(moduloSugerido)
  }

  const enviar = async () => {
    if (titulo.trim().length < 4 || descripcion.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Completá un título y una descripción más detallada.",
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          modulo,
          prioridad,
          tipo: "bug",
          urlOrigen: pathname,
          stackTrace: `UA:${navigator.userAgent}`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo generar el ticket")

      toast({
        title: "Ticket generado",
        description: `Se creó ${data.numero}. El equipo de soporte ya lo ve en su bandeja.`,
      })
      setOpen(false)
      limpiar()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al reportar",
        description: error instanceof Error ? error.message : "No se pudo enviar el reporte",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!hasToken) return null

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setOpen(true)
          setModulo(moduloSugerido)
        }}
        className="fixed bottom-5 right-5 z-50 h-11 px-4 rounded-full shadow-lg"
      >
        <Bug className="h-4 w-4 mr-2" />
        Reportar error
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Crear ticket interno para soporte</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: No imprime comprobante en caja 2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Módulo</Label>
                <Select value={modulo} onValueChange={setModulo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULOS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={prioridad} onValueChange={setPrioridad}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Contá qué pasó, en qué paso y qué esperabas que ocurra..."
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={enviar} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Enviando..." : "Enviar ticket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

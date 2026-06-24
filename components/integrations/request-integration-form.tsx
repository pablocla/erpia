"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const SYNC_OPCIONES = [
  { id: "productos", label: "Productos / stock" },
  { id: "pedidos", label: "Pedidos / ventas" },
  { id: "clientes", label: "Clientes / contactos" },
  { id: "pagos", label: "Pagos / cobranzas" },
  { id: "fiscal", label: "Facturación fiscal" },
  { id: "logistica", label: "Envíos / logística" },
]

export function RequestIntegrationForm({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [nombre, setNombre] = useState("")
  const [sitio, setSitio] = useState("")
  const [email, setEmail] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [syncItems, setSyncItems] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || syncItems.length === 0 || !email.trim()) {
      toast({ title: "Completá los campos obligatorios", variant: "destructive" })
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/integrations/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          nombreSistema: nombre,
          sitioWeb: sitio || undefined,
          syncItems,
          descripcion,
          emailContacto: email,
        }),
      })
      if (res.ok) {
        toast({ title: "Solicitud enviada", description: "El equipo la revisará y te contactará." })
        setNombre("")
        setSitio("")
        setDescripcion("")
        setSyncItems([])
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error, variant: "destructive" })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/conexiones"><ArrowLeft className="h-4 w-4 mr-1" />Volver al catálogo</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>¿Necesitás una integración que no está aquí?</CardTitle>
          <CardDescription>
            Contanos qué sistema usás y qué querés sincronizar. Priorizamos las más pedidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="space-y-4">
            <div>
              <Label>Nombre del sistema *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Tango, SAP, Rappi" required />
            </div>
            <div>
              <Label>Sitio web</Label>
              <Input value={sitio} onChange={(e) => setSitio(e.target.value)} placeholder="https://..." type="url" />
            </div>
            <div>
              <Label>¿Qué sincronizar? *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {SYNC_OPCIONES.map((op) => (
                  <label key={op.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={syncItems.includes(op.id)}
                      onCheckedChange={(c) => {
                        setSyncItems((prev) => c ? [...prev, op.id] : prev.filter((x) => x !== op.id))
                      }}
                    />
                    {op.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Contanos en pocas palabras</Label>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Email de contacto *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Enviar solicitud
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type Detalle = {
  numero: string
  titulo: string
  descripcion: string
  estado: string
  prioridad: string
  comentarios: { autor: string; texto: string; createdAt: string }[]
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ClaverClienteTicketDetallePage() {
  const params = useParams()
  const id = params.id as string
  const [ticket, setTicket] = useState<Detalle | null>(null)
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!id) return
    const res = await fetch(`/api/claver-cliente/tickets/${id}`, { headers: authHeaders() })
    if (res.ok) setTicket(await res.json())
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const enviarComentario = async () => {
    if (!texto.trim()) return
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(`/api/claver-cliente/tickets/${id}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ texto: texto.trim() }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "No se pudo enviar el comentario")
        return
      }
      setTexto("")
      await cargar()
    } finally {
      setEnviando(false)
    }
  }

  if (!ticket) return <p className="text-sm text-muted-foreground">Cargando…</p>

  return (
    <div className="space-y-4">
      <Link href="/claver-cliente/tickets" className="text-sm text-primary">
        ← Volver
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {ticket.numero} — {ticket.titulo}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{ticket.estado}</Badge>
            <Badge variant="outline">{ticket.prioridad}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.descripcion}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comentarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ticket.comentarios.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin comentarios aún.</p>
          )}
          {ticket.comentarios.map((c, i) => (
            <div key={i} className="border rounded-md p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">
                {c.autor}
                {c.createdAt && (
                  <span className="ml-2">
                    {new Date(c.createdAt).toLocaleString("es-AR")}
                  </span>
                )}
              </p>
              <p>{c.texto}</p>
            </div>
          ))}
          <div className="pt-2 space-y-2 border-t">
            <Textarea
              placeholder="Escribí tu comentario o consulta…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              maxLength={4000}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              size="sm"
              onClick={enviarComentario}
              disabled={enviando || texto.trim().length < 2}
            >
              {enviando ? "Enviando…" : "Enviar comentario"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
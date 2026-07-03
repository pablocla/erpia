"use client"

import { useCallback, useEffect, useState } from "react"
import { Copy, Check, ExternalLink, Link2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "@/hooks/use-toast"

export function AgendaPublicLinkCard() {
  const empresaId = useAuthStore((s) => s.user?.empresaId)
  const [copied, setCopied] = useState(false)
  const [publicUrl, setPublicUrl] = useState("")

  useEffect(() => {
    if (!empresaId || typeof window === "undefined") return
    setPublicUrl(`${window.location.origin}/agenda-online/${empresaId}`)
  }, [empresaId])

  const copyLink = useCallback(async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast({ title: "Link copiado", description: "Pegalo en Instagram, WhatsApp o tu web." })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" })
    }
  }, [publicUrl])

  if (!empresaId) return null

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4 text-emerald-600" />
          Link para que reserven turnos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Tus clientas eligen día y horario sin entrar al panel. Necesitás al menos un profesional activo.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md border bg-background px-3 py-2 text-xs">
            {publicUrl || "…"}
          </code>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void copyLink()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1.5">{copied ? "Copiado" : "Copiar"}</span>
            </Button>
            {publicUrl && (
              <Button size="sm" variant="secondary" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Probar
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
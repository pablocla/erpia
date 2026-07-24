"use client"

import { useCallback, useEffect, useState } from "react"
import { Copy, Check, ExternalLink, Link2, Share2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "@/hooks/use-toast"
import { buildWaMeUrl } from "@/lib/comercial/whatsapp-copy"

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

  const shareWhatsApp = useCallback(() => {
    if (!publicUrl) return
    const text = `Reservá tu turno acá (elegís día y horario): ${publicUrl}`
    // Share without forcing a number — user picks contact
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }, [publicUrl])

  if (!empresaId) return null

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Link para que reserven solos
        </CardTitle>
        <CardDescription>
          Tus clientes eligen día y horario 24/7. Necesitás al menos un profesional activo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md border bg-background px-3 py-2 text-xs font-mono">
            {publicUrl || "…"}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void copyLink()} className="min-h-[40px]">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1.5">{copied ? "Copiado" : "Copiar"}</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={shareWhatsApp} className="min-h-[40px]">
              <Share2 className="h-4 w-4 mr-1.5" />
              Compartir WA
            </Button>
            {publicUrl && (
              <Button size="sm" variant="ghost" asChild className="min-h-[40px]">
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

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Copy, Check, Share2, Users, Sparkles } from "lucide-react"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

export function ViralReferralBanner() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    codigoReferido: string
    linkReferido: string
    recompensaTexto: string
    invitacionesExitosas: number
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    authFetch("/api/comercial/referrals")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setData(json)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return null

  const handleCopiar = () => {
    navigator.clipboard.writeText(data.linkReferido)
    setCopied(true)
    toast({
      title: "¡Link copiado!",
      description: "Compartilo con otros comerciantes o amigos.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCompartirWhatsApp = () => {
    const texto = `Hola! Estoy usando Claver ERP para mi negocio y está genial. Te paso el link para que lo pruebes gratis: ${data.linkReferido}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank")
  }

  return (
    <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent overflow-hidden">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">Invitá comercios y ganá meses gratis</h4>
              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">
                {data.invitacionesExitosas} invitados
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
              {data.recompensaTexto}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopiar}
            className="text-xs flex-1 sm:flex-none border-emerald-500/30 hover:bg-emerald-500/10"
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? "Copiado" : "Copiar Link"}
          </Button>

          <Button
            size="sm"
            onClick={handleCompartirWhatsApp}
            className="text-xs bg-[#25D366] hover:bg-[#1EBE5D] text-white flex-1 sm:flex-none font-medium"
          >
            <Share2 className="h-3.5 w-3.5 mr-1" />
            WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

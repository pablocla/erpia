"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { QrCode, Download, Printer, Sparkles, Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export interface PartnerQrCardProps {
  referralUrl: string
  referralCode: string
  partnerName?: string | null
}

export function PartnerQrCard({ referralUrl, referralCode, partnerName }: PartnerQrCardProps) {
  const { toast } = useToast()
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!referralUrl) return
    QRCode.toDataURL(referralUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("[QRCode error]", err))
  }, [referralUrl])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      toast({ title: "Link copiado al portapapeles" })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Error al copiar", variant: "destructive" })
    }
  }

  const handleDownload = () => {
    if (!qrDataUrl) return
    const link = document.createElement("a")
    link.download = `claver-partner-qr-${referralCode}.png`
    link.href = qrDataUrl
    link.click()
    toast({ title: "QR descargado correctamente" })
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Flyer Partner Claver - ${referralCode}</title>
          <style>
            @page { size: A5 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; color: #0f172a; margin: 0; padding: 20px; }
            .card { border: 2px solid #e2e8f0; border-radius: 24px; padding: 32px; max-width: 380px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .badge { display: inline-block; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid #a7f3d0; }
            h1 { font-size: 26px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.5px; }
            p { font-size: 14px; color: #64748b; margin: 0 0 24px; line-height: 1.4; }
            .qr-img { width: 220px; height: 220px; border-radius: 16px; border: 1px solid #e2e8f0; padding: 8px; }
            .code { font-family: monospace; font-size: 16px; font-weight: 700; color: #047857; margin-top: 16px; letter-spacing: 1px; }
            .footer { font-size: 11px; color: #94a3b8; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Prueba Gratis</div>
            <h1>Claver ERP & POS</h1>
            <p>Escaneá con tu celular y empezá a gestionar tu negocio, caja y presupuestos gratis.</p>
            <img class="qr-img" src="${qrDataUrl}" alt="QR Referido" />
            <div class="code">Código: ${referralCode}</div>
            <div class="footer">Software de gestión para comercios y oficios · claver.com.ar</div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <QrCode className="h-4 w-4" />
            </span>
            <CardTitle className="text-base font-bold">QR de Calle y Mostrador</CardTitle>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]">
            Referral Tracking
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Imprimí este QR o mostralo en tu celular para que almacenes, técnicos y comercios se registren con tu código.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 rounded-xl bg-background/80 border shadow-xs">
          {qrDataUrl ? (
            <div className="relative rounded-xl border bg-white p-2.5 shadow-xs shrink-0">
              <img src={qrDataUrl} alt="QR Partner" className="h-36 w-36 rounded-lg object-contain" />
            </div>
          ) : (
            <div className="h-36 w-36 animate-pulse rounded-xl bg-muted shrink-0" />
          )}

          <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tu Código</div>
              <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {referralCode}
              </div>
              {partnerName && <div className="text-xs text-muted-foreground">{partnerName}</div>}
            </div>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" />
                Descargar PNG
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />
                Imprimir Flyer
              </Button>
              <Button size="sm" variant="secondary" className="h-8 text-xs gap-1.5" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar Link"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

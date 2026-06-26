"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PosBarcodeCameraProps {
  onScan: (code: string) => void
  disabled?: boolean
}

export function PosBarcodeCamera({ onScan, disabled }: PosBarcodeCameraProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const detener = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const iniciar = useCallback(async () => {
    setError("")
    try {
      if (!("BarcodeDetector" in window)) {
        setError("Tu navegador no soporta escáner por cámara. Usá pistola USB o Chrome/Android.")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // @ts-expect-error BarcodeDetector es experimental
      const detector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "qr_code"],
      })

      const loop = async () => {
        if (!videoRef.current || !streamRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          const code = codes[0]?.rawValue
          if (code) {
            onScan(code)
            setOpen(false)
            return
          }
        } catch {
          /* frame skip */
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch {
      setError("No se pudo acceder a la cámara. Verificá permisos.")
    }
  }, [onScan])

  useEffect(() => {
    if (open) void iniciar()
    else detener()
    return detener
  }, [open, iniciar, detener])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={disabled}
        onClick={() => setOpen(true)}
        title="Escanear con cámara"
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-base">Escanear código</DialogTitle>
            <DialogDescription>Apuntá al código de barras del producto</DialogDescription>
          </DialogHeader>
          <div className="relative bg-black aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-8 border-2 border-primary/80 rounded-lg pointer-events-none" />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {error && (
            <p className="text-xs text-destructive px-4 pb-4">{error}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
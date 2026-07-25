"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle2, RotateCcw, PenTool } from "lucide-react"

interface PodSignatureDialogProps {
  open: boolean
  onClose: () => void
  envioNumero: string
  onSaveSignature: (signatureDataUrl: string, receptorNombre: string, receptorDni: string) => void
}

export function PodSignatureDialog({ open, onClose, envioNumero, onSaveSignature }: PodSignatureDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [receptorNombre, setReceptorNombre] = useState("")
  const [receptorDni, setReceptorDni] = useState("")

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.strokeStyle = "#0f172a"
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleConfirm = () => {
    if (!canvasRef.current || !hasSignature) return
    const dataUrl = canvasRef.current.toDataURL("image/png")
    onSaveSignature(dataUrl, receptorNombre, receptorDni)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            Firma Táctil POD (Proof of Delivery)
          </DialogTitle>
          <DialogDescription>
            Registrá la conformidad de entrega del Remito / Envío #{envioNumero}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nombre de quien recibe</Label>
              <Input
                placeholder="Ej. Juan Pérez"
                value={receptorNombre}
                onChange={(e) => setReceptorNombre(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">DNI / Documento</Label>
              <Input
                placeholder="Ej. 35.123.456"
                value={receptorDni}
                onChange={(e) => setReceptorDni(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <Label className="text-xs font-semibold">Firma digital táctil sobre pantalla</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearCanvas}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpiar firma
              </Button>
            </div>
            <div className="border border-border/80 rounded-lg p-1 bg-background shadow-xs touch-none">
              <canvas
                ref={canvasRef}
                width={380}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full bg-slate-50 dark:bg-slate-900 rounded cursor-crosshair"
              />
            </div>
            {!hasSignature && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                * Por favor dibuje la firma en el recuadro superior.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!hasSignature || !receptorNombre}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Confirmar Entrega POD
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

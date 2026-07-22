"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"

export interface PaywallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  requiredSku?: string
}

export function PaywallModal({
  open,
  onOpenChange,
  title = "Mejorá tu plan",
  description = "Llegaste al límite de uso gratuito o esta función requiere una suscripción activa.",
  requiredSku,
}: PaywallModalProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="flex flex-col items-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground max-w-sm">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              onOpenChange(false)
              router.push("/dashboard/facturacion-recurrente")
            }}
          >
            Ver opciones de suscripción
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Quizás más tarde
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PosSkuGateButtonProps {
  activo: boolean
  label: string
  icon: React.ReactNode
  onClick?: () => void
  className?: string
  sku?: string
}

export function PosSkuGateButton({
  activo,
  label,
  icon,
  onClick,
  className,
  sku,
}: PosSkuGateButtonProps) {
  if (!activo) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-8 sm:h-7 text-xs gap-1 opacity-60 ${className ?? ""}`}
              asChild
            >
              <Link href={sku ? `/dashboard/apps?sku=${sku}` : "/dashboard/apps"}>
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Activá {label} en App Store</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`h-8 sm:h-7 text-xs gap-1 ${className ?? ""}`}
      onClick={onClick}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
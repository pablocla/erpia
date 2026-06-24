"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CaeaPanel } from "@/components/fiscal/caea-panel"
import { CloudOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface PosCaeaPopoverProps {
  caeaVigente?: boolean
  className?: string
}

export function PosCaeaPopover({ caeaVigente, className }: PosCaeaPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 text-xs gap-1",
            caeaVigente && "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
            className,
          )}
        >
          <CloudOff className="h-3.5 w-3.5" />
          CAEA
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] p-0" align="end">
        <CaeaPanel puedeEditar puntoVentaDefault={1} />
      </PopoverContent>
    </Popover>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Type } from "lucide-react"

export function FontZoomToggle() {
  const [scale, setScale] = useState<"md" | "lg" | "xl">("md")

  useEffect(() => {
    const saved = localStorage.getItem("claver_font_scale") as "md" | "lg" | "xl" | null
    if (saved) {
      setScale(saved)
      applyScale(saved)
    }
  }, [])

  function applyScale(s: "md" | "lg" | "xl") {
    const root = document.documentElement
    if (s === "md") {
      root.removeAttribute("data-font-scale")
      root.style.fontSize = "16px"
    } else if (s === "lg") {
      root.setAttribute("data-font-scale", "lg")
      root.style.fontSize = "18px"
    } else if (s === "xl") {
      root.setAttribute("data-font-scale", "xl")
      root.style.fontSize = "20px"
    }
  }

  function handleSetScale(newScale: "md" | "lg" | "xl") {
    setScale(newScale)
    localStorage.setItem("claver_font_scale", newScale)
    applyScale(newScale)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 font-bold text-xs hover:bg-accent border border-border/50 rounded-lg"
          title="Tamaño de letra (Aumentar para mejor lectura)"
        >
          <Type className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px]">
            {scale === "md" ? "A" : scale === "lg" ? "A+" : "A++"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground border-b mb-1">
          👁️ Tamaño de letra (Lectura)
        </div>
        <DropdownMenuItem
          className={`cursor-pointer justify-between text-xs ${scale === "md" ? "font-bold bg-accent" : ""}`}
          onClick={() => handleSetScale("md")}
        >
          <span>Normal (Estándar)</span>
          <span className="text-muted-foreground font-mono">100%</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`cursor-pointer justify-between text-xs ${scale === "lg" ? "font-bold bg-accent text-primary" : ""}`}
          onClick={() => handleSetScale("lg")}
        >
          <span className="font-semibold">A+ Grande</span>
          <span className="text-emerald-600 font-bold font-mono">115%</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`cursor-pointer justify-between text-xs ${scale === "xl" ? "font-bold bg-accent text-primary" : ""}`}
          onClick={() => handleSetScale("xl")}
        >
          <span className="font-extrabold text-sm">A++ Extra Grande</span>
          <span className="text-emerald-600 font-bold font-mono">130%</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

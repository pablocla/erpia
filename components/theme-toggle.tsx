"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2.5 text-xs border-amber-500/30 bg-amber-500/10 text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300 font-medium"
        aria-label="Cambiando tema"
      >
        <Sun className="h-4 w-4" />
        <span className="hidden sm:inline">Modo claro</span>
      </Button>
    )
  }

  const isDark = (resolvedTheme || theme) === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className={`h-8 gap-1.5 px-2.5 text-xs font-semibold transition-all touch-target ${
              isDark
                ? "bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/25 hover:text-amber-300"
                : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100"
            }`}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                <span className="inline">Modo claro</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                <span className="inline">Modo oscuro</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs font-medium">
            {isDark ? "Pasar a modo claro (pantalla blanca)" : "Pasar a modo oscuro"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

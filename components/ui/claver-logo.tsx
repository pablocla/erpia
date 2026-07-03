import * as React from "react"
import { cn } from "@/lib/utils"

export function ClaverLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("text-primary", className)}
      aria-label="Claver Logo"
    >
      {/* Marco cuadrado con abertura en la esquina inferior izquierda */}
      <path 
        d="M 20 75 L 20 20 L 80 20 L 80 80 L 70 80" 
        stroke="currentColor" 
        strokeWidth="4" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Texto "Claver" asomando por la esquina inferior izquierda */}
      <text 
        x="10" 
        y="85" 
        fill="currentColor" 
        fontSize="28" 
        fontFamily="sans-serif" 
        fontWeight="600" 
        letterSpacing="-1.5"
      >
        Claver
      </text>
    </svg>
  )
}

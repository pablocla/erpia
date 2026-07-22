"use client"

import { useEffect } from "react"

export interface POSShortcutsHandlers {
  onSearchFocus?: () => void
  onPayCash?: () => void
  onPayQR?: () => void
  onApplyDiscount?: () => void
  onCancel?: () => void
}

/**
 * Custom hook for fast keyboard navigation in POS / Counter screens.
 * Enables zero-mouse operations for high-speed retail checkout.
 * 
 * F1: Focus search / barcode scanner
 * F2: Quick Pay Cash
 * F3: Quick Pay QR / MercadoPago
 * F4: Apply Discount
 * Esc: Cancel sale / clear cart
 */
export function usePOSShortcuts({
  onSearchFocus,
  onPayCash,
  onPayQR,
  onApplyDiscount,
  onCancel,
}: POSShortcutsHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing inside an input/textarea unless it's Esc or specific F-keys
      const target = e.target as HTMLElement | null
      const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA"

      if (e.key === "F1") {
        e.preventDefault()
        onSearchFocus?.()
      } else if (e.key === "F2") {
        e.preventDefault()
        onPayCash?.()
      } else if (e.key === "F3") {
        e.preventDefault()
        onPayQR?.()
      } else if (e.key === "F4") {
        e.preventDefault()
        onApplyDiscount?.()
      } else if (e.key === "Escape") {
        if (!isInput || target?.getAttribute("type") === "search") {
          onCancel?.()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onSearchFocus, onPayCash, onPayQR, onApplyDiscount, onCancel])
}

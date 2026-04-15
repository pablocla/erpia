"use client"

/**
 * useKeyboardShortcuts — Global keyboard shortcut system.
 *
 * Provides module-level hotkeys beyond Ctrl+K.
 * Competitors: SAP B1 has extensive keyboard shortcuts.
 */

import { useEffect, useCallback } from "react"

export interface KeyboardShortcut {
  /** Key identifier (e.g. "n", "e", "Delete", "Escape") */
  key: string
  /** Modifier keys */
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  /** Description for help overlay */
  description: string
  /** Handler */
  action: () => void
  /** Only active when no input/textarea is focused */
  ignoreInputs?: boolean
}

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || tag === "select" ||
    (el as HTMLElement).isContentEditable
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()
        const ctrlMatch = !!s.ctrl === (e.ctrlKey || e.metaKey)
        const shiftMatch = !!s.shift === e.shiftKey
        const altMatch = !!s.alt === e.altKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (s.ignoreInputs !== false && isInputFocused()) continue
          e.preventDefault()
          s.action()
          return
        }
      }
    },
    [shortcuts],
  )

  useEffect(() => {
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handler])
}

/**
 * Common ERP shortcuts builder.
 * Usage:
 *   useKeyboardShortcuts(erpShortcuts({
 *     onNew: () => setDialogOpen(true),
 *     onRefresh: () => cargarDatos(),
 *   }))
 */
export function erpShortcuts(handlers: {
  onNew?: () => void
  onRefresh?: () => void
  onSearch?: () => void
  onExport?: () => void
  onEscape?: () => void
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = []

  if (handlers.onNew) {
    shortcuts.push({
      key: "n",
      alt: true,
      description: "Nuevo registro (Alt+N)",
      action: handlers.onNew,
    })
  }
  if (handlers.onRefresh) {
    shortcuts.push({
      key: "r",
      alt: true,
      description: "Refrescar datos (Alt+R)",
      action: handlers.onRefresh,
    })
  }
  if (handlers.onSearch) {
    shortcuts.push({
      key: "f",
      ctrl: true,
      description: "Buscar (Ctrl+F)",
      action: handlers.onSearch,
      ignoreInputs: false,
    })
  }
  if (handlers.onExport) {
    shortcuts.push({
      key: "e",
      alt: true,
      description: "Exportar (Alt+E)",
      action: handlers.onExport,
    })
  }
  if (handlers.onEscape) {
    shortcuts.push({
      key: "Escape",
      description: "Cerrar diálogo (Esc)",
      action: handlers.onEscape,
      ignoreInputs: false,
    })
  }

  return shortcuts
}

"use client"

import { useEffect, useState } from "react"

/**
 * Custom hook for automatic draft saving of complex forms (Presupuestos, OTs, Pedidos).
 * Prevents data loss if power cuts out or tab is closed.
 */
export function useAutoSaveDraft<T>(key: string, initialData: T, delayMs = 1000) {
  const [data, setData] = useState<T>(() => {
    if (typeof window === "undefined") return initialData
    try {
      const saved = localStorage.getItem(`draft:${key}`)
      return saved ? JSON.parse(saved) : initialData
    } catch {
      return initialData
    }
  })

  const [hasSavedDraft, setHasSavedDraft] = useState(false)

  // Save to localStorage when data changes
  useEffect(() => {
    if (!key) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`draft:${key}`, JSON.stringify(data))
        setHasSavedDraft(true)
      } catch {
        /* storage full / disabled */
      }
    }, delayMs)

    return () => clearTimeout(timer)
  }, [key, data, delayMs])

  const clearDraft = () => {
    try {
      localStorage.removeItem(`draft:${key}`)
      setHasSavedDraft(false)
    } catch {}
  }

  return {
    data,
    setData,
    hasSavedDraft,
    clearDraft,
  }
}

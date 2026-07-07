"use client"

import { useState, useEffect } from "react"

export function useAppChecklist(appId: string, totalSteps: number) {
  const key = `claver_checklist_${appId}`
  const [completed, setCompleted] = useState<number[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        setCompleted(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [key])

  const toggleStep = (stepIndex: number) => {
    setCompleted((prev) => {
      const next = prev.includes(stepIndex)
        ? prev.filter((i) => i !== stepIndex)
        : [...prev, stepIndex]
      
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const progress = totalSteps > 0 ? (completed.length / totalSteps) * 100 : 0
  const isFinished = totalSteps > 0 && completed.length === totalSteps

  return {
    completed,
    toggleStep,
    progress,
    isFinished
  }
}

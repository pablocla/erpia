"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

function formatInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

interface AiMessageContentProps {
  content: string
  className?: string
}

export function AiMessageContent({ content, className }: AiMessageContentProps) {
  const lines = content.split("\n")
  const blocks: ReactNode[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length === 0) return
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc pl-4 space-y-0.5 my-1">
        {listItems.map((item, i) => (
          <li key={i}>{formatInline(item)}</li>
        ))}
      </ul>,
    )
    listItems = []
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }
    const bullet = trimmed.match(/^[-•*]\s+(.+)/)
    if (bullet) {
      listItems.push(bullet[1])
      return
    }
    flushList()
    blocks.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {formatInline(trimmed)}
      </p>,
    )
  })
  flushList()

  return <div className={cn("space-y-1", className)}>{blocks}</div>
}
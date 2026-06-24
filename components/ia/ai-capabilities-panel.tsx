"use client"

import { CheckCircle2, XCircle, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AI_CAN_DO, AI_CANNOT_DO, AI_EXAMPLE_PROMPTS } from "./ai-chat-constants"

interface AiCapabilitiesPanelProps {
  onSelectPrompt?: (prompt: string) => void
  compact?: boolean
}

export function AiCapabilitiesPanel({ onSelectPrompt, compact = false }: AiCapabilitiesPanelProps) {
  return (
    <div className={compact ? "space-y-3" : "space-y-3 sm:space-y-4"}>
      <Card className={compact ? "border-dashed" : undefined}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Puede ayudarte con
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {AI_CAN_DO.map((item) => (
              <li key={item} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <XCircle className="h-4 w-4 text-amber-600" />
            No puede (por diseño)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {AI_CANNOT_DO.map((item) => (
              <li key={item} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-amber-600 shrink-0 mt-0.5">×</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {onSelectPrompt && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Ejemplos para probar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-2">
            {AI_EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onSelectPrompt(prompt)}
                className="text-left text-sm rounded-lg border border-border/80 bg-muted/30 px-3 py-2 hover:bg-muted/60 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
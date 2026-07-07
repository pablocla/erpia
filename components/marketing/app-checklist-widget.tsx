"use client"

import { useState } from "react"
import { Check, CheckCircle2, ChevronUp, Trophy } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAppChecklist } from "@/hooks/use-app-checklist"
import { cn } from "@/lib/utils"
import type { AppExperienceGuide } from "@/lib/comercial/app-experience"

interface AppChecklistWidgetProps {
  appId: string
  guide: AppExperienceGuide
}

export function AppChecklistWidget({ appId, guide }: AppChecklistWidgetProps) {
  const { completed, toggleStep, progress, isFinished } = useAppChecklist(appId, guide.steps.length)
  const [open, setOpen] = useState(false)

  if (!guide.steps.length) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "fixed bottom-4 right-4 z-50 h-auto gap-3 rounded-full border-slate-200 bg-white p-3 pr-4 shadow-lg transition-all hover:bg-slate-50",
            isFinished && "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg">
            {isFinished ? <Trophy className="h-4 w-4 text-emerald-600" /> : guide.emoji}
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-xs font-medium text-slate-500">
              {isFinished ? "¡Todo listo!" : "Empezá por acá"}
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {completed.length} / {guide.steps.length} pasos
            </span>
          </div>
          <ChevronUp className="h-4 w-4 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mb-2 mr-4" align="end" side="top">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4">
          <h4 className="font-semibold text-slate-900">{guide.title}</h4>
          <p className="mt-1 text-xs text-slate-500">{guide.subtitle}</p>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs font-medium text-slate-500">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="p-2">
          {guide.steps.map((step, idx) => {
            const isDone = completed.includes(idx)
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleStep(idx)}
                className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white"
                  )}
                >
                  {isDone && <Check className="h-3 w-3" />}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isDone ? "text-slate-400 line-through" : "text-slate-700"
                  )}
                >
                  {step}
                </span>
              </button>
            )
          })}
        </div>
        {isFinished && (
          <div className="border-t border-slate-100 bg-emerald-50/50 p-3 text-center text-sm font-medium text-emerald-700">
            ¡Excelente! Ya podés sacarle todo el jugo a la app.
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

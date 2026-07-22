"use client"

import { usePresence, type ActiveUserPresence } from "@/hooks/use-presence"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit3 } from "lucide-react"

interface UserPresenceBarProps {
  resourceType: string
  resourceId?: string | null
  className?: string
}

export function UserPresenceBar({ resourceType, resourceId, className }: UserPresenceBarProps) {
  const { activeUsers } = usePresence(resourceType, resourceId)

  if (!activeUsers || activeUsers.length === 0) return null

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-full bg-muted/40 border text-xs ${className ?? ""}`}>
      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Eye className="h-3 w-3 text-emerald-500 animate-pulse" />
        Viendo ahora:
      </span>

      <div className="flex items-center -space-x-1.5 overflow-hidden">
        <TooltipProvider delayDuration={200}>
          {activeUsers.map((u) => (
            <Tooltip key={u.userId}>
              <TooltipTrigger asChild>
                <div className="relative inline-block">
                  <Avatar className="h-6 w-6 ring-2 ring-background text-[10px]">
                    <AvatarImage src={u.avatarUrl} alt={u.nombre} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {u.nombre.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {u.isEditing && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-1 ring-background flex items-center justify-center">
                      <Edit3 className="h-1.5 w-1.5 text-white" />
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{u.nombre}</p>
                <p className="text-[10px] text-muted-foreground">
                  {u.isEditing ? "Editando este formulario..." : "Visualizando esta pantalla"}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {activeUsers.some((u) => u.isEditing) && (
        <Badge variant="outline" className="h-4 text-[9px] px-1.5 bg-amber-500/10 text-amber-600 border-amber-200">
          Modo Edición Activo
        </Badge>
      )}
    </div>
  )
}

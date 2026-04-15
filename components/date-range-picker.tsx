"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  align?: "start" | "center" | "end"
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Seleccionar período",
  className,
  align = "start",
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 justify-start text-left text-xs font-normal",
            !value?.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "dd/MM/yy", { locale: es })} —{" "}
                {format(value.to, "dd/MM/yy", { locale: es })}
              </>
            ) : (
              format(value.from, "dd/MM/yyyy", { locale: es })
            )
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}

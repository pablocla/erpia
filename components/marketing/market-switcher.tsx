"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MARKETS, MARKET_COOKIE, MARKET_LOCKED_COOKIE, type MarketId } from "@/lib/comercial/markets"

export function MarketSwitcher() {
  const router = useRouter()
  const [currentMarketId, setCurrentMarketId] = React.useState<MarketId>("ar")
  const marketList = Object.values(MARKETS)

  React.useEffect(() => {
    // Leer cookie
    const match = document.cookie.match(new RegExp("(^| )" + MARKET_COOKIE + "=([^;]+)"))
    if (match && match[2]) {
      setCurrentMarketId(match[2] as MarketId)
    }
  }, [])

  const handleSelect = (marketId: MarketId) => {
    // Seteamos las cookies para forzar el mercado
    document.cookie = `${MARKET_COOKIE}=${marketId}; path=/; max-age=31536000; SameSite=Lax`
    document.cookie = `${MARKET_LOCKED_COOKIE}=true; path=/; max-age=31536000; SameSite=Lax`
    // Recargamos duro para que el server-side lea la nueva cookie y vuelva a renderizar todo
    window.location.href = window.location.href
  }

  const current = MARKETS[currentMarketId] || MARKETS.ar

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">{current.flag} {current.labelEn}</span>
          <span className="sm:hidden">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {marketList.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => handleSelect(m.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>{m.flag}</span>
              <span>{m.labelEn}</span>
            </div>
            {m.id === currentMarketId && (
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

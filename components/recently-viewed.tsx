"use client"

import Link from "next/link"
import { useUIStore } from "@/lib/stores/ui-store"
import { Clock, Star, StarOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function RecentlyViewed({ collapsed }: { collapsed?: boolean }) {
  const recentPages = useUIStore((s) => s.recentPages)
  const favoritePages = useUIStore((s) => s.favoritePages)
  const toggleFavorite = useUIStore((s) => s.toggleFavorite)
  const isFavorite = useUIStore((s) => s.isFavorite)

  if (collapsed) return null
  if (favoritePages.length === 0 && recentPages.length === 0) return null

  return (
    <div className="space-y-3 px-3 mt-3">
      {/* Favorites */}
      {favoritePages.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
            <Star className="h-3 w-3" />
            Favoritos
          </p>
          <div className="space-y-0.5">
            {favoritePages.map((fav) => (
              <div key={fav.href} className="flex items-center group">
                <Link
                  href={fav.href}
                  className="flex-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5 truncate"
                >
                  {fav.label}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => toggleFavorite(fav.href, fav.label)}
                >
                  <StarOff className="h-3 w-3 text-amber-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {recentPages.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Recientes
          </p>
          <div className="space-y-0.5">
            {recentPages.slice(0, 5).map((page) => (
              <div key={page.href} className="flex items-center group">
                <Link
                  href={page.href}
                  className="flex-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5 truncate"
                >
                  {page.label}
                </Link>
                {!isFavorite(page.href) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => toggleFavorite(page.href, page.label)}
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { useUIStore, type Locale } from "@/lib/stores/ui-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

const locales: { value: Locale; label: string; flag: string }[] = [
  { value: "es-AR", label: "Español (AR)", flag: "🇦🇷" },
  { value: "en-US", label: "English (US)", flag: "🇺🇸" },
  { value: "es-MX", label: "Español (MX)", flag: "🇲🇽" },
  { value: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
]

export function LocaleFlagToggle() {
  const { locale, setLocale } = useUIStore()
  const router = useRouter()

  const current = locales.find((l) => l.value === locale) || locales[0]

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale)
    // Update the cookie so the server knows the preference on next reload
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    
    // We optionally could update EmpresaTemaConfig via API if the user is admin,
    // but the local override works immediately.
    
    // Hard refresh to apply translations everywhere
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Idioma / Language">
          <span className="text-lg">{current.flag}</span>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => handleSelect(l.value)}
            className={locale === l.value ? "bg-accent" : ""}
          >
            <span className="mr-2 text-lg">{l.flag}</span>
            <span>{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

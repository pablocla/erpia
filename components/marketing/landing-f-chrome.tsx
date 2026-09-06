import type { ReactNode } from "react"
import Link from "next/link"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"

/** Shell de conversión AR. Sin market switcher, sin Cloud, sin menú ERP. */
export function LandingFChrome({
  children,
  homeHref = "/",
  extraFooter,
}: {
  children: ReactNode
  homeHref?: string
  extraFooter?: ReactNode
}) {
  return (
    <div data-page="landing" className="min-h-screen overflow-x-hidden text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <Link href={homeHref} className="shrink-0" aria-label="Claver, inicio">
            <BrandLogo size="sm" theme="light" variant="group-full" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <p className="hidden text-xs font-medium text-[var(--muted-foreground)] sm:block">
              Argentina
            </p>
            <Button variant="ghost" size="lg" className="min-h-12 text-muted-foreground" asChild>
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-[var(--muted-foreground)] sm:px-6 lg:px-8">
          <p>Hecho para comercios de Argentina. Pesos, AFIP y WhatsApp cuando hace falta.</p>
          <p className="mt-3">
            <Link href="/legal/terminos" className="underline underline-offset-2">
              Términos
            </Link>
            {" · "}
            <Link href="/legal/privacidad" className="underline underline-offset-2">
              Privacidad
            </Link>
            {" · "}
            <Link href="/claver/partners" className="underline underline-offset-2">
              Partners
            </Link>
          </p>
          {extraFooter ? <p className="mt-2">{extraFooter}</p> : null}
        </div>
      </footer>
    </div>
  )
}

export function LandingWrap({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
  )
}

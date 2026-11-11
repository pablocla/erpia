import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Velde",
  robots: { index: false, follow: false },
}

/**
 * Entrada mobile-first del tenant Velde.
 * Velde no tiene usuarios propios: se entra con la cuenta owner Claver →
 * Claver Cloud → Tenants → "Ingresar ERP" en Velde (impersonación, plan Pro).
 */
export default function VeldePage() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center gap-8 px-6 py-10 bg-background text-foreground">
      <h1 className="text-4xl font-extrabold tracking-tight">Velde</h1>
      <Link
        href="/login?next=/claver-cloud/tenants"
        className="w-full max-w-xs h-14 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-semibold touch-manipulation"
      >
        Ingresar
      </Link>
    </main>
  )
}

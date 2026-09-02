import { Metadata } from "next"
import { ExpressOnboardingWizard } from "@/components/onboarding/express-onboarding-wizard"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Configuración Express | POS System Argentina - Claver",
  description: "Configurá tu comercio en 2 minutos y comenzá a cobrar por WhatsApp y MercadoPago."
}

export default function ExpressOnboardingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-10 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-white bg-clip-text text-transparent">
            CLAVER
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Express
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Configuración segura y sin tarjeta</span>
        </div>
      </header>

      {/* Main Form Content */}
      <section className="my-auto z-10 w-full py-6">
        <ExpressOnboardingWizard />
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 z-10 py-4">
        <p>© 2026 Grupo Claver - Software para Comercio y Oficios en Argentina. Todos los derechos reservados.</p>
      </footer>
    </main>
  )
}

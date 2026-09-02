import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, FileText, Receipt, ShieldCheck, Sparkles, Zap } from "lucide-react"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PactarImplementacionArca } from "@/components/comercial/pactar-implementacion-arca"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Facturación Electrónica ARCA / AFIP 1-Clic | Claver",
  description:
    "Emití Facturas A, B y C oficiales de ARCA/AFIP al instante en PDF con QR fiscal sin entrar a la página oficial. Integración directa para comercios, profesionales y empresas.",
  alternates: { canonical: `${siteUrl}/arca` },
}

export default function ArcaLandingPage() {
  return (
    <div data-page="landing-arca" className="min-h-screen bg-slate-950 text-slate-50 antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="sm" theme="dark" variant="group-full" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
              <Link href="/">Volver a Oficios</Link>
            </Button>
            <Button size="sm" className="bg-amber-500 font-semibold text-slate-950 hover:bg-amber-400" asChild>
              <Link href="/login">Ingresar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 mb-4">
              Módulo Fiscal Autónomo
            </Badge>
            <h1 className="font-[var(--font-fraunces)] text-4xl font-semibold sm:text-5xl text-white">
              Facturación ARCA / AFIP oficial en 1 clic.
              <span className="block text-amber-400">Sin entrar a la web del gobierno.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-300">
              Conexión directa por Web Services (WSFE + CAEA Offline). Emití Facturas A, B, C, Notas de Crédito y Débito
              al instante en PDF con código QR fiscal para enviar por WhatsApp o imprimir.
            </p>
          </div>

          {/* Cards de características */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base">Emisión Ultrarrápida</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Obtené el CAE y el QR fiscal en menos de 1 segundo directamente desde tu celular o computadora.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base">Facturas A, B, C y MiPyME</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Soporte total para Monotributistas, Responsables Inscriptos, Facturas de Crédito Electrónica MiPyME y Exportación.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base">Contingencia Offline CAEA</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Si AFIP se cae o se te corta internet, el sistema sigue emitiendo comprobantes bajo régimen CAEA sin frenar tus ventas.
              </p>
            </div>
          </div>

          {/* Formulario / Modal de Implementación Asistida ARCA */}
          <div className="mt-16 rounded-3xl border border-amber-500/30 bg-slate-900/90 p-8 sm:p-12 text-center">
            <h2 className="font-[var(--font-fraunces)] text-2xl sm:text-3xl font-bold text-white">
              ¿Querés que configuremos tu facturación ARCA de punta a punta?
            </h2>
            <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto">
              Nuestro equipo de soporte te asiste en la delegación de certificados digitales en AFIP,
              alta de puntos de venta y habilitación inmediata en tu cuenta.
            </p>
            <div className="mt-8 flex justify-center">
              <PactarImplementacionArca
                triggerLabel="Solicitar Implementación ARCA"
                triggerClassName="bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 px-6 py-2.5 h-auto text-sm"
                variant="landing"
                pagina="/arca"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

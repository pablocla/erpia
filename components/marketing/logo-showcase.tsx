"use client"

import Image from "next/image"
import { BrandLogo, ClaverIcon } from "@/components/marketing/brand-logo"
import { BRAND_ASSETS } from "@/lib/brand"
import { ScrollReveal } from "@/components/ui/motion"

interface LogoShowcaseProps {
  variant?: "matrix" | "claverp" | "clavergrow"
}

/** Bloque visual de marca para heroes de landing */
export function LogoShowcase({ variant = "matrix" }: LogoShowcaseProps) {
  const isClaverp = variant === "claverp"
  const isClavergrow = variant === "clavergrow"

  return (
    <ScrollReveal className="mt-16">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-8 shadow-2xl backdrop-blur-md sm:p-12">
        <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-primary">
          El Ecosistema {isClaverp ? "ClavERP" : isClavergrow ? "ClaverGrow" : "Claver"}
        </h2>
        <p className="mb-12 text-center text-xl font-medium text-slate-200 sm:text-2xl">
          Tecnología de alto rendimiento para escalar tus operaciones
        </p>

        <div className="flex flex-col items-center justify-center gap-12 sm:flex-row sm:gap-20">
          <div className="flex flex-col items-center text-center">
            <BrandLogo
              size="lg"
              theme="dark"
              variant={
                isClavergrow ? "clavergrow-full" : isClaverp ? "claverp-full" : "group-full"
              }
              showByClaver={isClaverp || isClavergrow}
            />
            <h3 className="mt-6 text-sm font-semibold text-slate-200">
              {isClavergrow ? "Growth Engine" : isClaverp ? "ERP Inteligente" : "Plataforma Core"}
            </h3>
            <p className="mt-2 max-w-[200px] text-xs leading-relaxed text-slate-400">
              {isClavergrow 
                ? "Acelera tus ventas con herramientas de marketing automatizado." 
                : isClaverp 
                  ? "Gestión integral, facturación AFIP y control de stock en tiempo real." 
                  : "Infraestructura robusta diseñada para alta disponibilidad."}
            </p>
          </div>

          <div className="hidden h-32 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent sm:block" />

          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex gap-4 items-center justify-center h-[72px]">
              <ClaverIcon size={56} className="text-primary opacity-80" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Ecosistema Integrado
              </h3>
              <p className="mt-2 max-w-[200px] text-xs leading-relaxed text-slate-400">
                Sincronización perfecta entre todos los módulos de tu negocio.
              </p>
            </div>
          </div>
        </div>

        {!isClavergrow && (
          <div className="mt-14 flex flex-col items-center justify-center space-y-4 border-t border-white/5 pt-10">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Respaldado por
            </p>
            <BrandLogo size="md" variant="group-full" theme="dark" className="opacity-80 transition-all hover:opacity-100" />
          </div>
        )}
      </section>
    </ScrollReveal>
  )
}
"use client"

import Image from "next/image"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { BRAND_ASSETS } from "@/lib/brand"
import { ScrollReveal } from "@/components/ui/motion"

interface LogoShowcaseProps {
  variant?: "matrix" | "claverp"
}

/** Bloque visual de marca para heroes de landing */
export function LogoShowcase({ variant = "matrix" }: LogoShowcaseProps) {
  const isClaverp = variant === "claverp"

  return (
    <ScrollReveal className="mt-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-10">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-slate-400">
          Identidad de marca
        </p>
        <div className="flex flex-col items-center justify-center gap-10 sm:flex-row sm:gap-16">
          <div className="text-center">
            <BrandLogo
              size="lg"
              theme="dark"
              variant={isClaverp ? "claverp-full" : "group-full"}
              showByClaver={isClaverp}
            />
            <p className="mt-4 text-xs text-slate-500">Componente React (vivo)</p>
          </div>
          <div className="hidden h-24 w-px bg-white/10 sm:block" />
          <div className="flex flex-col items-center gap-4">
            <Image
              src={isClaverp ? BRAND_ASSETS.claverpIcon : BRAND_ASSETS.claverIcon}
              alt=""
              width={80}
              height={80}
              className="rounded-2xl shadow-lg shadow-blue-900/30"
            />
            {!isClaverp && (
              <Image
                src={BRAND_ASSETS.claverpIcon}
                alt=""
                width={56}
                height={56}
                className="rounded-xl opacity-90"
              />
            )}
            <p className="text-xs text-slate-500">SVG en /public/brand/</p>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <Image
            src={BRAND_ASSETS.claverpLockup}
            alt="Clavis by Claver"
            width={280}
            height={56}
            className="opacity-95"
          />
        </div>
      </div>
    </ScrollReveal>
  )
}
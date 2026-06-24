import { ClaverShell } from "@/components/marketing/claver-shell"
import { ClavisPricingSection } from "@/components/marketing/clavis-pricing-section"
import { MotionFadeDown } from "@/components/ui/motion"
import Link from "next/link"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"

export const metadata = {
  title: "Precios y Planes — Clavis ERP",
  description:
    "Planes empaquetados Clavis 2026: Core + bundles Omnicanal, Envíos, Industria y más. Precios en ARS para PyMEs argentinas.",
}

export default function ClavisPreciosPage() {
  return (
    <ClaverShell context="claverp" theme="light">
      <div className="pt-24 pb-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Link
              href="/claver/claverp"
              className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
            >
              ← Volver a Clavis
            </Link>
          </MotionFadeDown>
        </div>
      </div>
      <ClavisPricingSection />
    </ClaverShell>
  )
}
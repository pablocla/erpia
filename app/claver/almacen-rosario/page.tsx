import { Suspense } from "react"
import Link from "next/link"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { AlmacenRosarioVitrine } from "@/components/marketing/almacen-rosario-vitrine"
import { MotionFadeDown } from "@/components/ui/motion"

export const metadata = {
  title: "Pack Almacén Rosario — Retail de barrio | Clavis",
  description:
    "18 módulos para kioscos y almacenes: envases, vales, listas distribuidora, 2×1, arqueo ciego. Pack $34.900/mes. Todo visible, activás lo que necesitás.",
}

export default function AlmacenRosarioMarketingPage() {
  return (
    <ClaverShell context="claverp" theme="light">
      <div className="pt-24 pb-8 bg-gradient-to-b from-orange-50/80 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown>
            <Link
              href="/claver/apps"
              className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
            >
              ← Claver AutoPool
            </Link>
            <h1 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
              Pack Almacén Rosario
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Para el dueño que atiende el mostrador: margen, merma, envases y caja sin cuadernos ni Excel.
            </p>
          </MotionFadeDown>
        </div>
      </div>
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Suspense>
            <AlmacenRosarioVitrine variant="full" ctaMode="public" />
          </Suspense>
        </div>
      </section>
    </ClaverShell>
  )
}
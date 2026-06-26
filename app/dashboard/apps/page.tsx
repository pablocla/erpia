import Link from "next/link"
import { Metadata } from "next"
import { Suspense } from "react"
import { Network, Sparkles, Store } from "lucide-react"
import { AppStoreGrid } from "@/components/marketplace/app-store-grid"
import { ProductControlPanel } from "@/components/platform/product-control-panel"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "App Store | Clavis ERP",
  description: "Marketplace de servicios automáticos para tu empresa.",
}

export default function AppsPage() {
  return (
    <div className="flex-1 w-full p-4 md:p-8 pt-6 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-orange-500/25 bg-orange-500/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            <Store className="h-4 w-4 text-orange-500" />
            Pack Almacén Rosario
          </p>
          <p className="text-xs text-muted-foreground">
            18 módulos visibles: margen, envases, vales, recargas, balanza, 2×1 y más. Solo se desactiva sin SKU.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/almacen">Panel</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/almacen/guia">Guía</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/claver/almacen-rosario">Vitrina web</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-500/25 bg-slate-500/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            <Network className="h-4 w-4 text-slate-500" />
            OPO Studio Bridge
          </p>
          <p className="text-xs text-muted-foreground">
            Ontología sobre Protheus o Clavis nativo — REST/SQL, discovery y playground IA.
          </p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/dashboard/apps/opo">Abrir panel OPO</Link>
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-violet-500/25 bg-violet-500/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Premium ERP 7
          </p>
          <p className="text-xs text-muted-foreground">
            Guardián POS, liquidación MP, fiscal, JIT y OCR — panel unificado.
          </p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/dashboard/apps/premium">Abrir panel Premium</Link>
        </Button>
      </div>
      <ProductControlPanel />
      <Suspense>
        <AppStoreGrid />
      </Suspense>
    </div>
  )
}

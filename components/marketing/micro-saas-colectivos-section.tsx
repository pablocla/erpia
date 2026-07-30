"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
import {
  MICRO_SAAS_COLECTIVOS,
  productsForColectivo,
  type MicroSaasColectivo,
  type MicroSaasColectivoId,
  type MicroSaasProducto,
} from "@/lib/comercial/micro-saas-portfolio"
import { fmtPrecioArs } from "@/lib/comercial/sub-saas-catalog"
import { activarRegisterHref } from "@/lib/comercial/activar-intent"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MotionList, MotionListItem, ScrollReveal } from "@/components/ui/motion"
import { cn } from "@/lib/utils"

const ACCENT: Record<
  MicroSaasColectivo["accent"],
  { card: string; badge: string; pill: string; btn: string }
> = {
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-b from-emerald-50/80 to-white hover:border-emerald-300",
    badge: "bg-emerald-600 text-white",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
    btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  sky: {
    card: "border-sky-200/80 bg-gradient-to-b from-sky-50/80 to-white hover:border-sky-300",
    badge: "bg-sky-600 text-white",
    pill: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
    btn: "bg-sky-600 hover:bg-sky-700 text-white",
  },
  violet: {
    card: "border-violet-200/80 bg-gradient-to-b from-violet-50/80 to-white hover:border-violet-300",
    badge: "bg-violet-600 text-white",
    pill: "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100",
    btn: "bg-violet-600 hover:bg-violet-700 text-white",
  },
  amber: {
    card: "border-amber-200/80 bg-gradient-to-b from-amber-50/80 to-white hover:border-amber-300",
    badge: "bg-amber-600 text-white",
    pill: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
    btn: "bg-amber-600 hover:bg-amber-700 text-white",
  },
}

function priceLabel(p: MicroSaasProducto): string {
  if (p.anclaGratis || p.precioArs === 0) return "Gratis"
  return `${fmtPrecioArs(p.precioArs)}/mes`
}

function ProductPill({
  product,
  accentClass,
}: {
  product: MicroSaasProducto
  accentClass: string
}) {
  const href = activarRegisterHref(product.sku)
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        accentClass,
      )}
    >
      <span className="font-semibold">{product.marca.replace("Claver ", "")}</span>
      <span className="opacity-70">{priceLabel(product)}</span>
    </Link>
  )
}

function ColectivoCard({
  colectivo,
  expanded,
  onToggle,
  isUs = false,
}: {
  colectivo: MicroSaasColectivo
  expanded: boolean
  onToggle: () => void
  isUs?: boolean
}) {
  const products = productsForColectivo(colectivo.id)
  const a = ACCENT[colectivo.accent]
  const leader = products[0]

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border p-5 shadow-sm transition sm:p-6",
        a.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-2xl" aria-hidden>
            {colectivo.emoji}
          </span>
          <h3 className="mt-2 font-[var(--font-fraunces)] text-xl font-semibold text-slate-900">
            {colectivo.nombre}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-700">{colectivo.lema}</p>
          <p className="mt-1 text-xs text-slate-500">{colectivo.paraQuien}</p>
        </div>
        <Badge className={cn("shrink-0", a.badge)}>
          {products.length} app{products.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {/* Siempre visibles: pills de productos (colectivo, no catálogo plano) */}
      <div className="mt-4 flex flex-wrap gap-2">
        {products.map((p) => (
          <ProductPill key={p.sku} product={p} accentClass={a.pill} />
        ))}
      </div>

      {/* Expand: free vs paid de cada app — opcional, no satura above fold */}
      <button
        type="button"
        onClick={onToggle}
        className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
        aria-expanded={expanded}
      >
        {expanded ? (isUs ? "Hide details" : "Ocultar detalle") : (isUs ? "View free vs paid" : "Ver free vs pago")}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition", expanded && "rotate-180")}
          aria-hidden
        />
      </button>

      {expanded && (
        <ul className="mt-3 space-y-2 border-t border-slate-200/80 pt-3">
          {products.map((p) => (
            <li key={p.sku} className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{p.marca}</span>
              <span className="mt-0.5 block text-slate-500">
                Free: {p.anclaGratisDetalle}
              </span>
              <span className="block text-slate-500">Pago: {p.gatilloPago}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" className={cn("rounded-full", a.btn)}>
          <Link href={colectivo.ctaHref}>
            {colectivo.ctaLabel}
            <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
        {leader && (
          <Button asChild size="sm" variant="ghost" className="rounded-full text-slate-600">
            <Link href={`/claver/apps/${leader.subSaasSlug ?? leader.slug}`}>
              {isUs ? "View product" : "Ver ficha"}
            </Link>
          </Button>
        )}
      </div>
    </article>
  )
}

/**
 * Sección home: 4 colectivos (no 11 productos sueltos).
 * Cada colectivo se vende como línea de producto distinta con apps hermanas.
 */
export function MicroSaasColectivosSection({
  className,
  highlightColectivo,
  isUs = false,
}: {
  className?: string
  /** Resalta el colectivo alineado al dolor del hero */
  highlightColectivo?: MicroSaasColectivoId
  isUs?: boolean
}) {
  const [openId, setOpenId] = useState<MicroSaasColectivoId | null>(null)

  return (
    <section
      id="apps-por-colectivo"
      aria-labelledby="colectivos-heading"
      className={cn(
        "scroll-mt-24 border-b border-slate-200/80 bg-slate-50/80 px-4 py-14 sm:px-6",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isUs ? "Claver Apps · freemium" : "Apps Claver · freemium"}
          </p>
          <h2
            id="colectivos-heading"
            className="mt-2 font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl"
          >
            {isUs ? "Four suites. Eleven apps. No ERP menus." : "Cuatro líneas. Once apps. Sin menú de ERP."}
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            {isUs ? "Each suite works standalone. Start free or on trial, upgrade when the system prompts you." : "Cada línea se vende sola — como un producto chico con su precio y su promesa. Empezás gratis o en trial; pagás cuando el sistema te cobra o te avisa solo."}
          </p>
        </ScrollReveal>

        <MotionList className="mt-8 grid gap-4 sm:grid-cols-2">
          {MICRO_SAAS_COLECTIVOS.map((c) => (
            <MotionListItem key={c.id}>
              <div
                className={cn(
                  highlightColectivo === c.id && "ring-2 ring-offset-2 ring-slate-900/10 rounded-2xl",
                )}
              >
                <ColectivoCard
                  colectivo={c}
                  expanded={openId === c.id}
                  onToggle={() => setOpenId((id) => (id === c.id ? null : c.id))}
                  isUs={isUs}
                />
              </div>
            </MotionListItem>
          ))}
        </MotionList>

        <p className="mt-8 text-center text-sm text-slate-500">
          {isUs ? "Want to see the full ecosystem catalog?" : "¿Querés ver el catálogo completo del ecosistema?"} {" "}
          <Link href="/claver/apps" className="font-medium text-slate-800 underline-offset-4 hover:underline">
            {isUs ? "Go to Claver Apps" : "Ir a Apps Claver"}
          </Link>
        </p>
      </div>
    </section>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Lock, ShoppingBag, Smartphone } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { LandingFChrome, LandingWrap } from "@/components/marketing/landing-f-chrome"
import { LANDING_F_CTA_CLASS, landingFRegisterHref } from "@/lib/comercial/landing-f"
import { PactarImplementacionArca } from "@/components/comercial/pactar-implementacion-arca"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      absolute: "Tu punto de venta y tu libreta de fiados, gratis | Claver",
    },
    description:
      "Anotá ventas, controlá el stock y sabé quién te debe. Desde el celular o la compu. Sin tarjeta y sin vencimiento. Argentina.",
    alternates: { canonical: `${siteUrl}/f` },
    openGraph: {
      title: "Tu punto de venta y tu libreta de fiados, gratis | Claver",
      description:
        "Libreta y caja para tu negocio, sin tarjeta. Los extras (WhatsApp, AFIP) se prenden cuando los necesites.",
      url: `${siteUrl}/f`,
      locale: "es_AR",
      siteName: CLAVER_GROUP.name,
    },
  }
}

export default async function LandingFPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  const registerHref = landingFRegisterHref(ref)

  return (
    <LandingFChrome
      extraFooter={
        <Link href="/f/servicios" className="underline underline-offset-2">
          ¿Presupuestás obras u oficios? Esta no es tu puerta
        </Link>
      }
    >
      <main className="pb-16 sm:pb-24">
        <LandingWrap className="grid items-center gap-10 pt-8 sm:pt-12 lg:grid-cols-2 lg:gap-16 lg:pt-16">
          <div>
            <p className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide bg-[var(--landing-badge-free)] text-[var(--landing-badge-free-fg)]">
              Gratis · Sin tarjeta · Sin vencimiento del cuaderno
            </p>
            <h1 className="font-[var(--font-fraunces)] text-3xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
              Tu libreta de fiados. En el celular.
            </h1>
            <p className="mt-4 max-w-xl text-base text-[var(--muted-foreground)] sm:text-lg">
              Anotá quién te debe y cuánto. Chau cuaderno de papel.
              Caja, stock y WhatsApp de cobro los activás después — no hace falta el día uno.
            </p>
            <div className="mt-6 space-y-3">
              <Button size="lg" className={LANDING_F_CTA_CLASS} asChild>
                <Link href={registerHref}>Empezar gratis</Link>
              </Button>
              <p className="text-xs text-[var(--muted-foreground)] sm:text-sm">
                Empezás con Claver Fiado (libreta). El resto, cuando el negocio lo pida.
              </p>
            </div>
          </div>

          <section
            aria-label="Vista de la libreta"
            className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
          >
            <div className="border-b border-[var(--border)] px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)]">
              Quién me debe · ahora
            </div>
            <ul className="divide-y divide-[var(--border)]">
              <li className="flex items-center justify-between px-4 py-3.5 sm:px-5">
                <span className="font-medium">Pérez</span>
                <span className="font-semibold tabular-nums">$12.000</span>
              </li>
              <li className="flex items-center justify-between px-4 py-3.5 sm:px-5">
                <span className="font-medium">García</span>
                <span className="font-semibold tabular-nums">$4.500</span>
              </li>
              <li className="flex items-center justify-between px-4 py-3.5 text-[var(--muted-foreground)] sm:px-5">
                <span>López</span>
                <span className="tabular-nums">$800</span>
              </li>
            </ul>
          </section>
        </LandingWrap>

        <LandingWrap className="mt-12 sm:mt-16">
          <ul className="grid gap-6 sm:grid-cols-3">
            <li className="flex gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
              <div>
                <p className="font-semibold">Chau cuaderno de papel</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Deudores, entregas y saldos sin perder hojas ni sacar cuentas a mano.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
              <div>
                <p className="font-semibold">Cobro en mostrador</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Buscá productos, cargá precios y controlá la caja del día.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
              <div>
                <p className="font-semibold">En el celu y en la compu</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Si cambiás de teléfono, la libreta sigue ahí.
                </p>
              </div>
            </li>
          </ul>
        </LandingWrap>

        <LandingWrap className="mt-14 sm:mt-20">
          <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold leading-tight sm:text-3xl">
            El sistema te avisa.
            <span className="block">Vos vendés.</span>
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { k: "Stock", t: "Te quedan 3 paquetes de yerba. Las últimas duraron 4 días." },
              { k: "Cobranza", t: "Pérez te debe $12.000 hace 15 días. ¿Le aviso?" },
              { k: "Caja", t: "Hoy entraron $X. Si no cierra, lo ves al toque." },
              { k: "Semana", t: "Esta semana vendiste más que la anterior." },
            ].map((c) => (
              <p
                key={c.k}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--landing-accent)]">
                  {c.k}
                </span>
                <span className="mt-1 block text-[var(--foreground)]">“{c.t}”</span>
              </p>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--muted-foreground)] sm:text-sm">
            Los avisos en pantalla van en el gratis. Mandar el WhatsApp al deudor es extra (nos cuesta a nosotros).
          </p>
        </LandingWrap>

        <LandingWrap className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-start sm:mt-20">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <h2 className="font-[var(--font-fraunces)] text-lg font-semibold sm:text-xl">¿Por qué es gratis?</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              La caja y el fiado son pantalla y datos: no te los cobramos. Pagás cuando el sistema
              <strong> cierra</strong> el problema: el aviso por WhatsApp, el link de cobro, o la factura AFIP.
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-[var(--landing-cta)] sm:text-4xl">$0</p>
            <p className="text-sm text-[var(--muted-foreground)]">dueño + 1 cajero · 1 caja · para siempre</p>

            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="extras" className="border-border">
                <AccordionTrigger className="text-sm font-medium">
                  Hay extras. No las necesitás para arrancar.
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
                  <p className="flex gap-2">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    Cobrá: avisos y link por WhatsApp. Se activa cuando ya ves quién te debe.
                  </p>
                  <p className="flex gap-2">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    Factura AFIP A/B/C. El ticket interno sigue gratis.
                  </p>
                  <p className="flex gap-2">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    Segunda caja y 3er usuario: cuando el local ya está andando.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section>
            <h2 className="font-[var(--font-fraunces)] text-lg font-semibold sm:text-xl">Preguntas de vereda</h2>
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="trucho">
                <AccordionTrigger className="text-sm">¿Si es gratis es trucho?</AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--muted-foreground)]">
                  No. La libreta y la caja no vencen. Cobramos el disparo que a nosotros nos sale plata (WhatsApp,
                  AFIP) o el link cuando tu deudor paga.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tarjeta">
                <AccordionTrigger className="text-sm">¿Me van a pedir la tarjeta?</AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--muted-foreground)]">
                  No para arrancar. Cero tarjeta, cero CBU, cero vencimiento del gratis.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="afip">
                <AccordionTrigger className="text-sm">¿Hace factura AFIP / ARCA?</AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
                  <p>
                    El ticket interno sí, gratis. La factura A/B/C con CAE se pacta con quien tenga acceso a ARCA para emitir el certificado. Mientras tanto vendés sin ticket oficial.
                  </p>
                  <PactarImplementacionArca
                    variant="compact"
                    triggerLabel="Pactar certificado ARCA / WhatsApp"
                    pagina="/f"
                    defaultArca
                    defaultWhatsapp
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cerrar">
                <AccordionTrigger className="text-sm">¿Y si cierran?</AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--muted-foreground)]">
                  Tus datos son tuyos. Si no usás el sistema 90 días, la libreta se congela — no se vende a terceros.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </LandingWrap>

        <LandingWrap className="mt-14 space-y-3 sm:mt-20">
          <Button size="lg" className={LANDING_F_CTA_CLASS} asChild>
            <Link href={registerHref}>Empezar gratis</Link>
          </Button>
          <p className="text-xs text-[var(--muted-foreground)] sm:text-sm">1 minuto · Sin tarjeta · Empezás por el fiado</p>
        </LandingWrap>
      </main>
    </LandingFChrome>
  )
}

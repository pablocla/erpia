import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList, Lock, Smartphone, Wallet } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { LandingFChrome, LandingWrap } from "@/components/marketing/landing-f-chrome"
import { LANDING_F_CTA_CLASS, landingFServiciosRegisterHref } from "@/lib/comercial/landing-f"
import { PactarImplementacionArca } from "@/components/comercial/pactar-implementacion-arca"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      absolute: "Presupuestos de oficio en el celu. Seña antes de comprar materiales | Claver",
    },
    description:
      "Electricista, plomero, pintor, gasista: armá el presupuesto en 3 niveles, mirá quién no te pagó la seña. Sin tarjeta para arrancar. Argentina.",
    alternates: { canonical: `${siteUrl}/f/servicios` },
    openGraph: {
      title: "Presupuestos de oficio en el celu | Claver",
      description:
        "Dejá el audio de WhatsApp. Presupuesto en 3 opciones, seña antes de los materiales. El disparo (link y aviso) se activa cuando cobrás.",
      url: `${siteUrl}/f/servicios`,
      locale: "es_AR",
      siteName: CLAVER_GROUP.name,
    },
  }
}

export default async function LandingFServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  const registerHref = landingFServiciosRegisterHref(ref)

  return (
    <LandingFChrome
      extraFooter={
        <Link href="/f" className="underline underline-offset-2">
          ¿Tenés un kiosco o almacén? Esta no es tu puerta
        </Link>
      }
    >
      <main className="pb-16 sm:pb-24">
        <LandingWrap className="grid items-center gap-10 pt-8 sm:pt-12 lg:grid-cols-2 lg:gap-16 lg:pt-16">
          <div>
            <p className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide bg-[var(--landing-badge-free)] text-[var(--landing-badge-free-fg)]">
              Sin tarjeta para arrancar · En el celu
            </p>
            <h1 className="font-[var(--font-fraunces)] text-3xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
              Presupuesto en el celu.
              <span className="block">Seña antes de comprar cables.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-[var(--muted-foreground)] sm:text-lg">
              Tres opciones para el cliente. Vos ves quién no pagó. El link de seña y el WhatsApp se prenden
              cuando cobrás de verdad.
            </p>
            <div className="mt-6 space-y-3">
              <Button size="lg" className={LANDING_F_CTA_CLASS} asChild>
                <Link href={registerHref}>Armar presupuesto ahora</Link>
              </Button>
              <p className="text-xs text-[var(--muted-foreground)] sm:text-sm">
                No calcula tableros ni CIRSOC. Cuida tu plata: presupuesto, seña y margen de la obra.
              </p>
            </div>
          </div>

          <section
            aria-label="Vista de trabajos"
            className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
          >
            <div className="border-b border-[var(--border)] px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)]">
              Trabajos · quién no te pagó
            </div>
            <ul className="divide-y divide-[var(--border)]">
              <li className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div>
                  <p className="font-medium">Depto 4B · Mitre</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Recableado · opción 2</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-amber-800">Seña $45.000</span>
              </li>
              <li className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div>
                  <p className="font-medium">Casa López</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Tablero · aceptó premium</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-[var(--landing-accent)]">Aceptado</span>
              </li>
              <li className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div>
                  <p className="font-medium">PH San Martín</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Enviado hace 6 días</p>
                </div>
                <span className="shrink-0 text-sm text-[var(--muted-foreground)]">Sin respuesta</span>
              </li>
            </ul>
          </section>
        </LandingWrap>

        <LandingWrap className="mt-12 sm:mt-16">
          <ul className="grid gap-6 sm:grid-cols-3">
            <li className="flex gap-3">
              <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
              <div>
                <p className="font-semibold">Chau presupuesto por audio</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Tres niveles (esencial, recomendado, completo). El cliente elige. 7 de cada 10 se van al del medio.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
              <div>
                <p className="font-semibold">No pongas los materiales de tu bolsillo</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  La seña se ve en pantalla. El link para que te la paguen es extra: ahí entra plata de verdad.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
              <div>
                <p className="font-semibold">En la obra, con una mano</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Celular. Sin bajar una app pesada. Fotos del antes/después en el trabajo, no en el chat perdido.
                </p>
              </div>
            </li>
          </ul>
        </LandingWrap>

        <LandingWrap className="mt-14 sm:mt-20">
          <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold leading-tight sm:text-3xl">
            El sistema te avisa.
            <span className="block">Vos cobrás la seña.</span>
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { k: "Seña", t: "Depto 4B no pagó la seña. ¿Le mando el link?" },
              { k: "Presupuesto", t: "PH San Martín lleva 6 días sin responder." },
              { k: "Obra", t: "En Casa López gastaste $32.000 de materiales. El margen está verde." },
              { k: "Cuadrilla", t: "El viernes hay 2 jornales sin cerrar." },
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
            Verlo en pantalla es el juego. Mandar el WhatsApp y el link de Mercado Pago es el disparo (extra).
          </p>
        </LandingWrap>

        <LandingWrap className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-start sm:mt-20">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <h2 className="font-[var(--font-fraunces)] text-lg font-semibold sm:text-xl">Cómo te convencés</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Armá <strong>un</strong> presupuesto real (el de mañana). Mandáselo al cliente como link. Si eligió
              una opción, ya vimos el problema. Si tiene que poner seña, ahí cobramos nosotros el extra — no por
              existir.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--muted-foreground)]">
              <li>Cliente + 3 opciones (2 minutos).</li>
              <li>El cliente ve el presupuesto en el teléfono.</li>
              <li>Seña en pantalla. Link de cobro cuando duela.</li>
            </ol>
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="extras" className="border-border">
                <AccordionTrigger className="text-sm font-medium">
                  Qué se paga (cuando ya te sirvió)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
                  <p className="flex gap-2">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    Link de seña Mercado Pago. El presupuesto en pantalla no mueve plata nuestra.
                  </p>
                  <p className="flex gap-2">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    WhatsApp de recordatorio. El aviso en tu pantalla es gratis de ver.
                  </p>
                  <p className="flex gap-2">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    Factura C AFIP cuando el cliente la pide. El trabajo se cierra igual sin CAE. Se pacta con quien tenga acceso a ARCA.
                  </p>
                  <PactarImplementacionArca
                    variant="compact"
                    triggerLabel="Pactar certificado ARCA / WhatsApp"
                    pagina="/f/servicios"
                    defaultArca
                    defaultWhatsapp
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section>
            <h2 className="font-[var(--font-fraunces)] text-lg font-semibold sm:text-xl">Preguntas de obra</h2>
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="cirsoc">
                <AccordionTrigger className="text-sm">¿Calcula el cable o el tablero?</AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--muted-foreground)]">
                  No. El cálculo lo hacés vos. Claver cuida que el presupuesto se vea, se acepte y se cobre la seña.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tarjeta">
                <AccordionTrigger className="text-sm">¿Tarjeta para probar?</AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--muted-foreground)]">
                  No. Arrancás sin tarjeta. El disparo (link / WA / AFIP) se activa cuando cobrás, no al registrarte.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="kiosco">
                <AccordionTrigger className="text-sm">¿Esto es una caja de kiosco?</AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--muted-foreground)]">
                  No. No vas a ver fiado de almacén ni mesas de bar. Presupuestos, trabajos, seña y cuadrilla. El
                  kiosco tiene otra puerta: claver.com.ar/f
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cuadrilla">
                <AccordionTrigger className="text-sm">¿Y si tengo ayudantes?</AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--muted-foreground)]">
                  Cargás el jornal en el trabajo y ves el margen. El segundo usuario (ayudante en el celu) es extra
                  cuando ya estás operando.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </LandingWrap>

        <LandingWrap className="mt-14 space-y-3 sm:mt-20">
          <Button size="lg" className={LANDING_F_CTA_CLASS} asChild>
            <Link href={registerHref}>Armar presupuesto ahora</Link>
          </Button>
          <p className="text-xs text-[var(--muted-foreground)] sm:text-sm">
            2 minutos. El de mañana, no un demo de juguete.
          </p>
        </LandingWrap>
      </main>
    </LandingFChrome>
  )
}

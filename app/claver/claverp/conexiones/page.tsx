import Link from "next/link"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { IntegrationsNovedades } from "@/components/marketing/integrations-novedades"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MotionFadeDown } from "@/components/ui/motion"
import {
  getIntegracionesComerciales,
  CATEGORIA_LABELS,
  INTEGRATIONS_HERO,
} from "@/lib/marketing/integrations-catalog"
import { ArrowRight, Check, Plug } from "lucide-react"

export const metadata = {
  title: "Conexiones Nativas | ClavERP",
  description: "Integrá Shopify, Tienda Nube, Mercado Libre, Stripe, WhatsApp y más con tu ERP argentino.",
}

const BENEFICIOS = [
  "Un solo stock para local, e-commerce y marketplaces",
  "Pedidos que bajan solos — sin cargar dos veces",
  "Pagos conciliados con Mercado Pago y Stripe",
  "WhatsApp y Telegram para tu equipo y clientes",
  "Logística Andreani y OCA desde el mismo despacho",
  "AFIP incluido — facturás legal desde el primer día",
]

export default function ClavERPConexionesPage() {
  const porCategoria = Object.entries(
    getIntegracionesComerciales().reduce<Record<string, ReturnType<typeof getIntegracionesComerciales>>>((acc, item) => {
      const cat = item.categoria
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {}),
  )

  return (
    <ClaverShell context="claverp">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 pt-28 pb-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <MotionFadeDown>
            <Badge className="mb-6 bg-teal-500/20 text-teal-200 border-teal-500/30">
              Centro de Conexiones Nativas
            </Badge>
            <h1 className="font-[var(--font-fraunces)] text-4xl font-semibold sm:text-5xl lg:text-6xl">
              Tu ERP conectado a<br />
              <span className="text-teal-400">todo tu ecosistema</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              {INTEGRATIONS_HERO.subtitulo}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild className="bg-teal-500 hover:bg-teal-400 text-white">
                <Link href="/login">
                  Empezar gratis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10">
                <Link href="/claver/ecommerce#integraciones">Ver e-commerce</Link>
              </Button>
            </div>
          </MotionFadeDown>
        </div>
      </section>

      <IntegrationsNovedades variant="novedades" showStats />

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-center mb-10">
            Por qué conexiones nativas y no un conector genérico
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICIOS.map((b) => (
              <Card key={b} className="border-slate-100">
                <CardContent className="pt-5 flex gap-3">
                  <Check className="h-5 w-5 text-teal-600 shrink-0" />
                  <p className="text-sm text-slate-700">{b}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-center mb-12">
            Catálogo completo por categoría
          </h2>
          <div className="space-y-10">
            {porCategoria.map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700 mb-4">{cat}</h3>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-white p-4 text-sm">
                      <span className="text-xl mr-2">{item.emoji}</span>
                      <span className="font-medium">{item.nombre}</span>
                      {item.novedad && (
                        <Badge className="ml-2 text-[9px] bg-violet-100 text-violet-700">Nuevo</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-teal-600 text-white text-center">
        <Plug className="h-12 w-12 mx-auto mb-4 opacity-80" />
        <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold mb-4">
          ¿Tu sistema no está en la lista?
        </h2>
        <p className="max-w-md mx-auto text-teal-100 mb-6">
          Pedilo desde el ERP y lo priorizamos en el roadmap según demanda de clientes.
        </p>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/login">Crear cuenta y solicitar integración</Link>
        </Button>
      </section>
    </ClaverShell>
  )
}
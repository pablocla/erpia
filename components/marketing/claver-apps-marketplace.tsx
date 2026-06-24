"use client"

import { ClaverShell } from "@/components/marketing/claver-shell"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { CLAVER_SERVICE_LINES } from "@/lib/marketing/claver-services-catalog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { MotionFadeDown, ScrollReveal, MotionList, MotionListItem } from "@/components/ui/motion"
import { Check, ShoppingCart, Sparkles } from "lucide-react"

// Extendemos las líneas de servicio con datos de pricing simulados para el SaaS Marketplace
const SAAS_CATALOG = CLAVER_SERVICE_LINES.map(line => {
  let price = "Consultar"
  let billing = ""
  let isPopular = false
  
  if (line.id === "claverp") {
    price = "$25.000"
    billing = "/ mes"
    isPopular = true
  } else if (line.id === "clavpay") {
    price = "2%"
    billing = "por tx"
  } else if (line.id === "clavai") {
    price = "$15.000"
    billing = "/ mes"
  } else if (line.id === "clavlog") {
    price = "$30.000"
    billing = "/ mes"
  } else if (line.id === "clavanalytics") {
    price = "$10.000"
    billing = "/ mes"
  }

  return {
    ...line,
    price,
    billing,
    isPopular
  }
})

export function ClaverAppsMarketplace() {
  return (
    <ClaverShell context="matrix">
      <section className="relative overflow-hidden bg-slate-50 pt-24 pb-20 sm:pt-32">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown className="text-center">
            <Badge variant="outline" className="mb-6 border-blue-200 bg-blue-50 text-blue-700">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              SaaS Marketplace
            </Badge>
            <h1 className="mx-auto max-w-4xl font-[var(--font-fraunces)] text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Ecosistema de Aplicaciones Claver
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Potenciá tu negocio sumando aplicaciones específicas. Pagás solo por lo que usás, todo integrado de forma nativa.
            </p>
          </MotionFadeDown>

          <MotionList className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {SAAS_CATALOG.map((app) => {
              const Icon = app.icon
              const isAvailable = app.status === "disponible" || app.status === "beta"

              return (
                <MotionListItem key={app.id}>
                  <Card className={`relative flex h-full flex-col overflow-hidden transition-all hover:shadow-xl ${app.isPopular ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                    {app.isPopular && (
                      <div className="absolute top-0 right-0 rounded-bl-xl bg-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        Más Popular
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner text-white ${app.gradient}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-[var(--font-fraunces)] text-2xl">{app.name}</CardTitle>
                        {!isAvailable && (
                          <Badge variant="secondary" className="text-[10px]">Próximamente</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-500">{app.tagline}</p>
                    </CardHeader>
                    
                    <CardContent className="flex-1">
                      <p className="text-sm text-slate-600 mb-6">{app.description}</p>
                      
                      <div className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-slate-900">{app.price}</span>
                          <span className="text-sm font-medium text-slate-500">{app.billing}</span>
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {app.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="pt-4 border-t border-slate-100 bg-slate-50/50">
                      <Button 
                        className={`w-full ${app.isPopular ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                        variant={app.isPopular ? 'default' : 'outline'}
                        disabled={!isAvailable}
                      >
                        {isAvailable ? (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Suscribirse
                          </>
                        ) : (
                          "Lista de espera"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </MotionListItem>
              )
            })}
          </MotionList>
        </div>
      </section>
    </ClaverShell>
  )
}

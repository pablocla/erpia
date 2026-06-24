"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, MapPin, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollReveal } from "@/components/ui/motion"
import { useToast } from "@/hooks/use-toast"
import { CLAVER_GROUP, CLAVERP_PRODUCT, BRAND_NAME } from "@/lib/brand"

export function EcommerceCtaFooter() {
  const { toast } = useToast()
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rubro: "",
    mensaje: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim()) {
      toast({
        title: "Faltan datos",
        description: "Por favor completá tu nombre y correo electrónico.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "¡Contacto enviado!",
      description: "Gracias por tu interés. Un asesor comercial se comunicará con vos en breve."
    })

    setForm({
      nombre: "",
      email: "",
      telefono: "",
      rubro: "",
      mensaje: ""
    })
  }

  return (
    <section className="bg-slate-950 px-4 py-24 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Texto Comercial */}
          <ScrollReveal className="space-y-6">
            <Badge className="border-amber-400/30 bg-amber-500/20 text-amber-200">
              <Sparkles className="mr-1.5 h-3 w-3 inline" />
              Soporte de Implementación
            </Badge>

            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold leading-tight sm:text-4xl">
              ¿Listo para dar el salto digital con tu negocio?
            </h2>

            <p className="max-w-md text-base leading-relaxed text-slate-400">
              Dejá de lidiar con planillas cruzadas y stocks rotos. Conectá tus ventas al mostrador y automatizá tu despacho hoy mismo.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-white text-slate-900 shadow-lg hover:bg-slate-100"
                asChild
              >
                <Link href="/login">
                  Entrar a la demo gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/tienda?empresaId=1">Ver Tienda Demo</Link>
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-4">
              <MapPin className="h-4 w-4" />
              <span>Desarrollado en Argentina para PyMEs comerciales. Soporte local en tu idioma.</span>
            </div>
          </ScrollReveal>

          {/* Formulario */}
          <ScrollReveal>
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">Hablemos con un asesor</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Nombre y Apellido"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      type="email"
                      placeholder="Correo Electrónico"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                    />
                    <Input
                      placeholder="Teléfono (Opcional)"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                    />
                  </div>
                  <Input
                    placeholder="Rubro de tu negocio (ej: Distribuidora, Autopartes)"
                    value={form.rubro}
                    onChange={(e) => setForm({ ...form, rubro: e.target.value })}
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                  />
                  <Textarea
                    placeholder="Contanos qué vendés y qué tamaño de depósito tenés..."
                    value={form.mensaje}
                    onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                    rows={3}
                  />
                  <Button type="submit" className="w-full bg-amber-600 text-white hover:bg-amber-500">
                    Enviar consulta
                  </Button>
                </form>
              </CardContent>
            </Card>
          </ScrollReveal>

        </div>

        {/* Footer y Enlaces */}
        <footer className="mt-20 border-t border-white/10 pt-8 text-center text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {CLAVER_GROUP.name} · {CLAVERP_PRODUCT.name} ({BRAND_NAME}). Todos los derechos reservados.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-6">
            <Link href="/" className="hover:text-slate-350">
              Inicio
            </Link>
            <Link href="/login" className="hover:text-slate-350">
              Login ERP
            </Link>
            <Link href="/tienda?empresaId=1" className="hover:text-slate-350">
              Tienda Demo
            </Link>
            <Link href="/portal?empresa=1" className="hover:text-slate-350">
              Portal Mayorista
            </Link>
            <Link href="#" className="hover:text-slate-350">
              Términos de Servicio
            </Link>
          </div>
        </footer>

      </div>
    </section>
  )
}

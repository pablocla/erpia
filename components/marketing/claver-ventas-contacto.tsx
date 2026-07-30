"use client"

import Link from "next/link"
import { ArrowRight, Calendar, MessageCircle, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollReveal } from "@/components/ui/motion"
import { useVentasConsulta } from "@/hooks/use-ventas-consulta"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import {
  VENTAS_CONSULTA_TIPO_LABELS,
  VENTAS_CONSULTA_TIPO_LABELS_US,
} from "@/lib/comercial/ventas-consulta-catalog"
import type { VentasConsultaTipo } from "@/lib/comercial/ventas-consulta-catalog"
import { cn } from "@/lib/utils"

const WHATSAPP = process.env.NEXT_PUBLIC_CLAVER_WHATSAPP?.replace(/\D/g, "")

function whatsappUrl(mensaje: string) {
  if (!WHATSAPP) return null
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`
}

interface ClaverVentasContactoProps {
  pagina?: string
  defaultTipo?: VentasConsultaTipo
  variant?: "dark" | "light"
  showSidebar?: boolean
  className?: string
  /** Mensaje WA prellenado (ej. según dolor de la home). */
  waMessage?: string
  /** CTA "Probar gratis" con ?activar= coherente. */
  registerHref?: string
  isUs?: boolean
}

export function ClaverVentasContacto({
  pagina = "/claver/contacto",
  defaultTipo = "contacto",
  variant = "dark",
  showSidebar = true,
  className,
  waMessage,
  registerHref = "/login/register?trial=14",
  isUs = false,
}: ClaverVentasContactoProps) {
  const { form, setForm, tipo, setTipo, saving, submit } = useVentasConsulta(defaultTipo)
  const dark = variant === "dark"
  const wa = whatsappUrl(
    waMessage ??
      (isUs ? "Hi Claver, I want info about the system for my business. My industry is: " : "Hola Claver, quiero info sobre el sistema para mi negocio. Mi rubro es: "),
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit({ pagina })
  }

  const inputClass = dark
    ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"

  return (
    <section
      className={cn(
        dark ? "bg-slate-950 text-white" : "bg-[#f8fafc] text-slate-900",
        "px-4 py-20 sm:px-6",
        className,
      )}
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-start">
        {showSidebar && (
          <ScrollReveal className="space-y-6">
            <Badge
              className={
                dark
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }
            >
              <Sparkles className="mr-1.5 h-3 w-3 inline" />
              {isUs ? "Sales" : "Ventas"} {CLAVER_GROUP.name}
            </Badge>

            <h2
              className={cn(
                "font-[var(--font-fraunces)] text-3xl font-semibold leading-tight sm:text-4xl",
                dark ? "text-white" : "text-slate-900",
              )}
            >
              {isUs ? "Let's talk about your business" : "Hablemos de tu negocio"}
            </h2>

            <p className={cn("max-w-md text-base leading-relaxed", dark ? "text-slate-400" : "text-slate-600")}>
              {isUs ? "Leave your details, request a guided demo or schedule a meeting. We reply within 24 business hours." : "Dejanos tus datos, pedí una demo guiada o agendá una reunión. Respondemos en menos de 24 h hábiles."}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className={dark ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-blue-600 hover:bg-blue-500 text-white"}
                asChild
              >
                <Link href={registerHref}>
                  {isUs ? "14-Day Free Trial" : "Probar gratis 14 días"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={
                  dark
                    ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                    : "border-slate-200"
                }
                asChild
              >
                <Link href="/demo">{isUs ? "See live demos" : "Ver demos por rubro"}</Link>
              </Button>
            </div>

            {wa && (
              <Button
                variant="outline"
                className={
                  dark
                    ? "border-green-500/30 bg-green-500/10 text-green-200 hover:bg-green-500/20"
                    : "border-green-200 text-green-800 hover:bg-green-50"
                }
                asChild
              >
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {isUs ? "Message on WhatsApp" : "Escribir por WhatsApp"}
                </a>
              </Button>
            )}

            <p className={cn("text-xs", dark ? "text-slate-500" : "text-slate-500")}>
              {isUs ? "Designed for local commerce · US Support" : "Diseñado para PyMEs argentinas · Soporte en español"}
            </p>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <Card
            className={
              dark
                ? "border-white/10 bg-white/5 backdrop-blur-sm shadow-xl"
                : "border-slate-200/80 bg-white shadow-lg"
            }
          >
            <CardHeader>
              <CardTitle className={dark ? "text-white" : "text-slate-900"}>
                {isUs ? "Sales contact" : "Contacto comercial"}
              </CardTitle>
              <p className={cn("text-sm", dark ? "text-slate-400" : "text-slate-500")}>
                {isUs ? "Choose what you need and fill out the form." : "Elegí qué necesitás y completá el formulario."}
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                {(["contacto", "demo", "reunion"] as VentasConsultaTipo[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition border",
                      tipo === t
                        ? dark
                          ? "border-blue-400/50 bg-blue-500/20 text-blue-100"
                          : "border-blue-300 bg-blue-50 text-blue-800"
                        : dark
                          ? "border-white/10 text-slate-400 hover:bg-white/5"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {t === "reunion" && <Calendar className="mr-1 h-3 w-3 inline" />}
                    {isUs ? VENTAS_CONSULTA_TIPO_LABELS_US[t] : VENTAS_CONSULTA_TIPO_LABELS[t]}
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className={dark ? "text-slate-300" : undefined}>{isUs ? "Name *" : "Nombre *"}</Label>
                    <Input
                      placeholder={isUs ? "Your name" : "Tu nombre"}
                      value={form.nombre}
                      onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={dark ? "text-slate-300" : undefined}>Email *</Label>
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={dark ? "text-slate-300" : undefined}>{isUs ? "Phone" : "Teléfono"}</Label>
                    <Input
                      placeholder={isUs ? "Optional" : "Opcional"}
                      value={form.telefono}
                      onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={dark ? "text-slate-300" : undefined}>{isUs ? "Business" : "Negocio"}</Label>
                    <Input
                      placeholder={isUs ? "Store, supplier..." : "Almacén, distribuidora…"}
                      value={form.negocio}
                      onChange={(e) => setForm((f) => ({ ...f, negocio: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={dark ? "text-slate-300" : undefined}>{isUs ? "Industry" : "Rubro"}</Label>
                    <Input
                      placeholder={isUs ? "retail, logistics..." : "kiosco, logística…"}
                      value={form.rubro}
                      onChange={(e) => setForm((f) => ({ ...f, rubro: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={dark ? "text-slate-300" : undefined}>
                    {tipo === "reunion" ? (isUs ? "What do you want to see in the meeting?" : "¿Qué querés ver en la reunión?") : (isUs ? "Message" : "Mensaje")}
                  </Label>
                  <Textarea
                    placeholder={
                      tipo === "reunion"
                        ? (isUs ? "Eg: demo of store operations, available Tuesday afternoon" : "Ej: demo de fiado + facturación AFIP, disponible martes por la tarde")
                        : (isUs ? "Tell us what you need..." : "Contanos qué necesitás…")
                    }
                    value={form.mensaje}
                    onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                    className={inputClass}
                    rows={3}
                  />
                </div>

                {/* Honeypot oculto */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden
                />

                <Button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    "w-full",
                    dark
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-blue-600 text-white hover:bg-blue-500",
                  )}
                >
                  {saving
                    ? (isUs ? "Sending..." : "Enviando…")
                    : tipo === "reunion"
                      ? (isUs ? "Request meeting" : "Solicitar reunión")
                      : tipo === "demo"
                        ? (isUs ? "Request demo" : "Pedir demo")
                        : (isUs ? "Send inquiry" : "Enviar consulta")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  )
}
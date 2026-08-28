import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Presupuestos de oficio en el celu",
  description:
    "Electricista, plomero, pintor: presupuesto en 3 niveles y seña antes de los materiales. Sin tarjeta para arrancar.",
  alternates: { canonical: `${siteUrl}/f/servicios` },
}

/** Alias histórico del hub con precios → tobogán de oficios. */
export default function OficiosPage() {
  redirect("/f/servicios")
}

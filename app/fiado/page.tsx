import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Libreta de fiados gratis",
  description: "Quién te debe, en el celu. Sin tarjeta. Los extras se prenden cuando cobrás.",
  alternates: { canonical: `${siteUrl}/f` },
}

/** Alias histórico del hub con precios → tobogán kiosco. */
export default function FiadoPage() {
  redirect("/f")
}

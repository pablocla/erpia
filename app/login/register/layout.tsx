import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Libreta de fiados gratis \u00b7 Claver",
  description:
    "Anot\u00e1 qui\u00e9n te debe, sin tarjeta. Caja y factura oficial las sum\u00e1s despu\u00e9s.",
  alternates: { canonical: "https://claver.com.ar/login/register" },
  openGraph: {
    title: "Libreta de fiados gratis \u00b7 Claver",
    description:
      "Anot\u00e1 qui\u00e9n te debe, sin tarjeta. Caja y factura oficial las sum\u00e1s despu\u00e9s.",
    url: "https://claver.com.ar/login/register",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Libreta de fiados gratis \u00b7 Claver",
    description:
      "Anot\u00e1 qui\u00e9n te debe, sin tarjeta. Caja y factura oficial las sum\u00e1s despu\u00e9s.",
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}

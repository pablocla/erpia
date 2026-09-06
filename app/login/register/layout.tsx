import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Software de gestión para PyMEs · Claver",
  description:
    "Stock, ventas y cobros simples para comercios, oficios y gimnasios. Empezá gratis, sin tarjeta.",
  alternates: { canonical: "https://claver.com.ar/login/register" },
  openGraph: {
    title: "Software de gestión para PyMEs · Claver",
    description:
      "Stock, ventas y cobros simples para comercios, oficios y gimnasios. Empezá gratis, sin tarjeta.",
    url: "https://claver.com.ar/login/register",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Software de gestión para PyMEs · Claver",
    description:
      "Stock, ventas y cobros simples para comercios, oficios y gimnasios. Empezá gratis, sin tarjeta.",
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}

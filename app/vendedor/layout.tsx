import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "App Vendedor | ERP Argentina",
  description: "Toma de pedidos, cobranzas y registro de visitas en campo",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
}

export default function VendedorLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>
}

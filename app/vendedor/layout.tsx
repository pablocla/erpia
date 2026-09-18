import type React from "react"
import type { Metadata } from "next"
import { BRAND_FULL } from "@/lib/brand"

export const viewport = {
  themeColor: "#0f172a",
}

export const metadata: Metadata = {
  title: `App Vendedor | ${BRAND_FULL}`,
  description: "App vendedor Claver — pedidos, cobranzas y visitas en campo",
  manifest: "/manifest.json",
}

export default function VendedorLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>
}

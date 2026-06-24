import type React from "react"
import type { Metadata } from "next"
import { BRAND_FULL } from "@/lib/brand"

export const metadata: Metadata = {
  title: `App Vendedor | ${BRAND_FULL}`,
  description: "App vendedor Clavis by Claver — pedidos, cobranzas y visitas en campo",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
}

export default function VendedorLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>
}

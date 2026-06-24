import type React from "react"
import type { Metadata } from "next"
import { BRAND_FULL } from "@/lib/brand"

export const metadata: Metadata = {
  title: `Portal de Clientes | ${BRAND_FULL}`,
  description: "Portal B2B Clavis by Claver — pedidos, estado de cuenta y facturas",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {children}
    </div>
  )
}

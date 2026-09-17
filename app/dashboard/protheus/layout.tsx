"use client"

import { ProtheusInvestShell } from "@/components/protheus-invest/shell"

export default function ProtheusLayout({ children }: { children: React.ReactNode }) {
  return <ProtheusInvestShell>{children}</ProtheusInvestShell>
}

import type { Metadata } from "next"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"

export const metadata: Metadata = {
  title: `${CLAVER_GROUP.name} — Redirigiendo…`,
  description: CLAVER_GROUP.descriptor,
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return children
}
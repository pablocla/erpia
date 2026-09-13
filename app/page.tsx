import type { Metadata } from "next"
import { HoldingHome } from "@/components/works/holding-home"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${CLAVER_GROUP.name} — Soft · Energy · Infra · Blockchain`,
  description:
    "Holding Claver: software de gestión (Soft) y orquestación Works (Energy, Infra, Blockchain).",
  alternates: { canonical: "/" },
}

/**
 * Holding home (Soft | Energy | Infra | Blockchain).
 * Soft landing moved to /software (LandingHomePuertas) — Soft door deep-links there.
 * /login /dashboard /claver/apps unchanged.
 */
export default function HomePage() {
  return <HoldingHome />
}

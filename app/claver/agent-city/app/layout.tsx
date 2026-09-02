import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Probar Agent City",
  description: "OS completo de Agent City: mapa, red, approvals, incidentes y chat.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/claver/agent-city/app" },
  openGraph: {
    title: "Agent City — lab",
    url: `${siteUrl}/claver/agent-city/app`,
  },
}

export default function AgentCityAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="agent-city-lab h-screen overflow-hidden bg-[#050506]">
      <style>{`
        .agent-city-lab .no-scrollbar::-webkit-scrollbar { display: none; }
        .agent-city-lab .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {children}
    </div>
  )
}

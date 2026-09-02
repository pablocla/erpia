/**
 * Campus Layout — Minimal layout without the heavy ERP sidebar
 * The campus needs full screen real estate for the 2D game view.
 */

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MetaSwarm Campus | Claver",
  description: "Tu oficina virtual 2D con agentes de IA trabajando en tiempo real.",
}

export default function CampusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a12]">
      {children}
    </div>
  )
}

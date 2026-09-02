import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MetaSwarm Campus 2D | Claver",
  description: "Tu oficina virtual 2D con agentes de IA trabajando en tiempo real.",
}

export default function CampusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a12]">
      {children}
    </div>
  )
}

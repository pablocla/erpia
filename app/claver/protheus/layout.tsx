import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Claver Inversiones × TOTVS Protheus — inteligencia sobre SIGAFIN",
  description:
    "Overlay de tesorería: cartera, alertas WhatsApp/Telegram, IA (Grok, Claude, Gemini o local) y ontología REST sobre los datos de Protheus. SIGAFIN no se toca.",
  alternates: { canonical: "/claver/protheus" },
}

export default function ClaverProtheusLayout({ children }: { children: React.ReactNode }) {
  return children
}

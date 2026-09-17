import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Claver Inversiones para TOTVS Protheus",
  description:
    "Entrá con tu usuario Claver. Cada tenant apunta al REST de su Protheus. SIGAFIN no se toca.",
  alternates: { canonical: "/claver/protheus" },
}

export default function ClaverProtheusLayout({ children }: { children: React.ReactNode }) {
  return children
}

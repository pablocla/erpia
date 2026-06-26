import { Metadata } from "next"
import { OpoStudioPanel } from "@/components/opo/opo-studio-panel"

export const metadata: Metadata = {
  title: "OPO Studio Bridge | Clavis ERP",
  description: "Ontología y puente semántico entre Clavis y sistemas legacy.",
}

export default function OpoStudioPage() {
  return (
    <div className="flex-1 w-full p-4 md:p-8 pt-6">
      <OpoStudioPanel />
    </div>
  )
}
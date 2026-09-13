import type { Metadata } from "next"
import { SegmentLanding } from "@/components/works/segment-landing"

export const metadata: Metadata = {
  title: "Claver Energy — Solar / EPC",
  description: "Lead solar Works: presupuesto, seña y partner EPC.",
}

export default function EnergyPage() {
  return <SegmentLanding segmento="energy" />
}

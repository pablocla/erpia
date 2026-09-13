import type { Metadata } from "next"
import { SegmentLanding } from "@/components/works/segment-landing"

export const metadata: Metadata = {
  title: "Claver Infra",
  description: "Consulta Infra — motor Works.",
}

export default function InfraPage() {
  return <SegmentLanding segmento="infra" />
}

import type { Metadata } from "next"
import { SegmentLanding } from "@/components/works/segment-landing"

export const metadata: Metadata = {
  title: "Claver Blockchain",
  description: "Consulta Blockchain — sin custody. Motor Works.",
}

export default function BlockchainPage() {
  return <SegmentLanding segmento="blockchain" />
}

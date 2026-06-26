import { describe, expect, it } from "vitest"
import { PIPELINE_ETAPAS, PIPELINE_ETAPA_LABELS } from "@/lib/ops/comercial-pipeline-catalog"

describe("comercial-pipeline-catalog", () => {
  it("tiene etiquetas para todas las etapas", () => {
    for (const etapa of PIPELINE_ETAPAS) {
      expect(PIPELINE_ETAPA_LABELS[etapa]).toBeTruthy()
    }
  })
})
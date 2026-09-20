import { describe, it, expect } from "vitest"
import { analyzeProtheusProcessFlow } from "@/lib/opo/protheus-flow-miner"
import { runProtheusHealthScan } from "@/lib/opo/protheus-health-scanner"
import { inferSchemaFromSample } from "@/lib/opo/schema-inference"
import { PROTHEUS_SX_TABLES } from "@/lib/opo/protheus-sx-meta"

describe("Process Mining & Health Scanner Protheus", () => {
  it("debe contener la definición canónica de SX9 y SIX", () => {
    const sx9 = PROTHEUS_SX_TABLES.find(t => t.id === "SX9")
    expect(sx9).toBeDefined()
    expect(sx9?.nombre).toContain("Relacionamentos")

    const six = PROTHEUS_SX_TABLES.find(t => t.id === "SIX")
    expect(six).toBeDefined()
    expect(six?.nombre).toContain("Índices")
  })

  it("debe ejecutar Process Mining y clasificar caminos de Facturación y Compras", () => {
    const result = analyzeProtheusProcessFlow(1, 90, {
      faturamento: {
        sc5Count: 500,
        sf2FacturaCount: 520,
        sf2DirectFromOrderCount: 380,
        sf2WithRemitoCount: 100,
        sf2EntregaFuturaCount: 30,
        sf2WithoutOrderCount: 10,
      },
      compras: {
        sc7Count: 200,
        sf1FacturaCount: 300,
        sf1WithOrderCount: 180,
        sf1WithoutOrderCount: 120,
        se2ManualExpensesCount: 15,
      }
    })

    expect(result.empresaId).toBe(1)
    expect(result.faturamento.activePaths.length).toBeGreaterThanOrEqual(4)
    expect(result.faturamento.mermaid).toContain("flowchart LR")
    expect(result.compras.purchasesModuleHealth).toBe("activo_formal")
    expect(result.faturamento.warnings.length).toBeGreaterThan(0)
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it("debe ejecutar el Health Scanner fiscal, contable y financiero con scoring 0-100", () => {
    const report = runProtheusHealthScan(1, {
      invoicesWithoutCae: 3,
      iibbDiscrepancyAmount: 500000,
      unbalancedJournalEntries: 1,
      unpostedInvoices: 20,
      overdueReceivablesPct: 18,
      expiredChecksAmount: 250000,
    })

    expect(report.empresaId).toBe(1)
    expect(report.overallScore).toBeGreaterThanOrEqual(0)
    expect(report.overallScore).toBeLessThanOrEqual(100)
    expect(report.areas.fiscal.weight).toBe(0.40)
    expect(report.areas.contable.weight).toBe(0.30)
    expect(report.areas.financiera.weight).toBe(0.30)
    expect(report.topCriticalIssues.length).toBeGreaterThan(0)
    expect(report.financialRiskTotalArs).toBeGreaterThan(0)
  })

  it("debe inferir tipos y roles de campos Protheus con CUIT y fechas", () => {
    const rawSample = [
      {
        A1_COD: "000120",
        A1_NOME: "ACME SOCIEDAD ANONIMA",
        A1_CGC: "30-71123456-9",
        A1_SALDUP: 154000.50,
      }
    ]

    const inferred = inferSchemaFromSample("/api/customers", "GET", rawSample)
    expect(inferred.protheusTablePrefix).toBe("A1_")
    expect(inferred.suggestedTable).toBe("SA1")
    expect(inferred.entityMatch?.entity).toBe("Customer")
    
    const cgcField = inferred.fields.find(f => f.name === "A1_CGC")
    expect(cgcField?.type).toBe("cuit")
    expect(cgcField?.role).toBe("fiscal")
  })

  it("debe contar con las queries SQL de auditoría fiscal histórica y calcular el impacto en $", async () => {
    const { PROTHEUS_FISCAL_AUDIT_QUERIES, runFiscalHistoricalAudit } = await import("@/lib/opo/protheus-fiscal-queries")
    expect(PROTHEUS_FISCAL_AUDIT_QUERIES.length).toBeGreaterThanOrEqual(6)

    const queryIibb = PROTHEUS_FISCAL_AUDIT_QUERIES.find(q => q.id === "AUDIT_IIBB_PERCEP_EXCESO")
    expect(queryIibb).toBeDefined()
    expect(queryIibb?.protheusTables).toContain("SFT")
    expect(queryIibb?.sqlTemplate).toContain("SFT{{SUFFIX}}")

    const auditResult = runFiscalHistoricalAudit(1, "simulated_demo", "20250101")
    expect(auditResult.totalAnomaliesDetected).toBeGreaterThan(0)
    expect(auditResult.totalFinancialImpactArs).toBeGreaterThan(0)
    expect(auditResult.executiveSummary.recuperoInmediatoEstimadoArs).toBeGreaterThan(0)
    expect(auditResult.executiveSummary.successFeeEstimado20PctArs).toBe(
      Math.round(auditResult.executiveSummary.recuperoInmediatoEstimadoArs * 0.20)
    )
  })
})

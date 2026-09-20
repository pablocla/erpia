"use client"

import { useState, useEffect } from "react"
import { 
  ShieldAlert, 
  Activity, 
  GitFork, 
  Database, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Layers,
  FileSpreadsheet
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores/auth-store"
import type { ProcessMiningResult } from "@/lib/opo/protheus-flow-miner"
import type { HealthScanReport } from "@/lib/opo/protheus-health-scanner"
import type { FiscalAuditRunResult } from "@/lib/opo/protheus-fiscal-queries"

export default function ProtheusAuditoriaPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [mode, setMode] = useState<"sql_direct" | "rest_api" | "simulated_demo">("simulated_demo")

  const [flowData, setFlowData] = useState<ProcessMiningResult | null>(null)
  const [healthData, setHealthData] = useState<HealthScanReport | null>(null)
  const [fiscalData, setFiscalData] = useState<FiscalAuditRunResult | null>(null)

  async function ejecutarAuditoriaCompleta() {
    setLoading(true)
    try {
      // 1. Process mining
      const resFlow = await authFetch(`/api/opo/flow-miner?days=90`)
      if (resFlow.ok) {
        const json = await resFlow.json()
        setFlowData(json.data)
      }

      // 2. Health scan
      const resHealth = await authFetch(`/api/opo/health-scan`)
      if (resHealth.ok) {
        const json = await resHealth.json()
        setHealthData(json.data)
      }

      // 3. Fiscal audit histórica
      const resFiscal = await authFetch(`/api/opo/fiscal-audit?mode=${mode}&from=20250101`)
      if (resFiscal.ok) {
        const json = await resFiscal.json()
        setFiscalData(json.data)
      }

      toast({
        title: "Auditoría completada con éxito",
        description: `Se detectaron inconsistencias históricas y se graficó el flujo operativo.`,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al ejecutar auditoría"
      toast({
        title: "Error al auditar",
        description: message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void ejecutarAuditoriaCompleta()
  }, [mode])

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Auditoría Operativa & Fiscal Protheus</h1>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
              Argentina Localized
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Process Mining (SX9 + Densidad Transaccional), Health Scoring y Detección de Ahorros Tributarios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de canal */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1 text-xs">
            <button
              onClick={() => setMode("simulated_demo")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                mode === "simulated_demo" 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Demo Realista
            </button>
            <button
              onClick={() => setMode("sql_direct")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                mode === "sql_direct" 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SQL Directo (VPN)
            </button>
            <button
              onClick={() => setMode("rest_api")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                mode === "rest_api" 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              REST / TLPP
            </button>
          </div>

          <Button onClick={ejecutarAuditoriaCompleta} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Escaneando..." : "Ejecutar Examen"}
          </Button>
        </div>
      </div>

      {/* KPI Cards de Impacto */}
      {fiscalData && healthData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/30">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Recupero Estimado (IIBB)
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                ${fiscalData.executiveSummary.recuperoInmediatoEstimadoArs.toLocaleString("es-AR")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Percepciones cobradas en exceso en compras (SFT).
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/30">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Riesgo de Multas AFIP
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                ${fiscalData.executiveSummary.riesgoMultasEvitadasArs.toLocaleString("es-AR")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Facturas sin CAE, omisiones y Libro IVA huérfano.
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 via-card to-card border-blue-500/30">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Health Score Protheus
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {healthData.overallScore} / 100
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Estado: <span className="font-semibold capitalize text-foreground">{healthData.overallStatus.replace("_", " ")}</span>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/30">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Success Fee 20%
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                ${fiscalData.executiveSummary.successFeeEstimado20PctArs.toLocaleString("es-AR")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Honorario sugerido por recupero efectivo para el partner.
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" />
            Salud Operativa & Fiscal
          </TabsTrigger>
          <TabsTrigger value="flow" className="gap-2">
            <GitFork className="w-4 h-4" />
            Process Mining (SX9)
          </TabsTrigger>
          <TabsTrigger value="findings" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Hallazgos & Inconsistencias ({fiscalData?.totalAnomaliesDetected ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Salud Operativa y Fiscal */}
        <TabsContent value="overview" className="space-y-4">
          {healthData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Área Fiscal (40%)</span>
                    <Badge variant={healthData.areas.fiscal.score > 70 ? "secondary" : "destructive"}>
                      {healthData.areas.fiscal.score}/100
                    </Badge>
                  </CardTitle>
                  <CardDescription>AFIP, CAE, TES y Alícuotas IIBB</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Facturas sin CAE:</span>
                    <span className="font-semibold">{healthData.summaryKpis.invoicesWithoutCaeCount} comprobantes</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Riesgo IIBB:</span>
                    <span className="font-semibold text-amber-500">${healthData.summaryKpis.iibbDiscrepancyAmountArs.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Hallazgos críticos:</span>
                    <span className="font-semibold">{healthData.areas.fiscal.criticalIssuesCount}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Área Contable (30%)</span>
                    <Badge variant={healthData.areas.contable.score > 70 ? "secondary" : "destructive"}>
                      {healthData.areas.contable.score}/100
                    </Badge>
                  </CardTitle>
                  <CardDescription>Asientos CT2 y Amarracao</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Asientos descuadrados:</span>
                    <span className="font-semibold">{healthData.summaryKpis.unbalancedJournalEntriesCount} en CT2</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Doc. sin contabilizar:</span>
                    <span className="font-semibold">{healthData.summaryKpis.unpostedDocumentsCount} pendientes</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Estado amarracao:</span>
                    <span className="font-semibold text-emerald-500">CT5 Parametrizado</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Área Financiera (30%)</span>
                    <Badge variant={healthData.areas.financiera.score > 70 ? "secondary" : "destructive"}>
                      {healthData.areas.financiera.score}/100
                    </Badge>
                  </CardTitle>
                  <CardDescription>Aging SE1/SE2 y Cheques SEF</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Mora en Cuentas a Cobrar:</span>
                    <span className="font-semibold">{healthData.summaryKpis.overdueReceivablesPercentage}% de la cartera</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Cheques vencidos en cartera:</span>
                    <span className="font-semibold text-amber-500">${healthData.summaryKpis.expiredChecksInPortfolioArs.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Conciliación bancaria:</span>
                    <span className="font-semibold">SE5 vs SE8 OK</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Hallazgos críticos */}
          {healthData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hallazgos de Mayor Riesgo Detectados</CardTitle>
                <CardDescription>Requieren corrección antes de la próxima presentación mensual ante AFIP o inspección.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthData.topCriticalIssues.map((issue) => (
                  <div key={issue.id} className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={issue.severity === "critical" ? "destructive" : "secondary"}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <span className="font-semibold text-sm">{issue.title}</span>
                        <Badge variant="outline" className="text-xs font-mono">{issue.protheusTable}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{issue.description}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Acción sugerida: {issue.recommendedAction}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">Impacto estimado</div>
                      <div className="text-sm font-bold text-foreground">
                        ${issue.estimatedRiskAmountArs.toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Process Mining */}
        <TabsContent value="flow" className="space-y-4">
          {flowData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Facturación */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Circuito de Facturación (Ventas)</CardTitle>
                    <Badge variant="outline">{flowData.faturamento.totalDocuments} docs</Badge>
                  </div>
                  <CardDescription>Ruta dominante: {flowData.faturamento.primaryPath}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {flowData.faturamento.activePaths.map((path) => (
                      <div key={path.pathId} className="p-3 rounded-lg border border-border/50 bg-card space-y-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{path.name}</span>
                          <span className="font-bold text-primary">{path.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${path.percentage}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">{path.diagnostic}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-muted/40 rounded-lg text-xs font-mono overflow-x-auto">
                    <div className="font-bold text-muted-foreground mb-1">Diagrama del Flujo (Mermaid)</div>
                    <pre>{flowData.faturamento.mermaid}</pre>
                  </div>
                </CardContent>
              </Card>

              {/* Compras */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Circuito de Compras</CardTitle>
                    <Badge variant={flowData.compras.purchasesModuleHealth === "activo_formal" ? "secondary" : "destructive"}>
                      {flowData.compras.purchasesModuleHealth.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>Ruta dominante: {flowData.compras.primaryPath}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {flowData.compras.activePaths.map((path) => (
                      <div key={path.pathId} className="p-3 rounded-lg border border-border/50 bg-card space-y-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{path.name}</span>
                          <span className="font-bold text-primary">{path.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${path.percentage}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">{path.diagnostic}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-muted/40 rounded-lg text-xs font-mono overflow-x-auto">
                    <div className="font-bold text-muted-foreground mb-1">Diagrama del Flujo (Mermaid)</div>
                    <pre>{flowData.compras.mermaid}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Hallazgos e Inconsistencias Fiscales */}
        <TabsContent value="findings" className="space-y-4">
          {fiscalData && (
            <div className="space-y-4">
              {fiscalData.findingsByRule.map((rule) => (
                <Card key={rule.ruleId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.severity === "critical" ? "destructive" : "secondary"}>
                          {rule.severity.toUpperCase()}
                        </Badge>
                        <CardTitle className="text-base">{rule.ruleName}</CardTitle>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">Impacto: </span>
                        <span className="font-bold text-foreground">${rule.estimatedImpactArs.toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                    <CardDescription>Se detectaron {rule.anomalyCount} registros con anomalías</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-x-auto text-xs">
                      <table className="w-full">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            {Object.keys(rule.sampleRecords[0] || {}).map((col) => (
                              <th key={col} className="p-2 text-left font-medium uppercase text-[10px]">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rule.sampleRecords.map((row, i) => (
                            <tr key={i} className="border-t border-border/40 hover:bg-muted/20">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="p-2 font-mono">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

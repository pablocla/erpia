"use client"

import { useState } from "react"
import {
  FileText,
  HelpCircle,
  LayoutGrid,
  LineChart,
  Radio,
  Receipt,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Wallet,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PageHeader, PageShell, StatusBadge } from "@/components/layout"
import { useCaja } from "@/lib/protheus-invest/store"
import { RestConfigPanel } from "./rest-config-panel"
import { InvestScreen } from "./invest-screen"
import {
  BoletinScreen,
  CajaScreen,
  CarteraScreen,
  ConectoresScreen,
  FiscalScreen,
  RiesgoScreen,
} from "./screens"
import { HelpScreen } from "./help-screen"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "caja", label: "Caja neta", icon: LayoutGrid },
  { id: "invest", label: "Inversiones", icon: LineChart },
  { id: "cartera", label: "Cartera eCheq", icon: Wallet },
  { id: "fiscal", label: "Fiscal", icon: Receipt },
  { id: "riesgo", label: "Riesgo BCRA", icon: ShieldAlert },
  { id: "conectores", label: "Conectores", icon: Radio },
  { id: "boletin", label: "Boletín", icon: FileText },
  { id: "ayuda", label: "Ayuda", icon: HelpCircle },
] as const

export function ProtheusInvestApp() {
  const [tab, setTab] = useState<string>("invest")
  const source = useCaja((s) => s.source)
  const syncing = useCaja((s) => s.syncing)
  const syncAll = useCaja((s) => s.syncAll)
  const reset = useCaja((s) => s.reset)
  const toasts = useCaja((s) => s.toasts)

  return (
    <PageShell>
      <PageHeader
        title="Inversiones Protheus"
        description="Tesorería sobre SIGAFIN del tenant. Entrá con tu usuario Claver: el REST es el de tu empresa (OPO / Legacy Bridge)."
        statusSlot={
          <StatusBadge
            variant={source === "protheus" ? "success" : "neutral"}
            label={source === "protheus" ? "Live SIGAFIN" : "Demo local"}
          />
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="size-3.5" />
              Reset demo
            </Button>
            <Button size="sm" onClick={syncAll} disabled={syncing}>
              <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
              Sync APIs
            </Button>
          </>
        }
      />

      <RestConfigPanel />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {TABS.map((item) => {
            const Icon = item.icon
            return (
              <TabsTrigger key={item.id} value={item.id} className="gap-1.5">
                <Icon className="size-3.5" />
                {item.label}
              </TabsTrigger>
            )
          })}
        </TabsList>
        <TabsContent value="caja">
          <CajaScreen onGo={setTab} />
        </TabsContent>
        <TabsContent value="invest">
          <InvestScreen />
        </TabsContent>
        <TabsContent value="cartera">
          <CarteraScreen />
        </TabsContent>
        <TabsContent value="fiscal">
          <FiscalScreen />
        </TabsContent>
        <TabsContent value="riesgo">
          <RiesgoScreen />
        </TabsContent>
        <TabsContent value="conectores">
          <ConectoresScreen />
        </TabsContent>
        <TabsContent value="boletin">
          <BoletinScreen />
        </TabsContent>
        <TabsContent value="ayuda">
          <HelpScreen />
        </TabsContent>
      </Tabs>

      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-md border bg-card px-3 py-2 text-sm shadow-lg"
          >
            {t.msg}
          </div>
        ))}
      </div>
    </PageShell>
  )
}

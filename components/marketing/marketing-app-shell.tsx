"use client"

import { useState, useCallback, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckCircle2, Bell, Loader2 } from "lucide-react"
import { MarketingBrowserChrome } from "@/components/marketing/marketing-browser-chrome"
import { PRODUCT_SHELLS } from "@/lib/comercial/product-shell"
import type { SubSaasSlug } from "@/lib/comercial/sub-saas-catalog"
import { MOCK_TRIAL_DAYS, MOCK_CURRENCY, type MockProductSlug } from "@/lib/marketing/product-mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type MockGlow = "emerald" | "blue" | "violet" | "amber"

export interface MockDemoContext {
  activeTab: string
  setActiveTab: (href: string) => void
  showToast: (message: string, type?: "success" | "info") => void
  runAction: (id: string, message: string, ms?: number) => Promise<void>
  busyAction: string | null
  completedActions: Set<string>
}

interface MarketingAppShellProps {
  slug: SubSaasSlug
  mockSlug: MockProductSlug
  url: string
  glow?: MockGlow
  className?: string
  heightClass?: string
  children: (ctx: MockDemoContext) => ReactNode
}

export function MarketingAppShell({
  slug,
  mockSlug,
  url,
  glow = "emerald",
  className,
  heightClass = "h-[580px] md:h-[520px]",
  children,
}: MarketingAppShellProps) {
  const shell = PRODUCT_SHELLS[slug]
  const tabs = shell.tabs.filter((t) => t.href !== "#more")
  const [activeTab, setActiveTab] = useState(tabs[0]?.href ?? "")
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())

  const showToast = useCallback((message: string, type: "success" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }, [])

  const runAction = useCallback(
    async (id: string, message: string, ms = 900) => {
      if (busyAction) return
      setBusyAction(id)
      await new Promise((r) => setTimeout(r, ms))
      setBusyAction(null)
      setCompletedActions((prev) => new Set(prev).add(id))
      showToast(message)
    },
    [busyAction, showToast],
  )

  const trialDays = MOCK_TRIAL_DAYS[mockSlug]
  const Icon = shell.icono

  const ctx: MockDemoContext = {
    activeTab,
    setActiveTab,
    showToast,
    runAction,
    busyAction,
    completedActions,
  }

  return (
    <div className={cn("w-full relative", heightClass, className)}>
      <MarketingBrowserChrome url={url} glow={glow} className="h-full">
        <div className="flex h-full overflow-hidden bg-slate-50">
          {/* Mini sidebar */}
          <aside className="hidden sm:flex w-11 md:w-32 flex-col border-r border-slate-200 bg-white shrink-0">
            <div className="flex h-10 items-center justify-center md:justify-start md:px-3 border-b border-slate-100">
              <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
              <span className="hidden md:inline ml-2 text-[10px] font-bold text-slate-800 truncate">
                {shell.marca}
              </span>
            </div>
            <nav className="flex-1 p-1.5 space-y-0.5" aria-label="Demo navegación">
              {tabs.map((tab) => {
                const TabIcon = tab.icon
                const isActive = activeTab === tab.href
                return (
                  <button
                    key={tab.href}
                    type="button"
                    onClick={() => setActiveTab(tab.href)}
                    className={cn(
                      "w-full flex items-center justify-center md:justify-start gap-2 rounded-lg px-2 py-2 text-[10px] font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
                    )}
                  >
                    <TabIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="hidden md:inline truncate">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main panel */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            {/* App topbar */}
            <div className="h-10 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between gap-2 px-3 z-10">
              <div className="flex items-center gap-2 min-w-0 sm:hidden">
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                <span className="text-[10px] font-bold text-slate-800 truncate">{shell.marca}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {tabs.map((tab) => (
                  <button
                    key={tab.href}
                    type="button"
                    onClick={() => setActiveTab(tab.href)}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
                      activeTab === tab.href
                        ? "bg-primary text-primary-foreground"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Sparkles className="h-2.5 w-2.5" aria-hidden />
                  Trial · {trialDays}d
                </span>
                <MockPrimaryButton
                  label={shell.primaryAction.label}
                  busy={busyAction === "__primary__"}
                  done={completedActions.has("__primary__")}
                  onClick={() => runAction("__primary__", `${shell.primaryAction.label} — listo`)}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="p-3 sm:p-4"
                >
                  {children(ctx)}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-lg shadow-emerald-900/10"
                >
                  {toast.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                  ) : (
                    <Bell className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
                  )}
                  <span className="text-xs font-medium text-slate-800">{toast.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </MarketingBrowserChrome>
    </div>
  )
}

export function MockKpiGrid({
  items,
  className,
}: {
  items: { label: string; value: string; hint?: string; tone?: "default" | "amber" | "emerald" | "blue" | "violet" }[]
  className?: string
}) {
  const toneClass = {
    default: "border-slate-100 bg-white",
    amber: "border-amber-100 bg-amber-50/80",
    emerald: "border-emerald-100 bg-emerald-50/80",
    blue: "border-blue-100 bg-blue-50/80",
    violet: "border-violet-100 bg-violet-50/80",
  }
  const labelClass = {
    default: "text-slate-600",
    amber: "text-amber-800",
    emerald: "text-emerald-800",
    blue: "text-blue-800",
    violet: "text-violet-800",
  }
  const valueClass = {
    default: "text-slate-950",
    amber: "text-amber-950",
    emerald: "text-emerald-950",
    blue: "text-blue-950",
    violet: "text-violet-950",
  }

  return (
    <div className={cn("mb-3 grid grid-cols-2 gap-2 sm:gap-3", className)}>
      {items.map((kpi) => {
        const tone = kpi.tone ?? "default"
        return (
          <div key={kpi.label} className={cn("rounded-xl border p-2.5 sm:p-3", toneClass[tone])}>
            <p className={cn("text-[10px] font-medium", labelClass[tone])}>{kpi.label}</p>
            <p className={cn("mt-0.5 font-[var(--font-fraunces)] text-lg sm:text-xl font-bold leading-tight", valueClass[tone])}>
              {kpi.value}
            </p>
            {kpi.hint && <p className={cn("text-[10px] mt-0.5 opacity-80", labelClass[tone])}>{kpi.hint}</p>}
          </div>
        )
      })}
    </div>
  )
}

export function MockActionButton({
  id,
  label,
  icon,
  variant = "outline",
  busy,
  done,
  onClick,
  className,
}: {
  id: string
  label: string
  icon?: ReactNode
  variant?: "outline" | "primary" | "ghost"
  busy?: boolean
  done?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || done}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all active:scale-95 disabled:opacity-70",
        done
          ? "bg-emerald-100 text-emerald-800"
          : variant === "primary"
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : variant === "ghost"
              ? "text-emerald-600 hover:bg-emerald-50"
              : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      ) : done ? (
        <CheckCircle2 className="h-3 w-3" aria-hidden />
      ) : (
        icon
      )}
      {done ? "Listo" : label}
    </button>
  )
}

function MockPrimaryButton({
  label,
  busy,
  done,
  onClick,
}: {
  label: string
  busy: boolean
  done: boolean
  onClick: () => void
}) {
  return (
    <Button
      size="sm"
      className="h-7 text-[10px] px-2.5 hidden xs:flex sm:inline-flex"
      disabled={busy || done}
      onClick={onClick}
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : done ? <CheckCircle2 className="h-3 w-3" /> : null}
      <span className="max-w-[7rem] truncate">{done ? "Hecho" : label}</span>
    </Button>
  )
}

export { MOCK_CURRENCY as mockCurrency }
"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { MarketplaceSku } from "@/lib/marketplace/marketplace-catalog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Loader2,
  Plus,
  CheckCircle2,
  Bot,
  Shield,
  Cloud,
  MessageSquare,
  Briefcase,
  Zap,
  BarChart,
  Sparkles,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { AppStoreBundles } from "@/components/marketplace/app-store-bundles"

type CatalogItem = MarketplaceSku & {
  instalada: boolean
  limiteActual: number | null
  provisionEstado: string | null
  provisionJobId: string | null
  activacionCliente?: string
}

type CatalogResponse = { catalog: CatalogItem[]; autopool: unknown[]; bundles: unknown[] }

export function AppStoreGrid() {
  const searchParams = useSearchParams()
  const skuParam = searchParams.get("sku")
  const bundleParam = searchParams.get("bundle")
  const [skuFilter, setSkuFilter] = useState<string | null>(skuParam)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const { data: catalogData, isLoading, mutate } = useAuthFetch<CatalogResponse>("/api/marketplace/catalog")
  const catalog = catalogData?.catalog
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("Todas")
  const [installingSku, setInstallingSku] = useState<string | null>(null)
  const [highlightSku, setHighlightSku] = useState<string | null>(null)

  const categories = ["Todas", "Intangibles", "Integraciones", "Seguridad", "Infraestructura", "Comunicaciones", "Fiscal", "Operaciones", "Datos", "Marketing"]

  useEffect(() => {
    setSkuFilter(skuParam)
  }, [skuParam])

  useEffect(() => {
    if (!skuFilter || !catalog?.length) return
    const item = catalog.find((i) => i.sku === skuFilter)
    if (!item) return

    setHighlightSku(skuFilter)
    setSearchTerm(item.nombre)
    setActiveTab(item.categoria)

    const t = window.setTimeout(() => {
      cardRefs.current[skuFilter]?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 300)

    const clear = window.setTimeout(() => setHighlightSku(null), 4000)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(clear)
    }
  }, [skuFilter, catalog])

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case "Seguridad": return <Shield className="w-5 h-5 text-blue-500" />
      case "Infraestructura": return <Cloud className="w-5 h-5 text-sky-500" />
      case "Comunicaciones": return <MessageSquare className="w-5 h-5 text-emerald-500" />
      case "Fiscal": return <Briefcase className="w-5 h-5 text-amber-500" />
      case "Operaciones": return <Zap className="w-5 h-5 text-orange-500" />
      case "Datos": return <BarChart className="w-5 h-5 text-indigo-500" />
      case "Marketing": return <Bot className="w-5 h-5 text-pink-500" />
      case "Intangibles": return <Sparkles className="w-5 h-5 text-violet-500" />
      case "Integraciones": return <Bot className="w-5 h-5 text-slate-500" />
      default: return <Plus className="w-5 h-5" />
    }
  }

  async function pollJob(jobId: string, maxAttempts = 20): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await authFetch(`/api/marketplace/jobs/${jobId}`)
      if (res.ok) {
        const job = await res.json()
        if (job.estado === "ready" || job.estado === "pending" || job.estado === "failed") {
          return job.estado
        }
      }
      await new Promise((r) => setTimeout(r, 800))
    }
    return "running"
  }

  const handleInstall = async (sku: string) => {
    setInstallingSku(sku)

    try {
      const item = catalog?.find((i) => i.sku === sku)
      if (!item) throw new Error("Item not found")

      const checkoutRes = await authFetch("/api/marketplace/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: [{ sku: item.sku, cantidad: 1, precio: item.precioArs }],
          origen: "dashboard",
        }),
      })
      if (!checkoutRes.ok) throw new Error("Checkout failed")

      const checkout = await checkoutRes.json()
      const jobId = checkout.provisionResults?.[0]?.jobId as string | undefined
      if (jobId) await pollJob(jobId)

      setInstallingSku(null)
      mutate()
      window.dispatchEvent(new Event("productos-updated"))
    } catch (err) {
      console.error(err)
      setInstallingSku(null)
    }
  }

  const filteredCatalog = catalog?.filter((item) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      item.sku.toLowerCase().includes(q) ||
      item.nombre.toLowerCase().includes(q) ||
      item.i18n["es-AR"].descripcion.toLowerCase().includes(q)
    const matchesCategory = activeTab === "Todas" || item.categoria === activeTab
    const matchesSkuParam = !skuFilter || item.sku === skuFilter
    return matchesSearch && matchesCategory && matchesSkuParam
  })

  const skuParamItem = skuFilter ? catalog?.find((i) => i.sku === skuFilter) : undefined

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">App Store</h1>
          <p className="text-muted-foreground mt-2 text-lg">Descubrí e instalá servicios automáticos para potenciar tu negocio.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar apps..."
            className="pl-9 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-300 rounded-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              if (skuParam && e.target.value !== skuParamItem?.nombre) {
                setHighlightSku(null)
              }
            }}
          />
        </div>
      </div>

      {!isLoading && catalog && (
        <AppStoreBundles
          catalog={catalog}
          highlightBundleId={bundleParam}
          onInstalled={() => mutate()}
        />
      )}

      {skuFilter && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/5 px-4 py-2.5 text-sm">
          {skuParamItem ? (
            <>
              <span>
                Activá <strong>{skuParamItem.nombre}</strong> para desbloquear el módulo en panel y POS.
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setSkuFilter(null)
                  setSearchTerm("")
                  setHighlightSku(null)
                  window.history.replaceState(null, "", "/dashboard/apps")
                }}
              >
                Ver todo el catálogo
              </Button>
            </>
          ) : (
            <span>
              SKU <code className="text-xs">{skuFilter}</code> no encontrado en el catálogo.
            </span>
          )}
        </div>
      )}

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-transparent border-b border-border/40 h-auto p-0 justify-start w-max min-w-full rounded-none">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2.5 text-base font-medium transition-all"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-muted/20 animate-pulse border border-border/10" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredCatalog?.map((item) => (
                  <motion.div
                    key={item.sku}
                    ref={(el) => {
                      cardRefs.current[item.sku] = el
                    }}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 ease-out hover:-translate-y-1",
                      highlightSku === item.sku
                        ? "border-primary ring-2 ring-primary/40 shadow-lg"
                        : "border-border/40",
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-muted/30 rounded-xl backdrop-blur-sm border border-border/20 group-hover:bg-background/50 transition-colors">
                          {getCategoryIcon(item.categoria)}
                        </div>
                        {item.instalada && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Instalado
                          </Badge>
                        )}
                        {!item.instalada && item.provisionEstado === "pending" && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Analista
                          </Badge>
                        )}
                        {!item.instalada && item.tipoCobro === "recurrente" && (
                          <Badge variant="outline" className="text-muted-foreground border-border/50">
                            Mensual
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold tracking-tight mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {item.nombre}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                        {item.i18n["es-AR"].descripcion}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium">Precio</span>
                        <span className="text-lg font-bold">
                          ${Intl.NumberFormat("es-AR").format(item.precioArs)}
                        </span>
                      </div>

                      <Button
                        variant={item.instalada ? "secondary" : "default"}
                        className={`rounded-xl transition-all duration-300 ${!item.instalada && "group-hover:shadow-[0_0_20px_-5px_var(--primary)]"} ${item.instalada ? "bg-secondary hover:bg-secondary/80" : ""}`}
                        disabled={item.instalada || installingSku === item.sku}
                        onClick={() => handleInstall(item.sku)}
                      >
                        {installingSku === item.sku ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : item.instalada ? (
                          "Configurar"
                        ) : (
                          "Obtener App"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              {filteredCatalog?.length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                  <div className="p-4 bg-muted/20 rounded-full mb-4">
                    <Search className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-medium mb-1">No se encontraron apps</h3>
                  <p className="text-muted-foreground">Intentá con otros términos de búsqueda o categoría.</p>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </Tabs>
    </div>
  )
}
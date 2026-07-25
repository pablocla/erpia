"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Network,
  Users,
  ShoppingCart,
  FileText,
  Package,
  Truck,
  Wallet,
  AlertTriangle,
  Search,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  Send,
  Zap,
  CheckCircle2,
  Filter,
  Eye,
  Activity,
  Layers,
  Brain,
} from "lucide-react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/layout"
import type { KnowledgeGraphData, GraphNode, NodeCategory } from "@/lib/cerebro/graph-projector"
import type { GraphRAGResult } from "@/lib/cerebro/graphrag-service"

const CATEGORY_LABELS: Record<NodeCategory | "all", { label: string; icon: any; color: string; strokeColor: string }> = {
  all: { label: "Todos", icon: Network, color: "bg-primary/10 text-primary border-primary/20", strokeColor: "hsl(var(--primary))" },
  app: { label: "Apps Claver", icon: Sparkles, color: "bg-purple-500/10 text-purple-400 border-purple-500/30", strokeColor: "#a855f7" },
  cliente: { label: "Clientes", icon: Users, color: "bg-blue-500/10 text-blue-400 border-blue-500/30", strokeColor: "#3b82f6" },
  venta: { label: "Ventas", icon: ShoppingCart, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", strokeColor: "#10b981" },
  factura: { label: "Facturas AFIP", icon: FileText, color: "bg-purple-500/10 text-purple-400 border-purple-500/30", strokeColor: "#8b5cf6" },
  producto: { label: "Productos", icon: Package, color: "bg-amber-500/10 text-amber-400 border-amber-500/30", strokeColor: "#f59e0b" },
  proveedor: { label: "Proveedores", icon: Truck, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", strokeColor: "#6366f1" },
  caja: { label: "Caja", icon: Wallet, color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", strokeColor: "#06b6d4" },
  paciente: { label: "Veterinaria", icon: Users, color: "bg-pink-500/10 text-pink-400 border-pink-500/30", strokeColor: "#ec4899" },
  vehiculo: { label: "Logística", icon: Truck, color: "bg-teal-500/10 text-teal-400 border-teal-500/30", strokeColor: "#14b8a6" },
  alerta: { label: "Alertas", icon: AlertTriangle, color: "bg-rose-500/10 text-rose-400 border-rose-500/30", strokeColor: "#f43f5e" },
}

const PRESET_PROMPTS = [
  "¿Qué clientes tienen deuda en cuenta corriente?",
  "¿Hay productos en nivel crítico de stock?",
  "¿Cuál es el volumen total facturado con AFIP?",
  "Resumen general del estado de mi empresa",
]

export default function CerebroPage() {
  const { data, isLoading, mutate } = useAuthFetch<{ ok: boolean; data: KnowledgeGraphData }>("/api/cerebro/graph")
  const graph = data?.data

  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [viewMode, setViewMode] = useState<"constellation" | "grid">("constellation")

  // GraphRAG State
  const [ragPrompt, setRagPrompt] = useState("")
  const [ragLoading, setRagLoading] = useState(false)
  const [ragResult, setRagResult] = useState<GraphRAGResult | null>(null)

  const handleAskGraphRAG = async (promptText: string) => {
    if (!promptText.trim()) return
    setRagLoading(true)
    try {
      const res = await authFetch("/api/cerebro/ask", {
        method: "POST",
        body: JSON.stringify({ prompt: promptText }),
      })
      const resultData = await res.json()
      if (res.ok && resultData.result) {
        setRagResult(resultData.result)
      }
    } catch {
      /* ignore error */
    } finally {
      setRagLoading(false)
    }
  }

  const filteredNodes = useMemo(() => {
    return (graph?.nodes ?? []).filter((node) => {
      const matchesCategory = selectedCategory === "all" || node.category === selectedCategory
      const matchesSearch =
        !searchTerm ||
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.subtext?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [graph?.nodes, selectedCategory, searchTerm])

  // Calcular posiciones radiales para la constelación neurótica (Constellation Layout)
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    const total = filteredNodes.length
    if (total === 0) return map

    const width = 1000
    const height = 650
    const centerX = width / 2
    const centerY = height / 2

    // Hub Central
    map.set("center-hub", { x: centerX, y: centerY })

    // Agrupar por categoría en órbitas
    const apps = filteredNodes.filter((n) => n.category === "app")
    const others = filteredNodes.filter((n) => n.category !== "app")

    // Órbita 1: Apps Claver (radio 180px)
    const r1 = 170
    apps.forEach((node, i) => {
      const angle = (i / Math.max(apps.length, 1)) * 2 * Math.PI - Math.PI / 2
      const x = centerX + r1 * Math.cos(angle)
      const y = centerY + r1 * Math.sin(angle)
      map.set(node.id, { x, y })
    })

    // Órbita 2: Entidades del negocio (radio 320px)
    const r2 = 310
    others.forEach((node, i) => {
      const angle = (i / Math.max(others.length, 1)) * 2 * Math.PI - Math.PI / 2
      const x = centerX + r2 * Math.cos(angle)
      const y = centerY + r2 * Math.sin(angle)
      map.set(node.id, { x, y })
    })

    return map
  }, [filteredNodes])

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-serif flex items-center gap-2">
                Cerebro Visual & Graphify
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Red neuronal 360° interconectada (Apps Grupo Claver, Clientes, AFIP, Stock, Proveedores y Caja)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "constellation" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("constellation")}
            className="gap-1.5 text-xs"
          >
            <Activity className="h-3.5 w-3.5" />
            Modo Red Neuronal
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="gap-1.5 text-xs"
          >
            <Layers className="h-3.5 w-3.5" />
            Modo Grilla
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Nodos Interconectados</p>
              <p className="text-2xl font-bold mt-1">{graph?.summary.totalNodes ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Network className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Conexiones de Red</p>
              <p className="text-2xl font-bold mt-1">{graph?.summary.totalEdges ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Alertas en Red</p>
              <p className="text-2xl font-bold mt-1 text-rose-400">{graph?.summary.riesgoCount ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Apps Claver Activas</p>
              <p className="text-2xl font-bold mt-1 text-emerald-400">
                {graph?.summary.appsActivasCount ?? 12}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Visual Network Canvas + GraphRAG Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Visualizador Neuronal (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60 shadow-sm overflow-hidden flex flex-col h-[700px] relative bg-slate-950/90 text-slate-100">
            {/* Header Controls */}
            <CardHeader className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <CardTitle className="text-base font-semibold">Mapa Visual de Interconexiones</CardTitle>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Buscar nodo..."
                    className="pl-8 h-8 text-xs bg-slate-900 border-slate-700 text-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>

            {/* Category Filter Pills */}
            <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs z-10">
              {(Object.keys(CATEGORY_LABELS) as Array<NodeCategory | "all">).map((cat) => {
                const config = CATEGORY_LABELS[cat]
                const IconComponent = config.icon
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-400 font-medium shadow-sm shadow-purple-500/30"
                        : "hover:bg-slate-800 text-slate-400 border-slate-800"
                    }`}
                  >
                    <IconComponent className="h-3 w-3" />
                    {config.label}
                  </button>
                )
              })}
            </div>

            {/* Visual Canvas Container */}
            <CardContent className="p-0 flex-1 relative overflow-auto flex items-center justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-purple-400" />
                  <p className="text-sm">Mapeando red neuronal de entidades...</p>
                </div>
              ) : viewMode === "constellation" ? (
                /* RED VISUAL CON CONSTELACIÓN DE SVG Y NODOS CONECTADOS */
                <div className="relative w-[1000px] h-[650px] flex items-center justify-center select-none">
                  {/* SVG Background Connections Layer */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>

                    {/* Aristas entre Nodos */}
                    {(graph?.edges ?? []).map((edge) => {
                      const srcPos = nodePositions.get(edge.source)
                      const tgtPos = nodePositions.get(edge.target)
                      if (!srcPos || !tgtPos) return null

                      const isHighlighted = ragResult?.highlightEdgeIds.includes(edge.id)

                      return (
                        <g key={edge.id}>
                          <line
                            x1={srcPos.x}
                            y1={srcPos.y}
                            x2={tgtPos.x}
                            y2={tgtPos.y}
                            stroke={isHighlighted ? "url(#grad-active)" : "rgba(148, 163, 184, 0.2)"}
                            strokeWidth={isHighlighted ? 3 : 1.5}
                            strokeDasharray={isHighlighted ? "6 6" : undefined}
                            className={isHighlighted ? "animate-pulse" : ""}
                          />
                          {/* Label de la Relación */}
                          {isHighlighted && (
                            <text
                              x={(srcPos.x + tgtPos.x) / 2}
                              y={(srcPos.y + tgtPos.y) / 2 - 5}
                              fill="#a855f7"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="bg-slate-900 px-1"
                            >
                              {edge.label}
                            </text>
                          )}
                        </g>
                      )
                    })}

                    {/* Conexiones del Hub Central */}
                    {Array.from(nodePositions.entries()).map(([id, pos]) => {
                      if (id === "center-hub") return null
                      const isApp = id.startsWith("app-")
                      if (!isApp) return null
                      const center = nodePositions.get("center-hub")!
                      return (
                        <line
                          key={`center-${id}`}
                          x1={center.x}
                          y1={center.y}
                          x2={pos.x}
                          y2={pos.y}
                          stroke="rgba(168, 85, 247, 0.25)"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      )
                    })}
                  </svg>

                  {/* Nodo Central Hub "Cerebro Grupo Claver" */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute z-20 p-4 rounded-full bg-purple-600/30 border-2 border-purple-400 text-white flex flex-col items-center justify-center shadow-xl shadow-purple-500/20 backdrop-blur"
                    style={{ left: 500 - 45, top: 325 - 45, width: 90, height: 90 }}
                  >
                    <Brain className="h-8 w-8 text-purple-300 animate-pulse" />
                    <span className="text-[10px] font-bold mt-1 text-purple-200 tracking-tight">CLAVER</span>
                  </motion.div>

                  {/* Rendering Nodes en Posiciones Radial Constelación */}
                  {filteredNodes.map((node) => {
                    const pos = nodePositions.get(node.id)
                    if (!pos) return null

                    const config = CATEGORY_LABELS[node.category] ?? CATEGORY_LABELS.all
                    const IconComp = config.icon
                    const isHighlighted = ragResult?.highlightNodeIds.includes(node.id)

                    return (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setSelectedNode(node)}
                        className={`absolute z-10 p-2.5 rounded-xl border cursor-pointer backdrop-blur transition-all flex items-center gap-2 max-w-[170px] ${
                          isHighlighted
                            ? "bg-purple-950/90 border-purple-400 ring-2 ring-purple-500 shadow-xl shadow-purple-500/30 scale-105"
                            : "bg-slate-900/90 border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/90"
                        }`}
                        style={{
                          left: pos.x - 70,
                          top: pos.y - 25,
                        }}
                      >
                        <div className={`p-1.5 rounded-lg border ${config.color} shrink-0`}>
                          <IconComp className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate text-slate-100">{node.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{node.subtext}</p>
                        </div>

                        {isHighlighted && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                          </span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                /* MODO GRILLA */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
                  {filteredNodes.map((node) => {
                    const config = CATEGORY_LABELS[node.category] ?? CATEGORY_LABELS.all
                    const IconComp = config.icon
                    const isHighlighted = ragResult?.highlightNodeIds.includes(node.id)

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isHighlighted
                            ? "bg-purple-950/80 border-purple-400 ring-2 ring-purple-500"
                            : "bg-slate-900/80 border-slate-800 hover:border-purple-500/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg border ${config.color}`}>
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate text-slate-100">{node.label}</p>
                            <p className="text-xs text-slate-400 truncate">{node.subtext}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* GraphRAG Assistant Side Panel (1 Col) */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm flex flex-col h-[700px]">
            <CardHeader className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-base font-semibold">Asistente GraphRAG</CardTitle>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-400">
                  Causa Raíz
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Consultá en lenguaje natural y mirá las conexiones activadas en el mapa neuronal.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4 overflow-y-auto">
              {/* Presets */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Consultas Frecuentes:</p>
                <div className="flex flex-col gap-1.5">
                  {PRESET_PROMPTS.map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setRagPrompt(promptText)
                        handleAskGraphRAG(promptText)
                      }}
                      className="text-left text-xs p-2 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{promptText}</span>
                      <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>

              {/* RAG Answer Display */}
              {ragResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl border bg-purple-500/5 border-purple-500/20 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Respuesta del Cerebro</span>
                  </div>

                  <p className="text-xs leading-relaxed text-foreground">{ragResult.response}</p>

                  {ragResult.hallazgosClave.length > 0 && (
                    <div className="space-y-1 border-t border-purple-500/10 pt-2 text-xs">
                      <p className="font-medium text-purple-400 text-[11px]">Hallazgos Clave:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {ragResult.hallazgosClave.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Prompt Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAskGraphRAG(ragPrompt)
                }}
                className="flex items-center gap-2 border-t pt-3 mt-auto"
              >
                <Input
                  placeholder="Preguntá al cerebro de tu empresa..."
                  value={ragPrompt}
                  onChange={(e) => setRagPrompt(e.target.value)}
                  className="text-xs h-9"
                />
                <Button type="submit" size="sm" disabled={ragLoading || !ragPrompt.trim()} className="gap-1 h-9 px-3 shrink-0 bg-purple-600 hover:bg-purple-700">
                  {ragLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Node Inspector Sheet */}
      <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <SheetContent className="sm:max-w-md">
          {selectedNode && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {selectedNode.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">#{selectedNode.rawId}</span>
                </div>
                <SheetTitle className="text-xl font-bold mt-2">{selectedNode.label}</SheetTitle>
                <SheetDescription className="text-sm">{selectedNode.subtext}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Métricas de la Entidad</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedNode.metrics?.monto != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Monto Transaccionado</p>
                        <p className="font-bold text-foreground mt-0.5">
                          ${selectedNode.metrics.monto.toLocaleString("es-AR")}
                        </p>
                      </div>
                    )}

                    {selectedNode.metrics?.deuda != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Deuda Acumulada</p>
                        <p className="font-bold text-rose-500 mt-0.5">
                          ${selectedNode.metrics.deuda.toLocaleString("es-AR")}
                        </p>
                      </div>
                    )}

                    {selectedNode.metrics?.cantidad != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Stock Actual</p>
                        <p className="font-bold text-foreground mt-0.5">{selectedNode.metrics.cantidad} unidades</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Link to Module */}
                <div className="pt-2">
                  <Button asChild className="w-full gap-2">
                    <Link
                      href={
                        selectedNode.category === "cliente"
                          ? "/dashboard/clientes"
                          : selectedNode.category === "venta"
                            ? "/dashboard/ventas"
                            : selectedNode.category === "factura"
                              ? "/dashboard/facturas"
                              : selectedNode.category === "producto"
                                ? "/dashboard/stock"
                                : "/dashboard/compras"
                      }
                    >
                      <span>Abrir Módulo de {selectedNode.category}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

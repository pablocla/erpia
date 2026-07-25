"use client"

import { useState } from "react"
import { Users, Building2, Crown, ChevronDown, ChevronRight, DollarSign, Award, Layers, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface EmpresaRef {
  id: number
  nombre: string
  email: string | null
  createdAt: string
  mpSubscriptionStatus: string | null
  trialExpiresAt: string | null
}

interface SubAfiliado {
  id: number
  nombreFantasia: string | null
  referralCode: string | null
  tipo: string
  nivel: string
}

interface Comision {
  id: number
  monto: number
  nivel: number
  estado: string
  fecha: string
  empresaOrigenId: number
  sku: string | null
}

interface PartnerTreeProps {
  partner: {
    nombreFantasia: string | null
    referralCode: string
    nivel: string
    tipo: string
  }
  empresas: EmpresaRef[]
  subAfiliados: SubAfiliado[]
  comisiones: Comision[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export function PartnerTreeVisualizer({ partner, empresas, subAfiliados, comisiones }: PartnerTreeProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Totales
  const comisionesN1 = comisiones.filter((c) => c.nivel === 1).reduce((acc, c) => acc + c.monto, 0)
  const comisionesN2 = comisiones.filter((c) => c.nivel === 2).reduce((acc, c) => acc + c.monto, 0)
  const totalGenerado = comisionesN1 + comisionesN2

  return (
    <Card className="border-amber-500/30 bg-slate-950 text-white shadow-2xl overflow-hidden mt-6">
      <CardHeader className="border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-amber-400">
              <Crown className="h-5 w-5 text-amber-400 animate-pulse" />
              Esquema Piramidal de Ganancias & Red
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Estructura jerárquica multinivel de 2 capas: Vos en la cúspide, tu Nivel 1 directo y tu Nivel 2 de red.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs py-1 font-mono">
              Comisión Acumulada: {fmt(totalGenerado)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8 pb-10 px-4 sm:px-8 space-y-8">
        {/* DIAGRAMA ESTRUCTURA PIRAMIDAL */}
        <div className="flex flex-col items-center justify-center space-y-0 relative max-w-4xl mx-auto">
          
          {/* 🔺 PISO 1: CÚSPIDE DE LA PIRÁMIDE (VOS) */}
          <div className="z-20 w-full max-w-xs text-center">
            <div className="relative bg-gradient-to-b from-amber-500/30 via-amber-600/20 to-slate-900 border-2 border-amber-500 rounded-2xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.25)] transition-all hover:scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] uppercase px-4 py-1 rounded-full tracking-wider shadow-lg flex items-center gap-1">
                <Crown className="h-3 w-3" /> CÚSPIDE (VOS)
              </div>
              <p className="font-extrabold text-lg text-white mt-1">{partner.nombreFantasia || partner.referralCode}</p>
              <p className="text-xs text-amber-300 font-mono">Ref: {partner.referralCode} · {partner.tipo}</p>
              <div className="mt-2 pt-2 border-t border-amber-500/30 flex justify-around text-[11px] font-semibold text-slate-300">
                <span>N1 Directos: <strong className="text-emerald-400">{empresas.length}</strong></span>
                <span>N2 Red: <strong className="text-purple-400">{subAfiliados.length}</strong></span>
              </div>
            </div>
          </div>

          {/* LÍNEAS CONECTORAS CÚSPIDE A PISO 2 */}
          <div className="w-full flex flex-col items-center my-0 pointer-events-none">
            <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-emerald-500" />
            <div className="w-2/3 h-0.5 bg-emerald-500/50 hidden sm:block" />
          </div>

          {/* 🟩 PISO 2: NIVEL 1 (DIRECTOS - 30% COMISIÓN) */}
          <div className="z-10 w-full max-w-2xl text-center">
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2 mb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> PISO 2: Comercios & Directos N1 (Ganás 30%)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">{fmt(comisionesN1)}</span>
              </div>

              {empresas.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 italic">Sin comercios en tu Nivel 1. Compartí tu link para empezar a armar tu base.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {empresas.map((e) => (
                    <div key={e.id} className="bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5 text-left text-xs shadow-sm hover:bg-slate-900 transition-colors">
                      <p className="font-bold text-slate-200 truncate" title={e.nombre}>{e.nombre}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-slate-400 font-mono">Nivel 1</span>
                        <Badge className={`text-[8px] px-1 py-0 ${e.mpSubscriptionStatus === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                          {e.mpSubscriptionStatus || "Trial"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LÍNEAS CONECTORAS PISO 2 A PISO 3 */}
          <div className="w-full flex flex-col items-center my-0 pointer-events-none">
            <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-purple-500" />
            <div className="w-5/6 h-0.5 bg-purple-500/50 hidden sm:block" />
          </div>

          {/* 🟪 PISO 3: BASE DE LA PIRÁMIDE (NIVEL 2 - RED DE PARTNERS HIJOS - 5% COMISIÓN) */}
          <div className="w-full max-w-4xl text-center">
            <div className="bg-slate-900/80 border border-purple-500/40 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-purple-500/30 pb-2 mb-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> BASE PIRAMIDAL: Red de Partners N2 (Ganás 5% de sus cierres)
                </span>
                <span className="text-xs font-mono font-bold text-purple-400">{fmt(comisionesN2)}</span>
              </div>

              {subAfiliados.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 italic">Sin partners en tu base N2. Si un amigo se registra con tu ref como partner, aparecerá acá.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {subAfiliados.map((s) => (
                    <div key={s.id} className="bg-slate-950 border border-purple-500/30 rounded-xl p-2.5 text-left text-xs shadow-sm hover:border-purple-400 transition-all">
                      <p className="font-bold text-purple-200 truncate">{s.nombreFantasia || s.referralCode}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Ref: {s.referralCode}</p>
                      <div className="mt-1 pt-1 border-t border-purple-500/20 text-[9px] text-purple-300 font-semibold flex justify-between">
                        <span>Partner N2</span>
                        <span>5% Overriding</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* LEYENDA Y EXPLICACIÓN DE REPARTO PIRAMIDAL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
            <div>
              <p className="font-bold text-amber-300">Entrada 100% GRATIS</p>
              <p className="text-slate-400 text-[11px]">Cualquier persona se suma sin pagar nada bajo la línea directa Claver. Vende y se queda el 100% del primer mes + 30% mensual de por vida.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
            <div>
              <p className="font-bold text-emerald-300">Comercios N1 (Directos)</p>
              <p className="text-slate-400 text-[11px]">Ganás el 100% del primer cobro por Mercado Pago en la mano + 30% recurrente de cada abono cobrado.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">3</div>
            <div>
              <p className="font-bold text-purple-300">Líder de Célula / Canon o Mérito</p>
              <p className="text-slate-400 text-[11px]">Para liderar equipos y ganar el 5% de tu red N2: Podés pagar el Canon de Franquicia ($500.000 ARS) o **desbloquearlo 100% GRATIS vendiendo 20 comercios activos** por tu propio mérito.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

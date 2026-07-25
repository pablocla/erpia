"use client"

import { useState } from "react"
import { Plane, Compass, MapPin, Award, CheckCircle2, Lock, Sparkles, Gift, Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export interface RewardTier {
  id: string
  title: string
  destination: string
  emoji: string
  imageBg: string
  requiredReferrals: number
  requiredMrr: number
  description: string
  benefits: string[]
  badgeColor: string
}

export const REWARD_DESTINATIONS: RewardTier[] = [
  {
    id: "escapada",
    title: "Escapada Relax & Vinos",
    destination: "Mendoza / Bariloche",
    emoji: "🍷",
    imageBg: "from-amber-600 to-red-900",
    requiredReferrals: 15,
    requiredMrr: 450000,
    description: "Fin de semana All-Inclusive para 2 personas en resort de montaña con bodega y spa.",
    benefits: ["Pasajes aéreos incluidos", "3 noches hotel 4 estrellas", "Excursión y cata de vinos"],
    badgeColor: "border-amber-500 text-amber-300 bg-amber-500/10",
  },
  {
    id: "caribe",
    title: "Caribe All-Inclusive",
    destination: "Cancún / Punta Cana",
    emoji: "🏝️",
    imageBg: "from-teal-600 to-emerald-900",
    requiredReferrals: 40,
    requiredMrr: 1200000,
    description: "7 días de playa, palmeras y cócteles en resort 5 estrellas frente al mar.",
    benefits: ["Aéreos internacionales x2", "7 noches All-Inclusive 5*", "Traslados privados VIP"],
    badgeColor: "border-teal-400 text-teal-300 bg-teal-500/10",
  },
  {
    id: "miami_tech",
    title: "Miami Shopping & Tech",
    destination: "Miami & Orlando",
    emoji: "🗽",
    imageBg: "from-blue-600 to-indigo-900",
    requiredReferrals: 80,
    requiredMrr: 2500000,
    description: "Semana en South Beach + pase a parques y un kit de tecnología Apple de regalo.",
    benefits: ["Aéreos + Hotel en South Beach", "MacBook Pro M3 de regalo", "Entradas a Universal Studios"],
    badgeColor: "border-blue-400 text-blue-300 bg-blue-500/10",
  },
  {
    id: "world_tour",
    title: "World Tour Leyenda",
    destination: "Europa o Japón (15 días)",
    emoji: "🌍",
    imageBg: "from-purple-600 to-fuchsia-950",
    requiredReferrals: 150,
    requiredMrr: 4500000,
    description: "El premio máximo de la Pirámide: 15 días recorriendo las capitales del mundo con todo pago.",
    benefits: ["Tour Europa (Madrid/París/Roma) o Tokio", "Viáticos $3.000 USD de bolsillo", "Status Partner Leyenda vitalicio"],
    badgeColor: "border-purple-400 text-purple-300 bg-purple-500/10",
  },
]

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export function PartnerRewardsCatalog({
  activeReferralsCount,
  currentCommissionsMonthly,
}: {
  activeReferralsCount: number
  currentCommissionsMonthly: number
}) {
  return (
    <Card className="border-indigo-500/30 bg-slate-950 text-white shadow-2xl overflow-hidden mt-6">
      <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-400">
              <Plane className="h-5 w-5 text-indigo-400 animate-bounce" />
              Catálogo de Destinos & Viajes de Incentivo
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Desbloqueá viajes y premios internacionales a medida que aumenta el volumen de tu pirámide de referidos.
            </CardDescription>
          </div>
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs py-1 font-mono">
            {activeReferralsCount} Referidos Activos
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6 px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          {REWARD_DESTINATIONS.map((tier) => {
            const isUnlocked = activeReferralsCount >= tier.requiredReferrals
            const pct = Math.min(100, Math.round((activeReferralsCount / tier.requiredReferrals) * 100))
            const remaining = Math.max(0, tier.requiredReferrals - activeReferralsCount)

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border p-5 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  isUnlocked
                    ? "border-emerald-500/60 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                    : "border-slate-800 bg-slate-900/40 opacity-90 hover:border-slate-700"
                }`}
              >
                {/* BANNER BG ACCENT */}
                <div className={`absolute top-0 right-0 h-24 w-24 bg-gradient-to-br ${tier.imageBg} opacity-20 blur-2xl rounded-full pointer-events-none`} />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-2xl mr-2">{tier.emoji}</span>
                      <span className="font-bold text-base text-white">{tier.title}</span>
                      <p className="text-xs text-indigo-300 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {tier.destination}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] uppercase font-mono font-bold ${tier.badgeColor}`}>
                      {tier.requiredReferrals} Referidos
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{tier.description}</p>

                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-400">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* PROGRESS BAR & DESBLOQUEO */}
                <div className="mt-5 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                    <span className="text-slate-400">Progreso a destino:</span>
                    <span className={`font-bold ${isUnlocked ? "text-emerald-400" : "text-amber-400"}`}>
                      {pct}% ({activeReferralsCount}/{tier.requiredReferrals})
                    </span>
                  </div>
                  <Progress value={pct} className="h-2 bg-slate-800" />

                  <div className="mt-3 flex items-center justify-between">
                    {isUnlocked ? (
                      <Badge className="bg-emerald-500 text-slate-950 font-bold gap-1 text-xs py-1">
                        <Sparkles className="h-3.5 w-3.5" /> ¡DESTINO DESBLOQUEADO!
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Lock className="h-3 w-3 text-amber-500" /> Falta{remaining > 1 ? "n" : ""} <strong>{remaining} referido{remaining > 1 ? "s" : ""}</strong>
                      </span>
                    )}

                    {isUnlocked && (
                      <Button size="sm" className="bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs">
                        Solicitar Viaje
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

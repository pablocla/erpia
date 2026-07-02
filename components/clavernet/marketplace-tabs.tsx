"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Package, Users, GraduationCap, Code, Copy, Check } from "lucide-react"
import { useState } from "react"

const APPS_CATALOG = [
  // Módulos Oficiales Claver
  { id: 1, name: "Punto de Venta POS", dev: "Claver Core", commPct: 20, price: 29900, type: "Core", sku: "CORE-POS-01" },
  { id: 2, name: "Facturación AFIP", dev: "Claver Core", commPct: 20, price: 14900, type: "Core", sku: "CORE-AFIP-01" },
  { id: 3, name: "Gestión de Stock", dev: "Claver Core", commPct: 20, price: 19900, type: "Core", sku: "LOG-STOCK-01" },
  { id: 4, name: "Módulo Financiero", dev: "Claver Core", commPct: 25, price: 24900, type: "Core", sku: "FIN-BANCO-01" },
  { id: 5, name: "Tienda Online", dev: "Claver Core", commPct: 25, price: 34900, type: "Core", sku: "ECOM-B2C-01" },
  { id: 6, name: "Portal Mayorista", dev: "Claver Core", commPct: 30, price: 39900, type: "Core", sku: "B2B-PORTAL-01" },
  { id: 7, name: "Producción & MRP", dev: "Claver Core", commPct: 30, price: 45000, type: "Core", sku: "IND-MRP-01" },
  { id: 8, name: "Gestión Gastronómica", dev: "Claver Core", commPct: 20, price: 25000, type: "Core", sku: "HOS-MESAS-01" },
  { id: 9, name: "Liquidación Sueldos", dev: "Claver Core", commPct: 20, price: 29000, type: "Core", sku: "RRHH-SUELDOS-01" },
  { id: 10, name: "CRM Ventas B2B", dev: "Claver Core", commPct: 20, price: 22000, type: "Core", sku: "CRM-PIPELINE-01" },
  // Servicios Generables / IA
  { id: 11, name: "Briefing Diario IA", dev: "Claver Services", commPct: 15, price: 9900, type: "Servicio", sku: "gen.intel.briefing_semanal" },
  { id: 12, name: "Auditoría de Caja IA", dev: "Claver Services", commPct: 15, price: 14900, type: "Servicio", sku: "gen.comply.auditoria_interna" },
  { id: 13, name: "Creador Posts RRSS", dev: "Claver Services", commPct: 15, price: 8500, type: "Servicio", sku: "gen.content.redes_rubro" },
  { id: 14, name: "Bot de Cobranzas", dev: "Claver Services", commPct: 20, price: 19900, type: "Servicio", sku: "gen.crm.winback" },
  { id: 15, name: "Asistente Soporte", dev: "Claver Services", commPct: 20, price: 29900, type: "Servicio", sku: "gen.train.sop_operativo" },
  // Terceros
  { id: 16, name: "Split Pago MercadoPago", dev: "Fintech Solutions", commPct: 10, price: 15000, type: "App de Tercero", sku: "3RD-PAY-MERCADOP" },
  { id: 17, name: "Envíos Andreani", dev: "Logística Devs", commPct: 10, price: 12000, type: "App de Tercero", sku: "3RD-LOG-ANDREANI" },
  { id: 18, name: "Conector PowerBI", dev: "Data Analytics SA", commPct: 15, price: 25000, type: "App de Tercero", sku: "3RD-REP-POWERBI" },
  { id: 19, name: "Lector Balanzas IoT", dev: "AgroDev", commPct: 10, price: 18000, type: "App de Tercero", sku: "3RD-IND-BALANZA" },
  { id: 20, name: "Monitor AgroClima", dev: "AgroDev", commPct: 10, price: 10000, type: "App de Tercero", sku: "3RD-AGRO-CLIMA" },
  // Premium & A Medida
  { id: 21, name: "Motor de Afiliados B2B", dev: "Claver Core", commPct: 25, price: 35000, type: "Core", sku: "CORE-AFIL-01" },
  { id: 22, name: "App a Medida (Setup)", dev: "Claver Studio", commPct: 10, price: 500000, type: "Servicio Premium", sku: "SRV-STUDIO-01" },
  // Nuevas Mini-Apps Monetizables
  { id: 23, name: "Cuenta Partida (Socios)", dev: "Claver Core", commPct: 20, price: 15000, type: "Core", sku: "FIN-PARTIDA-01" },
  { id: 24, name: "Delivery Propio (Anti-Rappi)", dev: "Claver Core", commPct: 25, price: 20000, type: "Core", sku: "HOS-DELIV-01" },
  { id: 25, name: "Cartelera Digital Menú", dev: "Claver Core", commPct: 15, price: 10000, type: "Core", sku: "CORE-CARTEL-01" },
  { id: 26, name: "Recibo Digital Alquileres", dev: "Claver Core", commPct: 20, price: 40000, type: "Core", sku: "PROP-RECIBO-01" },
  { id: 27, name: "Control de Obras Pyme", dev: "Claver Core", commPct: 20, price: 15000, type: "Core", sku: "IND-OBRAS-01" },
  { id: 28, name: "Turno Médico IA (Bot)", dev: "Claver Services", commPct: 15, price: 50000, type: "Servicio", sku: "gen.medico.turnos" },
  { id: 29, name: "Stock Compartido Local", dev: "Claver Core", commPct: 25, price: 10000, type: "Core", sku: "LOG-SHARE-01" },
]

const DEVELOPERS = [
  { id: 1, name: "Claver Core", apps: 10, rating: 5.0, type: "Oficial" },
  { id: 2, name: "Claver Services", apps: 5, rating: 5.0, type: "Servicios Oficiales" },
  { id: 3, name: "Fintech Solutions", apps: 1, rating: 4.8, type: "Independiente" },
  { id: 4, name: "Logística Devs", apps: 1, rating: 4.6, type: "Independiente" },
  { id: 5, name: "Data Analytics SA", apps: 1, rating: 4.9, type: "Independiente" },
  { id: 6, name: "AgroDev", apps: 2, rating: 4.5, type: "Independiente" },
]

const SELLERS = [
  { id: 1, name: "Consultora Rosario", level: "Elite", clients: 145 },
  { id: 2, name: "Tech Implementers", level: "Pro", clients: 98 },
]

const TEACHERS = [
  { id: 1, name: "María Gómez", specialty: "Onboarding Gastronomía", rate: "$80,000 / impl." },
  { id: 2, name: "Estudio Contable JL", specialty: "Setup Financiero & AFIP", rate: "$150,000 / impl." },
]

export function MarketplaceTabs() {
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const handleCopyLink = (id: number) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Tabs defaultValue="apps" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-100 p-1 rounded-xl">
        <TabsTrigger value="apps" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <Package className="w-4 h-4 mr-2" /> Apps para Vender
        </TabsTrigger>
        <TabsTrigger value="devs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <Code className="w-4 h-4 mr-2" /> Developers
        </TabsTrigger>
        <TabsTrigger value="sellers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <Users className="w-4 h-4 mr-2" /> Sellers
        </TabsTrigger>
        <TabsTrigger value="teachers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <GraduationCap className="w-4 h-4 mr-2" /> Teachers
        </TabsTrigger>
      </TabsList>

      <TabsContent value="apps" className="mt-0">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {APPS_CATALOG.map((app) => {
            const mrr = (app.price * app.commPct) / 100
            return (
              <Card key={app.id} className="border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                      por {app.dev}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium mb-1">Comisión Recurrente ({app.commPct}%)</p>
                    <p className="text-2xl font-bold text-blue-600">${mrr.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ mes</span></p>
                  </div>
                  <button 
                    onClick={() => handleCopyLink(app.id)}
                    className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {copiedId === app.id ? (
                      <><Check className="w-4 h-4 text-emerald-600" /> ¡Link Copiado!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copiar Link de Venta</>
                    )}
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </TabsContent>

      <TabsContent value="devs" className="mt-0">
        <div className="grid md:grid-cols-3 gap-6">
          {DEVELOPERS.map((dev) => (
            <Card key={dev.id} className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>{dev.name}</CardTitle>
                <CardDescription className="text-blue-600 font-medium">{dev.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-1">Apps publicadas: <span className="font-bold text-slate-900">{dev.apps}</span></p>
                <p className="text-slate-600 text-sm">Calificación: <span className="font-bold text-slate-900">{dev.rating} ⭐</span></p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="sellers" className="mt-0">
        <div className="grid md:grid-cols-3 gap-6">
          {SELLERS.map((seller) => (
            <Card key={seller.id} className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>{seller.name}</CardTitle>
                <CardDescription className="text-indigo-600 font-medium">{seller.level} Seller</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Clientes traídos a la red: <span className="font-bold text-slate-900">{seller.clients}</span></p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="teachers" className="mt-0">
        <div className="grid md:grid-cols-2 gap-6">
          {TEACHERS.map((teacher) => (
            <Card key={teacher.id} className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>{teacher.name}</CardTitle>
                <CardDescription className="text-emerald-600 font-medium">Especialidad: {teacher.specialty}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-4">Tarifa base: <span className="font-bold text-slate-900">{teacher.rate}</span></p>
                <button className="text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium px-4 py-2 rounded-lg transition-colors">
                  Contactar para Implementación
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}

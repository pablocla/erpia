"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  HelpCircle,
  Bug,
  FileText,
  Plus,
  Route,
  Navigation,
  MessageCircle,
  CheckCircle,
  Calendar,
  Layers,
  ShieldCheck,
  UserCheck,
  Award,
  Activity,
  Flame
} from "lucide-react"

interface FumigacionHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FumigacionHelpDialog({ open, onOpenChange }: FumigacionHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 text-slate-100 border-slate-800">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Bug className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                Guía Operativa & Diagrama de Flujo: Control de Plagas
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-normal">
                  Fumigación & Sanitización
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Documentación completa del proceso de trabajo, ruteo técnico, emisión de certificados normativos y valor de cada botón.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="flujo" className="w-full mt-4">
          <TabsList className="bg-slate-800/80 border border-slate-700 text-slate-300 grid grid-cols-4 w-full">
            <TabsTrigger value="flujo" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              🔄 Diagrama de Flujo
            </TabsTrigger>
            <TabsTrigger value="botones" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              🕹️ Botones & Valor
            </TabsTrigger>
            <TabsTrigger value="certificado" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              📜 Certificados & Ley
            </TabsTrigger>
            <TabsTrigger value="recurrencia" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              📆 Recurrencia & Alertas
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DIAGRAMA DE FLUJO */}
          <TabsContent value="flujo" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-400" />
                  Proceso E2E de Servicio de Control de Plagas
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Secuencia completa desde el pedido del cliente hasta la certificación técnica y agendamiento automático.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Diagrama de 6 Pasos */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2.5 relative">
                  
                  <div className="p-3 bg-slate-900 border border-blue-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs mb-1.5">1</div>
                    <span className="font-semibold text-xs text-blue-200">Alta de OT</span>
                    <p className="text-[10px] text-slate-400 mt-1">Recepción, plaga objetivo y dirección geocodificada.</p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-indigo-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs mb-1.5">2</div>
                    <span className="font-semibold text-xs text-indigo-200">Asignación & GPS</span>
                    <p className="text-[10px] text-slate-400 mt-1">Asignación a técnico y ruteo en Google Maps / Waze.</p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-full bg-amber-600/30 text-amber-400 flex items-center justify-center font-bold text-xs mb-1.5">3</div>
                    <span className="font-semibold text-xs text-amber-200">Tratamiento Campo</span>
                    <p className="text-[10px] text-slate-400 mt-1">Aplicación de gel/líquido, dosis y registro de lote.</p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-purple-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold text-xs mb-1.5">4</div>
                    <span className="font-semibold text-xs text-purple-200">Firma Táctil</span>
                    <p className="text-[10px] text-slate-400 mt-1">Conformidad del cliente firmada en pantalla móvil.</p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-emerald-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs mb-1.5">5</div>
                    <span className="font-semibold text-xs text-emerald-200">Certificado PDF</span>
                    <p className="text-[10px] text-slate-400 mt-1">Emisión de O.T. y certificado sanitario para inspección.</p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-cyan-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-7 h-7 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold text-xs mb-1.5">6</div>
                    <span className="font-semibold text-xs text-cyan-200">Alerta Recurrencia</span>
                    <p className="text-[10px] text-slate-400 mt-1">Aviso por WhatsApp 7 días antes de vencer el certificado.</p>
                  </div>

                </div>

                <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-emerald-300">Valor Clave de Negocio:</strong> El módulo no solo gestiona la visita técnica, sino que automatiza la **recompra recurrente**. En comercios e industrias, los certificados vencen cada 30 o 60 días por normativa municipal. El sistema avisa por WhatsApp antes del vencimiento para agendar la re-fumigación automáticamente.
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: BOTONES Y VALOR */}
          <TabsContent value="botones" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                      <Plus className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ + Nueva Orden (OT) ]</h4>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Planificación</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Crea un servicio especificando Cliente, Plagas (Roedores, Cucarachas, Mosquitos), Dirección y Técnico.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Centraliza pedidos, autogeocodifica la ubicación y asigna agenda.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ 📱 Panel Campo ]</h4>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 text-[10px]">Técnico Móvil</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Abre la interfaz táctil ultra-rápida pensada para el teléfono del fumigador en el lugar del trabajo.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Cero papelería, consumo exacto de químico por lote y firma en pantalla.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ 🗺️ Navegar / Waze / Maps ]</h4>
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-300 text-[10px]">Ruteo GPS</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Abre la ruta directa en Google Maps, Waze o Apple Maps con las paradas optimizadas del día.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Ahorra combustible y evita demoras en el tráfico urbano.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-600 rounded-lg text-white">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ 📜 Certificado PDF ]</h4>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 text-[10px]">Legal / Sanitario</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Emite e imprime el Certificado de Fumigación con número de matrícula profesional, químicos y vencimiento.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Cumple con las exigencias de inspecciones bromatológicas y municipales.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-600 rounded-lg text-white">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ 💬 WhatsApp Cliente ]</h4>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 text-[10px]">Comunicación</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Envía el aviso "En Camino", el certificado digital en PDF o el recordatorio de vencimiento al cliente.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Mejora la satisfacción del cliente y agiliza la entrega de documentos.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-600 rounded-lg text-white">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ ⚠️ Alertas Vencimiento ]</h4>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">Agenda Recurrente</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Filtra los certificados que vencen en los próximos 15, 30 o 60 días para coordinar la refumigación.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Retiene clientes automáticamente e impulsa las ventas del mes.
                </div>
              </div>

            </div>
          </TabsContent>

          {/* TAB 3: CERTIFICADOS Y LEY */}
          <TabsContent value="certificado" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-400" />
                  Normativa y Datos Obligatorios del Certificado
                </CardTitle>
                <CardDescription className="text-slate-400">
                  El Certificado Técnico Sanitario debe incluir los siguientes requisitos para ser válido en inspecciones:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1.5">
                  <strong className="text-purple-300 text-sm">1. Datos de la Empresa y Matrícula:</strong>
                  <p>Razón Social, CUIT, Dirección, Teléfono de Emergencia Toxicológica y Matrícula del Director Técnico (Ing. Agrónomo / Químico).</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1.5">
                  <strong className="text-purple-300 text-sm">2. Detalle del Tratamiento e Insumos:</strong>
                  <p>Principios activos utilizados (ej: Cipermetrina, Deltametrina, Bromadiolona), principio activo, dosis aplicada y número de lote de ANMAT.</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1.5">
                  <strong className="text-purple-300 text-sm">3. Fechas de Aplicación y Vencimiento Legal:</strong>
                  <p>Fecha y hora de aplicación + Fecha exacta de vencimiento de la cobertura (30 días en gastronomía, 60-90 días en consorcios/comercios).</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: RECURRENCIA */}
          <TabsContent value="recurrencia" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Motor de Recurrencia Automática de Fumigación
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Cómo transformar visitas puntuales en contratos mensuales/bimestrales recurrentes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-cyan-950/30 border border-cyan-800/50 rounded-xl space-y-2">
                  <h5 className="font-bold text-cyan-300 text-sm">Estrategia de Fidelización de 3 Pasos:</h5>
                  <ol className="text-xs text-slate-300 space-y-2 pl-4 list-decimal">
                    <li><strong>Al finalizar el servicio:</strong> El sistema programa una alerta a los 23 días (si el certificado dura 30 días).</li>
                    <li><strong>Disparo por WhatsApp (Día 23):</strong> *"Hola [Comercio], tu Certificado Sanitario N° XXXX vence el día [Fecha]. ¿Coordinamos la visita para esta semana?"*</li>
                    <li><strong>Re-agendamiento en 1 Clic:</strong> Al confirmar el cliente, se clona la O.T. anterior con los mismos datos y plaga objetivo.</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

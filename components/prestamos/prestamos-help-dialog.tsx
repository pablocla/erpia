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
  Plus,
  MapPin,
  MessageSquare,
  RefreshCw,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Activity,
  Layers,
  ShieldAlert
} from "lucide-react"

interface PrestamosHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrestamosHelpDialog({ open, onOpenChange }: PrestamosHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 text-slate-100 border-slate-800">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                Guía y Diagrama del Módulo de Préstamos
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs font-normal">
                  Prestamistas & Microcréditos
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Aprende cómo funciona el ciclo de vida del préstamo, la medición de rentabilidad real anti-inflación y el valor de cada botón operativo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="flujo" className="w-full mt-4">
          <TabsList className="bg-slate-800/80 border border-slate-700 text-slate-300 grid grid-cols-4 w-full">
            <TabsTrigger value="flujo" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              🔄 Diagrama de Flujo
            </TabsTrigger>
            <TabsTrigger value="botones" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              🕹️ Botones & Valor
            </TabsTrigger>
            <TabsTrigger value="inflacion" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              📈 Rentabilidad vs IPC
            </TabsTrigger>
            <TabsTrigger value="mora" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              🛡️ Riesgo PAR
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DIAGRAMA DE FLUJO */}
          <TabsContent value="flujo" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-400" />
                  Ciclo Completo de Vida de un Préstamo
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Flujo ordenado desde el scoring inicial hasta la rentabilidad final cobrada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Diagrama Visual */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                  
                  <div className="p-3.5 bg-slate-900 border border-blue-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold mb-2">1</div>
                    <span className="font-semibold text-sm text-blue-200">Originación & Scoring</span>
                    <p className="text-xs text-slate-400 mt-1">Verificación DNI, ratio cuota/ingreso e historial.</p>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-indigo-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold mb-2">2</div>
                    <span className="font-semibold text-sm text-indigo-200">Simulación & Pagaré</span>
                    <p className="text-xs text-slate-400 mt-1">Tasa, cuotas, plan (Diario/Semanal) y firma de pagaré.</p>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-emerald-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold mb-2">3</div>
                    <span className="font-semibold text-sm text-emerald-200">Desembolso & Caja</span>
                    <p className="text-xs text-slate-400 mt-1">Entrega de efectivo o CBU. Impacto en Capital Sobrante.</p>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-amber-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-amber-600/30 text-amber-400 flex items-center justify-center font-bold mb-2">4</div>
                    <span className="font-semibold text-sm text-amber-200">Ruta & Cobranza</span>
                    <p className="text-xs text-slate-400 mt-1">Cobro diario/semanal, recargos mora y recibo WhatsApp.</p>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-violet-500/40 rounded-xl flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-violet-600/30 text-violet-400 flex items-center justify-center font-bold mb-2">5</div>
                    <span className="font-semibold text-sm text-violet-200">Cierre & Rentabilidad</span>
                    <p className="text-xs text-slate-400 mt-1">Ajuste por IPC/Inflación y re-inversión de utilidades.</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-950/40 border border-blue-800/50 rounded-xl flex items-start gap-3">
                  <Activity className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-blue-300">Regla de Oro del Negocio:</strong> El dinero prestado debe rotar a la máxima velocidad posible. Un préstamo cobrado en cuotas diarias o semanales genera una Tasa Efectiva Anual (TEA) hasta 3 veces superior a un préstamo mensual, protegiendo la liquidez frente a la inflación.
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
                    <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                      <Plus className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ Otorgar Préstamo ]</h4>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 text-[10px]">Originación</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Abre el simulador interactivo para ingresar Capital, Tasa (TNA/TEM), Cantidad de Cuotas y Frecuencia.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Elimina errores de cálculo manual, genera el Pagaré legal instantáneo y actualiza la cartera.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ Ruteo Cobranza ]</h4>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Operación Calle</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Accede al tablero táctil optimizado para cobradores en moto/calle con vista de mapa y listado del día.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Reduce los tiempos de recorrido un 35% y permite la rendición de caja sin fugas de dinero.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-600 rounded-lg text-white">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ Cobrar Cuota / Parcial ]</h4>
                  </div>
                  <Badge className="bg-violet-500/20 text-violet-300 text-[10px]">Caja / Recibo</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Registra cobros en efectivo, CBU o MercadoPago, calculando automáticamente recargos o mora diaria.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Asegura el cobro exacto de intereses por mora y emite comprobante térmico/PDF.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-600 rounded-lg text-white">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ Recordatorio WhatsApp ]</h4>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 text-[10px]">Fidelización & Mora</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Dispara un mensaje pre-diseñado con los datos de la cuotas, monto total y Alias/QR de pago directo.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Incrementa la puntualidad de cobro en un +40% al evitar descuidos del deudor.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-600 rounded-lg text-white">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ Refinanciar Deuda ]</h4>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">Recupero Cartera</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Unifica el saldo atrasado + punitorios y genera un nuevo acuerdo de pago a mayor plazo.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Evita declarar créditos como incobrables y emite un nuevo pagaré actualizado.
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-600 rounded-lg text-white">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Botón [ Fondeo / Retiro ]</h4>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px]">Tesorera</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Registra el ingreso de capital de inversores/propio o el retiro de utilidades de la firma.
                </p>
                <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <strong>Valor Aportado:</strong> Garantiza la trazabilidad del saldo "Capital Sobrante" disponible para colocar.
                </div>
              </div>

            </div>
          </TabsContent>

          {/* TAB 3: INFLACION Y FISHER */}
          <TabsContent value="inflacion" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Cálculo de Rentabilidad Real (Anti-Inflación IPC ARS)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  En economías inflacionarias, cobrar intereses no garantiza estar ganando patrimonio real.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs text-center space-y-2">
                  <div className="text-slate-400">Fórmula de Rentabilidad Real Deflactada (Efecto Fisher):</div>
                  <div className="text-lg font-bold text-emerald-400">
                    Rentabilidad Real = [ (1 + TEM Neta) / (1 + IPC) ] - 1
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Donde TEM Neta = Intereses Cobrados - Incobrabilidad - Gastos Operativos.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl">
                    <h5 className="font-semibold text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Caso Exitoso (Ganancia Real)
                    </h5>
                    <ul className="text-xs text-slate-300 space-y-1.5 mt-2">
                      <li>• TEM Cobrada Neta: <strong>10% mensual</strong></li>
                      <li>• IPC del Mes (Inflación): <strong>5.5%</strong></li>
                      <li>• <strong className="text-emerald-400">Rentabilidad Real: +4.26% de Ganancia en Poder de Compra.</strong></li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-rose-950/30 border border-rose-800/60 rounded-xl">
                    <h5 className="font-semibold text-rose-300 text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Caso Crítico (Licuación de Capital)
                    </h5>
                    <ul className="text-xs text-slate-300 space-y-1.5 mt-2">
                      <li>• TEM Cobrada Neta (tras mora): <strong>6% mensual</strong></li>
                      <li>• IPC del Mes (Inflación): <strong>7.5%</strong></li>
                      <li>• <strong className="text-rose-400">Rentabilidad Real: -1.40% (El negocio pierde capital real).</strong></li>
                    </ul>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: MANTENIMIENTO Y RIESGO PAR */}
          <TabsContent value="mora" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-400" />
                  Matriz PAR (Portfolio at Risk) y Protocolo de Cobranza
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Clasificación de la mora por tramos para aplicar la acción correspondiente sin fisuras.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">

                <div className="space-y-2">
                  <div className="p-3 bg-slate-900 border-l-4 border-l-emerald-500 rounded-r-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-white">PAR 0 (Al Día)</span>
                      <p className="text-xs text-slate-400">Cuotas vigentes sin atraso.</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300">Acción: Ninguna / Mantener</Badge>
                  </div>

                  <div className="p-3 bg-slate-900 border-l-4 border-l-blue-500 rounded-r-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-white">PAR 1 - 7 Días (Mora Temprana)</span>
                      <p className="text-xs text-slate-400">Demora puntual o descuido habitual.</p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-300">Acción: Botón WhatsApp Recordatorio</Badge>
                  </div>

                  <div className="p-3 bg-slate-900 border-l-4 border-l-amber-500 rounded-r-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-white">PAR 8 - 30 Días (Mora Intermedia)</span>
                      <p className="text-xs text-slate-400">Riesgo de encadenamiento de cuotas.</p>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-300">Acción: Asignar a Ruta / Cobrador</Badge>
                  </div>

                  <div className="p-3 bg-slate-900 border-l-4 border-l-rose-500 rounded-r-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-white">PAR 31 - 90 Días (Mora Crítica)</span>
                      <p className="text-xs text-slate-400">Dificultad de pago severa.</p>
                    </div>
                    <Badge className="bg-rose-500/20 text-rose-300">Acción: Botón Refinanciar Deuda</Badge>
                  </div>

                  <div className="p-3 bg-slate-900 border-l-4 border-l-purple-500 rounded-r-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-white">PAR +90 Días (Incobrables / NPL)</span>
                      <p className="text-xs text-slate-400">Pérdida técnica declarada.</p>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-300">Acción: Ejecución Legal Pagaré</Badge>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Code, Briefcase, GraduationCap } from "lucide-react"

export function ClavernetHero() {
  return (
    <section className="relative pt-24 pb-32 overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-600 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
          🚀 Programa de Partners Clavernet 2026 Abierto
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto">
          Hacé negocio con el software que <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            mueve a las PyMEs argentinas.
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
          Transformá tu red de contactos o tus habilidades técnicas en un ingreso recurrente mensual. Vendé el ERP más moderno del país, programá integraciones o cobrá por implementar. Nosotros nos ocupamos de los servidores y la facturación.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
          <Button size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-700 font-bold">
            Crear Cuenta de Partner <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 text-base font-bold text-slate-700">
            Ver Simulador de Ganancias
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider">MÁS POPULAR</div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Para Sellers y Contadores</h3>
            <p className="text-slate-600 mb-4 text-sm leading-relaxed">Recomendá y ganá. Llevate hasta un 30% de comisión recurrente por cada empresa que empiece a usar Claver con tu enlace. Ideal para contadores, consultoras y agencias B2B.</p>
            <ul className="space-y-2 text-sm text-slate-500 font-medium mt-4">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Link de afiliado automático</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Dashboard de comisiones en ARS</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Split de pagos mensual garantizado</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Para Developers</h3>
            <p className="text-slate-600 mb-4 text-sm leading-relaxed">Tu código, tus reglas. Creá microservicios, conectalos a nuestra API multi-tenant y publicalos en el Marketplace. Facturá el 70% de cada suscripción mensual de por vida.</p>
            <ul className="space-y-2 text-sm text-slate-500 font-medium mt-4">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> SDK y APIs abiertas seguras</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Acceso a base PyME cautiva</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Facturación resuelta por Claver Cloud</li>
            </ul>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Para Implementadores</h3>
            <p className="text-slate-600 mb-4 text-sm leading-relaxed">Tu tiempo vale. Las empresas necesitan ayuda para configurar su ERP y capacitar a sus empleados. Certificate como Teacher oficial y cobrá honorarios de implementación directamente.</p>
            <ul className="space-y-2 text-sm text-slate-500 font-medium mt-4">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Clientes derivados de la red</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Cobro por hora o setup fijo</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Sello de Teacher Certificado</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32 max-w-3xl mx-auto text-left">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Preguntas Frecuentes</h2>
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-lg mb-2">¿Tengo que saber programar para ser Seller?</h4>
              <p className="text-slate-600 text-sm">No, en absoluto. Solo necesitás registrarte, copiar tu link de afiliado y compartirlo. Si la empresa se suscribe a través de tu link, la comisión se asocia a tu cuenta automáticamente.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-lg mb-2">¿Cuándo y cómo cobro mis comisiones?</h4>
              <p className="text-slate-600 text-sm">Los cortes se realizan a fin de mes. El dinero se deposita mediante transferencia bancaria (CBU/CVU) a la cuenta registrada en tu portal de Partner entre el día 10 y 15 del mes siguiente.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-lg mb-2">¿Qué pasa si mi cliente deja de pagar el ERP?</h4>
              <p className="text-slate-600 text-sm">El modelo es 100% atado al éxito compartido (MRR). Si el cliente entra en mora o da de baja la suscripción, la comisión se suspende inmediatamente hasta que regularice su situación.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

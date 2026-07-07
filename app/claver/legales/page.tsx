import React from "react"
import { SubSaasAppsSection } from "@/components/marketing/commercial-catalog-sections"

export const metadata = {
  title: "Términos y Condiciones Legales | Claver",
  description: "Términos, condiciones y políticas de uso de los productos Claver.",
}

export default function LegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-8">
        Términos y Condiciones Legales
      </h1>
      
      <div className="prose prose-slate max-w-none">
        <p className="lead">
          Al utilizar los servicios de Claver, usted acepta nuestros términos de servicio y políticas de privacidad.
        </p>

        <h2>1. Condiciones Generales</h2>
        <p>
          Claver provee un sistema integral de gestión empresarial bajo la modalidad de Software as a Service (SaaS). 
          El uso de la plataforma está sujeto al pago de la suscripción correspondiente y al cumplimiento de las leyes vigentes.
        </p>

        <h2>2. Condiciones específicas: Sub-SaaS</h2>
        <p>
          Además de las condiciones generales, algunos de nuestros productos específicos (Sub-SaaS) tienen condiciones particulares de uso:
        </p>

        <div className="space-y-6 my-8">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mt-0">Claver Cobrá</h3>
            <p className="text-sm text-slate-600">
              Claver Cobrá es una herramienta de gestión de cobranzas. Claver no actúa como agente de retención ni garantiza el cobro de las deudas.
              La comunicación con los deudores es responsabilidad exclusiva del usuario, debiendo respetar las normativas de protección al consumidor y privacidad de datos.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mt-0">Claver Fiado</h3>
            <p className="text-sm text-slate-600">
              Claver Fiado permite llevar un registro de cuentas corrientes o fiados. El usuario es responsable de verificar la identidad y solvencia
              de sus clientes. Claver provee únicamente la herramienta tecnológica de registro y notificación.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mt-0">Claver Turnos</h3>
            <p className="text-sm text-slate-600">
              La plataforma de agendamiento online depende de la disponibilidad configurada por el usuario. Claver no se responsabiliza por
              turnos superpuestos debidos a mala configuración o inasistencias de los clientes finales.
            </p>
          </div>
        </div>

        <h2>3. Privacidad y Datos</h2>
        <p>
          Procesamos los datos de sus clientes exclusivamente para brindarle el servicio, actuando como encargados del tratamiento. 
          Usted retiene la titularidad de los datos y es responsable de obtener los consentimientos necesarios.
        </p>

        <h2>4. Pruebas Gratuitas (Trials)</h2>
        <p>
          Durante el período de prueba gratuita, el sistema puede limitar algunas funcionalidades. Una vez finalizado el trial, 
          se bloquearán las operaciones de escritura hasta que se confirme una suscripción paga.
        </p>
      </div>
    </div>
  )
}

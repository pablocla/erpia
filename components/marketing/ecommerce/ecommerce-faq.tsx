"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollReveal } from "@/components/ui/motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function EcommerceFaq() {
  const faqs = [
    {
      q: "¿Necesito otro sistema para gestionar la tienda?",
      a: "No. Toda la gestión se hace desde el panel central de Clavis. Cuando subís un producto en el ERP, podés decidir si lo hacés visible en la tienda minorista o en el portal mayorista con un solo clic. No hay sincronizaciones externas lentas ni integraciones con parches."
    },
    {
      q: "¿El stock se descuenta automáticamente al vender online?",
      a: "Sí. Apenas un cliente confirma su compra en la web, el sistema reserva las unidades inmediatamente para evitar vender un producto que no tenés. Esa reserva impacta al instante en tu stock de mostrador (POS) y en tus otros canales digitales."
    },
    {
      q: "¿Puedo tener tienda para consumidor final y portal para mayoristas al mismo tiempo?",
      a: "Exactamente. Podés habilitar la tienda pública B2C para cualquiera que llegue a tu web sin registrarse, y al mismo tiempo habilitar el Portal Mayorista B2B, donde tus distribuidores ingresan con su CUIT para ver sus listas de precios personalizadas, saldos de cuenta corriente y límites de crédito."
    },
    {
      q: "¿Funciona con factura electrónica AFIP?",
      a: "Totalmente. El circuito está pensado para Argentina: el pedido ingresa, se realiza el picking, se emite el remito de entrega y el sistema genera automáticamente la factura electrónica AFIP (factura A, B, C o de exportación) solicitando el CAE en segundos."
    },
    {
      q: "¿Se integra con Mercado Libre y Mercado Pago?",
      a: "Sí, a través de nuestros módulos adicionales (add-ons). Podés sincronizar publicaciones de Mercado Libre para bajar ventas al ERP de manera directa, y habilitar Mercado Pago como pasarela de cobros oficiales para recibir pagos con tarjeta de crédito, débito o transferencia en el checkout."
    },
    {
      q: "¿Cuánto tarda la implementación?",
      a: "Si ya usás Clavis, la activación es inmediata. El onboarding inteligente de IA te permite configurar las variables operativas de tu rubro, categorías de productos y pasarelas de pago en menos de 5 minutos para que puedas empezar a vender en el día."
    }
  ]

  return (
    <section className="py-16 md:py-24 bg-slate-50/50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        
        {/* Encabezado */}
        <ScrollReveal className="text-center">
          <Badge variant="outline" className="border-slate-350 bg-slate-100 text-slate-800">
            Ayuda y Respuestas
          </Badge>
          <h2 className="mt-4 font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
            Preguntas Frecuentes
          </h2>
          <p className="text-xs text-slate-550 mt-1">
            Todo lo que necesitas saber sobre el funcionamiento de los canales digitales integrados.
          </p>
        </ScrollReveal>

        {/* Acordeón de FAQs */}
        <ScrollReveal className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border-slate-200">
                <AccordionTrigger className="text-left font-medium text-slate-900 text-sm hover:text-slate-700">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>

      </div>
    </section>
  )
}

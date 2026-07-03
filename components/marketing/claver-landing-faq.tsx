"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LANDING_FAQ } from "@/lib/marketing/landing-seo"

export function ClaverLandingFaq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {LANDING_FAQ.map((item, i) => (
        <AccordionItem key={item.question} value={`faq-${i}`} className="border-slate-200">
          <AccordionTrigger className="text-left text-base font-medium text-slate-900 hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-slate-600 leading-relaxed">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
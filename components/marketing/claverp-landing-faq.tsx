"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CLAVERP_FAQ } from "@/lib/marketing/claverp-landing-seo"

export function ClaverpLandingFaq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {CLAVERP_FAQ.map((item, i) => (
        <AccordionItem key={item.question} value={`claverp-faq-${i}`} className="border-slate-200">
          <AccordionTrigger className="text-left text-base font-medium text-slate-900 hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-slate-600 leading-relaxed">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LANDING_FAQ, LANDING_FAQ_US } from "@/lib/marketing/landing-seo"

export function ClaverLandingFaq({ isUs = false }: { isUs?: boolean }) {
  const faqList = isUs ? LANDING_FAQ_US : LANDING_FAQ
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqList.map((item, i) => (
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
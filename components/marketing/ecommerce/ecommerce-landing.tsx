"use client"

import { EcommerceNav } from "@/components/marketing/ecommerce/ecommerce-nav"
import { EcommerceHero } from "@/components/marketing/ecommerce/ecommerce-hero"
import { EcommerceFeatures } from "@/components/marketing/ecommerce/ecommerce-features"
import { EcommerceSocialProof } from "@/components/marketing/ecommerce/ecommerce-social-proof"
import { EcommerceIntegrations } from "@/components/marketing/ecommerce/ecommerce-integrations"
import { EcommercePricing } from "@/components/marketing/ecommerce/ecommerce-pricing"
import { EcommerceFaq } from "@/components/marketing/ecommerce/ecommerce-faq"
import { EcommerceCtaFooter } from "@/components/marketing/ecommerce/ecommerce-cta-footer"

export function EcommerceLanding() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(248,246,241,0.9),_transparent_55%),_linear-gradient(120deg,_rgba(248,248,246,1),_rgba(234,242,246,0.9))]">
      <EcommerceNav />
      <main className="relative flex flex-col pt-16">
        <EcommerceHero />
        <div id="funcionalidades">
          <EcommerceFeatures />
        </div>
        <EcommerceSocialProof />
        <div id="integraciones">
          <EcommerceIntegrations />
        </div>
        <div id="precios">
          <EcommercePricing />
        </div>
        <div id="faq">
          <EcommerceFaq />
        </div>
        <EcommerceCtaFooter />
      </main>
    </div>
  )
}
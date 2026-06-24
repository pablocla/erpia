"use client"

import { EcommerceNav } from "@/components/marketing/ecommerce/ecommerce-nav"
import { EcommerceHero } from "@/components/marketing/ecommerce/ecommerce-hero"
import { EcommerceFeatures } from "@/components/marketing/ecommerce/ecommerce-features"
import { EcommerceSocialProof } from "@/components/marketing/ecommerce/ecommerce-social-proof"
import { EcommerceIntegrations } from "@/components/marketing/ecommerce/ecommerce-integrations"
import { EcommercePricing } from "@/components/marketing/ecommerce/ecommerce-pricing"
import { EcommerceFaq } from "@/components/marketing/ecommerce/ecommerce-faq"
import { EcommerceCtaFooter } from "@/components/marketing/ecommerce/ecommerce-cta-footer"

export default function EcommerceLandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(248,246,241,0.9),_transparent_55%),_linear-gradient(120deg,_rgba(248,248,246,1),_rgba(234,242,246,0.9))]">
      {/* Sticky navigation */}
      <EcommerceNav />

      <main className="relative flex flex-col pt-16">
        {/* Hero Section */}
        <EcommerceHero />

        {/* Features Comparison & Vertical Rubros */}
        <div id="funcionalidades">
          <EcommerceFeatures />
        </div>

        {/* Social Proof: Metrics + Testimonials */}
        <EcommerceSocialProof />

        {/* Integraciones nativas */}
        <EcommerceIntegrations />

        {/* Pricing Tables & Addons */}
        <div id="precios">
          <EcommercePricing />
        </div>

        {/* FAQ Accordion */}
        <div id="faq">
          <EcommerceFaq />
        </div>

        {/* Final CTA Contact Form & Footer */}
        <EcommerceCtaFooter />
      </main>
    </div>
  )
}
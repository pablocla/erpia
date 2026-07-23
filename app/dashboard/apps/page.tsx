import { Metadata } from "next"
import { AppsPageTabs } from "@/components/marketplace/apps-page-tabs"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getLocale } from "next-intl/server"

export const metadata: Metadata = {
  title: "App Store & Módulos | Claver ERP",
  description: "Marketplace de módulos, soluciones por industria y gestión de licencias.",
}

export default async function AppsPage() {
  const messages = await getMessages()
  const locale = await getLocale()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppsPageTabs />
    </NextIntlClientProvider>
  )
}

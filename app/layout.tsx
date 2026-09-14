import type { Metadata } from 'next'
import { Manrope, Fraunces, Geist_Mono, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeConfigProvider } from '@/lib/theme-config'
import { Toaster } from '@/components/ui/toaster'
import { ReportErrorButton } from '@/components/report-error-button'
import { CommandPalette } from '@/components/command-palette'
import { PageTrackerProvider } from '@/components/page-tracker-provider'
import { MetaPixel } from '@/components/meta-pixel'
import { ChatWidget } from '@/components/chat-widget'
import { getEffectiveLocale } from '@/lib/i18n/request-locale'
import { I18nProvider } from '@/components/i18n-provider'
import './globals.css'

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
})
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
})

export const viewport = {
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  // Holding-aware root defaults (Soft /software keeps its own Tier A overrides).
  // Avoid Fiado-first / ERP residual so Soft Ads + Holding home aren't polluted.
  title: {
    default: 'Claver — Soft · Energy · Infra · Blockchain',
    template: '%s | Claver',
  },
  description:
    'Holding Claver: software de gestión (Soft) y orquestación Works (Energy, Infra, Blockchain).',
  keywords: [
    'Claver',
    'Claver Soft',
    'software PyME Argentina',
    'POS Argentina',
    'Energy solar partners',
    'Infra obra partners',
    'Blockchain partners',
  ],
  authors: [{ name: 'Claver' }],
  openGraph: {
    title: 'Claver — Soft · Energy · Infra · Blockchain',
    description:
      'Holding Claver: Soft (gestión) y Works (Energy, Infra, Blockchain) con partners.',
    url: 'https://claver.ar',
    siteName: 'Claver',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claver — Soft · Energy · Infra · Blockchain',
    description:
      'Soft para gestionar tu PyME. Works para proyectos con partners (Energy, Infra, Blockchain).',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Claver',
  },
  icons: {
    icon: [
      {
        url: '/icon.svg?v=4',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getEffectiveLocale();
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    messages = (await import(`@/messages/es-AR.json`)).default;
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${manrope.variable} ${fraunces.variable} ${geistMono.variable} ${inter.variable} font-sans antialiased`}>
        <I18nProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <ThemeConfigProvider>
              <PageTrackerProvider>
                {children}
              </PageTrackerProvider>
              <MetaPixel />
              <CommandPalette />
              <ChatWidget />
              <ReportErrorButton />
              <Toaster />
            </ThemeConfigProvider>
          </ThemeProvider>
        </I18nProvider>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}

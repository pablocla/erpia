import type { Metadata } from 'next'
import { Manrope, Fraunces, Geist_Mono, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeConfigProvider } from '@/lib/theme-config'
import { Toaster } from '@/components/ui/toaster'
import { ReportErrorButton } from '@/components/report-error-button'
import { CommandPalette } from '@/components/command-palette'
import { ChatWidget } from '@/components/chat-widget'
import { getEffectiveLocale } from '@/lib/i18n/request-locale'
import { I18nProvider } from '@/components/i18n-provider'
import './globals.css'

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport = {
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: 'Claver ERP — Sistema de Gestión, POS y Facturación AFIP para PyMEs',
  description: 'Sistema ERP & POS #1 de Argentina para Comercio de Calle, Kioscos, Ferreterías, Mercado de Frutas y Talleres. Libreta de fiado digital, cobro por WhatsApp, facturación ARCA/AFIP en contingencia y control de stock.',
  keywords: [
    'ERP Argentina',
    'POS Argentina',
    'Facturación AFIP',
    'Libreta Fiado Digital',
    'Cobro WhatsApp MercadoPago',
    'Sistema Kiosco Almacen',
    'Sistema Mercado Central Rosario Buenos Aires',
    'Factura Electronica ARCA CAEA',
    'Software PyME Argentina',
  ],
  authors: [{ name: 'Grupo Claver ERP' }],
  openGraph: {
    title: 'Claver ERP — Facturación AFIP, Libreta de Fiado y POS Móvil',
    description: 'Optimizá tu comercio de calle en 60 segundos. Controlá el fiado, cobrá por WhatsApp con MercadoPago y emití facturas AFIP sin interrupciones.',
    url: 'https://claver.ar',
    siteName: 'Claver ERP',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claver ERP — El Sistema de Gestión que se paga solo',
    description: 'Cobrá deudas morosas por WhatsApp y facturá en contingencia AFIP desde tu celular.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Claver ERP',
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
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ThemeConfigProvider>
              {children}
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

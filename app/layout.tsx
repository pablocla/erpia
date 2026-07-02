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
  title: 'Claver by Claver — ERP & POS Argentina',
  description: 'Claver by Claver del grupo Claver: facturación AFIP, POS, stock, ecommerce y 40+ módulos para PyMEs argentinas.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Claver',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
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

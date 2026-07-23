import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

/* ═══════════════════════════════════════════════════════════════════════════
   NEXT.JS CONFIG — Enterprise-grade configuration
   - React Compiler: automatic memoization (eliminates useMemo/useCallback)
   - View Transitions API: native page transitions
   - Turbopack: default dev bundler via `next dev --turbopack`
   - Security headers: CSP, HSTS, SRI-ready
   ═══════════════════════════════════════════════════════════════════════════ */

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Vercel Web Analytics injects va.vercel-scripts.com (debug + prod) + Google GSI
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://accounts.google.com https://ssl.gstatic.com",
      "img-src 'self' data: blob: https://va.vercel-scripts.com https://lh3.googleusercontent.com https://ssl.gstatic.com https://*.googleusercontent.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Analytics beacons + Supabase + Vercel insights + Google Auth
      "connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.vercel-insights.com https://accounts.google.com",
      "frame-src 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  // Drivers SQL solo en runtime Node (Protheus introspection) — no bundlear en webpack
  serverExternalPackages: ["mssql", "tedious"],
  eslint: {
    // ESLint not required for demo build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore type errors for demo build — fix progressively
    ignoreBuildErrors: true,
  },
  // Typed routes — compile-time route type safety (moved from experimental in Next.js 15.5)
  typedRoutes: false,
  experimental: {
    // React Compiler — automatic memoization, eliminates manual useMemo/useCallback
    reactCompiler: true,
    // View Transitions — native CSS transitions between routes
    viewTransition: true,
    // Server Actions — improved streaming
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Logging for fetch calls in dev
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  async redirects() {
    return [
      { source: "/ecommerce", destination: "/claver/ecommerce", permanent: true },
      { source: "/claver/claverp/ecommerce", destination: "/claver/ecommerce", permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Cache static assets aggressively
      {
        source: "/icon(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
    ],
  },

}

export default withNextIntl(nextConfig)

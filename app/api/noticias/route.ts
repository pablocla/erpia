import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"

// Mock data for news since we don't have an API key configured yet.
const MOCK_NEWS: Record<string, any[]> = {
  tecnologia: [
    {
      id: "t1",
      title: "El auge de la Inteligencia Artificial Generativa en el ERP",
      summary: "Las empresas están adoptando IA para automatizar flujos de trabajo de manera masiva. Claver lidera la iniciativa en el cono sur.",
      url: "https://infobae.com",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
      publishedAt: new Date().toISOString(),
      source: "Tech News AR"
    },
    {
      id: "t2",
      title: "Nueva actualización de Next.js 15: Lo que necesitas saber",
      summary: "Rendimiento mejorado y nuevas características para el App Router. Impacto positivo en aplicaciones de gran escala.",
      url: "https://nextjs.org",
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
      publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      source: "Vercel Blog"
    },
    {
      id: "t3",
      title: "Ciberseguridad 2026: Nuevos vectores de ataque",
      summary: "Expertos advierten sobre amenazas emergentes en infraestructuras cloud y dispositivos IoT comerciales.",
      url: "https://wired.com",
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
      publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      source: "Security Tech"
    }
  ],
  finanzas: [
    {
      id: "f1",
      title: "Mercados al alza: SP500 rompe nuevo récord histórico",
      summary: "Los inversores muestran optimismo frente a los recientes recortes de tasas y los sólidos reportes de ganancias del sector tech.",
      url: "https://bloomberg.com",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800",
      publishedAt: new Date().toISOString(),
      source: "Finanzas Hoy"
    },
    {
      id: "f2",
      title: "Bitcoin supera la resistencia de los $90k",
      summary: "El mercado cripto experimenta un resurgimiento tras nuevas regulaciones favorables en Estados Unidos y Europa.",
      url: "https://coinmarketcap.com",
      imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800",
      publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      source: "CryptoNews"
    },
    {
      id: "f3",
      title: "Tasas de interés: ¿Qué espera el Banco Central?",
      summary: "Análisis profundo sobre la política monetaria y su impacto en las inversiones locales e internacionales.",
      url: "https://reuters.com",
      imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800",
      publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      source: "Reuters"
    }
  ],
  penny_stocks: [
    {
      id: "p1",
      title: "3 Penny Stocks tecnológicas con potencial x10 este año",
      summary: "Analistas apuntan a pequeñas empresas de microchips y ciberseguridad como las próximas joyas del mercado.",
      url: "https://yahoo.finance.com",
      imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800",
      publishedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      source: "Stock Alerts"
    },
    {
      id: "p2",
      title: "Micro-cap Biotech anuncia ensayo exitoso",
      summary: "Las acciones de la compañía farmacéutica de pequeña capitalización se dispararon un 150% en el pre-market.",
      url: "https://yahoo.finance.com",
      imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=800",
      publishedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      source: "MarketWatch"
    }
  ]
}

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") || "tecnologia"

  // En un escenario real, aquí haríamos fetch a NewsAPI o Alpha Vantage.
  // if (process.env.NEWS_API_KEY) { ... fetch from external API }

  let data = MOCK_NEWS[category]
  if (!data) {
    // Fallback a mezclar todo si no es una categoría conocida
    data = [...MOCK_NEWS.tecnologia, ...MOCK_NEWS.finanzas, ...MOCK_NEWS.penny_stocks]
  }

  // Simulamos un pequeño delay de red para efectos del loading state
  await new Promise(resolve => setTimeout(resolve, 600))

  return NextResponse.json({
    category,
    status: "ok",
    totalResults: data.length,
    articles: data
  })
}

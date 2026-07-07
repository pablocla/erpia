import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { SOLUTION_SLUGS, getSolution } from "@/lib/marketing/solutions-catalog"
import { getSiteUrl, buildLandingJsonLd } from "@/lib/marketing/landing-seo"
import { Button } from "@/components/ui/button"

export async function generateStaticParams() {
  return SOLUTION_SLUGS.map((slug) => ({
    slug: slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await params
  const solution = getSolution(p.slug)
  if (!solution) return {}

  const title = `${solution.headline} | ClavERP`
  const description = solution.subheadline
  const url = `${getSiteUrl()}/claver/claverp/${p.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  }
}

export default async function SolutionLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params
  const solution = getSolution(p.slug)

  if (!solution) {
    notFound()
  }

  const siteUrl = getSiteUrl()
  const jsonLd = buildLandingJsonLd(siteUrl)

  return (
    <>
      {/* Schema.org for Software Application / Rich Snippets */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">
        {/* Hero Section */}
        <header className={`py-24 text-white bg-gradient-to-br ${solution.heroGradient}`}>
          <div className="container max-w-5xl mx-auto px-4 text-center space-y-6">
            <div className="text-6xl mb-4">{solution.emoji}</div>
            <h1 className="text-4xl md:text-6xl font-bold font-[var(--font-fraunces)] leading-tight">
              {solution.headline}
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">{solution.subheadline}</p>
            <div className="pt-8">
              <Button size="lg" variant="secondary" className="text-lg px-8 h-14 rounded-full font-semibold" asChild>
                <Link href={solution.demoLink ?? "/demo"}>
                  {solution.cta} <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <p className="mt-4 text-sm opacity-80">Ideal para: {solution.icp}</p>
            </div>
          </div>
        </header>

        {/* Pains & Solutions Grid */}
        <section className="container max-w-5xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Pains */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">El problema actual</h2>
              <ul className="space-y-4">
                {solution.pains.map((pain, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-600 bg-red-50 p-4 rounded-lg border border-red-100">
                    <span className="text-red-500 font-bold">✕</span> {pain}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Cómo lo resuelve ClavERP</h2>
              <ul className="space-y-4">
                {solution.solutions.map((sol, idx) => (
                  <li key={idx} className="flex flex-col gap-1 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <CheckCircle2 className={`w-5 h-5 ${solution.accentColor}`} />
                      {sol.title}
                    </div>
                    <p className="text-slate-600 text-sm ml-7">{sol.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Metrics Banner */}
        <section className="bg-slate-900 text-white py-16">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {solution.metrics.map((metric, idx) => (
                <div key={idx} className="pt-8 md:pt-0">
                  <div className={`text-4xl font-bold mb-2 ${solution.accentColor.replace("text-", "text-").replace(/-\d00/, "-400")}`}>{metric.value}</div>
                  <div className="text-slate-400 font-medium">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
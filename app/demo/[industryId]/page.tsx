"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth/hooks"
import { getIndustryTemplate } from "@/lib/comercial/industry-templates"
import { launchIndustryDemo } from "@/components/onboarding/launch-industry-demo"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DemoIndustryDeepLinkPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { loginConToken } = useAuth()
  const industryId = typeof params.industryId === "string" ? params.industryId : ""
  const present = searchParams.get("present") === "1"
  const activarParam = searchParams.get("activar")
  const template = getIndustryTemplate(industryId)

  const [error, setError] = useState("")
  const [launching, setLaunching] = useState(true)

  useEffect(() => {
    if (!template) {
      setLaunching(false)
      setError(`Rubro no encontrado: ${industryId}`)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const dest = await launchIndustryDemo(industryId, loginConToken, { present, activar: activarParam })
        if (!cancelled) router.replace(dest)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error de conexión")
          setLaunching(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [industryId, template, loginConToken, router, present])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <Link href="/demo" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Elegir otro rubro
        </Link>

        <BrandLogo size="md" theme="dark" variant="group-full" showByClaver={false} />

        {template ? (
          <div>
            <p className="text-4xl">{template.emoji}</p>
            <h1 className="mt-2 font-[var(--font-fraunces)] text-2xl font-semibold">{template.label}</h1>
            <p className="mt-2 text-slate-400">{template.tagline}</p>
          </div>
        ) : null}

        {launching && !error && (
          <div className="flex flex-col items-center gap-3 text-slate-300">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Armando tu demo en 10 segundos…</p>
          </div>
        )}

        {error && (
          <>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" className="border-white/20" asChild>
              <Link href="/demo">Volver al sensor</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
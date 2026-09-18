"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import Link from "next/link"

export default function TenantLookupPage() {
  const router = useRouter()
  const [slug, setSlug] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (slug.trim()) {
      router.push(`/tenant/${slug.trim()}/login`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <Card className="w-full max-w-md border-border/80 shadow-sm">
        <CardHeader className="space-y-2 pb-4 text-center">
          <div className="flex justify-center mb-2">
            <BrandLogo size="md" variant="group-full" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Acceso a Entorno Protheus
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Ingresá el identificador de tu entorno para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Identificador de Entorno (Slug)</Label>
              <Input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="ej: mi-empresa"
                autoComplete="off"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={!slug.trim()}>
              Continuar al Login
            </Button>

            <div className="text-center mt-4">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                Volver al login principal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

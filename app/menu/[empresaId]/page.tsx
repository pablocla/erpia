"use client"

import { useEffect, useMemo, useState, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PlatoPublico {
  id: number
  nombre: string
  descripcion: string | null
  precioVenta: number
  categoriaId: number | null
  categoriaNombre: string | null
}

interface MenuPublicoResponse {
  success: boolean
  empresa: { id: number; nombre: string; logoUrl: string | null }
  categorias: Array<{ id: number; nombre: string }>
  platos: PlatoPublico[]
}

interface PageProps {
  params: Promise<{ empresaId: string }>
}

const fmtArs = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)

export default function MenuPublicoPage({ params }: PageProps) {
  const { empresaId } = use(params)
  const [data, setData] = useState<MenuPublicoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/menu-publico/${empresaId}`)
        if (!res.ok) throw new Error("Menú no disponible")
        const json = (await res.json()) as MenuPublicoResponse
        if (!json.success) throw new Error("Respuesta inválida")
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar")
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [empresaId])

  const platosPorCategoria = useMemo(() => {
    if (!data) return []
    const groups = new Map<string, PlatoPublico[]>()
    for (const plato of data.platos) {
      const key = plato.categoriaNombre ?? "Otros"
      const list = groups.get(key) ?? []
      list.push(plato)
      groups.set(key, list)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, "es"))
  }, [data])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8f5] px-4 py-12">
        <div className="mx-auto max-w-lg text-center text-slate-500">Cargando carta…</div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#faf8f5] px-4 py-12">
        <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
          {error ?? "No se encontró la carta"}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] pb-16">
      <header className="border-b border-amber-100 bg-white px-4 py-8 shadow-sm">
        <div className="mx-auto max-w-lg text-center">
          {data.empresa.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.empresa.logoUrl}
              alt=""
              className="mx-auto mb-4 h-16 w-16 rounded-full object-cover"
            />
          )}
          <h1 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
            {data.empresa.nombre}
          </h1>
          <Badge variant="secondary" className="mt-3">
            Carta digital
          </Badge>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-8 px-4 pt-8">
        {platosPorCategoria.length === 0 ? (
          <p className="text-center text-slate-500">Todavía no hay platos publicados.</p>
        ) : (
          platosPorCategoria.map(([categoria, platos]) => (
            <section key={categoria}>
              <h2 className="mb-4 font-[var(--font-fraunces)] text-xl font-semibold text-amber-900">
                {categoria}
              </h2>
              <div className="space-y-3">
                {platos.map((plato) => (
                  <Card key={plato.id} className="border-amber-100/80 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                      <CardTitle className="text-base font-semibold text-slate-900">
                        {plato.nombre}
                      </CardTitle>
                      <span className="shrink-0 font-semibold text-amber-800">
                        {fmtArs(plato.precioVenta)}
                      </span>
                    </CardHeader>
                    {plato.descripcion && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-slate-600">{plato.descripcion}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <footer className="mt-12 text-center text-xs text-slate-400">
        Menú con{" "}
        <a href="https://claver.com.ar/claver/apps/menu-qr" className="underline hover:text-slate-600">
          Claver Menú
        </a>
      </footer>
    </main>
  )
}
import * as fs from "fs"
import * as path from "path"
import matter from "gray-matter"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import DocClient from "@/components/docs/doc-client"
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Tag,
  User,
  Workflow,
  Layers,
  Shield,
  Rocket,
  ShoppingCart,
  MessageCircle,
  Receipt,
  Cloud,
  KeyRound,
  Compass,
  HandCoins,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { loadMdx } from "@/lib/docs/load-mdx"
import { cn } from "@/lib/utils"

const DOCS_DIR = path.join(process.cwd(), "content", "docs")

const CATEGORY_META: Record<string, { label: string; order: number; blurb: string }> = {
  room: { label: "Empezá acá · Flujos", order: 0, blurb: "Cómo funciona el sistema" },
  analista: { label: "Implementación", order: 1, blurb: "Poner un cliente en marcha" },
  developer: { label: "Desarrollo", order: 2, blurb: "Código y APIs" },
  funcional: { label: "Módulos", order: 3, blurb: "Qué hace cada parte" },
  operaciones: { label: "Operaciones", order: 4, blurb: "Deploy y salud" },
  comercial: { label: "Comercial", order: 5, blurb: "Venta y packs" },
  roadmap: { label: "Roadmap", order: 6, blurb: "Hacia dónde va" },
  "ia-context": { label: "Para la IA", order: 7, blurb: "Metadatos y prompts" },
  general: { label: "General", order: 99, blurb: "" },
}

type RoomCard = {
  slug: string
  title: string
  plain: string
  time: string
  icon: LucideIcon
  tone: string
}

const ROOM_CARDS: RoomCard[] = [
  {
    slug: "room/mapa-grupo",
    title: "¿Qué es el Grupo Claver?",
    plain: "ERP, Cloud, Leo, partners… en una sola imagen.",
    time: "3 min",
    icon: Layers,
    tone: "from-violet-500/15 to-violet-500/5 border-violet-500/25",
  },
  {
    slug: "room/como-funciona-todo",
    title: "Cómo funciona todo",
    plain: "Del click del cajero hasta la base de datos.",
    time: "6 min",
    icon: Workflow,
    tone: "from-sky-500/15 to-sky-500/5 border-sky-500/25",
  },
  {
    slug: "room/requisitos-funcionamiento",
    title: "Qué necesitás para que ande",
    plain: "Internet, base, env, WhatsApp, AFIP… checklist claro.",
    time: "4 min",
    icon: Rocket,
    tone: "from-amber-500/15 to-amber-500/5 border-amber-500/25",
  },
  {
    slug: "room/flujo-auth-multitenant",
    title: "Login y datos seguros",
    plain: "Cada comercio ve solo lo suyo. Así se logra.",
    time: "3 min",
    icon: Shield,
    tone: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/25",
  },
  {
    slug: "room/flujo-pos-caja",
    title: "Vender en el mostrador",
    plain: "Producto → cobro → caja → stock. Simple.",
    time: "4 min",
    icon: ShoppingCart,
    tone: "from-orange-500/15 to-orange-500/5 border-orange-500/25",
  },
  {
    slug: "room/flujo-fiado-leo",
    title: "Fiado y cobrar con Leo",
    plain: "La libreta digital y los recordatorios por WhatsApp.",
    time: "5 min",
    icon: HandCoins,
    tone: "from-rose-500/15 to-rose-500/5 border-rose-500/25",
  },
  {
    slug: "room/flujo-billing-skus",
    title: "Planes, trial y pagos",
    plain: "Qué se activa gratis, qué se cobra y cómo.",
    time: "4 min",
    icon: KeyRound,
    tone: "from-indigo-500/15 to-indigo-500/5 border-indigo-500/25",
  },
  {
    slug: "room/flujo-afip",
    title: "Factura AFIP",
    plain: "Del ticket a la factura con CAE, sin misterio.",
    time: "4 min",
    icon: Receipt,
    tone: "from-teal-500/15 to-teal-500/5 border-teal-500/25",
  },
  {
    slug: "room/flujo-go-live-cloud",
    title: "Poner un cliente en marcha",
    plain: "Del “sí” comercial al primer día de uso real.",
    time: "4 min",
    icon: Cloud,
    tone: "from-blue-500/15 to-blue-500/5 border-blue-500/25",
  },
]

const PERSONAS: {
  title: string
  desc: string
  href: string
  icon: LucideIcon
  cta: string
}[] = [
  {
    title: "Dueño de comercio",
    desc: "Quiero vender, fiar y cobrar sin enredarme.",
    href: "/dashboard/documentacion/room/flujo-pos-caja",
    icon: Store,
    cta: "Ver mostrador",
  },
  {
    title: "Implementador / analista",
    desc: "Tengo que dejar un local funcionando.",
    href: "/dashboard/documentacion/room/flujo-go-live-cloud",
    icon: Wrench,
    cta: "Ver go-live",
  },
  {
    title: "Desarrollador",
    desc: "Necesito arquitectura, tenant y APIs.",
    href: "/dashboard/documentacion/room/como-funciona-todo",
    icon: Workflow,
    cta: "Ver mapa técnico",
  },
  {
    title: "Comercial / partner",
    desc: "Qué vendo, qué no prometo, cómo cobramos.",
    href: "/dashboard/documentacion/room/mapa-grupo",
    icon: MessageCircle,
    cta: "Ver el grupo",
  },
]

const AUDIENCE_LABEL: Record<string, string> = {
  all: "Para todos",
  developer: "Desarrollo",
  analista: "Implementación",
  operaciones: "Operaciones",
  comercial: "Comercial",
  ia: "IA",
  partner: "Partner",
}

interface SidebarItem {
  slug: string
  title: string
  audience: string
  position: number
}

interface SidebarCategory {
  key: string
  category: string
  order: number
  items: SidebarItem[]
}

function getSidebarItems(): SidebarCategory[] {
  if (!fs.existsSync(DOCS_DIR)) return []

  const categories: Record<string, SidebarItem[]> = {}

  function scanDir(dir: string, baseSlug = "") {
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        scanDir(fullPath, baseSlug ? `${baseSlug}/${file}` : file)
        continue
      }
      if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue

      try {
        const fileContent = fs.readFileSync(fullPath, "utf-8")
        const { data } = matter(fileContent)
        const fileSlug = file.replace(/\.mdx?$/, "")
        const slug = baseSlug ? `${baseSlug}/${fileSlug}` : fileSlug
        if (slug === "index") continue

        const catKey = slug.includes("/") ? slug.split("/")[0] : "general"
        const item: SidebarItem = {
          slug,
          title: data.title || fileSlug,
          audience: data.audience || "all",
          position: typeof data.sidebar_position === "number" ? data.sidebar_position : 50,
        }
        if (!categories[catKey]) categories[catKey] = []
        categories[catKey].push(item)
      } catch {
        /* skip broken frontmatter */
      }
    }
  }

  scanDir(DOCS_DIR)

  return Object.keys(categories)
    .map((catKey) => {
      const meta = CATEGORY_META[catKey] ?? {
        label: catKey.charAt(0).toUpperCase() + catKey.slice(1).replace(/-/g, " "),
        order: 50,
        blurb: "",
      }
      return {
        key: catKey,
        category: meta.label,
        order: meta.order,
        items: [...categories[catKey]].sort(
          (a, b) => a.position - b.position || a.title.localeCompare(b.title, "es"),
        ),
      }
    })
    .sort((a, b) => a.order - b.order)
}

function HomeHub() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-primary mb-3">
          <Compass className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.18em]">Claver Docs</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground max-w-2xl">
          La sala donde se entiende cómo funciona Claver
        </h2>
        <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
          Sin jerga innecesaria. Diagramas, pasos y checklist para dueños, implementadores,
          devs y partners. Empezá por tu rol o por un flujo de la sala.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/dashboard/documentacion/room/como-funciona-todo">
            <Button className="rounded-xl gap-2">
              <Workflow className="h-4 w-4" />
              Empezar por el mapa
            </Button>
          </Link>
          <Link href="/dashboard/documentacion/room/requisitos-funcionamiento">
            <Button variant="outline" className="rounded-xl gap-2">
              <Rocket className="h-4 w-4" />
              Checklist para que ande
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          ¿Quién sos?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERSONAS.map((p) => {
            const Icon = p.icon
            return (
              <Link
                key={p.title}
                href={p.href}
                className="group rounded-2xl border bg-card/80 p-4 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{p.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{p.desc}</p>
                    <p className="text-sm font-medium text-primary mt-2">{p.cta} →</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Sala de flujos
          </h3>
          <p className="text-xs text-muted-foreground hidden sm:block">Tocá una tarjeta · lectura corta</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {ROOM_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.slug}
                href={`/dashboard/documentacion/${card.slug}`}
                className={cn(
                  "rounded-2xl border bg-gradient-to-br p-4 hover:shadow-md hover:-translate-y-0.5 transition-all",
                  card.tone,
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/80 border border-border/50">
                    <Icon className="h-4 w-4 text-foreground" />
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {card.time}
                  </span>
                </div>
                <p className="font-semibold text-foreground leading-snug">{card.title}</p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{card.plain}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/30 p-5">
        <h3 className="font-semibold text-foreground mb-1">También podés ir al manual del día a día</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Ventas, caja y pantallas para quien opera el local — no es la wiki técnica.
        </p>
        <Link href="/dashboard/capacitacion/manual-usuario">
          <Button variant="secondary" className="rounded-xl gap-2">
            <BookOpen className="h-4 w-4" />
            Abrir capacitación
          </Button>
        </Link>
      </section>
    </div>
  )
}

export default async function DocumentacionPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const currentSlugPath = slug ? slug.join("/") : "index"
  const isHome = currentSlugPath === "index"

  let doc
  try {
    doc = await loadMdx(currentSlugPath)
  } catch (error) {
    console.error("Error al cargar MDX:", error)
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
          <BookOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">No encontramos esta página</h2>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
          Puede que el enlace sea viejo. Volvé al inicio de Claver Docs y elegí un flujo de la
          sala.
        </p>
        <Link href="/dashboard/documentacion" className="mt-6">
          <Button className="rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" /> Ir a Claver Docs
          </Button>
        </Link>
      </div>
    )
  }

  const headingRegex = /^(##|###) +(.*)$/gm
  const toc: { level: number; text: string; id: string }[] = []
  let match
  while ((match = headingRegex.exec(doc.rawContent)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    toc.push({ level, text, id })
  }

  const sidebar = getSidebarItems()
  const isRoom = currentSlugPath === "index" || currentSlugPath.startsWith("room/")

  return (
    <div className="flex flex-col gap-4 p-2 md:p-3 min-h-[calc(100vh-8rem)]">
      <header className="rounded-2xl border border-border/70 bg-card/90 backdrop-blur px-4 py-3.5 md:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Grupo Claver</p>
            <p className="text-lg font-extrabold tracking-tight text-foreground leading-tight">
              Claver Docs
              <span className="text-muted-foreground font-semibold"> · fácil de leer</span>
            </p>
          </div>
        </div>
        {!isHome && (
          <Link href="/dashboard/documentacion">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Inicio
            </Button>
          </Link>
        )}
      </header>

      <div className="flex flex-col lg:flex-row gap-5 flex-1">
        <aside className="w-full lg:w-72 shrink-0 lg:border-r lg:border-border/50 lg:pr-4">
          <DocClient
            sidebarItems={sidebar.map((c) => ({
              category: c.category,
              items: c.items.map(({ slug: s, title, audience }) => ({
                slug: s,
                title,
                audience,
              })),
            }))}
            currentSlug={currentSlugPath}
          />
        </aside>

        <div className="flex-1 min-w-0 flex gap-5">
          <article className="flex-1 min-w-0">
            {isHome ? (
              <HomeHub />
            ) : (
              <div className="rounded-3xl border border-border/70 bg-card/50 backdrop-blur-md p-5 md:p-8 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {isRoom && (
                    <Badge className="gap-1 text-[10px] uppercase bg-primary/15 text-primary border-0 rounded-lg">
                      <Workflow className="h-3 w-3" /> Flujo
                    </Badge>
                  )}
                  {doc.audience && (
                    <Badge variant="secondary" className="gap-1 text-[10px] rounded-lg">
                      <User className="h-3 w-3" />
                      {AUDIENCE_LABEL[doc.audience] ?? doc.audience}
                    </Badge>
                  )}
                  {doc.reading_minutes != null && (
                    <Badge variant="outline" className="gap-1 text-[10px] rounded-lg text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {doc.reading_minutes} min de lectura
                    </Badge>
                  )}
                  {doc.last_verified && (
                    <Badge variant="outline" className="gap-1 text-[10px] rounded-lg text-muted-foreground">
                      Actualizado {doc.last_verified}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                  {doc.title}
                </h1>
                {doc.description && (
                  <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-2xl border-b border-border/50 pb-5">
                    {doc.description}
                  </p>
                )}

                <div
                  className="claver-docs-prose mt-2 max-w-none"
                  dangerouslySetInnerHTML={{ __html: doc.html }}
                />

                {doc.tags && Array.isArray(doc.tags) && doc.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-10 pt-5 border-t border-border/50">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex gap-1.5 flex-wrap">
                      {doc.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] rounded-md">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-2">
                  <Link href="/dashboard/documentacion">
                    <Button variant="outline" className="rounded-xl gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Volver al inicio
                    </Button>
                  </Link>
                  <Link href="/dashboard/documentacion/room/como-funciona-todo">
                    <Button variant="secondary" className="rounded-xl gap-2">
                      <Workflow className="h-4 w-4" />
                      Mapa general
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </article>

          {!isHome && toc.length > 0 && (
            <aside className="hidden xl:block w-52 shrink-0">
              <div className="sticky top-20 rounded-2xl border bg-card/60 p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  En esta página
                </h3>
                <ul className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
                  {toc.map((t) => (
                    <li key={t.id} style={{ paddingLeft: `${(t.level - 2) * 10}px` }}>
                      <a
                        href={`#${t.id}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors block leading-snug"
                        title={t.text}
                      >
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

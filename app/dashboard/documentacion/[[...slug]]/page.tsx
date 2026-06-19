import * as fs from "fs"
import * as path from "path"
import matter from "gray-matter"
import { marked } from "marked"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import DocClient from "@/components/docs/doc-client"
import { ArrowLeft, BookOpen, Clock, Tag, User } from "lucide-react"

const WORKSPACE = "C:\\Users\\Pablo Clavero\\Downloads\\pos-system-argentina"
const DOCS_DIR = path.join(WORKSPACE, "content", "docs")

// Configure marked renderer for custom classes and anchors
const renderer = {
  heading(text: string, level: number) {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const levelClasses: Record<number, string> = {
      1: "text-3xl font-extrabold text-foreground mb-6",
      2: "text-xl font-bold text-foreground mt-8 mb-4 border-b pb-1 border-border/40",
      3: "text-lg font-semibold text-foreground mt-6 mb-3",
    }
    const cls = levelClasses[level] || "text-base font-medium mt-4 mb-2"
    return `<h${level} id="${id}" class="scroll-mt-20 group relative ${cls}">${text}<a href="#${id}" class="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-primary font-mono text-sm">#</a></h${level}>`
  },
  code(code: string, infostring: string | undefined) {
    if (infostring === "mermaid") {
      return `<pre class="mermaid bg-slate-900/50 p-4 rounded-xl border border-slate-800 my-6 overflow-x-auto text-center">${code}</pre>`
    }
    return `<pre class="bg-slate-950 p-4 rounded-xl border border-slate-800 my-6 overflow-x-auto"><code class="language-${infostring || "plaintext"} text-slate-200 text-xs font-mono">${code}</code></pre>`
  },
  table(header: string, body: string) {
    return `<div class="overflow-x-auto my-6"><table class="w-full text-left border-collapse border border-border"><thead class="bg-muted"><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`
  },
  tablerow(content: string) {
    return `<tr class="border-b border-border hover:bg-muted/30">${content}</tr>`
  },
  tablecell(content: string, flags: { header: boolean; align: string | null }) {
    const tag = flags.header ? "th" : "td"
    return `<${tag} class="p-3 border border-border text-xs">${content}</${tag}>`
  }
}

marked.use({ renderer })

interface SidebarItem {
  slug: string
  title: string
  audience: string
}

interface SidebarCategory {
  category: string
  items: SidebarItem[]
}

function getSidebarItems(): SidebarCategory[] {
  if (!fs.existsSync(DOCS_DIR)) return []

  const categories: Record<string, SidebarItem[]> = {}
  
  function scanDir(dir: string, baseSlug = "") {
    const list = fs.readdirSync(dir)
    list.forEach(file => {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanDir(fullPath, baseSlug ? `${baseSlug}/${file}` : file)
      } else if (file.endsWith(".mdx") || file.endsWith(".md")) {
        const fileContent = fs.readFileSync(fullPath, "utf-8")
        const { data } = matter(fileContent)
        const slug = baseSlug 
          ? `${baseSlug}/${file.replace(/\.mdx?$/, "")}`
          : file.replace(/\.mdx?$/, "")
          
        if (slug === "index") return // Skip root index as its own item

        const parts = slug.split("/")
        const catName = parts.length > 1 ? parts[0] : "General"
        
        const item: SidebarItem = {
          slug,
          title: data.title || file.replace(/\.mdx?$/, ""),
          audience: data.audience || "all"
        }

        if (!categories[catName]) {
          categories[catName] = []
        }
        categories[catName].push(item)
      }
    })
  }

  scanDir(DOCS_DIR)

  return Object.keys(categories).map(catKey => ({
    category: catKey.charAt(0).toUpperCase() + catKey.slice(1).replace(/-/g, " "),
    items: categories[catKey]
  }))
}

export default async function DocumentacionPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const currentSlugPath = slug ? slug.join("/") : "index"
  
  let filePath = path.join(DOCS_DIR, `${currentSlugPath}.mdx`)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DOCS_DIR, `${currentSlugPath}.md`)
  }

  // Fallback if not found
  if (!fs.existsSync(filePath)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Documento no encontrado</h2>
        <p className="text-muted-foreground text-sm mt-2">La ruta que intentás acceder no existe en la wiki.</p>
        <Link href="/dashboard/documentacion" className="mt-4">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Button>
        </Link>
      </div>
    )
  }

  const fileContent = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(fileContent)
  const html = await marked.parse(content)

  // Extract H2 and H3 for TOC
  const headingRegex = /^(##|###) +(.*)$/gm
  const toc: { level: number; text: string; id: string }[] = []
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    toc.push({ level, text, id })
  }

  const sidebar = getSidebarItems()

  return (
    <div className="flex flex-col md:flex-row gap-6 p-2 min-h-[calc(100vh-8rem)]">
      {/* Sidebar (Desktop Left) */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4 border-r border-border/40 pr-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground tracking-wide uppercase">ERP Wiki</h2>
        </div>
        <DocClient sidebarItems={sidebar} currentSlug={currentSlugPath} />
        
        {/* Navigation Tree */}
        <nav className="hidden md:flex flex-col gap-4 mt-2 overflow-y-auto max-h-[70vh]">
          <Link
            href="/dashboard/documentacion"
            className={`text-xs py-1 rounded transition-colors ${
              currentSlugPath === "index" ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🏠 Inicio / Home Wiki
          </Link>
          {sidebar.map(cat => (
            <div key={cat.category} className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{cat.category}</h3>
              <div className="flex flex-col gap-1 pl-2 border-l border-border/30">
                {cat.items.map(item => (
                  <Link
                    key={item.slug}
                    href={`/dashboard/documentacion/${item.slug}`}
                    className={`text-xs py-1 rounded transition-colors ${
                      currentSlugPath === item.slug ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Doc Content */}
      <article className="flex-1 min-w-0 max-w-4xl bg-card/40 backdrop-blur-md rounded-2xl border p-6 md:p-8">
        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {data.audience && (
            <Badge variant="secondary" className="gap-1 text-[10px] uppercase">
              <User className="h-3 w-3" /> {data.audience}
            </Badge>
          )}
          {data.layer && (
            <Badge variant="outline" className="text-[10px] uppercase border-primary/30 text-primary">
              Capa: {data.layer}
            </Badge>
          )}
          {data.last_verified && (
            <Badge variant="ghost" className="gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" /> Verificado: {data.last_verified}
            </Badge>
          )}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground font-sans">
          {data.title || "Documentación"}
        </h1>
        {data.description && (
          <p className="text-muted-foreground text-sm mb-6 border-b pb-4 border-border/40 italic">
            {data.description}
          </p>
        )}

        {/* Rendered HTML */}
        <div 
          className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-xs space-y-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Tags footer */}
        {data.tags && Array.isArray(data.tags) && (
          <div className="flex items-center gap-2 mt-8 pt-4 border-t border-border/40">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex gap-1.5 flex-wrap">
              {data.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Table of Contents (Desktop Right) */}
      {toc.length > 0 && (
        <aside className="hidden xl:block w-48 shrink-0 pl-4 border-l border-border/40">
          <div className="sticky top-20">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">En esta página</h3>
            <ul className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
              {toc.map(t => (
                <li 
                  key={t.id}
                  style={{ paddingLeft: `${(t.level - 2) * 8}px` }}
                >
                  <Link 
                    href={`#${t.id}`}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors block truncate"
                    title={t.text}
                  >
                    {t.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  )
}

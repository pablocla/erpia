import * as fs from "fs"
import * as path from "path"
import matter from "gray-matter"
import { marked } from "marked"

export interface MdxData {
  slug: string
  title: string
  description: string
  audience: string
  tags: string[]
  layer: string
  last_verified: string
  related_routes?: string[]
  related_apis?: string[]
  related_code?: string[]
  reading_minutes?: number
  plain_summary?: string
  html: string
  wikiUrl: string
  rawContent: string
}

interface CacheEntry {
  data: MdxData
  expiresAt: number
}

const CACHE_TTL_MS = 30_000
const cache = new Map<string, CacheEntry>()

const DOCS_DIR = path.join(process.cwd(), "content", "docs")

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/** Estilos orientados a lectura amigable (no “manual de ingeniero denso”) */
const renderer = {
  heading(text: string, level: number) {
    const id = slugify(text)
    const levelClasses: Record<number, string> = {
      1: "text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-4 mt-2",
      2: "text-lg md:text-xl font-bold text-foreground mt-10 mb-3 flex items-center gap-2 before:content-[''] before:block before:w-1 before:h-5 before:rounded-full before:bg-primary before:shrink-0",
      3: "text-base md:text-lg font-semibold text-foreground mt-7 mb-2",
      4: "text-sm font-semibold text-foreground mt-5 mb-2",
    }
    const cls = levelClasses[level] || "text-sm font-medium mt-4 mb-2 text-foreground"
    return `<h${level} id="${id}" class="scroll-mt-24 group relative ${cls}">${text}<a href="#${id}" class="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-primary font-mono text-xs" aria-label="Enlace a sección">#</a></h${level}>`
  },
  paragraph(text: string) {
    return `<p class="text-[15px] md:text-base leading-relaxed text-foreground/85 mb-4">${text}</p>`
  },
  list(body: string, ordered: boolean) {
    const tag = ordered ? "ol" : "ul"
    const listCls = ordered
      ? "list-decimal pl-5 space-y-2.5 mb-5 text-[15px] text-foreground/85 marker:text-primary marker:font-semibold"
      : "list-disc pl-5 space-y-2.5 mb-5 text-[15px] text-foreground/85 marker:text-primary"
    return `<${tag} class="${listCls}">${body}</${tag}>`
  },
  listitem(text: string) {
    return `<li class="leading-relaxed pl-1">${text}</li>`
  },
  blockquote(quote: string) {
    return `<aside class="my-6 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 md:px-5 md:py-4 text-[15px] leading-relaxed text-foreground shadow-sm [&>p]:mb-0 [&>p]:text-foreground/90">${quote}</aside>`
  },
  codespan(code: string) {
    return `<code class="rounded-md bg-muted px-1.5 py-0.5 text-[13px] font-mono text-foreground border border-border/60">${code}</code>`
  },
  code(code: string, infostring: string | undefined) {
    if (infostring === "mermaid") {
      return `<div class="my-8 rounded-2xl border border-border/80 bg-gradient-to-b from-muted/40 to-muted/10 p-3 md:p-5 shadow-sm overflow-x-auto"><p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Diagrama</p><pre class="mermaid !bg-transparent !border-0 !p-0 !m-0 text-center min-h-[80px]">${code}</pre></div>`
    }
    return `<pre class="bg-slate-950 dark:bg-black/60 p-4 rounded-2xl border border-border my-6 overflow-x-auto shadow-inner"><code class="language-${infostring || "plaintext"} text-slate-100 text-[12px] md:text-[13px] font-mono leading-relaxed">${code}</code></pre>`
  },
  table(header: string, body: string) {
    return `<div class="overflow-x-auto my-6 rounded-2xl border border-border shadow-sm"><table class="w-full text-left border-collapse min-w-[280px]"><thead class="bg-muted/80"><tr>${header}</tr></thead><tbody class="bg-card/40">${body}</tbody></table></div>`
  },
  tablerow(content: string) {
    return `<tr class="border-b border-border/70 last:border-0 hover:bg-muted/25 transition-colors">${content}</tr>`
  },
  tablecell(content: string, flags: { header: boolean; align: string | null }) {
    const tag = flags.header ? "th" : "td"
    const align = flags.align ? `text-${flags.align}` : ""
    const base = flags.header
      ? "p-3 md:p-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border"
      : "p-3 md:p-3.5 text-sm text-foreground/90 align-top"
    return `<${tag} class="${base} ${align}">${content}</${tag}>`
  },
  link(href: string, title: string | null | undefined, text: string) {
    const isInternal = href.startsWith("/dashboard") || href.startsWith("#")
    const titleAttr = title ? ` title="${title}"` : ""
    if (isInternal && !href.startsWith("#")) {
      return `<a href="${href}"${titleAttr} class="inline-flex items-center gap-1 font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors">${text}<span class="text-[10px] opacity-60" aria-hidden="true">→</span></a>`
    }
    return `<a href="${href}"${titleAttr} class="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary" ${href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`
  },
  strong(text: string) {
    return `<strong class="font-semibold text-foreground">${text}</strong>`
  },
  hr() {
    return `<hr class="my-10 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />`
  },
}

marked.use({ renderer: renderer as any })

function estimateReadingMinutes(content: string): number {
  const words = content.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 180))
}

export async function loadMdx(slug: string): Promise<MdxData | null> {
  if (slug.includes("..") || slug.startsWith("/") || path.isAbsolute(slug)) {
    throw new Error("Invalid slug path")
  }

  const now = Date.now()
  const cached = cache.get(slug)
  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  let filePath = path.join(DOCS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DOCS_DIR, `${slug}.md`)
  }

  if (!fs.existsSync(filePath)) {
    return null
  }

  const fileContent = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(fileContent)
  const html = await marked.parse(content)

  const mdxData: MdxData = {
    slug,
    title: data.title || slug.split("/").pop() || "",
    description: data.description || "",
    audience: data.audience || "all",
    tags: data.tags || [],
    layer: data.layer || "",
    last_verified: data.last_verified || "",
    related_routes: data.related_routes || [],
    related_apis: data.related_apis || [],
    related_code: data.related_code || [],
    reading_minutes: estimateReadingMinutes(content),
    plain_summary: data.plain_summary || data.description || "",
    html,
    wikiUrl: `/dashboard/documentacion/${slug}`,
    rawContent: content,
  }

  cache.set(slug, {
    data: mdxData,
    expiresAt: now + CACHE_TTL_MS,
  })

  return mdxData
}

export function clearMdxCache() {
  cache.clear()
}

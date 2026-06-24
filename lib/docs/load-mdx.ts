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
  html: string
  wikiUrl: string
  rawContent: string
}

interface CacheEntry {
  data: MdxData
  expiresAt: number
}

const CACHE_TTL_MS = 60_000
const cache = new Map<string, CacheEntry>()

const DOCS_DIR = path.join(process.cwd(), "content", "docs")

// Configure marked renderer for custom classes and anchors (matching page.tsx)
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

marked.use({ renderer: renderer as any })

export async function loadMdx(slug: string): Promise<MdxData | null> {
  // Sanitization: block directory traversal and absolute/leading slashes
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
    html,
    wikiUrl: `/dashboard/documentacion/${slug}`,
    rawContent: content
  }

  cache.set(slug, {
    data: mdxData,
    expiresAt: now + CACHE_TTL_MS
  })

  return mdxData
}

import * as fs from "fs"
import * as path from "path"
import matter from "gray-matter"

export interface DocSearchItem {
  slug: string
  title: string
  description: string
  tags: string[]
  audience: string
  href: string
}

let cachedIndex: DocSearchItem[] | null = null
let indexExpiry = 0
const CACHE_TTL_MS = 60_000

const DOCS_DIR = path.join(process.cwd(), "content", "docs")

export function buildDocsIndex(): DocSearchItem[] {
  const now = Date.now()
  if (cachedIndex && indexExpiry > now) {
    return cachedIndex
  }

  if (!fs.existsSync(DOCS_DIR)) {
    return []
  }

  const items: DocSearchItem[] = []

  function scanDir(dir: string, baseSlug = "") {
    const list = fs.readdirSync(dir)
    list.forEach(file => {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        scanDir(fullPath, baseSlug ? `${baseSlug}/${file}` : file)
      } else if (file.endsWith(".mdx") || file.endsWith(".md")) {
        try {
          const fileContent = fs.readFileSync(fullPath, "utf-8")
          const { data } = matter(fileContent)
          
          const fileSlug = file.replace(/\.mdx?$/, "")
          const slug = baseSlug ? `${baseSlug}/${fileSlug}` : fileSlug

          // Skip index page in search results as it's the home page
          if (slug === "index") return

          items.push({
            slug,
            title: data.title || fileSlug,
            description: data.description || "",
            tags: data.tags || [],
            audience: data.audience || "all",
            href: `/dashboard/documentacion/${slug}`
          })
        } catch (err) {
          console.error(`Error al indexar archivo: ${fullPath}`, err)
        }
      }
    })
  }

  scanDir(DOCS_DIR)
  
  cachedIndex = items
  indexExpiry = now + CACHE_TTL_MS
  return items
}

export function searchDocs(query: string, limit = 10): DocSearchItem[] {
  const index = buildDocsIndex()
  if (!query) {
    return index.slice(0, limit)
  }

  const cleanQuery = query.toLowerCase().trim()
  
  const results = index.filter(item => {
    const matchTitle = item.title.toLowerCase().includes(cleanQuery)
    const matchDescription = item.description.toLowerCase().includes(cleanQuery)
    const matchTags = item.tags.some(tag => tag.toLowerCase().includes(cleanQuery))
    const matchSlug = item.slug.toLowerCase().includes(cleanQuery)

    return matchTitle || matchDescription || matchTags || matchSlug
  })

  return results.slice(0, limit)
}

# PROMPT — Gemini: Ayuda Contextual Dinámica + Búsqueda Docs en Command Palette

> **Copiar y pegar en Gemini Antigravity.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Fecha: 2026-06-22  
> Prioridad: **P0** — Estrategias #1 y #5 (no implementar RAG, Sandbox API ni FlowDiagram MDX en este sprint)

---

## PROMPT (copiar desde acá)

```
Sos un arquitecto frontend + documentación senior. Tenés acceso al shell del repo ClavERP (Next.js 15, App Router, TypeScript, Tailwind v4, shadcn/ui).

## Objetivo

Unificar la documentación operativa en **una sola fuente de verdad** (`content/docs/**/*.mdx`) y exponerla en dos lugares:

1. **#1 Ayuda Contextual Dinámica** — El botón `?` del topbar (`ContextualHelp`) debe cargar el MDX correspondiente a la ruta activa, no el diccionario hardcodeado.
2. **#5 Búsqueda en Command Palette** — `Ctrl+K` / `Cmd+K` debe indexar artículos de la wiki y navegar a `/dashboard/documentacion/[slug]`.

**NO implementar en este sprint:** RAG/pgvector (#2), API Sandbox (#3), FlowDiagram embebido en MDX (#4).

---

## Estado actual del repo (leer antes de codear)

### Ya existe ✅
- Wiki embebida: `app/dashboard/documentacion/[[...slug]]/page.tsx`
- Contenido: `content/docs/` — **44 archivos MDX** con frontmatter YAML
- Renderer: `marked` + Mermaid + `components/docs/doc-client.tsx`
- Ayuda topbar: `components/contextual-help.tsx` — **~500 líneas de `TUTORIALES` hardcodeados**
- Command palette: `components/command-palette.tsx` — solo rutas ERP, sin docs
- Esquema metadata: `content/docs/ia-context/metadata-schema.mdx`
- Guías fiscales en Markdown suelto (migrar a MDX):
  - `docs/fiscal/CAEA-GUIA.md` ← **prioridad P0**
  - `docs/fiscal/AFIP-GUIA.md`

### Hardcode problemático
`contextual-help.tsx` líneas 50-462: `const TUTORIALES: Record<string, TutorialSeccion[]>`
`getTutorialForPath()` hace match por pathname pero el contenido NO viene de MDX.

`documentacion/[[...slug]]/page.tsx` usa path absoluto Windows:
```ts
const WORKSPACE = "C:\\Users\\Pablo Clavero\\Downloads\\pos-system-argentina"
```
**Corregir** a `path.join(process.cwd(), "content", "docs")` para portabilidad.

---

## ENTREGABLE 1 — Mapa ruta → slug MDX

Crear `lib/docs/path-to-slug.ts`:

```ts
export interface DocRouteMapping {
  /** Ruta dashboard exacta o prefijo (más específico gana) */
  pathname: string
  /** Slug relativo sin extensión, ej: "funcional/sistema-pos" */
  slug: string
  /** Si true, matchea pathname.startsWith(pathname) */
  prefix?: boolean
}

export const DOC_ROUTE_MAP: DocRouteMapping[] = [
  { pathname: "/dashboard/pos", slug: "funcional/sistema-pos", prefix: true },
  { pathname: "/dashboard/ventas", slug: "funcional/sistema-pos", prefix: true }, // o crear ventas-facturacion.mdx
  { pathname: "/dashboard/configuracion", slug: "funcional/afip-integracion", prefix: true },
  { pathname: "/dashboard/facturas", slug: "funcional/afip-integracion", prefix: true },
  { pathname: "/dashboard/caja", slug: "funcional/tesoreria", prefix: true },
  { pathname: "/dashboard/compras", slug: "funcional/especificacion-erp", prefix: true },
  { pathname: "/dashboard/capacitacion", slug: "funcional/manuales/operacion-diaria", prefix: true },
  { pathname: "/dashboard/documentacion", slug: "index", prefix: true },
  // ... completar top 30 rutas del sidebar ERP
]

export function resolveDocSlug(pathname: string): string
```

**Reglas:**
- Match exacto primero, luego prefijo más largo (`/dashboard/pos/cierre` → `funcional/sistema-pos`)
- Fallback: `index` o `analista/guia-implementacion`
- Test unitario: `__tests__/docs/path-to-slug.test.ts` con ≥15 casos

---

## ENTREGABLE 2 — API para servir MDX al cliente

Crear `app/api/docs/content/route.ts`:

```
GET /api/docs/content?slug=funcional/sistema-pos
```

**Response:**
```json
{
  "slug": "funcional/sistema-pos",
  "title": "...",
  "description": "...",
  "audience": "analista",
  "tags": ["pos", "afip"],
  "html": "<article>...</article>",
  "wikiUrl": "/dashboard/documentacion/funcional/sistema-pos"
}
```

**Implementación:**
- Reutilizar lógica de parseo de `documentacion/[[...slug]]/page.tsx` (extraer a `lib/docs/load-mdx.ts`)
- `gray-matter` + `marked` con mismo renderer (Mermaid, tablas, anchors)
- Sanitizar path: rechazar `..` en slug
- Cache en memoria 60s (mismo patrón que `parametro-service`)
- Auth: `getAuthContext()` — solo usuarios logueados

---

## ENTREGABLE 3 — Refactor ContextualHelp

Archivo: `components/contextual-help.tsx`

### Comportamiento nuevo del Sheet `?`

1. `usePathname()` → `resolveDocSlug(pathname)`
2. `fetch(/api/docs/content?slug=...)` al abrir el Sheet
3. **Pestañas o secciones:**
   - **Guía** — HTML renderizado del MDX (ScrollArea, prose ERP)
   - **Pasos rápidos** (opcional) — mantener checklist local si el MDX tiene sección `## Capacitación` o frontmatter `quick_steps: []`
   - **Ver wiki completa** — link `wikiUrl` (ExternalLink)
4. Loading skeleton mientras carga
5. Error state: "Sin documentación para esta pantalla" + link a `/dashboard/documentacion`

### Migración gradual del hardcode
- **NO borrar** `TUTORIALES` de golpe
- Si API falla o slug sin MDX → fallback a `getTutorialForPath(pathname)` (comportamiento actual)
- Marcar `TUTORIALES` con comentario `@deprecated — migrar a content/docs`

### Mermaid en Sheet
- Reutilizar init de `doc-client.tsx` (mermaid.run) después de inyectar HTML

### Estilo
- Tokens OKLCH del ERP, ancho Sheet 440px, `prose prose-sm dark:prose-invert max-w-none`

---

## ENTREGABLE 4 — Migrar guías fiscales a MDX

### `content/docs/funcional/caea-contingencia.mdx`

Migrar desde `docs/fiscal/CAEA-GUIA.md` con frontmatter:

```yaml
---
title: "CAEA — Contingencia offline POS"
description: "Parametrización, emisión e informe de comprobantes con CAEA (RG 5782)"
sidebar_position: 15
tags: ["afip", "caea", "pos", "contingencia", "fiscal"]
audience: analista
layer: 1-config
related_routes: ["/dashboard/pos", "/dashboard/configuracion"]
related_apis: ["/api/afip/caea", "/api/config/caea", "/api/pos/venta"]
related_code: ["lib/afip/caea-config.ts", "lib/afip/emitir-caea-factura.ts", "components/fiscal/caea-config-panel.tsx"]
last_verified: 2026-06-22
status: completo
---
```

Preservar diagrama Mermaid del original (convertir si está en texto).

### `content/docs/funcional/afip-integracion.mdx`

Migrar desde `docs/fiscal/AFIP-GUIA.md` — mismo esquema frontmatter.

### Actualizar `DOC_ROUTE_MAP`:
```ts
{ pathname: "/dashboard/pos", slug: "funcional/caea-contingencia", prefix: true } // cuando pregunten CAEA
// Resolver: POS usa sistema-pos por defecto; si URL tiene ?doc=caea usar query (opcional P1)
```

**Decisión:** POS → `funcional/sistema-pos` principal; agregar en sistema-pos.mdx sección "Ver también: CAEA" con link interno.

### Actualizar `content/docs/developer/api-overview.mdx`
Agregar filas para `/api/config/caea` y documentar CAEA si faltan.

---

## ENTREGABLE 5 — Índice de documentación para Command Palette

Crear `lib/docs/docs-index.ts`:

```ts
export interface DocSearchItem {
  slug: string
  title: string
  description: string
  tags: string[]
  audience: string
  href: string // /dashboard/documentacion/{slug}
}

export function buildDocsIndex(): DocSearchItem[]
export function searchDocs(query: string, limit?: number): DocSearchItem[]
```

- Escanear `content/docs/**/*.mdx` en build time o lazy con cache
- En **cliente**: precargar índice vía `GET /api/docs/index` (ligero, solo metadata sin HTML)

Crear `app/api/docs/index/route.ts` — lista slug, title, description, tags.

### Modificar `components/command-palette.tsx`

Agregar grupo **"Documentación"** (icono `BookOpen`):

```tsx
<CommandGroup heading="Documentación">
  {docResults.map(doc => (
    <CommandItem
      key={doc.slug}
      onSelect={() => navigate(doc.href)}
      keywords={[...doc.tags, doc.title, doc.description]}
    >
      <BookOpen className="mr-2 h-4 w-4" />
      <span>{doc.title}</span>
      <span className="text-xs text-muted-foreground ml-2">{doc.description}</span>
    </CommandItem>
  ))}
</CommandGroup>
```

- Cargar índice al abrir palette (SWR o fetch once)
- Búsqueda fuzzy simple: includes en title + tags + description (no instalar fuse.js salvo necesidad)
- Ejemplos que DEBEN funcionar:
  - `CAEA` → caea-contingencia.mdx
  - `AFIP` → afip-integracion.mdx
  - `POS` → sistema-pos.mdx
  - `deploy` → operaciones/deploy-runbook.mdx

---

## ENTREGABLE 6 — Cross-links capacitación ↔ documentación

En `app/dashboard/capacitacion/page.tsx` (si existe hub):
- Card "Documentación técnica" → `/dashboard/documentacion`

En `content/docs/index.mdx`:
- Sección "Diagramas interactivos" con links a:
  - `/dashboard/capacitacion/manual-usuario`
  - `/dashboard/capacitacion/parametrizacion`
  - `/dashboard/capacitacion/diagnostico`

**Corregir** en `capacitacion/diagnostico/page.tsx`:
- `generarCPPorCompra()` **NO es stub** — está en `lib/cc-cp/cuentas-service.ts` y event bus `COMPRA_REGISTRADA`
- Quitar de prioridad 1 / gaps

---

## ENTREGABLE 7 — Tests y verificación

```bash
npm run test
```

Crear:
- `__tests__/docs/path-to-slug.test.ts` — mapa rutas
- `__tests__/docs/docs-index.test.ts` — búsqueda CAEA, AFIP, POS

Smoke manual (documentar en comentario del PR):
1. Ir a `/dashboard/pos` → clic `?` → debe mostrar contenido de sistema-pos (o skeleton→contenido)
2. `Ctrl+K` → "CAEA" → abre caea-contingencia
3. `/dashboard/documentacion/funcional/caea-contingencia` renderiza MDX con Mermaid
4. Fallback: ruta sin MDX (ej `/dashboard/iot`) → ayuda legacy o mensaje amigable

---

## Archivos a CREAR

| Archivo | Propósito |
|---------|-----------|
| `lib/docs/path-to-slug.ts` | Mapa pathname → slug |
| `lib/docs/load-mdx.ts` | Parse MDX server-side (extraído de page.tsx) |
| `lib/docs/docs-index.ts` | Índice búsqueda |
| `app/api/docs/content/route.ts` | API contenido HTML |
| `app/api/docs/index/route.ts` | API índice metadata |
| `content/docs/funcional/caea-contingencia.mdx` | Guía CAEA |
| `content/docs/funcional/afip-integracion.mdx` | Guía AFIP |
| `__tests__/docs/path-to-slug.test.ts` | Tests mapa |
| `__tests__/docs/docs-index.test.ts` | Tests búsqueda |

## Archivos a MODIFICAR

| Archivo | Cambio |
|---------|--------|
| `components/contextual-help.tsx` | Cargar MDX dinámico + fallback |
| `components/command-palette.tsx` | Grupo Documentación |
| `app/dashboard/documentacion/[[...slug]]/page.tsx` | Usar `load-mdx.ts`, quitar path Windows |
| `content/docs/funcional/sistema-pos.mdx` | Link a CAEA + actualizar sección contingencia |
| `app/dashboard/capacitacion/diagnostico/page.tsx` | Fix generarCPPorCompra |
| `content/docs/developer/api-overview.mdx` | APIs CAEA/config |

## NO TOCAR

- `lib/afip/*` (lógica fiscal — solo documentar en MDX)
- `prisma/schema.prisma`
- `app/api/pos/venta/route.ts` POST
- `lib/theme-config.tsx`
- No instalar Docusaurus ni segundo puerto
- No implementar pgvector/RAG ni chat-widget changes

---

## Criterios de aceptación (Definition of Done)

- [ ] Un solo `npm run dev` — todo en puerto 3000
- [ ] `?` en POS muestra MDX de `sistema-pos.mdx`
- [ ] `Ctrl+K` + "CAEA" navega a wiki CAEA
- [ ] `docs/fiscal/*.md` migrados a `content/docs/funcional/*.mdx`
- [ ] `path-to-slug` con tests ≥15 casos passing
- [ ] `npm run test` — 0 regresiones (suite actual ~361 tests)
- [ ] Sin path absoluto Windows en código de docs
- [ ] Frontmatter completo en MDX nuevos (ver metadata-schema.mdx)

---

## Orden de implementación sugerido

1. `load-mdx.ts` + fix `documentacion/page.tsx`
2. `path-to-slug.ts` + tests
3. `api/docs/content` + `api/docs/index`
4. Migrar CAEA + AFIP a MDX
5. Refactor `ContextualHelp`
6. `command-palette` + docs-index
7. Cross-links + fix diagnostico
8. `npm run test` + smoke

---

## Referencia de arquitectura previa

Leer `PROMPT_GEMINI_DOCUSAURUS_EMBED.md` para contexto del wiki embebido (Estrategia A Fumadocs/MDX nativo — ya implementada parcialmente).

## Handoff post-sprint (NO hacer ahora)

- **#2 RAG:** cuando exista índice estable, conectar `chat-widget.tsx` a `docs-index` + pgvector
- **#3 Sandbox:** componente `<ApiTryIt endpoint="/api/pos/venta" />` en api-overview.mdx
- **#4 FlowDiagram:** registrar en MDX parser componentes de `capacitacion/manual-usuario`

Reportá al final: archivos tocados, tests, gaps, y screenshot/descripción del flujo POS `?` + Ctrl+K CAEA.
```

---

## Notas para Pablo

- Pegá solo el bloque entre las triple backticks en Gemini.
- Cursor ya implementó CAEA en código; Gemini documenta y **expone** esa guía en la wiki + ayuda contextual.
- Si Gemini termina antes: puede agregar `related_routes` al frontmatter de los 10 MDX más usados.
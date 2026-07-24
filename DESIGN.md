---
name: Claver
description: >
  Sistema visual del Grupo Claver — ERP/POS Argentina multi-tenant.
  Product-first: densidad operativa, tokens OKLCH, shadcn New York.
  Brand surfaces (landings) usan la misma base con más display y motion.
  Source of truth for CSS tokens: app/globals.css. Do not invent parallel palettes.

colors:
  # Semantic (default palette — Premium Corporate). Always prefer CSS vars in code.
  background: "oklch(0.968 0.004 245)"
  foreground: "oklch(0.14 0.01 245)"
  card: "oklch(0.995 0 0)"
  card-foreground: "oklch(0.14 0.01 245)"
  primary: "oklch(0.25 0.02 245)"
  primary-foreground: "oklch(0.98 0 0)"
  secondary: "oklch(0.96 0.005 245)"
  secondary-foreground: "oklch(0.20 0.01 245)"
  muted: "oklch(0.96 0.005 245)"
  muted-foreground: "oklch(0.45 0.01 245)"
  accent: "oklch(0.96 0.005 245)"
  accent-foreground: "oklch(0.20 0.01 245)"
  destructive: "oklch(0.45 0.16 27)"
  destructive-foreground: "oklch(0.98 0.01 27)"
  border: "oklch(0.92 0.005 245)"
  input: "oklch(0.92 0.005 245)"
  ring: "oklch(0.70 0.01 245)"
  canvas: "oklch(0.985 0.002 245)"
  surface: "oklch(0.995 0 0)"
  surface-elev: "oklch(0.98 0.005 245)"
  surface-border: "oklch(0.92 0.005 245)"
  sidebar: "oklch(0.99 0.002 245)"
  sidebar-primary: "oklch(0.25 0.02 245)"
  # Status semantic
  status-success: "oklch(0.55 0.14 155)"
  status-warning: "oklch(0.72 0.14 75)"
  status-error: "oklch(0.55 0.18 25)"
  status-info: "oklch(0.55 0.12 245)"
  status-neutral: "oklch(0.55 0.01 245)"
  # Charts
  chart-1: "oklch(0.48 0.12 245)"
  chart-2: "oklch(0.55 0.14 185)"
  chart-3: "oklch(0.60 0.15 65)"
  chart-4: "oklch(0.65 0.16 315)"
  chart-5: "oklch(0.75 0.18 85)"

typography:
  sans:
    fontFamily: "Manrope, system-ui, sans-serif"
    cssVar: "--font-sans" # → --font-manrope
  display:
    fontFamily: "Fraunces, Georgia, serif"
    cssVar: "--font-display" # → --font-fraunces
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    cssVar: "--font-mono" # → --font-geist-mono
  scale:
    "12": "0.75rem"    # meta, badges
    "13": "0.8125rem"  # secondary UI
    "14": "0.875rem"   # dense body, table, controls
    "16": "1rem"       # default body
    "18": "1.125rem"   # lead / card title soft
    "20": "1.25rem"    # section within card
    "24": "1.5rem"     # page title (mobile)
    "30": "1.875rem"   # page title (sm+)
    "36": "2.25rem"    # marketing section
    "48": "3rem"       # marketing display
  roles:
    page-title:
      fontFamily: "Manrope"
      fontSize: "1.5rem" # text-2xl; sm: text-3xl
      fontWeight: 700
      letterSpacing: "-0.025em"
      lineHeight: 1.2
    body:
      fontFamily: "Manrope"
      fontSize: "0.875rem"
      fontWeight: 400
      lineHeight: 1.5
    muted:
      fontFamily: "Manrope"
      fontSize: "0.875rem"
      color: "var(--muted-foreground)"
    display-marketing:
      fontFamily: "Fraunces"
      fontWeight: 600
      letterSpacing: "-0.02em"
      lineHeight: 1.1
    mono-data:
      fontFamily: "Geist Mono"
      fontSize: "0.8125rem"

rounded:
  sm: "calc(var(--radius) - 4px)"
  md: "calc(var(--radius) - 2px)"
  lg: "var(--radius)"           # 0.75rem default
  xl: "calc(var(--radius) + 4px)"
  full: "9999px"
  base: "0.75rem"

spacing:
  page-stack: "1.5rem"   # space-y-6 in PageShell
  toolbar-gap: "0.75rem" # gap-3
  section-gap: "1rem"    # gap-4
  card-pad: "1rem"       # p-4; sm:p-5 on surface headers
  touch-min: "40px"

components:
  button-primary:
    use: "@/components/ui/button"
    variant: default
  button-secondary:
    use: "@/components/ui/button"
    variant: outline
  page-shell:
    use: "@/components/layout"
    export: PageShell
  page-header:
    use: "@/components/layout"
    export: PageHeader
  page-toolbar:
    use: "@/components/layout"
    export: PageToolbar
  status-badge:
    use: "@/components/layout"
    export: StatusBadge
  data-table:
    use: "@/components/data-table"
  empty-state:
    use: "@/components/ui/empty-state"
  kpi-strip:
    use: "@/components/layout"
    export: KpiStrip
---

# Design System: Grupo Claver

## 1. Overview

**Creative North Star: “Operativo con oficio”**

Claver se siente como un **ERP/POS premium argentino**: limpio, confiable y rápido de usar. No es un playground de efectos AI ni un template de startup US. El color vive en **tokens OKLCH** (tema + paletas de tenant); la tipografía en **Manrope** (UI) y **Fraunces** (display de marca); los componentes en **shadcn/ui New York** + layout kit de `components/layout`.

**Key characteristics**

- Product-first: densidad media-alta, jerarquía clara, poca ornamentación.
- Tokens semánticos (`--primary`, `--status-*`, `--surface`) — nunca hex/oklch sueltos en páginas.
- Dark mode nativo (`.dark`) + paletas `[data-palette="…"]` (porcelain, sand, sage, mist, blue, green, orange, rose, violet, amber, teal, …).
- Un solo kit de página en dashboard: `PageShell` / `PageHeader` / `PageToolbar` / `DataTable` / `StatusBadge` / `EmptyState`.
- Brand surfaces pueden ser más expresivas; **no** copiar esa expresividad al POS ni a grillas fiscales.

**Source of truth**

| Artefacto | Rol |
|-----------|-----|
| `app/globals.css` | Tokens OKLCH, paletas, motion utilities |
| `components/ui/*` | Primitivos shadcn |
| `components/layout/*` | Shell de páginas de producto |
| `lib/ui/status-map.ts` | Variantes/labels de estado de dominio |
| `docs/DESIGN-SYSTEM.md` | Recetas de página (listados, badges) |
| `PRODUCT.md` | Audiencia, surfaces, principios de producto |

Si un valor de token cambia en `globals.css`, este archivo debe alinearse — **el CSS gana**.

---

## 2. The Kit: One Vocabulary

### Consumption rule

Al construir o refinar una pantalla de **producto**:

1. Usar primitivos de `@/components/ui/*` (Button, Input, Card, Dialog, Select, Table, Tabs, Sheet, Toast/Sonner, etc.).
2. Usar layout de `@/components/layout` antes de inventar wrappers.
3. Usar `cn()` de `@/lib/utils` para clases condicionales.
4. Inventar solo si el kit no cubre el patrón; si el patrón se repite, extraer a `components/`.

### Page scaffold (dashboard / cloud / la mayoría de módulos)

```tsx
import { PageShell, PageHeader, PageToolbar } from "@/components/layout"
import { DataTable } from "@/components/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

<PageShell>
  <PageHeader
    title="Clientes"
    description="Base unificada de clientes y cuentas corrientes."
    actions={<Button>Crear cliente</Button>}
    // variant="surface" en módulos transaccionales densos
  />
  <PageToolbar
    left={<Input placeholder="Buscar por CUIT o razón social…" />}
    right={<Button variant="outline">Exportar</Button>}
  />
  {/* loading → skeleton; empty → EmptyState; else → DataTable / form */}
</PageShell>
```

### Kit cheatsheet

| Necesidad | Usar |
|-----------|------|
| Contenedor de página | `PageShell` (`space-y-6`, maxWidth opcional) |
| Título + CTA de módulo | `PageHeader` (una vez por ruta; no `h1` suelto) |
| Filtros / búsqueda / export | `PageToolbar` |
| KPIs de resumen | `KpiStrip` |
| Estado de dominio | `StatusBadge` + helpers de `status-map.ts` |
| Listado tabular | `DataTable` |
| Vacío accionable | `EmptyState` (`@/components/ui/empty-state`) |
| Loading de tabla | `TableSkeleton` / `PageSkeleton` |
| Acciones primarias/secundarias | `Button` (`default` / `outline` / `ghost` / `destructive`) |
| Feedback global | Toaster / Sonner existentes |
| Mobile quick actions | `MobileQuickDock` cuando el shell lo requiera |
| Logo marca | `components/ui/claver-logo` |

### PageHeader vs Card title

- **`PageHeader`**: una sola vez, arriba de la ruta; contexto del módulo + CTAs principales.
- **Card title**: subdivisión interna (paneles, bloques de form, side panels).

---

## 3. Color

### Rules

1. **CSS variables only** en UI nueva: `bg-background`, `text-foreground`, `bg-primary`, `border-border`, `text-muted-foreground`, `bg-card`, etc.
2. **No hardcode** de estados: prohibido `bg-green-100`, `text-red-800`, etc. → `StatusBadge` + `--status-*`.
3. **OKLCH system**: nuevos tokens se declaran en `globals.css` en OKLCH; no hex en componentes de producto.
4. **Palette awareness**: el tenant puede cambiar `[data-palette]`; el UI no asume un primary fijo en hex.
5. **Dark mode**: todo contraste debe funcionar en `.dark`; probar mentalmente ambos.
6. **Charts**: usar `--chart-1` … `--chart-5`, no colores inventados por gráfico.

### Semantic status

| Variant | Uso |
|---------|-----|
| `success` | Completado, aprobado, facturado, emitido |
| `warning` | Pendiente, borrador, advertencia |
| `error` | Rechazo AFIP, anulado, fallido |
| `info` | En proceso, enviado, en tránsito |
| `neutral` | Inactivo / base |

Implementación: `StatusBadge` + `lib/ui/status-map.ts` (`facturaEstadoVariant`, `cajaEstadoVariant`, `ticketEstadoVariant`, …). Al agregar dominio, extender el map — no un one-off.

### Surfaces

- **Canvas** (`--canvas`): fondo de app / áreas amplias.
- **Surface / surface-elev**: paneles y elevación suave (`dashboard-surface` donde exista).
- **Card**: contenedores de contenido; **no anidar cards sin necesidad**.

### Brand accent budget

- Producto: el primary del tema + status colors. Sin gradientes decorativos en tablas/forms.
- Marketing: acentos y gradientes sutiles permitidos si usan tokens y no el cliché purple→blue AI.

---

## 4. Typography

| Rol | Familia | Uso |
|-----|---------|-----|
| UI / body | **Manrope** (`font-sans`) | Casi todo el producto |
| Display / marca | **Fraunces** (`font-display`) | Landings, wordmarks, títulos de marketing; **escaso** en dashboard |
| Datos / código | **Geist Mono** (`font-mono`) | Códigos, CUIT compacto, IDs, snippets |

### Hierarchy (product)

- **Page title (`PageHeader`)**: `text-2xl sm:text-3xl font-bold tracking-tight` (Manrope).
- **Description**: `text-sm text-muted-foreground leading-relaxed max-w-2xl`.
- **Card / section title**: `text-base`–`text-lg font-semibold`.
- **Table / controls**: `text-sm` default; meta `text-xs text-muted-foreground`.
- **No Inter as primary.** Inter puede existir en el bundle legacy; no introducirlo en UI nueva como cara principal.

### Hierarchy (brand)

- Fraunces en heroes y section displays.
- Manrope en body y UI de la landing.
- Tracking y clamp fluidos OK en brand; en product preferir escala fija del kit.

### Typography rules

- Oraciones en UI en es-AR; evitar inglés en labels de producto salvo términos técnicos inevitables (SKU, API).
- No full sentences en uppercase tracked.
- Montos y tablas: alineación numérica consistente; mono solo si mejora scan (IDs, códigos).

---

## 5. Layout, density & spacing

### Product density

- Contenedores principales: `space-y-6` (`PageShell`).
- Toolbars: `gap-3` / `gap-4`.
- Acciones primarias a la **derecha** del header o toolbar.
- Formularios: agrupar por sección; labels visibles; errores bajo el campo.
- Listados: toolbar → tabla → paginación; no empujar el CTA principal al fondo sin header.

### POS / KDS density

- Más compacto que el dashboard.
- Totales y CTAs de cobro con peso visual alto.
- Minimizar padding de “marketing”; maximizar área de catálogo / ticket.

### Radius & elevation

- Radius base `--radius: 0.75rem`; usar escala Tailwind del theme (`rounded-md`, `rounded-lg`, `rounded-xl`).
- Elevation: preferir border + `bg-card` / surface; sombra soft (`--shadow-soft`) con moderación.
- Evitar glassmorphism decorativo en módulos de datos.

### Responsive

- Mobile-first donde el módulo se use en piso.
- Touch min ~40px en acciones primarias.
- Tablas: scroll horizontal o columnas prioritarias en sm; no romper el shell.

---

## 6. Components & patterns

### Buttons

- Primary: una por zona de decisión (header o footer de form).
- Secondary: `outline` / `ghost`.
- Destructive: solo acciones irreversibles (anular, eliminar) con confirmación.
- Loading: disabled + spinner del kit; no duplicar submits.

### Forms

- shadcn `Form` / `Field` / `Input` / `Select` / `Checkbox` / `Switch`.
- Placeholders de ayuda corta; validación en español.
- CUIT, montos y fechas con formato local.

### Tables

- `DataTable` como default de listados.
- Columnas de estado con `StatusBadge`.
- Empty: `EmptyState` con título, descripción y CTA (“Crear…”, “Importar…”).

### Dialogs / sheets

- Dialog para confirmaciones y forms cortos.
- Sheet/drawer para detalle lateral o mobile.
- No modales anidados si se puede evitar.

### Feedback

- Toast para éxito/error no bloqueante.
- Alert/AlertDialog para errores bloqueantes o confirmaciones.
- Errores AFIP: mensaje humano + código/detalle colapsable si hace falta.

### Motion

- Preferir utilidades existentes (`animate-shimmer`, slide-fade, Framer en `components/ui/motion` si aplica).
- Duraciones cortas (150–300ms); easing estándar, **no bounce/elastic**.
- Respetar `prefers-reduced-motion`.

### Empty / loading / error (mandatory on new list pages)

1. Loading → skeleton (`TableSkeleton` / `PageSkeleton`).
2. Empty → `EmptyState` + CTA.
3. Error → mensaje + reintentar; no pantalla en blanco.

---

## 7. Copy (UX writing)

- Verbos de acción: Guardar, Cancelar, Facturar, Cobrar, Emitir, Anular, Exportar.
- Errores: qué pasó + qué hacer (“Revisá el CUIT e intentá de nuevo”).
- Empty: “Todavía no hay clientes” + “Crear cliente”, no “No data found”.
- Brand: puede ser más aspiracional; product: operativo y sobrio.
- i18n: strings de producto en `messages/es-AR.json` (y locales hermanas) cuando el módulo ya está internacionalizado.

---

## 8. Do and Do Not

### Do

- Seguir `PageShell` + `PageHeader` en módulos dashboard/cloud.
- Usar tokens y `StatusBadge` para cualquier estado.
- Diseñar empty/loading/error en el mismo PR que el listado.
- Mantener es-AR, ARS, fechas y CUIT correctos.
- Priorizar legibilidad y velocidad en POS/caja.
- En brand: Fraunces + motion con propósito, siempre sobre tokens Claver.
- Probar mentalmente light/dark y una paleta alternativa.

### Do Not

- No uses Inter/Arial como tipografía principal nueva.
- No uses gradientes purple→blue, neon, ni “AI glow” en producto.
- No anides cards por costumbre.
- No hardcodees colores de estado Tailwind sueltos.
- No conviertas el ERP en landing (márgenes hero, un feature por viewport).
- No pongas delight/animación ornamental en flujos fiscales o de cobro.
- No ignores multi-tenant / permisos al proponer UI de datos.
- No dupliques primitivos que ya existen en `components/ui` o `components/layout`.
- No asumas un solo primary hex: el tema y la paleta cambian.

---

## 9. Surface-specific notes

| Surface | Density | Display type | Motion | Notes |
|---------|---------|--------------|--------|-------|
| Dashboard ERP | Media-alta | Manrope titles | Mínima | Kit de página obligatorio |
| POS / Caja / KDS | Máxima | Manrope; números grandes | Feedback rápido | Sin estética marketing |
| Claver Cloud | Alta | Manrope | Mínima | Ops: estados y tablas primero |
| Portales | Media | Manrope | Baja | Self-service + confianza |
| Marketing / demos | Baja-media | Fraunces display | Media | Brand register; tokens igual |
| Auth | Media | Manrope | Baja | Confianza, form corto |

---

## 10. Agent workflow (Impeccable)

Comandos sugeridos por tipo de trabajo:

| Objetivo | Comando |
|----------|---------|
| Auditar calidad / a11y / responsive | `/impeccable audit <ruta o área>` |
| Review de UX y jerarquía | `/impeccable critique …` |
| Alinear a este DESIGN.md | `/impeccable polish …` |
| Densidad / spacing | `/impeccable layout …` |
| Tipografía | `/impeccable typeset …` |
| Empty states / first-run | `/impeccable onboard …` |
| Errores, overflow, i18n | `/impeccable harden …` |
| Landing más expresiva | `/impeccable bolder …` (solo brand) |
| Quitar ruido visual | `/impeccable quieter` / `distill` |
| Detector sin LLM | `npx impeccable detect app/ components/` |

**Regla de oro para agentes:** este archivo y `PRODUCT.md` mandan sobre el gusto genérico del modelo. Si un “mejora visual” rompe el kit de página o los tokens, no es una mejora.

### Related docs

- `PRODUCT.md` — producto, usuarios, surfaces
- `AGENTS.md` — arquitectura y convenciones de código
- `docs/DESIGN-SYSTEM.md` — recetas operativas de UI
- `docs/AUDITORIA_GRUPO_CLAVER.md` — mapa del monolito

# Product — Grupo Claver

> Contexto durable para agentes de diseño (Impeccable, Grok Build, Cursor, Gemini).
> Complementa `AGENTS.md` (arquitectura) y `docs/DESIGN-SYSTEM.md` (patrones de página).
> Visual tokens y componentes: ver `DESIGN.md`.

## Register

**product** (default)

La mayor parte del monolito es UI de producto (ERP, Cloud, POS, portales).  
Las superficies de **brand** (marketing, landings, demos comerciales) son la excepción: ver [Surfaces](#surfaces).

| Cuando trabajás en… | Register a aplicar |
|---------------------|--------------------|
| `/dashboard/*`, `/claver-cloud/*`, POS, portales, KDS | **product** |
| `/claver/*`, `/marketing/*`, landings, demos de venta | **brand** |
| Login / registro / trial | **product** con polish de confianza (casi brand) |

Si el task no nombra ruta: asumir **product** denso, no landing SaaS.

## Users

### Operadores del ERP (primarios)
- Dueños y empleados de PyMEs argentinas: comercio, gastronomía, servicios, agro, salud, etc.
- Usan el sistema en horario laboral, a veces en caja o depósito, con poco tiempo de training.
- Priorizan: velocidad, claridad fiscal (AFIP, CUIT, IVA), no perder una venta, ver stock y deudas.

### Cajero / mozo / operario de piso
- Touch o teclado, pantalla chica o tablet, interrupciones constantes.
- Necesitan feedback inmediato, botones grandes, atajos, cero decoración inútil.

### Analista / implementador Claver Cloud
- Equipo interno o partner: provisioning, CCA, billing, demos, soporte.
- Necesitan densidad de información, estados claros, runbooks embebidos, no marketing.

### Comprador / decisor comercial
- Ve landings, demos por industria y trial antes de pagar.
- Necesita percepción premium + prueba de que resuelve su rubro en Argentina.

### Portal / B2B / stakeholder
- Clientes del tenant, vendedores en ruta, proveedores: menos módulos, más self-service.

## Product Purpose

**Grupo Claver** es un ecosistema SaaS argentino en un monolito Next.js:

| Pilar | Qué es | Rutas base |
|-------|--------|------------|
| **Claver (ERP)** | POS + backoffice 40+ módulos | `/dashboard/*` |
| **Claver Cloud** | Torre analista: provisioning, CCA, billing, ops | `/claver-cloud/*` |
| **Marketing / Grupo** | Landings, apps de nicho, SEO | `/claver/*`, `/marketing/*` |
| **Portales** | B2B, cliente, vendedor ruta, público | `/portal`, `/claver-cliente`, `/vendedor`, `/public/*` |
| **Comercial** | Demos industria, trial, activación SKU | `/demo/*`, `/login` |

**Éxito de diseño (producto):** el operador completa tareas críticas (cobrar, facturar AFIP, cargar stock, ver cuenta corriente) sin fricción, con estados legibles y sin “look de AI genérico”.

**Éxito de diseño (brand):** la marca se siente confiable, local y premium; convence de que es un ERP serio para Argentina, no un template.

## Brand Personality

Tres palabras: **claro, confiable, operativo**.

- **Claro:** español rioplatense profesional (es-AR), sin jerga de Silicon Valley. Labels cortos, verbos de acción (“Facturar”, “Cobrar”, “Guardar”).
- **Confiable:** precisión fiscal y contable; nunca trivializar AFIP, montos ni estados de error.
- **Operativo:** prioriza densidad útil y ritmo de trabajo sobre “delight” decorativo. El lujo es no trabarse en caja.

Tono de copy UI:
- Directo: “No se pudo emitir el comprobante” + razón + acción siguiente.
- Específico: montos en ARS, fechas dd/mm/yyyy, CUIT `XX-XXXXXXXX-X`.
- Respetuoso del tiempo: empty states con un CTA, no párrafos de onboarding.

No: hype (“¡Revolucioná tu negocio!”) en pantallas de producto.  
Sí: voz comercial cálida y concreta **solo** en brand/landings.

## Anti-references

Evitar todo lo que Impeccable y este producto critican:

### AI / SaaS slop
- Inter / system-ui como tipografía principal (tenemos Manrope + Fraunces).
- Gradientes purple-to-blue, neon cyan, glassmorphism decorativo, partículas glow.
- Cards anidadas en cards, icon tiles redondeados sobre cada heading.
- Hero métricas genéricas (“+40% productivity”) en módulos operativos.
- Bounce / elastic easing; animaciones sin propósito.

### Antipatrones de ERP mal diseñado
- Formularios de 40 campos sin agrupación ni prioridad.
- Estados hardcodeados (`bg-green-100`, `text-red-800`) en lugar de `StatusBadge` + tokens.
- Tablas sin toolbar de búsqueda/filtro cuando el dominio es listado.
- Mensajes de error crípticos o solo en inglés.
- Densidad de landing en POS (márgenes enormes, un botón por pantalla).

### Antipatrones de marca
- Look “startup US 2024” que no transmite seriedad fiscal argentina.
- Over-decoration en Claver Cloud (es torre de control, no brochure).

## Design Principles

1. **Design serves the task.** En product, la UI es herramienta. Si no acelera o aclara una tarea, sobra.
2. **One system, many surfaces.** Mismos tokens OKLCH, shadcn y layout primitives; la densidad y el “teatro visual” cambian por superficie (ver Surfaces).
3. **Tokens over hardcode.** Colores, estados y radius vía CSS variables / componentes del kit. Nunca inventar paletas por página.
4. **Status is semantic.** Todo estado de dominio pasa por `StatusBadge` + `lib/ui/status-map.ts`.
5. **Page structure is sacred.** Dashboard: `PageShell` → `PageHeader` → `PageToolbar` → contenido. No reinventar el chrome.
6. **Argentina-first.** es-AR, ARS, IVA 21%, AFIP, CUIT, fechas locales. i18n vía `messages/*` cuando el copy es de producto.
7. **Multi-tenant safe UX.** Nunca sugerir UI que exponga datos cross-empresa; el agente de código debe respetar `whereEmpresa` (ver `AGENTS.md`).
8. **Empty, loading, error are first-class.** Cada listado y flujo crítico tiene skeleton, empty state con CTA, y error accionable.
9. **Motion is purposeful.** Framer Motion / CSS para feedback y transición de vista; respetar `prefers-reduced-motion`.
10. **Brand earns the stage.** Animaciones “wow”, display Fraunces grande y storytelling: landings y demos — no en grilla de facturas.

## Surfaces

### A. ERP Dashboard (`/dashboard/*`) — product, densidad media-alta
- Shell: sidebar + topbar + command palette.
- Página: `PageShell` + `PageHeader` (+ `variant="surface"` en módulos transaccionales) + `PageToolbar` + `DataTable` / formularios.
- KPI: `KpiStrip` cuando hay métricas de resumen.
- Mobile: bottom nav / `MobileQuickDock` donde aplique; touch targets ≥ 40px.

### B. POS / Caja / KDS — product, máxima densidad y velocidad
- Priorizar teclado, scanner, touch, totales legibles, feedback de ítem agregado.
- Minimizar chrome decorativo; maximizar contraste de totales y estados de mesa/pedido.
- No aplicar “landing polish” (hero, bento marketing, oversized radius).

### C. Claver Cloud (`/claver-cloud/*`) — product, densidad alta + ops
- Torre de control: tablas densas, filtros, estados de tenant/pipeline, links a runbooks.
- Visual: serio, calmado, poca ornamentación; color solo para estado y prioridad.

### D. Portales (`/portal`, `/claver-cliente`, `/vendedor`, …) — product, densidad media
- Menos módulos; self-service; onboarding y empty states claros.
- Confianza y legibilidad > novelty.

### E. Marketing / Grupo (`/claver/*`, `/marketing/*`, demos) — brand
- Aquí sí: narrativa, tipografía display (Fraunces), motion, layout editorial o bento.
- Sigue tokens del sistema (no Inter, no purple gradient cliché).
- CTA claros hacia demo, trial o contacto.

### F. Auth (`/login`, registro, trial)
- Confianza + claridad; form corto; errores legibles; sin distracciones.

## Locale & Domain Conventions

| Concepto | Convención |
|----------|------------|
| Idioma UI default | es-AR (también es, en-US, es-MX en `messages/`) |
| Moneda | ARS · `Intl.NumberFormat` |
| Impuestos | IVA 21% (y regímenes según módulo); AFIP electrónico |
| CUIT | `XX-XXXXXXXX-X` |
| Fechas | ISO en datos; display `dd/mm/yyyy` |
| Roles UI | No inventar permisos; respetar roles existentes (`dueno`, `administrador`, etc.) |

## Success Metrics (design)

- Operador completa flujo crítico sin ayuda externa en el primer uso del módulo.
- Estados AFIP / caja / stock se leen en < 1 s de glance.
- Sin colores de estado hardcodeados en código nuevo.
- Empty states con acción primaria en listados clave.
- Landings convierten a demo/trial sin parecer template AI.
- Contraste WCAG 2.1 AA en texto de producto y controles.

## Accessibility & Inclusion

- WCAG 2.1 AA baseline en producto.
- Focus visible en controles; navegación por teclado en flujos de caja cuando existan atajos.
- `prefers-reduced-motion` respetado.
- HTML semántico; ARIA solo como complemento.
- Targets táctiles razonables en mobile/POS (mín. ~40px en acciones primarias).
- No depender solo del color para estados críticos (usar `StatusBadge` + label).

## Stack Snapshot (for agents)

- Next.js 15 App Router, TypeScript strict
- Tailwind CSS v4, shadcn/ui (New York), Framer Motion
- Fonts: Manrope (sans), Fraunces (display), Geist Mono (code)
- Color: OKLCH + paletas `[data-palette]` + dark mode
- i18n: `messages/*.json` + `I18nProvider`
- State: Zustand + SWR; auth JWT multi-tenant

Detalle de implementación: `AGENTS.md`.  
Patrones de página: `docs/DESIGN-SYSTEM.md`.  
Tokens y kit visual: `DESIGN.md`.

## Priority Order for UX/UI Work

Cuando se pida “mejorar UI del grupo” sin scope:

1. Shell compartido (layout, empty states, tablas, badges, toasts)
2. Flujos críticos (POS, facturación, clientes, productos, caja)
3. Claver Cloud ops / comercial
4. Portales
5. Landings y demos
6. Módulos long-tail del dashboard

No reescribir 40+ módulos de una vez: una superficie o flujo por pasada (`critique` → `layout`/`typeset` → `polish` → `harden`/`onboard`).

# PROMPT — Gemini Antigravity: Roadmap + Documentación embebida (estilo Docusaurus)

> **Copiar y pegar en Gemini Antigravity.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Fecha: 2026-06-19

---

## PROMPT (copiar desde acá)

```
Sos un arquitecto de documentación + frontend senior. Tenés acceso al shell del repo ERP Argentina (Next.js 15, App Router, TypeScript, Tailwind v4, shadcn/ui, Prisma).

## Objetivo principal

Construir el **roadmap completo del proyecto** y la **wiki de implementación** con experiencia tipo **Docusaurus** (sidebar, búsqueda, versionado, MDX, diagramas Mermaid), pero **EMBEBIDA en la misma app y el mismo puerto 3000** — NO levantar Docusaurus en :3001 ni otro proceso en dev.

El usuario final es:
- **Analista técnico** (implementación, parametrización, upgrades — estilo Protheus pero SaaS)
- **Developer** (API, servicios, tests)
- **Implementador IA** (futuro: el asistente lee esta doc como contexto)

## Restricción crítica — “embebido, no otro puerto”

Docusaurus standalone NO corre dentro de Next.js como React tree nativo. Elegí **UNA** estrategia y justificá en 5 líneas en `docs-site/ARCHITECTURE.md`:

### Estrategia A (RECOMENDADA) — Fumadocs / MDX nativo Next.js
- Misma UX que Docusaurus (sidebar izquierda, TOC derecha, search, dark mode)
- Rutas: `/dashboard/documentacion/[[...slug]]` dentro del shell del dashboard
- Contenido: `content/docs/**/*.mdx` + frontmatter YAML
- Build: un solo `npm run dev` / `npm run build`
- Paquetes sugeridos: `fumadocs-mdx`, `fumadocs-ui` (o equivalente Next 15 compatible)

### Estrategia B (alternativa si insistís en Docusaurus exacto) — Static export same-origin
- Subcarpeta `apps/docs-site/` con Docusaurus 3
- `baseUrl: '/documentacion/'`, `outDir: '../../public/documentacion'`
- Script `npm run build:docs` genera estáticos en `public/documentacion/`
- Next.js los sirve en el **mismo puerto** (archivos estáticos)
- Shell embebido: `app/dashboard/documentacion/[[...slug]]/page.tsx` con iframe same-origin O layout que redirige manteniendo topbar ERP
- En dev: `concurrently "next dev" "docusaurus start --port 3000 --host 0.0.0.0"` **PROHIBIDO** — solo build estático + watch opcional

**Preferí Estrategia A** salvo bloqueo técnico documentado.

## Integración visual con el ERP

- Reutilizar tokens OKLCH, fuentes Manrope/Fraunces, dark mode del ERP
- Sidebar documentación **dentro** del área de contenido del dashboard (no reemplazar sidebar módulos ERP; usar sub-sidebar doc o panel colapsable)
- Breadcrumb: Dashboard → Documentación → [Sección] → [Página]
- Link desde menú existente: ampliar módulo **Centro de Capacitación** (`/dashboard/capacitacion`) con entrada **"Documentación técnica"** → `/dashboard/documentacion`
- Mobile: sidebar doc colapsable (sheet)

## Arquitectura de contenido — árbol obligatorio

Migrar y estructurar (no dejar MD sueltos en raíz del repo):

```
content/docs/   (o docs-site/docs si Docusaurus)
├── index.mdx                          # Home wiki
├── roadmap/
│   ├── vision.mdx                     # Visión producto LATAM
│   ├── fases-f1-f4.mdx                # División Cursor/Gemini cerrada
│   ├── score-85-68.mdx                # Métricas actuales
│   └── g14-actualizaciones.mdx        # Política upgrade SaaS
├── analista/
│   ├── guia-implementacion.mdx        # FROM docs/analista/GUIA_ANALISTA_IMPLEMENTACION.md
│   ├── protheus-vs-saas.mdx           # Comparativa extendida
│   ├── capas-personalizacion.mdx      # 5 capas + árbol decisión
│   ├── faq.mdx                        # FAQ implementación
│   └── checklist-go-live.mdx
├── developer/
│   ├── getting-started.mdx
│   ├── arquitectura.mdx               # FROM AGENTS.md
│   ├── api-overview.mdx               # 264 routes — índice por módulo
│   ├── multi-tenant.mdx
│   ├── prisma-migrations.mdx
│   └── testing.mdx                    # FROM TESTING_GEMINI.md
├── funcional/
│   ├── railroad-engine.mdx
│   ├── sistema-pos.mdx
│   ├── pendientes-por-rol.mdx         # FROM funcional.txt
│   ├── tesoreria.mdx
│   └── rubros/...
├── integraciones/
│   ├── afip.mdx
│   ├── whatsapp-twilio.mdx
│   ├── mercadopago.mdx
│   └── mercado-libre.mdx
├── operaciones/
│   ├── deploy-runbook.mdx
│   ├── health-check.mdx
│   ├── actualizaciones.mdx            # Manual hoy + panel futuro
│   └── troubleshooting.mdx
└── ia-context/
    ├── metadata-schema.mdx            # YAML frontmatter para RAG futuro
    └── prompts-implementacion.mdx
```

## INVENTARIO EXISTENTE — reutilizar, no reinventar

**Sí hay documentación funcional y diagramas en el repo.** El wiki embebido debe **migrar y unificar** lo que ya existe, no crear contenido duplicado desde cero.

### A) Markdown con diagramas Mermaid (migrar tal cual a MDX)

| Archivo | Contenido | Diagramas Mermaid |
|---------|-----------|-------------------|
| `docs/funcional/sistema-pos.md` | POS completo: flujos, atajos, capacitación, autocrítica | **6** flowcharts |
| `docs/funcional/rubro-config-railroad-engine.md` | Railroad switch por rubro (venta→factura→cobro) | **1** flowchart grande |
| `docs/ESPECIFICACION_FUNCIONAL_ERP.md` | Especificación transversal ERP | **5** diagramas |
| `docs/funcional/modulo-ia.md` | Agentes, eventos, prompts | texto + refs técnicas |
| `docs/funcional/tesoreria-cuentas-corrientes.md` | CxC/CxP — estado **COMPLETO** | procesos escritos |
| `docs/funcional/maestros-clientes-proveedores.md` | Maestros — **EN PROCESO** | procesos parciales |
| `docs/funcional/logistica-distribucion-ecommerce.md` | Logística — **EN PROCESO** | procesos |
| `docs/funcional/IMPLEMENTACION_COMPLETA.md` | Matriz implementación por módulo | tablas/gaps |
| `docs/introspeccion_por_modulos.md` | Mapa módulos + estado | inventario |
| `docs/funcional/rubros/*.md` | Veterinaria, bebidas, otros | por vertical |

**Regla:** al migrar, preservar bloques ` ```mermaid ` sin reescribir. Instalar `remark-mermaid` o plugin Fumadocs equivalente.

### B) UI React con diagramas de flujo (NO duplicar — enlazar o extraer)

Ya existen **diagramas funcionales interactivos** en el dashboard (componentes `FlowNode` + `FlowDiagram`):

| Ruta | Diagramas de proceso |
|------|---------------------|
| `/dashboard/capacitacion/manual-usuario` | Operación diaria, ventas E2E, NC, compras, cheques, **gastronomía, salud, distribución, industria, veterinaria** |
| `/dashboard/capacitacion/parametrizacion` | Cascada features, activación railroad |
| `/dashboard/capacitacion/diagnostico` | Gaps por módulo |
| `/dashboard/capacitacion` | Hub capacitación |

**Estrategia obligatoria (elegir una y documentar en ARCHITECTURE.md):**

1. **Híbrido recomendado:** wiki MDX para analista/developer + cards en `/dashboard/documentacion` que **enlazan** a las páginas React existentes ("Ver diagrama interactivo → Manual usuario / Ventas").
2. **Extracción opcional:** mover `FlowDiagram`/`FlowNode` a `components/docs/flow-diagram.tsx` y reutilizar en MDX vía componente `<FlowDiagram>`.
3. **Prohibido:** reescribir a mano en MDX los 10+ flujos que ya están en `manual-usuario/page.tsx` sin leer el archivo fuente.

### C) Procesos de negocio ya documentados (texto)

| Archivo | Proceso |
|---------|---------|
| `funcional.txt` | Pendientes por rol, home cajero, POS suspendidas, bandeja gerente |
| `docs/analista/GUIA_ANALISTA_IMPLEMENTACION.md` | 5 capas custom, Protheus vs SaaS, upgrades |
| `DIVISION_TAREAS_CURSOR_GEMINI.txt` | Fases proyecto, bugs, score |
| `TESTING_GEMINI.md` | QA, checklist demo |

### D) Assets HTML legacy (referencia, no embed crudo)

- `erp_modulos_maestros_argentina.html` — mapa módulos → extraer índice a `funcional/modulos-maestros.mdx`
- `roadmap_turnos_erp.html` — roadmap visual antiguo → inspiración para `roadmap/vision.mdx`

### E) Relación Capacitación ↔ Documentación

```
/dashboard/capacitacion          → usuario final (operación diaria, diagramas React)
/dashboard/documentacion         → analista + developer + roadmap (wiki MDX)
         ↑ cross-links bidireccionales obligatorios
```

- Manual usuario = **cómo operar** el sistema
- Documentación técnica = **cómo implementar, parametrizar y actualizar**

## Frontmatter estándar (cada MDX) — preparar IA futura

```yaml
---
title: "Título"
description: "Resumen 1 línea"
sidebar_position: 10
tags: [analista, ventas, P1]
audience: analista | developer | operaciones | ia
rubro: all | gastronomia | agro | industria
layer: 1-config | 2-campos | 3-features | 4-workflow | 5-codigo
related_apis: ["/api/ventas/pedidos", "/api/pendientes"]
related_code: ["lib/ventas/ventas-service.ts"]
last_verified: 2026-06-19
status: completo | borrador | deprecado
---
```

## Funcionalidades tipo Docusaurus (obligatorias)

1. **Sidebar** auto-generada desde `_meta.json` o frontmatter `sidebar_position`
2. **Búsqueda** full-text en cliente (FlexSearch o built-in Fumadocs search)
3. **TOC** flotante derecha (headings h2-h3)
4. **Mermaid** para diagramas (railroad, flujos analista, deploy)
5. **Tabs** para comparar Protheus vs ERP / homologación vs producción
6. **Admonitions** (:::tip :::warning :::danger)
7. **Edit link** → ruta al archivo en repo (opcional)
8. **Versión doc** badge: `v1.0.0` alineado a `package.json`

## Páginas especiales a generar

### 1. Roadmap interactivo (`/dashboard/documentacion/roadmap`)
- Timeline Fase 1–4 (Gemini audit, Cursor impl, E2E, cierre)
- G13/G14 pendientes con checkboxes
- Score demo 85 / prod 68 con desglose
- Mermaid gantt o flowchart

### 2. Portal analista (`/dashboard/documentacion/analista`)
- Wizard 5 pasos: Discovery → Param → Custom → UAT → Go-live
- Árbol decisión personalización (capas 1–5) clickeable
- FAQ acordeón
- Enlace a checklist TESTING_GEMINI

### 3. Mapa API (`/dashboard/documentacion/developer/api-overview`)
- Tabla módulo | ruta | auth | test existe ✅/❌
- Generar script `scripts/generate-api-index.ts` que lea `app/api/**/route.ts`

### 4. Changelog (`/dashboard/documentacion/roadmap/changelog`)
- Crear `CHANGELOG.md` en raíz si no existe
- Sync con releases

## Scripts npm a agregar

```json
{
  "build:docs": "...",
  "dev:docs": "opcional watch MDX",
  "lint:docs": "verificar links rotos + frontmatter",
  "generate:api-index": "tsx scripts/generate-api-index.ts"
}
```

## División de trabajo — NO invadir territorio Cursor

### Gemini (vos) — HACER
- Scaffold sitio doc embebido (Fumadocs o Docusaurus static)
- Migrar MD existentes a MDX con frontmatter
- Sidebar, search, layout integrado dashboard
- `scripts/generate-api-index.ts`
- `CHANGELOG.md` inicial
- `docs-site/ARCHITECTURE.md` con decisión técnica
- Roadmap visual + FAQ analista en MDX
- Verificar `npm run build` pasa con docs incluidos

### Cursor (Grok) — NO TOCAR (dejar para después)
- API `/api/docs/search` con embeddings para IA (RAG)
- Cablear chat widget → contexto doc por `audience` y `rubro` del usuario
- Redis/BullMQ, Sentry, CI/CD
- Panel admin G14 (versión + migraciones pendientes en UI producto)
- Tests E2E de navegación documentación

Si necesitás un hook de auth: las páginas doc viven bajo `/dashboard/documentacion` → ya protegidas por middleware JWT del dashboard.

## Fuentes a migrar (leer del repo)

| Origen | Destino MDX | Notas |
|--------|-------------|-------|
| `docs/analista/GUIA_ANALISTA_IMPLEMENTACION.md` | `analista/guia-implementacion.mdx` | Protheus, capas, FAQ |
| `docs/G13_DOCUMENTACION_Y_TECNOLOGIA.md` | `roadmap/g13-gaps.mdx` | Gaps doc/tech |
| `docs/funcional/rubro-config-railroad-engine.md` | `funcional/railroad-engine.mdx` | **Mermaid railroad** |
| `docs/funcional/sistema-pos.md` | `funcional/sistema-pos.mdx` | **6 Mermaid** — prioridad P0 |
| `docs/ESPECIFICACION_FUNCIONAL_ERP.md` | `funcional/especificacion-erp.mdx` | **5 Mermaid** |
| `docs/funcional/tesoreria-cuentas-corrientes.md` | `funcional/tesoreria.mdx` | COMPLETO |
| `docs/funcional/maestros-clientes-proveedores.md` | `funcional/maestros-clientes.mdx` | EN PROCESO |
| `docs/funcional/logistica-distribucion-ecommerce.md` | `funcional/logistica.mdx` | EN PROCESO |
| `docs/funcional/modulo-ia.md` | `funcional/modulo-ia.mdx` | Agentes IA |
| `docs/funcional/IMPLEMENTACION_COMPLETA.md` | `roadmap/implementacion-modulos.mdx` | Matriz gaps |
| `docs/introspeccion_por_modulos.md` | `developer/modulos-index.mdx` | Inventario |
| `docs/funcional/rubros/*.md` | `funcional/rubros/*.mdx` | Verticales |
| `TESTING_GEMINI.md` | `developer/testing.mdx` | |
| `AGENTS.md` | `developer/arquitectura.mdx` | |
| `DIVISION_TAREAS_CURSOR_GEMINI.txt` | `roadmap/fases-f1-f4.mdx` | |
| `funcional.txt` | `funcional/pendientes-por-rol.mdx` | Procesos UX rol |
| `PROMPT_GEMINI_TESTING_ERP.md` | `ia-context/prompts-implementacion.mdx` | |
| `app/dashboard/capacitacion/manual-usuario/page.tsx` | `funcional/manuales/operacion-diaria.mdx` | **Link + resumen**; diagramas React quedan en capacitación |
| `app/dashboard/capacitacion/parametrizacion/page.tsx` | `analista/parametrizacion-features.mdx` | Link a diagrama cascada features |
| `erp_modulos_maestros_argentina.html` | `funcional/modulos-maestros.mdx` | Extraer índice |

No borrar archivos origen hasta que la migración esté verificada.

### Verificación de reutilización (añadir a criterios)

- [ ] Los **12+ Mermaid** existentes renderizan en MDX (no solo 2 genéricos nuevos)
- [ ] Páginas wiki enlazan a `/dashboard/capacitacion/manual-usuario` donde el flujo interactivo ya existe
- [ ] `docs/funcional/README.md` índice actualizado refleja estado real post-migración

## Criterios de aceptación

- [ ] `npm run dev` → abrir `http://localhost:3000/dashboard/documentacion` — wiki carga SIN segundo puerto
- [ ] Sidebar con ≥8 secciones del árbol obligatorio
- [ ] Búsqueda encuentra "Protheus", "pendientes", "AFIP"
- [ ] ≥20 páginas MDX migradas (incluye inventario § existente)
- [ ] Mermaid renderiza: sistema-pos, railroad-engine, especificacion-erp (12+ diagramas preservados)
- [ ] Cross-link Capacitación ↔ Documentación en home wiki
- [ ] `npm run build` exitoso (328+ rutas)
- [ ] Entrada en menú Capacitación → Documentación técnica
- [ ] `docs-site/ARCHITECTURE.md` explica por qué Fumadocs o static Docusaurus
- [ ] `CHANGELOG.md` creado con v1.0.0 y Fases 1-4
- [ ] Reporte final en `DIVISION_TAREAS_CURSOR_GEMINI.txt` sección "G15 DOCUSAURUS EMBED"

## Verificación

```bash
npm run build
npm run verify          # 302 tests deben seguir PASS
# Manual: navegar 5 páginas doc, probar search, mobile sheet
```

## Estilo y simplificación UX analista

- Lenguaje es-AR, sin jerga innecesaria
- Cada página analista: bloque **"En 30 segundos"** al inicio
- Cada página developer: bloque **"Archivos clave"** con paths clickeables
- Evitar wall of text: máximo 3 niveles de heading, tabs para detalle
- Iconos Lucide alineados al dashboard (no emoji en títulos)

## Impacto positivo futuro (dejar preparado)

1. Frontmatter `audience` + `tags` → listo para RAG / asistente IA por rol
2. `related_apis` + `related_code` → "ir al código" desde doc (links a GitHub o rutas internas)
3. `layer` → wizard analista auto-sugiere capa de personalización
4. `last_verified` → job CI que alerta doc stale > 90 días
5. Página `ia-context/metadata-schema.mdx` documenta el contrato para Cursor

## Entregables finales

1. Código scaffold + MDX migrados
2. `walkthrough.md` con screenshots o descripción de rutas
3. Actualización `DIVISION_TAREAS_CURSOR_GEMINI.txt` → sección G15
4. Lista de páginas **borrador** que faltan completar (honest gap list)

Empezá leyendo el **inventario existente** (§ arriba), luego:
`docs/funcional/sistema-pos.md`, `docs/funcional/rubro-config-railroad-engine.md`,
`app/dashboard/capacitacion/manual-usuario/page.tsx`, `docs/analista/GUIA_ANALISTA_IMPLEMENTACION.md`,
`app/dashboard/layout.tsx`, `package.json`.
Implementá Estrategia A salvo impedimento documentado. **Migrá antes de crear contenido nuevo.**
```

---

## Notas para Pablo (no pegar en Gemini)

### Por qué no Docusaurus en :3000 como dev server separado
Dos apps React en el mismo puerto chocan. La solución **embebida real** es:
- **Fumadocs** = un solo Next.js (recomendado en el prompt), o
- **Docusaurus build → `public/documentacion/`** = mismo puerto, archivos estáticos

### Qué dejamos para Cursor (alto impacto)
| Item | Impacto |
|------|---------|
| `/api/ai/docs-context` — RAG sobre MDX | Asistente responde como analista senior |
| E2E navegación doc | CI no rompe wiki |
| Panel G14 versiones en producto | Upgrades visibles al cliente |
| Sync `last_verified` en CI | Doc no mentada |

### Inventario rápido (ya en el repo hoy)

| Tipo | Cantidad aprox. |
|------|-----------------|
| Mermaid en `.md` | **12** (3 archivos) |
| FlowDiagram React en capacitación | **10+** flujos por rubro |
| Docs funcionales `docs/funcional/` | **10** archivos |
| Procesos analista/UX en `.txt` | `funcional.txt`, divisiones, G13 |

### Comando después de que Gemini termine
```bash
npm run verify
npm run build
# Abrir /dashboard/documentacion
# Verificar Mermaid en /dashboard/documentacion/funcional/sistema-pos
# Verificar link a /dashboard/capacitacion/manual-usuario
```
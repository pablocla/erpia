# Documentación sana de Claver y el Grupo — Docusaurus, wiki embebida y generación

> **Pregunta:** *¿Falta documentación tipo [Docusaurus](https://docusaurus.io/)? ¿Cómo generar documentación sana de todo Claver y el grupo?*  
> **Respuesta corta:** Ya hay **wiki embebida** (estilo Docusaurus, sin segundo puerto). Falta **cobertura, curación, generación semi-automática y un mapa del Grupo**. Este doc define el sistema.

---

## 1. Qué hay hoy (y qué no)

### 1.1 Infra de docs (funciona)

| Pieza | Ubicación | Rol |
|-------|-----------|-----|
| **Wiki embebida** | `/dashboard/documentacion/[[...slug]]` | UI tipo docs: sidebar, MDX, Mermaid, tokens ERP |
| **Contenido canónico wiki** | `content/docs/**/*.mdx` | Lo que se publica en la wiki |
| **Render** | `marked` + `gray-matter` + `DocClient` | Server Components; ver `docs-site/ARCHITECTURE.md` |
| **Capacitación** | `/dashboard/capacitacion` | Manual usuario / parametrización (otro carril) |
| **Docs crudos / trabajo** | `docs/**/*.md` | Auditorías, comercial, QA, runbooks, drafts |
| **Contrato IA** | `content/docs/ia-context/metadata-schema.mdx` | Frontmatter para RAG |
| **OPO (otro producto)** | `opo/.../docs-site` | Docusaurus **standalone** real (no es Claver ERP) |
| **Prompt histórico** | `PROMPT_GEMINI_DOCUSAURUS_EMBED.md` | Pedía Fumadocs o Docusaurus estático |

**Decisión arquitectónica actual (válida):**  
No correr Docusaurus en `:3001` en dev. La “experiencia Docusaurus” vive **dentro de Next** en el mismo puerto.  
Docusaurus puro queda como **opción B** (static export a `public/documentacion/`) o sitio **público de marketing/grupo** separado.

### 1.2 Por qué “falta documentación”

No falta tanto el **motor** como el **sistema de conocimiento**:

| Síntoma | Causa |
|---------|--------|
| Muchos `.md` en `docs/` y pocos en `content/docs/` | Wiki = subset; el resto es archivo muerto o solo para humanos en Git |
| Docs desactualizados (`last_verified` viejo) | No hay ritual de verificación ni CI de docs |
| Código > doc (G13) | Features salen sin página MDX |
| Grupo Claver (Cloud, Grow, partners, OPO, Leo…) sin hub | Cada vertical documenta en silos |
| Landings y tortugas comerciales no están en la wiki | Comercial vive en `docs/comercial/` no en `content/docs/` |
| Duplicados / contradicciones | Misma verdad en 3 lados (Agents.md, docs/, content/) |

### 1.3 Docusaurus.io: ¿lo necesitamos igual?

| Uso | Recomendación |
|-----|----------------|
| **Docs internas del ERP (analista, dev, ops)** | Seguir con **wiki embebida** (`content/docs`) |
| **Docs públicas del Grupo** (inversores, partners, API pública) | **Docusaurus o Starlight** en subdominio `docs.claver...` o `grupo.claver...` |
| **OPO / protocolos abiertos** | Ya tiene Docusaurus en `opo/.../docs-site` — mantener separado |
| **Cliente final (cajero)** | No Docusaurus: **Capacitación** + tooltips + tortugas en home |

**Conclusión:** no reescribir todo en Docusaurus.  
**Sí:** (1) sanar la wiki embebida + pipeline de generación; (2) opcionalmente un **sitio Grupo** con Docusaurus para lo público.

---

## 2. Principios de documentación “sana”

1. **Una verdad por audiencia** — no 4 PDFs del mismo flujo.  
2. **Doc = producto versionable** — frontmatter, status, `last_verified`.  
3. **Código manda el “qué existe”; doc manda el “cómo se usa y se vende”.**  
4. **Generar borrador con IA; curar con humano** (dueño por sección).  
5. **Todo lo publicable en wiki vive en `content/docs/`.**  
   `docs/` = laboratorio, auditorías, prompts, drafts.  
6. **Cada pack PRD tiene ≥1 página wiki** o se marca `status: no-documentado` en el índice.  
7. **Enlace a código y API** (`related_code`, `related_apis`) — si no, no es doc de ingeniería.  
8. **Grupo = mapa de productos**, no un monólogo del monorepo.

---

## 3. Mapa del conocimiento — Grupo Claver

Estructura mental (y de carpetas wiki):

```
Grupo Claver
├── 01-grupo/                 # Quiénes somos, productos, marcas, partner
├── 02-producto-erp/          # ERP / POS / fiado / fiscal (core)
│   ├── developer/
│   ├── analista/
│   ├── funcional/
│   ├── operaciones/
│   └── comercial/            # Tortugas, packs, objeciones (sanitizado)
├── 03-empleados-digitales/   # Leo, canales WA/Telegram, metering
├── 04-claver-cloud/          # Implementación, superadmin, runbooks
├── 05-clavergrow/            # Agro (si se documenta como línea)
├── 06-marketplace-skus/      # Ciclo activación, bundles, entitlements
├── 07-partners-estudios/     # Reventa, white-label, contadores/abogados
├── 08-seguridad-compliance/  # Multi-tenant, IR/DR, AFIP prod
└── 09-ia-context/            # Schemas RAG, prompts, Agents compact
```

Hoy `content/docs/` cubre bien **02 (parcial) + ops + analista**.  
Faltan **01, 03, 05, 07** y profundidad en **06/08**.

### Audiencias (sidebar filtrable a futuro)

| Audience | Lee | No necesita |
|----------|-----|-------------|
| `developer` | Arquitectura, API, Prisma, tests | Speech de venta |
| `analista` | Go-live, parametrización, capas | Internals de Prisma |
| `operaciones` | Deploy, health, incidentes | Roadmap comercial largo |
| `comercial` | Packs PRD, objeciones, tortugas | SQL de migraciones |
| `partner` | Comisión, portal, white-label | Código de agentes |
| `cliente` | Manual corto por rol | Auditorías internas |
| `ia` | Metadata, índices, prompts | — (consume todo marcado) |

---

## 4. Cómo **generar** documentación (pipeline)

No escribir 200 páginas a mano. **Extraer → borrador → curar → publicar.**

### 4.1 Fuentes de verdad (inputs)

| Fuente | Qué extrae | Script / método |
|--------|------------|-----------------|
| `prisma/schema.prisma` | Modelos, relaciones, módulos | Generar `developer/data-model.mdx` por dominio |
| `app/api/**/route.ts` | Lista de endpoints | Índice OpenAPI liviano o tabla MDX |
| `lib/comercial/*` | Packs, SKUs, nav-matrix, go-live | `comercial/packs-prd.mdx` |
| `Agents.md` | Convenciones código | Sync a `developer/arquitectura.mdx` |
| `docs/GO_LIVE_PRD.md` | Qué es vendible | Resumen en `comercial/go-live-packs.mdx` |
| `docs/marketplace/*` | Ciclo producto | Páginas `06-marketplace-*` |
| `docs/comercial/*` | Playbooks | Solo lo **estable** → content; auditorías quedan en `docs/` |
| `__tests__/**` | Comportamiento garantizado | “Contratos testeados” por módulo |
| Git log / PRs | `last_verified` hints | “Archivos tocados sin doc” |

### 4.2 Pipeline recomendado (semi-auto)

```
[1] Harvest (script)
      → JSON índice: rutas API, modelos, packs, páginas existentes

[2] Gap report
      → "Pack PRD sin MDX" | "API sin related_apis" | "MDX last_verified > 60d"

[3] Draft (IA: Grok/Gemini con plantilla)
      → content/docs/_drafts/...mdx  (NUNCA merge directo a prod sin frontmatter)

[4] Curación humana (dueño de sección)
      → status: completo | borrador | deprecado
      → last_verified: hoy

[5] Publish
      → mover a content/docs/<seccion>/
      → sidebar se arma solo (scan de directorio actual)

[6] Consumo
      → Wiki UI + opcional índice embeddings para asistente
```

### 4.3 Plantilla obligatoria de página (sana)

```yaml
---
title: "Título corto"
description: "Una línea: para qué sirve esta página"
sidebar_position: 10
tags: ["fiado", "cobranza"]
audience: analista
product_line: claver | claver-cloud | leo | grow | grupo
layer: 1-config | 2-campos | 3-features | 4-workflow | 5-codigo
related_apis: []
related_code: []
related_packs: []          # skus / packs PRD
last_verified: 2026-07-23
status: borrador | completo | deprecado
owner: grok | gemini | humano-nombre
---
```

Cuerpo mínimo (estructura Diátaxis light):

1. **Para quién**  
2. **Qué problema / tortuga tapa** (si aplica comercial)  
3. **Flujo feliz** (pasos o diagrama Mermaid)  
4. **Config / precondiciones**  
5. **APIs y código**  
6. **Fallos frecuentes**  
7. **Qué no cubre** (honestidad go-live)  
8. **Links** a packs, runbooks, tests  

### 4.4 Scripts a crear (lista de ingeniería)

| Script | Función |
|--------|---------|
| `scripts/docs/harvest-index.ts` | Escanea API + content/docs + packs → `docs-site/generated/index.json` |
| `scripts/docs/gap-report.ts` | Imprime gaps; exit 1 en CI si pack PRD sin doc |
| `scripts/docs/sync-from-docs-folder.ts` | Copia selectiva `docs/X` → `content/docs/Y` con frontmatter stub |
| `scripts/docs/verify-frontmatter.ts` | Valida YAML de todo MDX |
| `scripts/docs/gen-api-overview.ts` | Regenera tabla de rutas desde `app/api` |
| `scripts/docs/gen-prisma-map.ts` | Mapa de modelos por dominio |

Prioridad: **harvest + gap + frontmatter** antes que OpenAPI completo.

### 4.5 Prompts de generación (para Grok/Gemini)

**Prompt A — Página funcional desde código**

```
Leé lib/<modulo> y app/api/<modulo>. Generá MDX en content/docs/funcional/<nombre>.mdx
con el frontmatter del metadata-schema. Incluí flujo feliz, precondiciones,
related_apis/code reales del repo, y sección "Qué no prometer en go-live".
status: borrador. No inventes endpoints que no existan.
```

**Prompt B — Página comercial desde playbook**

```
Tomá docs/comercial/<archivo>.md y producí content/docs/comercial/<slug>.mdx
para audience: comercial. Solo packs PRD y tortugas. Sacá auditorías internas
y tickets Grok/Gemini. Enlazá GO_LIVE_PRD.
```

**Prompt C — Página Grupo / partner**

```
Unificá PROGRAMA_PARTNER + GO_LIVE + PRODUCTO_VENDIBLE en
content/docs/grupo/mapa-productos.mdx y partners/programa.mdx.
Clarificá: qué es Claver ERP, Cloud, Leo, Grow; qué se revende.
```

### 4.6 Ritual semanal (30–45 min)

| Paso | Quién |
|------|--------|
| Correr gap-report | Cualquiera / CI |
| Elegir 3 gaps P0 (packs PRD o APIs rotas) | PO / vos |
| Generar drafts con IA | Grok o Gemini |
| Curar 3 páginas (last_verified) | Humano |
| Anunciar en canal interno “docs del viernes” | — |

Sin ritual, la wiki muere en 60 días.

---

## 5. Qué documentar primero (orden de valor)

### P0 — Sin esto el Grupo no se entiende

| Página | Fuente | Audience |
|--------|--------|----------|
| Mapa del Grupo Claver (productos y marcas) | AUDITORIA_GRUPO + Agents | all |
| Packs PRD go-live (qué sí se vende) | `GO_LIVE_PRD.md` | comercial, partner |
| Multi-tenant y seguridad tenant | código + AGENTS | developer, ops |
| Deploy / env Vercel | `docs/deploy/*` | operaciones |
| Fiado + Leo (flujo E2E) | funcional + empleados-digitales | analista, comercial |
| Partner: comisión y ética | `PROGRAMA_PARTNER_CLAVER.md` | partner |

### P1 — Escala implementación y reventa

| Página | Fuente |
|--------|--------|
| Proceso Cloud venta → go-live | ya hay MDX ops; alinear |
| AFIP homologación paso a paso | `docs/fiscal/*` |
| Membresías / abonos / cupos | schema + roadmap comercial |
| Tortugas y recomendaciones (landings) | `REUTILIZACION_SALVAJE_...md` → content |
| Estudios contables / white-label | comercial reutilización |
| Índice API por módulo | gen-api-overview |
| Empleados digitales (canales WA/Telegram) | `docs/empleados-digitales/*` |

### P2 — Completitud

- Rubros restantes, Clavergrow, hospitalidad KDS, OPO link-out  
- OpenAPI formal  
- i18n docs (solo es-AR por ahora)  
- Versionado de docs por release (`1.x`) si hay clientes enterprise  

### Qué **no** meter en la wiki pública/interna general

- Auditorías crudas con hallazgos de seguridad sin sanear  
- Backlog de tickets internos (`engineering/backlog-status.json`)  
- Dossiers de clientes reales  
- Prompts basura / experiments  

Esos quedan en `docs/` o privados.

---

## 6. Dos sitios, un contenido (estrategia dual)

```
                    content/docs/*.mdx   (source of truth wiki ERP)
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
  /dashboard/documentacion          (opcional) docs.grupo.claver
  Next embebido                     Docusaurus static
  login / tenant                    público o con password
  analista + dev + ops              partners + inversores + API pública
```

| | Wiki embebida | Docusaurus Grupo |
|--|---------------|------------------|
| URL | `/dashboard/documentacion` | `docs.claver...` |
| Auth | Sesión ERP | Público / basic auth |
| Contenido | 100% operativo | Subset + marketing técnico |
| Build | `next build` | `docusaurus build` CI |
| Mantenimiento | Principal | Mirror selectivo (`include` de carpetas) |

**Cuándo levantar Docusaurus del Grupo:**  
cuando necesites **link público** sin dar acceso al ERP (partners, sales decks técnicos, open API).  
Hasta entonces, **no bloquees** la sanidad de docs esperando el sitio standalone.

Si se implementa Docusaurus Grupo:

```bash
# apps/docs-grupo o docs-site/
npx create-docusaurus@latest docs-grupo classic --typescript
# baseUrl: /
# docs path: symlinks o copy CI desde content/docs/{grupo,comercial,partners,developer/api}
```

Referencia oficial: [https://docusaurus.io/](https://docusaurus.io/)  
Referencia interna OPO: `opo/Open-protocol-ontology/docs-site/`.

---

## 7. Estado actual de `content/docs` (inventario resumido)

| Sección | Páginas (aprox.) | Calidad |
|---------|------------------|---------|
| `index` | 1 | OK hub; desactualizado parcialmente (fechas 2026-06) |
| `analista/` | 6 | Buena base implementación |
| `developer/` | 9 | Buena; regenerar API overview |
| `funcional/` | ~15 | POS, tesorería, AFIP, automation; faltan fiado/Leo/membresías deep |
| `operaciones/` | 6 | Deploy, health, Cloud proceso |
| `roadmap/` | 7 | Histórico F1–F4; actualizar a packs PRD 2026-07 |
| `comercial/` | 1 | **Muy flaco** vs `docs/comercial/*` |
| `ia-context/` | 2 | Schema listo; falta índice generado |
| **grupo / leo / partners / grow** | 0 | **Agujero principal del Grupo** |

`docs/` tiene **decenas** de MD comerciales, QA, marketplace y seguridad que **aún no pasaron** por el embudo harvest → curate → `content/docs`.

---

## 8. CI mínimo de docs (salud)

```yaml
# Idea: .github/workflows/docs.yml
# - node scripts/docs/verify-frontmatter.ts
# - node scripts/docs/gap-report.ts --fail-on prd-pack-missing
# - opcional: link check interno /dashboard/documentacion/*
```

Reglas:

- PR que toca `lib/X` o `app/api/X` y pack PRD → comentario bot “¿actualizaste MDX?”  
- `status: deprecado` no se borra 30 días (redirect en index)  
- Prohibido MDX sin `audience` y `last_verified`

---

## 9. Roles y dueños (Grupo)

| Área wiki | Dueño contenido | Genera borrador | Publica |
|-----------|-----------------|-----------------|---------|
| Developer / API | Ingeniería (Grok) | Scripts + Grok | PR |
| Analista / go-live | Cloud / analista | Gemini + runbooks | PR |
| Comercial / packs | PO comercial | Gemini copy | Humano revisa claims |
| Leo / agentes | Ingeniería agentes | Grok | PR |
| Partner / estudio | Comercial + legal light | Gemini | Humano |
| Seguridad | Ops + eng | — | Humano only |
| Grupo mapa | Fundador / CPO | — | Humano |

---

## 10. Plan de 14 días (ejecutable)

| Día | Entrega |
|-----|---------|
| 1–2 | `harvest-index` + `gap-report` + lista P0 gaps |
| 3 | `content/docs/grupo/mapa-productos.mdx` (manual, alto valor) |
| 4 | Sync GO_LIVE packs → `comercial/go-live-packs.mdx` |
| 5 | Fiado + Leo E2E → `funcional/fiado-leo.mdx` |
| 6 | Partner programa → `partners/programa.mdx` |
| 7 | Regenerar `developer/api-overview.mdx` (script o IA acotada) |
| 8–9 | Seguridad multi-tenant + deploy env checklist en wiki |
| 10 | Membresías/abonos página (aunque cupos parciales — marcar honestidad) |
| 11 | Tortugas/landings resumen comercial en wiki |
| 12 | Actualizar `content/docs/index.mdx` hub Grupo |
| 13 | Frontmatter verify en local; arreglar 10 peores |
| 14 | Decidir: ¿Docusaurus público sí/no? Si sí, scaffold `docs-grupo` solo con subset |

---

## 11. Relación con “documentación tipo Docusaurus”

| Expectativa Docusaurus | Equivalente Claver hoy | Gap |
|------------------------|------------------------|-----|
| Sidebar por carpeta | Scan `content/docs` | Categorías Grupo faltantes |
| Búsqueda | Parcial / a mejorar | Algolia o search local |
| Versioning | No | Solo si hay clientes que lo pidan |
| i18n | es-AR only | OK |
| MDX components | Limitado (Markdown + Mermaid) | Suficiente para ops |
| Deploy docs | Dentro de Next | Público Grupo opcional |
| Blog | No | Opcional en Docusaurus Grupo |

**No hace falta “instalar Docusaurus para tener docs”.**  
Hace falta **contenido curado + generación + mapa del Grupo**.  
Docusaurus es un **canal de publicación extra**, no la cura de la deuda documental.

---

## 12. Checklist “¿está sana la doc del Grupo?”

- [ ] Existe página **Mapa del Grupo** con cada línea de producto y qué no es  
- [ ] Cada pack **PRD** tiene MDX o link explícito “doc pendiente”  
- [ ] `last_verified` < 60 días en P0  
- [ ] Frontmatter válido en 100% de `content/docs`  
- [ ] Gap-report en CI (aunque sea warning)  
- [ ] Comercial y partner no dependen solo de `.docx` sueltos  
- [ ] Seguridad multi-tenant documentada y linkeada desde AGENTS  
- [ ] Un onboarding dev (getting-started) funciona en máquina limpia  
- [ ] Un onboarding analista (checklist go-live) se puede seguir sin preguntar a Pablo  
- [ ] IA/asistente puede listar docs por `audience` y `tags`  

---

## 13. Referencias internas

| Recurso | Path |
|---------|------|
| Arquitectura wiki | `docs-site/ARCHITECTURE.md` |
| Prompt embed histórico | `PROMPT_GEMINI_DOCUSAURUS_EMBED.md` |
| Metadata RAG | `content/docs/ia-context/metadata-schema.mdx` |
| Gaps G13 | `docs/G13_DOCUMENTACION_Y_TECNOLOGIA.md` |
| Go-live packs | `docs/GO_LIVE_PRD.md` |
| Partner | `docs/comercial/PROGRAMA_PARTNER_CLAVER.md` |
| Reutilización / tortugas | `docs/comercial/REUTILIZACION_SALVAJE_LANDINGS_MEMBRESIAS_REVENTA.md` |
| Docusaurus OPO | `opo/Open-protocol-ontology/docs-site/` |
| Docusaurus docs oficiales | https://docusaurus.io/ |

---

## 14. Claver Docs · Room (implementado en producto)

| Pieza | Path |
|-------|------|
| UI central | `/dashboard/documentacion` — brand **Claver Docs · Room** |
| Flujos Mermaid | `content/docs/room/*.mdx` |
| Sidebar ERP | Sección **Claver Docs** (wiki + cómo funciona + requisitos + mapa) |
| Nav shared | `/dashboard/documentacion` en `NAV_SHARED_PATHS` |
| Command palette | sección Claver Docs |

**Room P0 actual:** mapa grupo · cómo funciona todo · requisitos · auth · POS/caja · fiado/Leo · billing · AFIP · go-live Cloud.

Ampliar Room = agregar MDX en `content/docs/room/` con frontmatter + ≥1 diagrama Mermaid; la sidebar se genera sola.

---

## 15. Cierre

**Falta documentación** en el sentido de **cobertura del Grupo, frescura y pipeline** — no en el sentido de “no tenemos Docusaurus instalado en el ERP”.

Documentación sana de todo Claver y el Grupo =

1. **Fuente** `content/docs` (+ `docs/` como laboratorio)  
2. **Generación** harvest → gap → draft IA → curación  
3. **Publicación** wiki embebida **Claver Docs · Room** (Docusaurus público opcional)  
4. **Ritual** semanal + dueños  
5. **Honestidad** go-live (qué no prometemos)

El siguiente paso de ingeniería más rentable: **gap-report + más flujos Room** (membresías, sorteos, partner white-label) y regenerar API overview.

# PROMPT — Gemini / Cursor: Empaquetado Comercial Claver Nicho LATAM

> **Copiar y pegar en Gemini Antigravity o Cursor Agent.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Fecha: 2026-07-02  
> Prioridad: **P0** — Salir a vender 11 mini-SaaS de nicho + 3 packs comerciales  
> Stack: Next.js 15 · Prisma · PostgreSQL · TypeScript strict · shadcn/ui · Zustand  
> Referencia gold standard: `pos.fiado_barrio` (Libreta Fiado) — ver `PROMPT_GEMINI_LIBRETA_FIADO.md`  
> Estrategia: **Strangler Fig** — reemplazar cuaderno/Excel; upsell a ERP legacy (Protheus) vía `lib/legacy-bridge/`

---

## PROMPT (copiar desde acá)

```
Sos arquitecto full-stack senior del grupo CLAVER. Tenés shell del repo.

## Objetivo de producto

**Empaquetar comercialmente** el framework **Claver Nicho LATAM** — 11 apps mini-SaaS que ya tienen código base — para que un vendedor de calle pueda:

1. Mostrarlas en `/claver/apps?nicho=nicho_latam`
2. Activarlas con `provisionSku("niche.*")` sin analista
3. Entregar golden path funcional en < 5 minutos post-login
4. Vender packs bundle con WhatsApp incluido

**Lema del portfolio:** «Tu nicho en el bolsillo. Sin Excel. Con WhatsApp.»  
**Pitch vendedor:** «Dejá el cuaderno. Cobrá más rápido. Si después tenés Protheus, conectamos sin tocar el core.»

**NO romper multi-tenant.** Toda API usa `getAuthContext()` + `whereEmpresa()`.

---

## Contexto — qué YA existe (apalancar, no rehacer)

### Catálogo y motores (`lib/niche/`)

| appId | SKU | Engine | Golden path | Precio ARS/mes |
|-------|-----|--------|-------------|----------------|
| consorcios | niche.consorcios | consorcio | /dashboard/nicho/consorcios | 8.900 |
| club | niche.club_barrio | cuotas | /dashboard/nicho/club | 3.990 |
| feria | niche.feria_puesto | movimientos | /dashboard/nicho/feria | 3.990 |
| prestamista | niche.prestamo_barrio | libreta → /dashboard/fiado | /dashboard/fiado | 5.990 |
| obras | niche.obra_changas | movimientos | /dashboard/nicho/obras | 4.990 |
| acopio | niche.acopio_grano | movimientos | /dashboard/nicho/acopio | 6.990 |
| remis | niche.base_remis | movimientos | /dashboard/nicho/remis | 4.990 |
| plancha | niche.tintoreria | movimientos | /dashboard/nicho/plancha | 3.990 |
| consultorio | niche.consultorio_solo | agenda → /dashboard/agenda | /dashboard/agenda | 4.990 |
| garantia | niche.inmo_garantia | movimientos | /dashboard/nicho/garantia | 5.990 |
| mutuo | niche.cooperativa_cuotas | cuotas | /dashboard/nicho/mutuo | 4.990 |

Fuente única: `lib/niche/niche-apps-catalog.ts` → `NICHE_APPS`

### Infraestructura ya cableada ✅

| Pieza | Ubicación | Estado |
|-------|-----------|--------|
| Hub nicho | `app/dashboard/nicho/page.tsx` | ✅ |
| Shell por app | `components/niche/niche-app-shell.tsx` | 🟡 básico |
| Panel consorcios | `components/niche/niche-consorcios-panel.tsx` | ✅ |
| API genérica | `app/api/niche/[appId]/route.ts` | ✅ |
| API consorcios | `app/api/consorcios/` | ✅ |
| Modelo DB | `NicheMovimiento` + migración `20260702130000_niche_movimientos` | ✅ archivo, ⚠️ deploy pendiente |
| Servicios | `movimientos-service.ts`, `cuotas-service.ts`, `niche-whatsapp.ts` | ✅ |
| Provision hook | `lib/niche/niche-provision.ts` → `activarNicheApp` | ✅ |
| Product hooks | `lib/platform/product-hooks.ts` | ✅ |
| Product registry | `lib/platform/product-registry.ts` | ✅ |
| Marketplace SKUs | `lib/niche/niche-marketplace-entries.ts` → spread en `marketplace-catalog.ts` | ✅ |
| AutoPool nicho | `nicho_latam` en `autopool-manifest.ts` + `NICHE_AUTOPOOL_ENTRIES` | ✅ |
| Runbooks | `lib/niche/niche-runbooks.ts` → spread en `product-runbooks.ts` | ✅ |
| Enganches | `enganche-catalog.ts` mapea `NICHE_APPS` | ✅ |
| Bundles | `pool-claver-nicho`, `pool-propiedad`, `pool-calle-nicho` en `bundles.ts` | ✅ |
| Pack calle | `pack-calle-catalog.ts` con `modoLite: "niche"` | ✅ |
| Lite sidebar | `lite-sidebar.ts` incluye `/dashboard/nicho` | ✅ |
| Industry templates | `industry-templates.ts` | 🟡 solo 4/11 apps |
| Legacy Bridge | `lib/legacy-bridge/` + benchmark API | ✅ (upsell enterprise) |
| Tests base | `__tests__/niche/niche-apps.test.ts` + legacy-bridge (17 tests) | ✅ verdes |

### Benchmark vendible (copiar patrón)

**Libreta Fiado** (`pos.fiado_barrio`) tiene TODO lo que falta en nicho:
- SKU en marketplace ✅
- Runbook con pasos analista ✅
- Migración aplicada ✅
- UI pulida con selector cliente ✅
- Docs `docs/marketplace/11-libreta-fiado-almacen.md` ✅
- Bundle `pool-almacen-barrio` ✅
- Tests `resolveSku` + `provisionSku` ✅

**Meta:** cada `niche.*` debe llegar al mismo nivel que Fiado en su vertical.

---

## GAP actual (implementar en este prompt)

### P0 — Bloqueantes para vender hoy

1. **Migración DB** — correr `npx prisma migrate deploy` (o `migrate dev`) para `niche_movimientos`
2. **Tests marketplace** — `resolveSku("niche.consorcios")` y `provisionSku("niche.club_barrio")` deben pasar
3. **Selector Cliente real** — `niche-app-shell.tsx` usa `clienteId: 1` hardcodeado (L99); reemplazar por combobox que busque en `/api/clientes`
4. **Industry templates** — faltan 7 apps: feria, obras, acopio, remis, consultorio, garantia, mutuo
5. **Comercial relevamiento** — agregar packs nicho en `lib/ops/comercial-relevamiento-catalog.ts`
6. **Docs marketplace** — crear `docs/marketplace/19-claver-nicho-latam.md` + actualizar `README.md` y `07-bundles-comerciales.md`
7. **Hub nicho polish** — cards con precio, wow moment, CTA trial; filtro por app activa (`canUseSku`)

### P1 — Vendedor de calle puede demostrar

8. **Speech comercial** — sección en `docs/comercial/roadmap-venta-vendedor-calle.md` con 3 pitches (consorcios, club, plancha)
9. **Onboarding post-provision** — toast + redirect a `goldenPath` tras `activarNicheApp`
10. **WhatsApp masivo UX** — feedback de cuántos mensajes encolados; badge si falta `com.whatsapp`
11. **Command palette** — entradas «Claver Nicho» + cada app activa por SKU
12. **Pack calle tests** — `__tests__/comercial/pack-calle-catalog.test.ts` incluye los 3 packs nicho

### P2 — Upsell enterprise (opcional en este sprint)

13. **Legacy Bridge pitch** en hub nicho: «¿Tenés Protheus? Conectá sin tocar el core»
14. **Demo benchmark visual** — link a `/api/legacy-bridge/benchmark` desde hub
15. **PDF export** boletines técnicos Protheus

---

## Definición funcional — flujo comercial completo

### Happy path vendedor (5 minutos)

```
Visita administrador consorcio
  → Demo tablet: /dashboard/nicho/consorcios (tenant demo)
  → Cierre: pool-propiedad $29.900/mes (consorcios + garantía + cobranzas WA + WA)
  → Cobro MP / transferencia
  → Claver Cloud: provisionOrden con SKUs del pack
  → Cliente recibe mail activación → login → golden path
  → Primer gasto + liquidación expensas → WhatsApp masivo morosos
```

### Provision automática (sin analista)

Al `provisionSku("niche.*")`:
1. `SuscripcionModulo` creada (patrón existente en `provision-service.ts`)
2. Hook `activarNicheApp(empresaId, sku)`:
   - `empresa.modoLite = "niche"`
   - `featureEmpresa.niche_apps` con `{ apps: [sku], primarySku, appId }`
   - Si engine `cuotas` → crear `PlanMembresia` default si no existe
3. Redirect post-login → `pack-calle-catalog` `landingPath` = `/dashboard/nicho` o golden path del SKU primario

**Verificar:** `provision-service.test.ts` — agregar casos para `niche.consorcios` y `niche.tintoreria`.

### Entitlements

- `canUseSku(empresaId, "niche.consorcios")` debe ser true tras provision
- Layout guard en `app/dashboard/nicho/[appId]/layout.tsx` ya redirige si no tiene SKU
- Prestamista depende de `pos.fiado_barrio` (`dependeDe` en marketplace entry)

### UI mínima vendible por engine

| Engine | Pantalla mínima | Acción wow |
|--------|-----------------|------------|
| consorcio | Edificio → gastos → liquidar período | WA masivo inquilinos |
| cuotas | Lista socios + cuota del mes | Marcar pagado + WA morosos |
| movimientos | Registros + estados pendiente/listo/pagado | Plancha: LISTO → WA automático |
| libreta | Redirect a `/dashboard/fiado` | Cuota vencida → WA |
| agenda | Redirect a `/dashboard/agenda` | Turno confirmado |

### Selector Cliente (P0 — crítico)

En `components/niche/niche-app-shell.tsx` y modal de alta:

```typescript
// Reemplazar clienteId: 1 y campo texto libre
// Usar patrón de app/dashboard/clientes o combobox shadcn
// GET /api/clientes?q=...&limit=20
// Si no existe → botón "Alta rápida" POST /api/fiado/clientes-rapido o /api/clientes mínimo
```

Campos mínimos alta rápida: `nombre`, `telefono` (obligatorio para WA), `email?`.

---

## Bundles comerciales (ya definidos — documentar y testear)

| Pack ID | Nombre | SKUs | Precio | Lema |
|---------|--------|------|--------|------|
| pool-claver-nicho | Claver Nicho Starter | niche.consorcios + com.whatsapp | $19.900 | Una app de nicho + WhatsApp |
| pool-propiedad | Claver Propiedad | niche.consorcios + niche.inmo_garantia + intang.cobranzas_wa + com.whatsapp | $29.900 | Consorcios y contratos |
| pool-calle-nicho | Calle + Nicho | pos.fiado_barrio + niche.feria_puesto + niche.tintoreria + com.whatsapp | $24.900 | Fiado + feria o tintorería |

**Upsell path:**
- Nicho Starter → Propiedad (administradores)
- Calle + Nicho → pool-almacen-barrio (comercio mixto)
- Cualquier nicho → Legacy Bridge Protheus (enterprise)

---

## Sprints de implementación (orden estricto)

### NICHO-EMP-S00 — DB + tests marketplace
- [ ] `npx prisma migrate deploy` (o dev) — verificar tabla `niche_movimientos`
- [ ] `__tests__/marketplace/niche-provision.test.ts`:
  - `resolveSku("niche.consorcios")` retorna entrada válida
  - `provisionSku(1, "niche.club_barrio")` llama hook y no lanza
  - `provisionSku(1, "sku.inexistente")` sigue fallando
- [ ] Correr `npx vitest run __tests__/niche __tests__/marketplace/niche-provision`

### NICHO-EMP-S01 — Selector Cliente + UX shell
- [ ] Componente `components/niche/niche-cliente-picker.tsx` (combobox + alta rápida)
- [ ] Integrar en `niche-app-shell.tsx` para engines `cuotas` y `movimientos`
- [ ] Quitar `clienteId: 1` hardcodeado
- [ ] Feedback toast post crear registro / marcar pagado / WA masivo
- [ ] Test smoke: POST `/api/niche/club` con clienteId real (mock)

### NICHO-EMP-S02 — Industry templates + onboarding
- [ ] Completar `lib/comercial/industry-templates.ts` para las 7 apps faltantes
- [ ] Cada template: `goldenPath`, `engancheId`, `menuLabels`, rubro keywords
- [ ] Post-provision redirect: en `niche-provision.ts` o middleware onboarding → `getNicheAppBySku(sku)?.goldenPath`
- [ ] Hub `/dashboard/nicho`: cards con emoji, lema, wow moment, badge activo/inactivo

### NICHO-EMP-S03 — Comercial calle + relevamiento
- [ ] `lib/ops/comercial-relevamiento-catalog.ts` — entries para pool-claver-nicho, pool-propiedad, pool-calle-nicho
- [ ] `lib/comercial/pack-calle-catalog.ts` — verificar `MODO_POR_ENGANCHE` incluye packs nicho
- [ ] Tests `__tests__/comercial/pack-calle-catalog.test.ts` — 3 packs nicho presentes y `vendibleHoy: true`
- [ ] Actualizar `docs/comercial/roadmap-venta-vendedor-calle.md` — sección «Nicho LATAM» con speech 30 segundos por vertical

### NICHO-EMP-S04 — Docs marketplace
- [ ] Crear `docs/marketplace/19-claver-nicho-latam.md`:
  - Tabla 11 apps con dolor/wow/precio
  - Flujo provision + entitlements
  - Bundles y upsell paths
  - Checklist demo vendedor
- [ ] Actualizar `docs/marketplace/README.md` índice
- [ ] Actualizar `docs/marketplace/07-bundles-comerciales.md` con 3 packs nuevos
- [ ] Actualizar `docs/marketplace/12-enganches-comerciales.md` — tier `implementado` para los 11 SKUs

### NICHO-EMP-S05 — Command palette + AutoPool UI
- [ ] `components/command-palette.tsx` — grupo «Claver Nicho» con apps activas del tenant
- [ ] Verificar `/claver/apps?nicho=nicho_latam` muestra las 11 entradas con lema y precio
- [ ] Badge «Nuevo en el pool» si `poolSince` < 14 días (ya existe lógica AutoPool — verificar)

### NICHO-EMP-S06 — QA final vendible
- [ ] `npx vitest run __tests__/niche __tests__/marketplace __tests__/comercial`
- [ ] Smoke manual checklist (abajo)
- [ ] Reportar % completitud vs Fiado benchmark

---

## Tests obligatorios (Vitest)

```
__tests__/marketplace/niche-provision.test.ts   ← CREAR
  - resolveSku para cada niche.* (sample 3)
  - provisionSku niche.consorcios activa modoLite niche
  - provisionSku sin SKU falla

__tests__/comercial/pack-calle-catalog.test.ts  ← EXTENDER
  - PACKS_CALLE incluye pool-claver-nicho, pool-propiedad, pool-calle-nicho
  - landingPath = /dashboard/nicho para packs niche
  - vendibleHoy true

__tests__/niche/niche-marketplace.test.ts       ← CREAR (opcional)
  - NICHE_MARKETPLACE_CATALOG.length === 11
  - cada SKU tiene trialDias 14 y paisesHabilitados incluye AR
```

Usar `mockPrismaClient` de `__tests__/setup.ts`. Agregar `nicheMovimiento` al mock si falta.

---

## Smoke manual — checklist vendedor (Definition of Done)

1. ✅ `/claver/apps?nicho=nicho_latam` lista 11 apps con precio y CTA
2. ✅ Checkout/provision `niche.consorcios` → tenant con `modoLite: niche`
3. ✅ Login → redirect `/dashboard/nicho/consorcios` (o hub si multi-app)
4. ✅ Alta edificio + gasto + liquidar → registros en DB
5. ✅ WhatsApp masivo encola mensajes (o degrada sin `com.whatsapp` con mensaje claro)
6. ✅ `pool-propiedad` provisiona 4 SKUs sin error
7. ✅ Prestamista sin `pos.fiado_barrio` muestra upsell / bloqueo claro
8. ✅ Selector cliente funciona en Club y Plancha (no hardcode id 1)
9. ✅ Tests Vitest verdes (niche + marketplace + comercial)
10. ✅ Docs `19-claver-nicho-latam.md` existe y roadmap calle actualizado

**Criterio «listo para vender»:** 10/10 ✅. Hoy estimado ~7/10 — completar P0+P1.

---

## Restricciones

- **No** duplicar SKUs manualmente — siempre derivar de `NICHE_APPS` vía `niche-marketplace-entries.ts`
- **No** crear 11 codebases — un motor `movimientos` + un motor `cuotas` + consorcio + redirects
- **No** romper Fiado ni marketplace existente
- Locale **es-AR**, moneda **ARS**, fechas **dd/mm/yyyy**
- Seguir shadcn/ui + `cn()` + patterns de `app/dashboard/fiado/page.tsx`
- Commits por sprint; PRs acotados

---

## Archivos probables a tocar

```
prisma/migrations/20260702130000_niche_movimientos/  (deploy)
components/niche/niche-cliente-picker.tsx            (CREAR)
components/niche/niche-app-shell.tsx
app/dashboard/nicho/page.tsx
lib/comercial/industry-templates.ts
lib/comercial/pack-calle-catalog.ts
lib/ops/comercial-relevamiento-catalog.ts
lib/niche/niche-provision.ts
components/command-palette.tsx
docs/marketplace/19-claver-nicho-latam.md            (CREAR)
docs/marketplace/README.md
docs/marketplace/07-bundles-comerciales.md
docs/marketplace/12-enganches-comerciales.md
docs/comercial/roadmap-venta-vendedor-calle.md
__tests__/marketplace/niche-provision.test.ts        (CREAR)
__tests__/comercial/pack-calle-catalog.test.ts
__tests__/niche/niche-marketplace.test.ts            (CREAR)
```

---

## Coordinación con Cursor / otro agente

Si trabajás en paralelo con otro agente (Cursor):

| Agente | Foco |
|--------|------|
| **Gemini** | UI polish, industry templates, docs comerciales, speech vendedor, command palette |
| **Cursor** | Tests marketplace, migración DB, selector cliente API, provision edge cases |

**Sync point:** `NICHE_APPS` en `niche-apps-catalog.ts` es fuente única — no editar SKUs en dos lugares.

---

## Orden de ejecución para el agente

1. Leer `lib/niche/niche-apps-catalog.ts` y `PROMPT_GEMINI_LIBRETA_FIADO.md` (benchmark)
2. NICHO-EMP-S00 → S01 → S02 → S03 → S04 → S05 → S06
3. Reportar al final: checklist 10 ítems, % vs Fiado, archivos tocados, comandos vitest

Empezá por NICHO-EMP-S00 ahora. No preguntes — ejecutá con shell y tests.
```

---

## Notas para Pablo

### Cómo usar este prompt con Gemini

1. Abrí **Gemini Antigravity** (o Cursor en otra ventana) con acceso al repo
2. Copiá todo el bloque entre las comillas del `## PROMPT` de arriba
3. Decile: *«Ejecutá NICHO-EMP-S00 a S06 en orden. Reportá checklist al final.»*
4. En paralelo, Cursor puede seguir con Legacy Bridge o Fiado upsells

### Qué ya está hecho (no repetir)

- Spread marketplace/autopool/runbooks desde `niche-marketplace-entries.ts`
- 3 bundles en `bundles.ts` + pack calle
- Hook `activarNicheApp` + product registry
- 17 tests niche + legacy-bridge verdes

### Pricing sugerido vendedor calle

| Oferta | Precio | Target |
|--------|--------|--------|
| App suelta (club, feria, plancha) | $3.990–$6.990 | Comercio chico |
| Consorcios solo | $8.900 | Administrador edificio |
| Nicho Starter (consorcios + WA) | $19.900 | Puerta fría administración |
| Propiedad (consorcios + garantía + cobranzas) | $29.900 | Inmobiliaria/administración |
| Calle + Nicho (fiado + feria/plancha) | $24.900 | Almacén con feria o lavadero |

### Archivos hermanos de referencia

- `PROMPT_GEMINI_LIBRETA_FIADO.md` — gold standard producto vendible
- `PROMPT_GEMINI_CLAVER_MARKETPLACE.md` — AutoPool y provision
- `docs/comercial/roadmap-venta-vendedor-calle.md` — playbook calle
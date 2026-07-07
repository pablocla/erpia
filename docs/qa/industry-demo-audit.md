# Auditoría QA — Industry Demos (`/api/onboarding/industry-demo`)

**Fecha:** 3 jul 2026  
**Entorno:** `http://localhost:3000` (puede levantar en `:3001` si 3000 ocupado)  
**Ejecutado por:** agente Cursor (SDET)  
**Handoff para:** Gemini / siguiente agente de QA

---

## Objetivo

Validar los **Circuitos Comerciales** (Industry Demos) que provisionan tenants aislados vía:

```http
POST /api/onboarding/industry-demo
Content-Type: application/json

{ "industryId": "<ID_DEL_RUBRO>" }
```

**Respuesta esperada:** `200` + JWT + objeto `provision` (goldenPath, skusActivados, modoLite, etc.).

---

## Mecanismo de sandboxing

| Campo | Regla |
|-------|--------|
| CUIT | `20-{hash8}-0` (hash = primer segmento UUID) |
| Email | `demo-{hash8}@claver.com.ar` |
| Usuario | `Administrador Demo` / rol `administrador` |
| Aislamiento | `empresaId` único por request |

**Rate limit:** 15 requests / 15 min por IP → tras batería de tests puede devolver **429**. Esperar ventana o provisionar vía script directo (ver §Carnicería).

---

## Estado de la matriz (6 circuitos originales)

| # | `industryId` | Golden path esperado | Estado audit | Método | ¿Demo comercial OK? |
|---|--------------|----------------------|--------------|--------|---------------------|
| 1 | `almacen` | `/dashboard/fiado` | **Completo** | POST + DB + API + 3× concurrente | ❌ |
| 2 | `gimnasio` | `/dashboard/membresias` | **Completo** | POST + DB + API + 3× concurrente | ✅ (caveats) |
| 3 | `veterinaria` | `/dashboard/historia-clinica` | **Completo** | POST + DB + API | ❌ |
| 4 | `taller_mecanico` | `/dashboard/nicho/taller` | **Completo** | POST + DB + API + 3× concurrente | ❌ |
| 5 | `club_barrio` | `/dashboard/nicho/club` | **Completo** | POST + DB + API + 3× concurrente | ❌ |
| 6 | `carniceria` | `/dashboard/pos` | **Parcial** | POST → 429; reprovisionado con script TS | ❌ |

**Pendiente para Gemini:** completar auditoría HTTP de `carniceria` (POST + 3× concurrente + API balanza) cuando expire el rate limit.

---

## Checklist estándar (repetir por circuito)

1. **Aprovisionamiento:** HTTP 200, JWT válido, `provision.empresaNombre` con sufijo hash.
2. **Seeding DB:** productos y clientes coherentes con el rubro (Prisma).
3. **Golden path:** `goldenPath` correcto, `modoLite` coherente, menú adaptado.
4. **SKUs:** `provision.skusActivados` coincide con suscripciones en `suscripcionModulo`.
5. **Concurrencia:** 3× POST simultáneos → CUIT/email únicos, sin subs zombie.
6. **UI/API:** página del golden path + API principal del módulo (sin 500).

---

## Reportes por circuito

### 1. `almacen`

**Referencia:** `empresaId: 23` · `demo-47917b0f@claver.com.ar`

| Check | Resultado |
|-------|-----------|
| POST 200 + JWT | ✅ |
| `goldenPath` | ✅ `/dashboard/fiado` |
| `modoLite` | ✅ `fiado` |
| `skusActivados` en JSON | ❌ `[]` (bug reporting) |
| Sub en DB | ✅ `pos.fiado_barrio` activo |
| Productos | ⚠️ 10 duplicados (5 retail + 5 seed `DEMO-KIOS-*`) |
| Clientes fiado | ✅ Don Carlos, Juan Pérez, María del Valle |
| API `/api/fiado/resumen` | ❌ **500** |
| API `/api/fiado/deudores` | ✅ 3 deudores |
| Página `/dashboard/fiado` | ✅ 200 (shell) |
| 3× concurrente | ✅ empresas 24–26 aisladas |

**Fallos P0:**
- `lib/fiado/fiado-provision.ts:23` — `any.log` rompe hook → `skusActivados` vacío en respuesta.
- `lib/fiado/fiado-service.ts:190` — consulta `fiadoNotificacionLog` (modelo inexistente).

---

### 2. `gimnasio`

**Referencia:** `empresaId: 27` · `demo-766b7207@claver.com.ar`

| Check | Resultado |
|-------|-----------|
| POST 200 + JWT | ✅ |
| `goldenPath` | ✅ `/dashboard/membresias` |
| `modoLite` | ✅ `niche` |
| `skusActivados` | ✅ `["niche.gimnasio_barrio"]` |
| Planes | ⚠️ 4 (incluye plan espurio `"Claver Gimnasio"` $4.990) |
| Membresías | ✅ 4 (activa, suspendida, vencidas) |
| Productos | ✅ 3 (sin retail kiosco) |
| API `/api/membresias` | ✅ 200 con resumen |
| Página `/dashboard/membresias` | ✅ 200 |
| 3× concurrente | ✅ empresas 28–30 |

**Fallos menores:**
- Plan marketplace `"Claver Club"` / `"Claver Gimnasio"` por `activarNicheApp` engine `cuotas` (`niche-provision.ts:64`).
- Doble golden path: industry → `/dashboard/membresias` vs nicho → `/dashboard/nicho/gimnasio`.
- Cliente `Carlos Pintos` sin membresía vinculada.

**Mejor circuito de la matriz para demo comercial.**

---

### 3. `veterinaria`

**Referencia:** `empresaId: 31` · `demo-34fd171c@claver.com.ar`

| Check | Resultado |
|-------|-----------|
| POST 200 + JWT | ✅ |
| `goldenPath` | ✅ `/dashboard/historia-clinica` |
| `modoLite` | ⚠️ `completo` (no enfocado) |
| `skusActivados` | ❌ `[]` (sin `engancheId` en template) |
| Productos | ✅ 4 vet (consulta, vacuna, antiparasitario, alimento) |
| Clientes tutores | ✅ María González (Bobby), Lucas (Max) |
| `Paciente` / `Consulta` | ❌ **0 registros** |
| API `/api/historia-clinica` | ✅ 200 pero `totalPacientes: 0` |
| Página `/dashboard/historia-clinica` | ✅ 200 (vacía) |

**Fallos P0:**
- Falta `seedVetDemo()` (Bobby, Max como `Paciente` + consultas).
- Template sin `engancheId: "niche.vet_barrio"`.
- Wow moment *"Perfil de Bobby"* incumplido.

**Bug seguridad:** `app/api/historia-clinica/route.ts:44` — `consulta.count()` sin filtro `empresaId`.

---

### 4. `taller_mecanico`

**Referencia:** `empresaId: 35` · `demo-5d920eea@claver.com.ar`

| Check | Resultado |
|-------|-----------|
| POST 200 + JWT | ✅ |
| `goldenPath` | ✅ `/dashboard/nicho/taller` |
| `modoLite` | ✅ `niche` |
| `skusActivados` | ✅ `["niche.taller_mecanico"]` |
| `NicheMovimiento` | ❌ **0 órdenes** |
| Productos | ❌ genéricos `PRD001` / `SRV001` |
| Clientes | ❌ solo `Consumidor Final` |
| API `/api/niche/taller` | ✅ 200, movimientos: 0 |
| 3× concurrente | ✅ empresas 36–38 |

**Fallos P0:**
- Falta entrada en `NICHE_MOVIMIENTO_SEEDS["niche.taller_mecanico"]`.
- Falta `CLIENTES_POR_RUBRO` / clientes con vehículos.

---

### 5. `club_barrio`

**Referencia:** `empresaId: 39` · `demo-ea72d225@claver.com.ar`

| Check | Resultado |
|-------|-----------|
| POST 200 + JWT | ✅ |
| `goldenPath` | ✅ `/dashboard/nicho/club` |
| `modoLite` | ✅ `niche` |
| `skusActivados` | ✅ `["niche.club_barrio"]` |
| Plan | ⚠️ `"Claver Club"` $3.990 (SKU marketplace, 0 membresías) |
| Socios / cuotas | ❌ 0 membresías, 0 movimientos |
| Productos | ❌ genéricos |
| API `/api/niche/club` | ✅ 200, vacío |
| 3× concurrente | ✅ empresas 40–42 |

**Fallos P0:**
- Falta `seedClubDemo()` (equivalente a `seedGymDemo` del gimnasio).
- Falta `NICHE_MOVIMIENTO_SEEDS["niche.club_barrio"]` + clientes socios.

---

### 6. `carniceria` (audit parcial)

**Referencia:** `empresaId: 43` · `demo-72ab36e3@claver.com.ar` (script directo, no POST HTTP)

| Check | Resultado |
|-------|-----------|
| POST HTTP | ❌ **429 Too Many Requests** |
| Provision script | ✅ `npx tsx` llamando `provisionIndustryDemo` |
| `goldenPath` | ✅ `/dashboard/pos` |
| `modoLite` | ✅ `pos` |
| `engancheId` template | ✅ `pos.balanza_peso` |
| `skusActivados` en JSON | ❌ `[]` |
| `suscripcionModulo` | ❌ vacío |
| Productos | ⚠️ 4 duplicados (Asado/Vacío ×2); `unidad: "unidad"` (debería `kg`) |
| Clientes | ❌ kiosco (Don Carlos, Juan Pérez) — no carnicería |
| API balanza | ❌ **403** `/api/pos/almacen/retail?modulo=balanza` |
| Página `/dashboard/pos` | ✅ 200 |
| 3× concurrente | ⏳ **No ejecutado** (rate limit) |

**Pendiente Gemini:**
```powershell
$body = '{"industryId":"carniceria"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/onboarding/industry-demo" -Method POST -ContentType "application/json" -Body $body
```

---

## Bugs transversales (prioridad fix)

| ID | Sev. | Descripción | Archivo(s) |
|----|------|-------------|------------|
| X-01 | **P0** | `any.log` en hook fiado → activación parcial, `skusActivados: []` | `lib/fiado/fiado-provision.ts:23` |
| X-02 | **P0** | API fiado resumen 500 — tabla inexistente | `lib/fiado/fiado-service.ts:190` |
| X-03 | **P1** | Doble seed productos (retail + `seedIndustryDemoData`) | `retail-onboarding-service.ts` + `industry-demo-seeds.ts` |
| X-04 | **P1** | Código producto `DEMO-KIOS-*` para rubros ≠ kiosco | `industry-demo-seeds.ts` ~L571 |
| X-05 | **P1** | Nichos `movimientos`/`cuotas` sin seeds en demo | `industry-demo-seeds.ts` `NICHE_MOVIMIENTO_SEEDS` |
| X-06 | **P1** | Veterinaria sin pacientes + sin `engancheId` | `industry-templates.ts` + seeds |
| X-07 | **P2** | Plan espurio marketplace en engine `cuotas` | `lib/niche/niche-provision.ts:64-76` |
| X-08 | **P2** | `CLIENTES_POR_RUBRO` usa `template.rubro` (kiosco) no `template.id` | `industry-demo-seeds.ts` |
| X-09 | **P2** | `if (!isLicensed)` debería ser `!isLicensed.ok` | `app/api/fiado/*/route.ts` |
| X-10 | **P2** | Rate limit bloquea batería QA (15/15min) | `app/api/onboarding/industry-demo/route.ts` |
| X-11 | **P2** | `pos.balanza_peso` puede requerir `core.pos` como dependencia | `product-lifecycle.ts` + marketplace |

---

## Patrón detectado

| Tipo circuito | Enganche | Seed dedicado | Resultado demo |
|---------------|----------|---------------|----------------|
| Retail (`almacen`, `carniceria`) | `pos.*` | Parcial / duplicado | ❌ (fiado roto / balanza 403) |
| Nicho + `seedGymDemo` (`gimnasio`) | `niche.gimnasio_barrio` | ✅ membresías | ✅ |
| Nicho sin seed (`taller`, `club`) | `niche.*` | ❌ | ❌ pantalla vacía |
| ERP sin enganche (`veterinaria`) | — | ❌ pacientes | ❌ pantalla vacía |

---

## Archivos clave para implementar fixes

```
lib/comercial/industry-templates.ts    # engancheId, rubro, goldenPath
lib/comercial/industry-demo-service.ts # flujo provisionIndustryDemo
lib/comercial/industry-demo-seeds.ts   # seeds por rubro + NICHE_MOVIMIENTO_SEEDS
lib/comercial/retail-onboarding-service.ts
lib/fiado/fiado-provision.ts          # BUG any.log
lib/fiado/fiado-service.ts             # BUG fiadoNotificacionLog
lib/niche/niche-provision.ts           # plan espurio cuotas
app/api/onboarding/industry-demo/route.ts
app/api/historia-clinica/route.ts
app/api/fiado/resumen/route.ts
app/api/niche/[appId]/route.ts
```

---

## Seeds mínimos sugeridos (para agente implementador)

### `seedVetDemo(empresaId)`
- `Paciente` Bobby → cliente María González
- `Paciente` Max → cliente Lucas Fernández
- 1–2 `Consulta` demo por paciente

### `NICHE_MOVIMIENTO_SEEDS["niche.taller_mecanico"]`
```typescript
[
  { titulo: "Service 15.000 km — Golf 1.6", categoria: "orden", monto: 85000, estado: "pendiente" },
  { titulo: "Cambio pastillas — Cronos", categoria: "orden", monto: 42000, estado: "pagado" },
]
```

### `NICHE_MOVIMIENTO_SEEDS["niche.club_barrio"]` + `seedClubDemo`
```typescript
[
  { titulo: "Cuota marzo — Pablo G.", categoria: "cuota", monto: 8500, estado: "pendiente" },
  { titulo: "Cuota marzo — Martín L.", categoria: "cuota", monto: 8500, estado: "pagado" },
]
```

### Template `veterinaria`
```typescript
engancheId: "niche.vet_barrio",
```

### `carniceria` — productos
- `unidad: "kg"` en seeds
- `CLIENTES_POR_RUBRO` por `template.id`, no solo `rubro`
- Activar `core.pos` antes de `pos.balanza_peso` o remover dependencia en demo

---

## Empresas demo creadas en sesión (limpieza opcional)

Durante la auditoría se crearon tenants aprox. **`empresaId` 23–43**. Considerar purge en entorno dev antes de re-test.

---

## Comandos útiles para Gemini

```powershell
# Provisionar un rubro
$body = '{"industryId":"gimnasio"}'
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/onboarding/industry-demo" -Method POST -ContentType "application/json" -Body $body
$token = $r.token
$h = @{ Authorization = "Bearer $token" }

# API según golden path
Invoke-RestMethod -Uri "http://localhost:3000/api/membresias" -Headers $h
Invoke-RestMethod -Uri "http://localhost:3000/api/niche/club" -Headers $h
Invoke-RestMethod -Uri "http://localhost:3000/api/historia-clinica" -Headers $h
Invoke-RestMethod -Uri "http://localhost:3000/api/fiado/resumen" -Headers $h

# 3× concurrente
1..3 | ForEach-Object { Start-Job { Invoke-RestMethod -Uri "http://localhost:3000/api/onboarding/industry-demo" -Method POST -ContentType "application/json" -Body '{"industryId":"almacen"}' } }
```

```bash
# Tests automatizados existentes
npx vitest run __tests__/comercial/industry-demo-seeds.test.ts
npx vitest run __tests__/comercial/industry-demo-service.test.ts
npx vitest run __tests__/api/niche-routes.test.ts
```

---

## Ranking demo comercial (actual)

| Rank | Circuito | Veredicto |
|------|----------|-----------|
| 1 | `gimnasio` | ✅ Vendible con caveats |
| 2 | `almacen` | ⚠️ Provision OK, golden path roto (API 500) |
| 3 | `carniceria` | ❌ Balanza no licenciada |
| 4 | `taller_mecanico` | ❌ Sin órdenes demo |
| 5 | `club_barrio` | ❌ Sin socios/cuotas |
| 6 | `veterinaria` | ❌ Sin fichas mascotas |

---

## Próximos pasos para Gemini

1. [ ] Completar audit HTTP `carniceria` (POST + concurrente + API balanza).
2. [ ] Aplicar fix P0 `fiado-provision.ts` y re-auditar `almacen`.
3. [ ] Implementar seeds faltantes (vet, taller, club) y re-auditar.
4. [ ] Agregar `engancheId` a `veterinaria`.
5. [ ] Opcional: extender matriz a otros IDs en `INDUSTRY_TEMPLATES` no listados arriba.
6. [ ] Tras fixes, correr Vitest + smoke POST de los 6 circuitos.

---

*Generado automáticamente tras sesión de auditoría Cursor — 3 jul 2026.*
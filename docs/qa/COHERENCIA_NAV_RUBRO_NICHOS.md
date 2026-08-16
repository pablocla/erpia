# Coherencia de navegación (sidebar + topbar) por rubro / nicho

**Fecha:** 2026-07-22  
**Contexto:** El producto se siente “no listo”: menús de arriba e izquierda no reflejan bien el rubro, el seteo por nicho o el fin funcional de cada vertical.  
**Objetivo de este doc:** diagnosticar **vallas** (bloqueos reales) y proponer **mejoras lineales** (orden de trabajo sin reescritura total).

### Estado implementación (2026-07-22)

| Fase | Estado |
|------|--------|
| 1.1 Bypass admin/dueño vs `allowedRubros` | **Hecho** (`sidebar-filters.ts`) |
| 1.2 Default `modoLite=pos` altas | **Hecho** (schema, signup, Google, onboarding) |
| 1.3 Limpiar Principal / Platform | **Hecho** (`sidebar-modules.ts`) |
| 1.4 Almacén solo rubros retail | **Hecho** |
| 1.5 `effectiveRubro` unificado | **Hecho** (`use-dashboard-shell.ts`) |
| 2.1 Matriz nav | **Hecho** (`lib/comercial/nav-matrix.ts`) |
| 2.2 Allowlist completo+rubro | **Hecho** (`sidebar-rubro-filter.ts`) |
| 6.x Tests | **Hecho** (`__tests__/dashboard/sidebar-filters.test.ts` 12/12) |
| 3.x Home del dia | **Hecho base** (Gemini + fixes) |
| 4.x Seteo checklist | **Hecho** (Gemini; checklist lee quality API y se tacha dinámicamente) |
| 5.x Badges Demo/Piloto | **Hecho** (`lib/comercial/go-live-nav-badges.ts` + shell) |
| Fiado IPC panel | **Hecho** (`components/fiado/inflacion-fiado-panel.tsx`) |
| Tenants ruidosos dry-run | **Hecho** `GET /api/ops/tenant-nav-health` |
| Maestros warnings UI | **Hecho** toast `_warnings` en create cliente/proveedor |
| Maestros badges listado | **Hecho** Sin teléfono/Fiado (clientes); Revisar CUIT/Sin contacto (proveedores) |
| Quality API | **Hecho** `GET /api/maestros/quality-summary` |
| Google OAuth multi-tenant | **Hecho** `EMPRESA_REQUIRED` sin auto-empresa |
| Suite tests coherencia | **56/56** (google, sub-saas, maestros, buen-día, go-live, inflación, sidebar) |

---

## 1. Opinión ejecutiva

No es solo “no lo testeaste bien”. Hay **deuda de producto de navegación**:

1. El sistema tiene **varias capas de filtro que se pisan** y no cuentan una sola historia al comerciante.  
2. En muchos casos reales (dueño/admin + `modoLite = completo` + rubro mal seteado o `otro`) el menú muestra **ERP completo** → ruido, botones que no aplican, sensación de incompleto.  
3. Los **nichos** (vet, gym, restaurant, agro…) tienen ítems sueltos y `allowedRubros`, pero **falta un “home del nicho”** con KPIs, acciones y seteo guiado.  
4. El **topbar** casi no cambia por rubro (caja/AFIP por lista ad-hoc de `modoLite`); no refuerza el fin del día del comercio.

**Veredicto:** la base técnica de filtrado existe y es ambiciosa; la **coherencia percibida** falla porque no hay **una matriz canónica** “rubro/pack → menú + home + top actions + seteo mínimo”.

---

## 2. Cómo está armado hoy (mapa real del código)

### 2.1 Fuentes de verdad (demasiadas)

| Capa | Archivo | Qué hace |
|------|---------|----------|
| Catálogo menú | `lib/dashboard/sidebar-modules.ts` | ~todas las secciones/ítems del ERP |
| Rol + feature + SKU + rubro item | `lib/dashboard/sidebar-filters.ts` → `canRenderMenuItem` | Oculta por rol, feature, sku, `allowedRubros`, monotributo… |
| Prioridad por rubro | `lib/onboarding/onboarding-ia.ts` → `sidebarPrioridad`, `quickActions` | Orden / foco UX por rubro |
| Allowlist industria/demo | `lib/comercial/sidebar-rubro-filter.ts` | Paths permitidos por template industria / present mode |
| Modo lite / pack | `lib/comercial/lite-sidebar.ts` | Allowlist corta: fiado, pos, cobranza, niche, servicios |
| Shell producto (tabs) | `lib/comercial/product-shell.ts` | Tabs tipo “app” (Fiado, POS, Cobrá) |
| Orquestación UI | `hooks/use-dashboard-shell.ts` | Combina todo lo anterior |
| Topbar | `components/topbar.tsx` | Badges caja/AFIP según `modoLite` + SKUs, no según matriz rubro |

### 2.2 Pipeline de filtrado (sidebar)

```text
DASHBOARD_SIDEBAR_MODULOS
  → canRenderMenuItem (rol, features, SKU, allowedRubros, país, monotributo)
  → isMenuItemAllowedInModoLite (si modoLite ≠ completo)
  → isMenuHrefVisibleInAllowlist (industria/demo)
  → isModuloSectionVisible (sección completa)
  → ordenarModulosPorRubro
```

### 2.3 Bug / sesgo importante (admin ve “todo”)

En `canRenderMenuItem`:

```ts
if (["administrador", "admin", "dueno"].includes(role || "")) return true
```

Eso ocurre **antes** de evaluar `allowedRubros` / varios filtros de ítem.  
**Efecto:** el dueño del kiosco (rol `dueno` / `administrador`) ve ítems de veterinaria, agro, prestamos, etc. **salvo** que `modoLite` o allowlist los recorten.

Si el alta deja `modoLite = completo` y `rubro = otro` (o no se cargó rubro):

> **Sidebar = ERP enterprise** → “el sistema no está listo / no es para mí”.

Eso explica mucho de la sensación al testear “como dueño”.

### 2.4 Inconsistencia `rubro` vs `effectiveRubro`

- Allowlist / visibilidad de sección usan a veces `effectiveRubro` (demo industry).  
- `canRenderMenuItem` recibe `rubro` de empresa.  

En demos o onboarding a medias, **menú y labels no coinciden** con lo que el usuario cree que eligió.

---

## 3. Coherencia por tipo de experiencia

### 3.1 Pack / modo lite (fiado, pos, cobranza) — la más coherente

| Pack | Menú lateral | Shell tabs | Fin funcional | Estado |
|------|--------------|------------|---------------|--------|
| **fiado** | Corto (fiado, pos, caja, productos, clientes, CxC) | Libreta / Mostrador / Clientes | Anotar y cobrar fiado | Buena base; falta home “quién debe hoy” |
| **pos** | POS, caja, productos, clientes, fiado | Mostrador / Caja / Productos | Vender y cerrar caja | Buena; Almacén Rosario a veces ensucia |
| **cobranza** | CxC, clientes, fiado, recurrente | Cobros / Clientes | Cobrar | OK; WA/Leo no siempre visibles |
| **servicios** | Presupuestos, ventas, agenda | Parcial | Presu → factura → cobro | A medias |
| **niche** | nicho, apps, agenda, HC, fiado | turnos-ish | Agenda del vertical | Frágil: mezcla genérico + nicho |
| **completo** | Casi todo | No hay shell | “ERP” | **Peor UX comercial** si el cliente es pyme de un rubro |

### 3.2 Rubro con `sidebarPrioridad` (sin allowlist)

Cuando no hay industry template / present mode y `modoLite === completo`, se ocultan secciones por `moduloKey` ∉ prioridad del rubro.

**Problemas:**

- Secciones sin `moduloKey` (ej. Fiscal, Claver Nicho, Principal) se comportan distinto.  
- Ítems **dentro** de “Ventas” (POS + Almacén + Retención LTV + App Store) no se reordenan al fin del rubro.  
- Labels genéricos (“Facturación”) no se renombran al lenguaje del rubro (salvo demos con `getMenuLabelForRubro`).

### 3.3 Nicho vertical (vet, gym, restaurant, agro…)

| Nicho | Fin funcional ideal | Qué hay en nav | Qué se siente |
|-------|---------------------|----------------|---------------|
| **Kiosco / almacén** | Vender, caja, fiado, stock | Mucho ERP si completo | Sobrecargado |
| **Bar / restaurant** | Mesas, KDS, caja, platos | Hospitalidad + POS genérico | A medias; falta “turno de servicio” |
| **Veterinaria** | Agenda + HC + cobro | HC, vet, agenda (si rubro bien) | Falta flujo único “consulta → cobro” |
| **Gimnasio** | Membresías + cobro | Membresías | Débil en “cuota del día” en home |
| **Peluquería** | Agenda + cobro | Agenda + peluquería móvil | OK seed; menú aún ruidoso en completo |
| **Agro** | Balanza, contratos, liquidaciones | Sección Clavergrow grande | Solo si rubro agro_*; admin lo ve todo igual |
| **Taller / OT** | OT, repuestos, cobro | OT genérico / servicios | No es “fin de nicho” cerrado en nav |
| **Prestamista / concesionaria / importador** | Verticales especiales | Ítems con allowedRubros | En admin se filtran mal (ver §2.3) |

### 3.4 Topbar

Hoy:

- Buscar (Ctrl+K)  
- Pill de producto / trial  
- Caja abierta/cerrada si “parece” POS  
- AFIP si “parece” facturación  
- Notificaciones, tema, user  

**Falta por rubro/nicho:**

| Debería haber | Kiosco | Restaurant | Vet | Cobranza |
|---------------|--------|------------|-----|----------|
| Acción primaria | Abrir POS | Mesas | Próximo turno | Cobrar |
| KPI chip | Ventas hoy | Mesas abiertas | Turnos hoy | $ vencido |
| Alerta contextual | Caja sin cerrar | Demora cocina | Sin profesional | 5 morosos |

Sin eso, el topbar es **chrome genérico**, no “mando del negocio”.

---

## 4. Vallas (bloqueos) — de mayor a menor impacto

### V1 — Admin bypass de filtros de rubro  
**Síntoma:** dueño ve menú de todos los nichos.  
**Causa:** early return en `canRenderMenuItem` para dueno/admin.  
**Impacto:** test “como dueño” = siempre ERP completo.

### V2 — `modoLite` / rubro mal persistidos al signup  
**Síntoma:** entrás a kiosco y ves contabilidad, agro, IA, etc.  
**Causa:** alta con `completo` + `otro` o features todas en true.  
**Impacto:** onboarding no define experiencia.

### V3 — Catálogo monstruo en “Ventas” y “Principal”  
**Síntoma:** App Store, Almacén Rosario, Pack Contador, Cobranza aaS, Partner en la cara del kiosquero.  
**Causa:** ítems globales sin `skuKey` / sin pack / sin rubro.  
**Impacto:** “esto no es para mí”.

### V4 — No hay “IA de información del home” por nicho  
**Síntoma:** dashboard genérico o vacío.  
**Causa:** `quickActions` y `foco` de `getRubroUx` existen pero no son el home obligatorio.  
**Impacto:** no hay fin del día visible (vender / cobrar / atender).

### V5 — Doble navegación sin jerarquía  
**Síntoma:** sidebar ERP + shell tabs + mobile bottom nav + command palette con reglas distintas.  
**Causa:** product-shell vs sidebar-modules no unificados.  
**Impacto:** el mismo link en 3 lados con nombres distintos.

### V6 — Nicho “skin” vs nicho “motor”  
**Síntoma:** menú dice Veterinaria pero el flujo cobro/agenda no está cerrado.  
**Causa:** nav adelantada al depth del dominio (ya documentado en GO_LIVE / faltantes nichos).  
**Impacto:** botón coherente, función incompleta → “no está listo”.

### V7 — Topbar no lee la misma matriz que el sidebar  
**Síntoma:** badge caja en modo que no es caja; o sin acción primaria del rubro.  
**Causa:** listas hardcode de strings en `topbar.tsx`.  
**Impacto:** desconfianza sutil.

### V8 — Labels y secciones no se renombran fuera de demo  
**Síntoma:** “Hospitalidad” en un restaurant que dice “Mesas”.  
**Causa:** `getSectionLabelForRubro` / menu labels solo bien cableados en parte de industry templates.  
**Impacto:** lenguaje de oficina, no de oficio.

### V9 — Features/SKU en false/true sin UX de “activá esto”  
**Síntoma:** desaparece el menú o aparece vacío.  
**Causa:** filter silencioso sin empty-state “contratá / activá módulo”.  
**Impacto:** parece roto.

### V10 — Testing manual sin matriz de rúbrica  
**Síntoma:** “capaz no lo testee yo así”.  
**Causa:** no hay checklist por rubro en CI ni script de “login demo kiosco / vet / fiado”.  
**Impacto:** regresiones de nav eternas.

---

## 5. Qué le falta a cada nicho (fin funcional vs nav)

Escala: **Nav** (menú tiene sentido) · **Flujo** (se puede completar el trabajo) · **Home** (la mañana del oficio)

| Nicho / pack | Nav | Flujo core | Home del día | Seteo mínimo al activar |
|--------------|-----|------------|--------------|-------------------------|
| Fiado barrio | B+ | B | C | Clientes + límites fiado |
| POS kiosco | B | B+ | C | Productos + caja + medios pago |
| Almacén / ferretería | C (ruido) | B | C | Listas precio + stock |
| Cobranza | B | B- (WA) | C | CxC + canal WA |
| Restaurant | C+ | B- | D | Mesas + platos + caja |
| Vet | C+ | C | D | Profesionales + agenda + HC |
| Gym | C | C | D | Planes membresía + cobro |
| Peluquería | C+ | C+ | D | Servicios + agenda |
| Agro | B (si rubro ok) | Variable | D | Muy pesado; no pyme default |
| OT / taller | D | C | D | Tipos OT + repuestos |
| Contador multi-empresa | C | C | D | Links empresas cliente |

**Patrón:** la nav a veces va **adelante** del flujo; el home va **atrás** de ambos.

---

## 6. Mejoras lineales (orden recomendado)

Principio: **una matriz, un filtro, un home**. No reescribir el ERP.

### Fase 0 — Diagnóstico reproducible (3–5 días)

| # | Mejora | Done cuando |
|---|--------|-------------|
| 0.1 | Matriz Excel/MD: rubro × modoLite × top 12 hrefs esperados | 6 rubros + 4 packs documentados |
| 0.2 | Script o checklist manual: login demo por rubro y screenshot sidebar | 6 capturas en PR |
| 0.3 | Log debug opcional `?debugNav=1` → muestra por qué se ocultó cada ítem | Dev puede auditar sin adivinar |

### Fase 1 — Dejar de mentir al dueño (1–2 semanas) — **máximo ROI**

| # | Mejora | Archivos probables |
|---|--------|-------------------|
| 1.1 | **Quitar early-return admin** que salta `allowedRubros` (admin sigue viendo config, no todos los nichos) | `sidebar-filters.ts` |
| 1.2 | Alta / onboarding: si elige kiosco → `modoLite=pos` o pack fiado, **nunca** `completo` por default | signup, onboarding, provision |
| 1.3 | Mover App Store, Partner, Contador, Cobranza aaS, Hardware a sección “Claver / Crecer” solo si SKU o rol ops | `sidebar-modules.ts` |
| 1.4 | Almacén Rosario solo si rubro/pack almacén o feature flag | `sidebar-modules.ts` |
| 1.5 | Unificar `rubro` usado en todos los filtros (`effectiveRubro` everywhere) | `use-dashboard-shell.ts` |

### Fase 2 — Matriz canónica de navegación (2–3 semanas)

| # | Mejora | Resultado |
|---|--------|-----------|
| 2.1 | Crear `lib/comercial/nav-matrix.ts`: por `packId \| rubro` → `{ primary[], secondary[], hideSections[], topActions[], homeKpis[] }` | Una fuente de verdad |
| 2.2 | Sidebar lee matriz primero; catálogo global solo como fallback de “Más módulos” | Menú de 6–10 ítems core |
| 2.3 | Topbar lee `topActions` de la misma matriz | Botón “Abrir POS / Cobrar / Mesas” |
| 2.4 | Product shell tabs = subset de `primary[]` | Sin divergencia shell vs sidebar |
| 2.5 | Labels por rubro (`Mesas` no `Hospitalidad`) desde matriz | Lenguaje de oficio |

### Fase 3 — Home del día por fin funcional ✅ (Implementado)

| # | Mejora | Pack / rubro |
|---|--------|--------------|
| 3.1 | Widget home: ventas ayer + deuda + stock crítico | pos / kiosco / fiado |
| 3.2 | Widget home: turnos hoy + ausentes | vet / pelu / gym |
| 3.3 | Widget home: mesas abiertas + demora | restaurant |
| 3.4 | CTA primaria full-width mobile | todos |

Sin esto, aunque el menú esté limpio, **no se siente listo a la mañana**.

### Fase 4 — Seteo por rubro (onboarding real) ✅ (Implementado)

| # | Mejora |
|---|--------|
| 4.1 | Checklist post-alta: 4 maestros críticos de `getRubroUx(rubro).maestrosCriticos` |
| 4.2 | Bloquear “completar después” con % de listo en banner (no bloquear venta si pack lo permite) |
| 4.3 | Activar features del rubro en batch al elegir industria (hoy a veces quedan off/on al azar) |
| 4.4 | Empty states con “Para qué sirve este botón en tu rubro” |

### Fase 5 — Nicho: honestidad de profundidad (continuo)

| # | Mejora |
|---|--------|
| 5.1 | Badge en menú: `Listo` / `Piloto` / `Demo` por ruta (GO_LIVE packs) |
| 5.2 | Ocultar o degradar verticales `no_vender` del menú comercial |
| 5.3 | Un flujo E2E por nicho PRD antes de mostrar el ítem sin badge |

### Fase 6 — Calidad automatizada (1 semana + mantener)

| # | Mejora |
|---|--------|
| 6.1 | Test unitario: “kiosco + cajero no ve agro/vet” |
| 6.2 | Test: “fiado modoLite solo allowlist LITE_MENU_PATHS” |
| 6.3 | Test: “dueno + allowedRubros se respeta” post-fix 1.1 |
| 6.4 | Playwright smoke: 3 logins (fiado, pos, vet) → assert menú |

---

## 7. Matriz objetivo (ejemplo lineal — no exhaustiva)

### Kiosco / almacén (pack pos o fiado)

| Zona | Debe haber | No debe haber (default) |
|------|------------|-------------------------|
| Sidebar primary | POS, Caja, Productos, Clientes, Fiado | Contabilidad, Agro, Industria, Prestamos |
| Topbar | Caja estado, Abrir POS | AFIP si monotributo sin config |
| Home | Ventas ayer, fiado a cobrar, stock bajo | Gráficos enterprise vacíos |

### Restaurant

| Zona | Debe haber | No debe haber |
|------|------------|---------------|
| Sidebar | Mesas, KDS, Platos, Caja, Productos insumos | Fiado barrio como centro, Agro |
| Topbar | Mesas abiertas | — |
| Home | Servicio del turno | Dashboard contable |

### Veterinaria

| Zona | Debe haber | No debe haber |
|------|------------|---------------|
| Sidebar | Agenda, HC, Clientes/pacientes, Cobro, Stock farmacia | POS kiosco como #1, Almacén Rosario |
| Topbar | Próximo turno | Caja retail si no aplica |
| Home | Turnos de hoy | — |

### Cobranza-only

| Zona | Debe haber | No debe haber |
|------|------------|---------------|
| Sidebar | CxC, Clientes, Fiado, Recurrente | Compras, Stock pesado |
| Topbar | $ vencido | POS |
| Home | Cola a cobrar | — |

---

## 8. Respuesta a “¿no está listo o no lo testee así?”

| Hipótesis | Verdad parcial |
|-----------|----------------|
| “No tiene bien las funcionalidades” | **Sí en nichos profundos**; **no tanto** en fiado/POS core |
| “Seteo por rubro flojo” | **Sí** — onboarding no cierra menú+features+home |
| “No lo testee como dueño real” | **Sí** — y el bypass admin agrava la percepción |
| “Nav bar incorrecta por rubro” | **Sí** — capas en conflicto + completo por default |

**Conclusión:** el sistema está en estado **“plataforma con skins parciales”**, no **“producto por oficio”**.  
Para vender en Rosario / Barrio Justo, la mejora lineal **Fase 1 + 2 + 3** vale más que sumar otro módulo.

---

## 9. Definition of Done — “nav coherente por rubro”

Se puede decir “listo para demo comercial de un rubro” cuando:

1. Login del pack/rubro muestra **≤ 10 ítems primarios** alineados al fin del día.  
2. Dueño/admin **no** ve verticales ajenos sin activarlos.  
3. Topbar tiene **1 CTA primaria** del oficio.  
4. Home responde en 10 s: plata / deuda / agenda / mesas según rubro.  
5. Seteo mínimo del rubro es un checklist, no “andá a configuración a ciegas”.  
6. Hay test automatizado que rompe el PR si reaparece Agro en kiosco.

---

## 10. Orden de ataque sugerido (esta semana → este mes)

```text
Semana 1:  1.1 admin bypass + 1.2 default modoLite + 1.3 limpiar Principal/Ventas
Semana 2:  0.1 matriz + 2.1 nav-matrix v0 para kiosco, fiado, restaurant
Semana 3:  2.2–2.4 cablear sidebar/topbar/shell a la matriz
Semana 4:  3.1 home kiosco/fiado + 6.1–6.2 tests
Mes 2:     resto rubros PRD + badges profundidad + seteo checklist
```

---

## 11. Archivos clave para quien implemente

| Tema | Path |
|------|------|
| Menú | `lib/dashboard/sidebar-modules.ts` |
| Filtro rol/feature | `lib/dashboard/sidebar-filters.ts` |
| Lite packs | `lib/comercial/lite-sidebar.ts` |
| Allowlist rubro/demo | `lib/comercial/sidebar-rubro-filter.ts` |
| Shell tabs | `lib/comercial/product-shell.ts` |
| UX rubro (prioridad, quick actions) | `lib/onboarding/onboarding-ia.ts` |
| Composición runtime | `hooks/use-dashboard-shell.ts` |
| Topbar | `components/topbar.tsx` |
| Packs vendibles | `docs/GO_LIVE_PRD.md`, `lib/comercial/go-live-packs.ts` |
| Faltantes nicho | `docs/qa/FALTANTES_TECNICOS_NICHOS.md` |

---

## 12. Resumen en una frase

> El problema no es solo testing: **hay demasiadas reglas de menú y el dueño ve el ERP entero**.  
> La mejora lineal es **una matriz por rubro/pack → sidebar + topbar + home**,  
> arreglar el bypass de admin, default no-completo, y no mostrar botones de nichos que no son el fin funcional del comercio.

---

*Doc vivo: actualizar cuando exista `nav-matrix.ts` y tests de coherencia.*

---

## Anexo

Diagnóstico comercial de **inflación / Fiado Protegido / pricing IPC** movido a:

**[docs/comercial/INDICE_INFLACION_GATILLOS.md](../comercial/INDICE_INFLACION_GATILLOS.md)**


# Coherencia de navegaciÃ³n (sidebar + topbar) por rubro / nicho

**Fecha:** 2026-07-22  
**Contexto:** El producto se siente â€œno listoâ€: menÃºs de arriba e izquierda no reflejan bien el rubro, el seteo por nicho o el fin funcional de cada vertical.  
**Objetivo de este doc:** diagnosticar **vallas** (bloqueos reales) y proponer **mejoras lineales** (orden de trabajo sin reescritura total).

### Estado implementaciÃ³n (2026-07-22)

| Fase | Estado |
|------|--------|
| 1.1 Bypass admin/dueÃ±o vs `allowedRubros` | **Hecho** (`sidebar-filters.ts`) |
| 1.2 Default `modoLite=pos` altas | **Hecho** (schema, signup, Google, onboarding) |
| 1.3 Limpiar Principal / Platform | **Hecho** (`sidebar-modules.ts`) |
| 1.4 AlmacÃ©n solo rubros retail | **Hecho** |
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

## 1. OpiniÃ³n ejecutiva

No es solo â€œno lo testeaste bienâ€. Hay **deuda de producto de navegaciÃ³n**:

1. El sistema tiene **varias capas de filtro que se pisan** y no cuentan una sola historia al comerciante.  
2. En muchos casos reales (dueÃ±o/admin + `modoLite = completo` + rubro mal seteado o `otro`) el menÃº muestra **ERP completo** â†’ ruido, botones que no aplican, sensaciÃ³n de incompleto.  
3. Los **nichos** (vet, gym, restaurant, agroâ€¦) tienen Ã­tems sueltos y `allowedRubros`, pero **falta un â€œhome del nichoâ€** con KPIs, acciones y seteo guiado.  
4. El **topbar** casi no cambia por rubro (caja/AFIP por lista ad-hoc de `modoLite`); no refuerza el fin del dÃ­a del comercio.

**Veredicto:** la base tÃ©cnica de filtrado existe y es ambiciosa; la **coherencia percibida** falla porque no hay **una matriz canÃ³nica** â€œrubro/pack â†’ menÃº + home + top actions + seteo mÃ­nimoâ€.

---

## 2. CÃ³mo estÃ¡ armado hoy (mapa real del cÃ³digo)

### 2.1 Fuentes de verdad (demasiadas)

| Capa | Archivo | QuÃ© hace |
|------|---------|----------|
| CatÃ¡logo menÃº | `lib/dashboard/sidebar-modules.ts` | ~todas las secciones/Ã­tems del ERP |
| Rol + feature + SKU + rubro item | `lib/dashboard/sidebar-filters.ts` â†’ `canRenderMenuItem` | Oculta por rol, feature, sku, `allowedRubros`, monotributoâ€¦ |
| Prioridad por rubro | `lib/onboarding/onboarding-ia.ts` â†’ `sidebarPrioridad`, `quickActions` | Orden / foco UX por rubro |
| Allowlist industria/demo | `lib/comercial/sidebar-rubro-filter.ts` | Paths permitidos por template industria / present mode |
| Modo lite / pack | `lib/comercial/lite-sidebar.ts` | Allowlist corta: fiado, pos, cobranza, niche, servicios |
| Shell producto (tabs) | `lib/comercial/product-shell.ts` | Tabs tipo â€œappâ€ (Fiado, POS, CobrÃ¡) |
| OrquestaciÃ³n UI | `hooks/use-dashboard-shell.ts` | Combina todo lo anterior |
| Topbar | `components/topbar.tsx` | Badges caja/AFIP segÃºn `modoLite` + SKUs, no segÃºn matriz rubro |

### 2.2 Pipeline de filtrado (sidebar)

```text
DASHBOARD_SIDEBAR_MODULOS
  â†’ canRenderMenuItem (rol, features, SKU, allowedRubros, paÃ­s, monotributo)
  â†’ isMenuItemAllowedInModoLite (si modoLite â‰  completo)
  â†’ isMenuHrefVisibleInAllowlist (industria/demo)
  â†’ isModuloSectionVisible (secciÃ³n completa)
  â†’ ordenarModulosPorRubro
```

### 2.3 Bug / sesgo importante (admin ve â€œtodoâ€)

En `canRenderMenuItem`:

```ts
if (["administrador", "admin", "dueno"].includes(role || "")) return true
```

Eso ocurre **antes** de evaluar `allowedRubros` / varios filtros de Ã­tem.  
**Efecto:** el dueÃ±o del kiosco (rol `dueno` / `administrador`) ve Ã­tems de veterinaria, agro, prestamos, etc. **salvo** que `modoLite` o allowlist los recorten.

Si el alta deja `modoLite = completo` y `rubro = otro` (o no se cargÃ³ rubro):

> **Sidebar = ERP enterprise** â†’ â€œel sistema no estÃ¡ listo / no es para mÃ­â€.

Eso explica mucho de la sensaciÃ³n al testear â€œcomo dueÃ±oâ€.

### 2.4 Inconsistencia `rubro` vs `effectiveRubro`

- Allowlist / visibilidad de secciÃ³n usan a veces `effectiveRubro` (demo industry).  
- `canRenderMenuItem` recibe `rubro` de empresa.  

En demos o onboarding a medias, **menÃº y labels no coinciden** con lo que el usuario cree que eligiÃ³.

---

## 3. Coherencia por tipo de experiencia

### 3.1 Pack / modo lite (fiado, pos, cobranza) â€” la mÃ¡s coherente

| Pack | MenÃº lateral | Shell tabs | Fin funcional | Estado |
|------|--------------|------------|---------------|--------|
| **fiado** | Corto (fiado, pos, caja, productos, clientes, CxC) | Libreta / Mostrador / Clientes | Anotar y cobrar fiado | Buena base; falta home â€œquiÃ©n debe hoyâ€ |
| **pos** | POS, caja, productos, clientes, fiado | Mostrador / Caja / Productos | Vender y cerrar caja | Buena; AlmacÃ©n Rosario a veces ensucia |
| **cobranza** | CxC, clientes, fiado, recurrente | Cobros / Clientes | Cobrar | OK; WA/Leo no siempre visibles |
| **servicios** | Presupuestos, ventas, agenda | Parcial | Presu â†’ factura â†’ cobro | A medias |
| **niche** | nicho, apps, agenda, HC, fiado | turnos-ish | Agenda del vertical | FrÃ¡gil: mezcla genÃ©rico + nicho |
| **completo** | Casi todo | No hay shell | â€œERPâ€ | **Peor UX comercial** si el cliente es pyme de un rubro |

### 3.2 Rubro con `sidebarPrioridad` (sin allowlist)

Cuando no hay industry template / present mode y `modoLite === completo`, se ocultan secciones por `moduloKey` âˆ‰ prioridad del rubro.

**Problemas:**

- Secciones sin `moduloKey` (ej. Fiscal, Claver Nicho, Principal) se comportan distinto.  
- Ãtems **dentro** de â€œVentasâ€ (POS + AlmacÃ©n + RetenciÃ³n LTV + App Store) no se reordenan al fin del rubro.  
- Labels genÃ©ricos (â€œFacturaciÃ³nâ€) no se renombran al lenguaje del rubro (salvo demos con `getMenuLabelForRubro`).

### 3.3 Nicho vertical (vet, gym, restaurant, agroâ€¦)

| Nicho | Fin funcional ideal | QuÃ© hay en nav | QuÃ© se siente |
|-------|---------------------|----------------|---------------|
| **Kiosco / almacÃ©n** | Vender, caja, fiado, stock | Mucho ERP si completo | Sobrecargado |
| **Bar / restaurant** | Mesas, KDS, caja, platos | Hospitalidad + POS genÃ©rico | A medias; falta â€œturno de servicioâ€ |
| **Veterinaria** | Agenda + HC + cobro | HC, vet, agenda (si rubro bien) | Falta flujo Ãºnico â€œconsulta â†’ cobroâ€ |
| **Gimnasio** | MembresÃ­as + cobro | MembresÃ­as | DÃ©bil en â€œcuota del dÃ­aâ€ en home |
| **PeluquerÃ­a** | Agenda + cobro | Agenda + peluquerÃ­a mÃ³vil | OK seed; menÃº aÃºn ruidoso en completo |
| **Agro** | Balanza, contratos, liquidaciones | SecciÃ³n Clavergrow grande | Solo si rubro agro_*; admin lo ve todo igual |
| **Taller / OT** | OT, repuestos, cobro | OT genÃ©rico / servicios | No es â€œfin de nichoâ€ cerrado en nav |
| **Prestamista / concesionaria / importador** | Verticales especiales | Ãtems con allowedRubros | En admin se filtran mal (ver Â§2.3) |

### 3.4 Topbar

Hoy:

- Buscar (Ctrl+K)  
- Pill de producto / trial  
- Caja abierta/cerrada si â€œpareceâ€ POS  
- AFIP si â€œpareceâ€ facturaciÃ³n  
- Notificaciones, tema, user  

**Falta por rubro/nicho:**

| DeberÃ­a haber | Kiosco | Restaurant | Vet | Cobranza |
|---------------|--------|------------|-----|----------|
| AcciÃ³n primaria | Abrir POS | Mesas | PrÃ³ximo turno | Cobrar |
| KPI chip | Ventas hoy | Mesas abiertas | Turnos hoy | $ vencido |
| Alerta contextual | Caja sin cerrar | Demora cocina | Sin profesional | 5 morosos |

Sin eso, el topbar es **chrome genÃ©rico**, no â€œmando del negocioâ€.

---

## 4. Vallas (bloqueos) â€” de mayor a menor impacto

### V1 â€” Admin bypass de filtros de rubro  
**SÃ­ntoma:** dueÃ±o ve menÃº de todos los nichos.  
**Causa:** early return en `canRenderMenuItem` para dueno/admin.  
**Impacto:** test â€œcomo dueÃ±oâ€ = siempre ERP completo.

### V2 â€” `modoLite` / rubro mal persistidos al signup  
**SÃ­ntoma:** entrÃ¡s a kiosco y ves contabilidad, agro, IA, etc.  
**Causa:** alta con `completo` + `otro` o features todas en true.  
**Impacto:** onboarding no define experiencia.

### V3 â€” CatÃ¡logo monstruo en â€œVentasâ€ y â€œPrincipalâ€  
**SÃ­ntoma:** App Store, AlmacÃ©n Rosario, Pack Contador, Cobranza aaS, Partner en la cara del kiosquero.  
**Causa:** Ã­tems globales sin `skuKey` / sin pack / sin rubro.  
**Impacto:** â€œesto no es para mÃ­â€.

### V4 â€” No hay â€œIA de informaciÃ³n del homeâ€ por nicho  
**SÃ­ntoma:** dashboard genÃ©rico o vacÃ­o.  
**Causa:** `quickActions` y `foco` de `getRubroUx` existen pero no son el home obligatorio.  
**Impacto:** no hay fin del dÃ­a visible (vender / cobrar / atender).

### V5 â€” Doble navegaciÃ³n sin jerarquÃ­a  
**SÃ­ntoma:** sidebar ERP + shell tabs + mobile bottom nav + command palette con reglas distintas.  
**Causa:** product-shell vs sidebar-modules no unificados.  
**Impacto:** el mismo link en 3 lados con nombres distintos.

### V6 â€” Nicho â€œskinâ€ vs nicho â€œmotorâ€  
**SÃ­ntoma:** menÃº dice Veterinaria pero el flujo cobro/agenda no estÃ¡ cerrado.  
**Causa:** nav adelantada al depth del dominio (ya documentado en GO_LIVE / faltantes nichos).  
**Impacto:** botÃ³n coherente, funciÃ³n incompleta â†’ â€œno estÃ¡ listoâ€.

### V7 â€” Topbar no lee la misma matriz que el sidebar  
**SÃ­ntoma:** badge caja en modo que no es caja; o sin acciÃ³n primaria del rubro.  
**Causa:** listas hardcode de strings en `topbar.tsx`.  
**Impacto:** desconfianza sutil.

### V8 â€” Labels y secciones no se renombran fuera de demo  
**SÃ­ntoma:** â€œHospitalidadâ€ en un restaurant que dice â€œMesasâ€.  
**Causa:** `getSectionLabelForRubro` / menu labels solo bien cableados en parte de industry templates.  
**Impacto:** lenguaje de oficina, no de oficio.

### V9 â€” Features/SKU en false/true sin UX de â€œactivÃ¡ estoâ€  
**SÃ­ntoma:** desaparece el menÃº o aparece vacÃ­o.  
**Causa:** filter silencioso sin empty-state â€œcontratÃ¡ / activÃ¡ mÃ³duloâ€.  
**Impacto:** parece roto.

### V10 â€” Testing manual sin matriz de rÃºbrica  
**SÃ­ntoma:** â€œcapaz no lo testee yo asÃ­â€.  
**Causa:** no hay checklist por rubro en CI ni script de â€œlogin demo kiosco / vet / fiadoâ€.  
**Impacto:** regresiones de nav eternas.

---

## 5. QuÃ© le falta a cada nicho (fin funcional vs nav)

Escala: **Nav** (menÃº tiene sentido) Â· **Flujo** (se puede completar el trabajo) Â· **Home** (la maÃ±ana del oficio)

| Nicho / pack | Nav | Flujo core | Home del dÃ­a | Seteo mÃ­nimo al activar |
|--------------|-----|------------|--------------|-------------------------|
| Fiado barrio | B+ | B | C | Clientes + lÃ­mites fiado |
| POS kiosco | B | B+ | C | Productos + caja + medios pago |
| AlmacÃ©n / ferreterÃ­a | C (ruido) | B | C | Listas precio + stock |
| Cobranza | B | B- (WA) | C | CxC + canal WA |
| Restaurant | C+ | B- | D | Mesas + platos + caja |
| Vet | C+ | C | D | Profesionales + agenda + HC |
| Gym | C | C | D | Planes membresÃ­a + cobro |
| PeluquerÃ­a | C+ | C+ | D | Servicios + agenda |
| Agro | B (si rubro ok) | Variable | D | Muy pesado; no pyme default |
| OT / taller | D | C | D | Tipos OT + repuestos |
| Contador multi-empresa | C | C | D | Links empresas cliente |

**PatrÃ³n:** la nav a veces va **adelante** del flujo; el home va **atrÃ¡s** de ambos.

---

## 6. Mejoras lineales (orden recomendado)

Principio: **una matriz, un filtro, un home**. No reescribir el ERP.

### Fase 0 â€” DiagnÃ³stico reproducible (3â€“5 dÃ­as)

| # | Mejora | Done cuando |
|---|--------|-------------|
| 0.1 | Matriz Excel/MD: rubro Ã— modoLite Ã— top 12 hrefs esperados | 6 rubros + 4 packs documentados |
| 0.2 | Script o checklist manual: login demo por rubro y screenshot sidebar | 6 capturas en PR |
| 0.3 | Log debug opcional `?debugNav=1` â†’ muestra por quÃ© se ocultÃ³ cada Ã­tem | Dev puede auditar sin adivinar |

### Fase 1 â€” Dejar de mentir al dueÃ±o (1â€“2 semanas) â€” **mÃ¡ximo ROI**

| # | Mejora | Archivos probables |
|---|--------|-------------------|
| 1.1 | **Quitar early-return admin** que salta `allowedRubros` (admin sigue viendo config, no todos los nichos) | `sidebar-filters.ts` |
| 1.2 | Alta / onboarding: si elige kiosco â†’ `modoLite=pos` o pack fiado, **nunca** `completo` por default | signup, onboarding, provision |
| 1.3 | Mover App Store, Partner, Contador, Cobranza aaS, Hardware a secciÃ³n â€œClaver / Crecerâ€ solo si SKU o rol ops | `sidebar-modules.ts` |
| 1.4 | AlmacÃ©n Rosario solo si rubro/pack almacÃ©n o feature flag | `sidebar-modules.ts` |
| 1.5 | Unificar `rubro` usado en todos los filtros (`effectiveRubro` everywhere) | `use-dashboard-shell.ts` |

### Fase 2 â€” Matriz canÃ³nica de navegaciÃ³n (2â€“3 semanas)

| # | Mejora | Resultado |
|---|--------|-----------|
| 2.1 | Crear `lib/comercial/nav-matrix.ts`: por `packId \| rubro` â†’ `{ primary[], secondary[], hideSections[], topActions[], homeKpis[] }` | Una fuente de verdad |
| 2.2 | Sidebar lee matriz primero; catÃ¡logo global solo como fallback de â€œMÃ¡s mÃ³dulosâ€ | MenÃº de 6â€“10 Ã­tems core |
| 2.3 | Topbar lee `topActions` de la misma matriz | BotÃ³n â€œAbrir POS / Cobrar / Mesasâ€ |
| 2.4 | Product shell tabs = subset de `primary[]` | Sin divergencia shell vs sidebar |
| 2.5 | Labels por rubro (`Mesas` no `Hospitalidad`) desde matriz | Lenguaje de oficio |

### Fase 3 â€” Home del dÃ­a por fin funcional âœ… (Implementado)

| # | Mejora | Pack / rubro |
|---|--------|--------------|
| 3.1 | Widget home: ventas ayer + deuda + stock crÃ­tico | pos / kiosco / fiado |
| 3.2 | Widget home: turnos hoy + ausentes | vet / pelu / gym |
| 3.3 | Widget home: mesas abiertas + demora | restaurant |
| 3.4 | CTA primaria full-width mobile | todos |

Sin esto, aunque el menÃº estÃ© limpio, **no se siente listo a la maÃ±ana**.

### Fase 4 â€” Seteo por rubro (onboarding real) âœ… (Implementado)

| # | Mejora |
|---|--------|
| 4.1 | Checklist post-alta: 4 maestros crÃ­ticos de `getRubroUx(rubro).maestrosCriticos` |
| 4.2 | Bloquear â€œcompletar despuÃ©sâ€ con % de listo en banner (no bloquear venta si pack lo permite) |
| 4.3 | Activar features del rubro en batch al elegir industria (hoy a veces quedan off/on al azar) |
| 4.4 | Empty states con â€œPara quÃ© sirve este botÃ³n en tu rubroâ€ |

### Fase 5 â€” Nicho: honestidad de profundidad (continuo)

| # | Mejora |
|---|--------|
| 5.1 | Badge en menÃº: `Listo` / `Piloto` / `Demo` por ruta (GO_LIVE packs) |
| 5.2 | Ocultar o degradar verticales `no_vender` del menÃº comercial |
| 5.3 | Un flujo E2E por nicho PRD antes de mostrar el Ã­tem sin badge |

### Fase 6 â€” Calidad automatizada (1 semana + mantener)

| # | Mejora |
|---|--------|
| 6.1 | Test unitario: â€œkiosco + cajero no ve agro/vetâ€ |
| 6.2 | Test: â€œfiado modoLite solo allowlist LITE_MENU_PATHSâ€ |
| 6.3 | Test: â€œdueno + allowedRubros se respetaâ€ post-fix 1.1 |
| 6.4 | Playwright smoke: 3 logins (fiado, pos, vet) â†’ assert menÃº |

---

## 7. Matriz objetivo (ejemplo lineal â€” no exhaustiva)

### Kiosco / almacÃ©n (pack pos o fiado)

| Zona | Debe haber | No debe haber (default) |
|------|------------|-------------------------|
| Sidebar primary | POS, Caja, Productos, Clientes, Fiado | Contabilidad, Agro, Industria, Prestamos |
| Topbar | Caja estado, Abrir POS | AFIP si monotributo sin config |
| Home | Ventas ayer, fiado a cobrar, stock bajo | GrÃ¡ficos enterprise vacÃ­os |

### Restaurant

| Zona | Debe haber | No debe haber |
|------|------------|---------------|
| Sidebar | Mesas, KDS, Platos, Caja, Productos insumos | Fiado barrio como centro, Agro |
| Topbar | Mesas abiertas | â€” |
| Home | Servicio del turno | Dashboard contable |

### Veterinaria

| Zona | Debe haber | No debe haber |
|------|------------|---------------|
| Sidebar | Agenda, HC, Clientes/pacientes, Cobro, Stock farmacia | POS kiosco como #1, AlmacÃ©n Rosario |
| Topbar | PrÃ³ximo turno | Caja retail si no aplica |
| Home | Turnos de hoy | â€” |

### Cobranza-only

| Zona | Debe haber | No debe haber |
|------|------------|---------------|
| Sidebar | CxC, Clientes, Fiado, Recurrente | Compras, Stock pesado |
| Topbar | $ vencido | POS |
| Home | Cola a cobrar | â€” |

---

## 8. Respuesta a â€œÂ¿no estÃ¡ listo o no lo testee asÃ­?â€

| HipÃ³tesis | Verdad parcial |
|-----------|----------------|
| â€œNo tiene bien las funcionalidadesâ€ | **SÃ­ en nichos profundos**; **no tanto** en fiado/POS core |
| â€œSeteo por rubro flojoâ€ | **SÃ­** â€” onboarding no cierra menÃº+features+home |
| â€œNo lo testee como dueÃ±o realâ€ | **SÃ­** â€” y el bypass admin agrava la percepciÃ³n |
| â€œNav bar incorrecta por rubroâ€ | **SÃ­** â€” capas en conflicto + completo por default |

**ConclusiÃ³n:** el sistema estÃ¡ en estado **â€œplataforma con skins parcialesâ€**, no **â€œproducto por oficioâ€**.  
Para vender en Rosario / Barrio Justo, la mejora lineal **Fase 1 + 2 + 3** vale mÃ¡s que sumar otro mÃ³dulo.

---

## 9. Definition of Done â€” â€œnav coherente por rubroâ€

Se puede decir â€œlisto para demo comercial de un rubroâ€ cuando:

1. Login del pack/rubro muestra **â‰¤ 10 Ã­tems primarios** alineados al fin del dÃ­a.  
2. DueÃ±o/admin **no** ve verticales ajenos sin activarlos.  
3. Topbar tiene **1 CTA primaria** del oficio.  
4. Home responde en 10 s: plata / deuda / agenda / mesas segÃºn rubro.  
5. Seteo mÃ­nimo del rubro es un checklist, no â€œandÃ¡ a configuraciÃ³n a ciegasâ€.  
6. Hay test automatizado que rompe el PR si reaparece Agro en kiosco.

---

## 10. Orden de ataque sugerido (esta semana â†’ este mes)

```text
Semana 1:  1.1 admin bypass + 1.2 default modoLite + 1.3 limpiar Principal/Ventas
Semana 2:  0.1 matriz + 2.1 nav-matrix v0 para kiosco, fiado, restaurant
Semana 3:  2.2â€“2.4 cablear sidebar/topbar/shell a la matriz
Semana 4:  3.1 home kiosco/fiado + 6.1â€“6.2 tests
Mes 2:     resto rubros PRD + badges profundidad + seteo checklist
```

---

## 11. Archivos clave para quien implemente

| Tema | Path |
|------|------|
| MenÃº | `lib/dashboard/sidebar-modules.ts` |
| Filtro rol/feature | `lib/dashboard/sidebar-filters.ts` |
| Lite packs | `lib/comercial/lite-sidebar.ts` |
| Allowlist rubro/demo | `lib/comercial/sidebar-rubro-filter.ts` |
| Shell tabs | `lib/comercial/product-shell.ts` |
| UX rubro (prioridad, quick actions) | `lib/onboarding/onboarding-ia.ts` |
| ComposiciÃ³n runtime | `hooks/use-dashboard-shell.ts` |
| Topbar | `components/topbar.tsx` |
| Packs vendibles | `docs/GO_LIVE_PRD.md`, `lib/comercial/go-live-packs.ts` |
| Faltantes nicho | `docs/qa/FALTANTES_TECNICOS_NICHOS.md` |

---

## 12. Resumen en una frase

> El problema no es solo testing: **hay demasiadas reglas de menÃº y el dueÃ±o ve el ERP entero**.  
> La mejora lineal es **una matriz por rubro/pack â†’ sidebar + topbar + home**,  
> arreglar el bypass de admin, default no-completo, y no mostrar botones de nichos que no son el fin funcional del comercio.

---

*Doc vivo: actualizar cuando exista `nav-matrix.ts` y tests de coherencia.*

---

## Anexo

Diagnóstico comercial de **inflación / Fiado Protegido / pricing IPC** movido a:

**[docs/comercial/INDICE_INFLACION_GATILLOS.md](../comercial/INDICE_INFLACION_GATILLOS.md)**


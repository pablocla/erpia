# Huecos de nichos — briefing ejecutable para Gemini (iterar, corregir, aportar plus)

> **Fecha:** 2026-07-18 · **Repo:** pos-system-argentina (Next.js 15 + Prisma + multi-tenant)  
> **Idioma:** es-AR · **Moneda:** ARS · **Piso suscripción pago:** $10.000/mes (ancla fiado $0)  
> **Este archivo es a la vez:** (A) mapa de huecos y (B) **prompt operativo** para que Gemini itere sección por sección, implemente, teste y deje valor plus.

---

# PARTE A — PROMPT MAESTRO PARA GEMINI

Copiá desde aquí hasta el final de la **Parte A** (o pasale el archivo completo) y pedile:  
*“Ejecutá la Parte A de este documento. Iterá por todas las secciones de la Parte B. No saltees. Cada iteración: código + tests + actualizar % y checklist de este MD.”*

---

## A0. Rol y misión

Sos **Senior Full-Stack + Product Engineer** del ERP Claver Argentina.

**Misión:** cerrar huecos de nichos listados en la **Parte B**, en orden de prioridad, de forma que:

1. El **lema / wowMoment** del catálogo tenga un **botón o flujo con el mismo nombre de dominio** en la UI.
2. Haya **búsqueda**, **filtros** y **acciones rápidas por fila** (cobrar, WA, link MP, listo, editar).
3. No se invente un producto nuevo por nicho si alcanza **mejorar el shell** (`cuotas` / `movimientos`) o un **redirect** al ERP correcto.
4. Cada cambio aporte **plus de valor** (no solo “arreglar el bug”): empty states, demo seed, copy es-AR, tests, doc actualizada.

**Reglas de oro:**

- Multi-tenant: siempre `getAuthContext` + `whereEmpresa` / `empresaId`.
- Convención deuda: `saldoCuentaCorriente < 0` = debe (igual fiado).
- No vender humo: si el proceso del lema no tiene UI, **no** marcar tier `implementado` sin botones.
- No implementar en esta pasada: portal inquilino full, sync Zonaprop, ICL/IPC, comisiones, OT mantenimiento inmobiliario, apps nativas.
- Preferir **shell v2** reutilizable a 15 paneles custom.
- Al terminar cada iteración: tests Vitest verdes en el área tocada y **actualizar este MD** (§B2 % y §B11 checklist).

---

## A1. Protocolo de iteración (obligatorio)

Trabajá en **olas**. No pases a la siguiente ola sin cumplir el DoD de la actual.

| Ola | Alcance | DoD mínimo |
|-----|---------|------------|
| **Ola 0** | Auditoría de código vs Parte B (confirmar paths, no reinventar) | Lista “ya existe / falta” en §B12 |
| **Ola 1** | **Shell cuotas v2** (club, escuela, gym, mutuo, colonia, peña + genérico) | §A2.1 completo |
| **Ola 2** | **Shell movimientos v2** (plancha, taller, delivery, remis, feria, obras, acopio, salón, garantia) | §A2.2 completo |
| **Ola 3** | **Redirects y unificación** (cancha, peluquería, consultorio, vet, prestamista copy) | §A2.3 completo |
| **Ola 4** | **Plus vertical** (1–2 procesos estrella: cancha seña, plancha cobro retiro, gym morosos) | §A2.4 |
| **Ola 5** | Hardening: seeds demo, tests, catálogo lemas alineados, marketplace tier | §A2.5 |
| **Ola 6** | Recorrer scorecard §B2 y **subir %** solo donde el DoD se cumplió; reescribir §B3/B8 | MD actualizado + resumen final |

**Formato de salida al cerrar cada ola (para el humano):**

```markdown
### Ola N — [nombre]
- Cambios: (archivos clave)
- Tests: (comando + resultado)
- Plus de valor: (qué mejoró la experiencia más allá del mínimo)
- % nichos impactados: (tabla id → % antes → % después)
- Deuda técnica residual: (1–3 bullets)
- Siguiente ola: lista
```

---

## A2. Especificaciones de implementación por ola

### A2.1 Ola 1 — Shell CUOTAS v2

**Archivos base:**

- UI: `components/niche/niche-app-shell.tsx` → `NicheCuotasPanel`
- API: `app/api/niche/[appId]/route.ts`
- Service: `lib/niche/cuotas-service.ts`
- Catálogo: `lib/niche/niche-apps-catalog.ts` (labels por appId)

**Implementar (mínimo + plus):**

| # | Feature | Plus de valor |
|---|---------|---------------|
| 1 | **Búsqueda** por nombre socio / teléfono (cliente-side o query API) | Placeholder es-AR, debounce 200ms |
| 2 | **Filtro** estado: todas / pendientes / pagadas + filtro período mes | Contador en chips |
| 3 | Por fila pendiente: **Cobrar** (marcar pagado + ajustar saldo correcto: deuda↓) | Toast con monto |
| 4 | Por fila: **WA** (encolar plantilla del app) | Si no hay tel, toast claro |
| 5 | Por fila: **Link MP** (reusar `resolverLinkPagoDeudor` / CxC si existe) | Copiar al clipboard |
| 6 | Header: **Avisar morosos** (masivo solo pendientes con tel) | Preview “N destinatarios” |
| 7 | Header: **Cuota del mes a todos** (socios/membresías sin cuota del período) | Confirm dialog |
| 8 | Empty state 3 pasos con `app.wowMoment` y CTA | Ilustración simple o icono |
| 9 | Labels por appId (Club=socio, Escuela=familia, Gym=miembro) | `getNicheLabels(appId)` |
| 10 | Tests Vitest: registrar cuota, marcar pagado, morosos list | `__tests__/niche/cuotas-shell.test.ts` |

**Apps impactadas:** club, escuela, gimnasio, mutuo, colonia, pena (+ cualquier `engine: cuotas`).

**Convención saldo al registrar cuota pendiente:**  
deuda del cliente → `saldoCuentaCorriente` **decrement** (hacia negativo).  
Al marcar pagado → **increment** (reduce deuda) o usar cobrosService si hay CxC.

> Nota: revisar `cuotas-service.ts` actual: puede tener el signo invertido respecto a fiado. **Corregir al estándar fiado** en esta ola.

---

### A2.2 Ola 2 — Shell MOVIMIENTOS v2

**Archivos base:** mismo shell → `NicheMovimientosPanel` + `lib/niche/movimientos-service.ts`

| # | Feature | Plus |
|---|---------|------|
| 1 | **Categorías** del `app.categorias` como select (no solo texto libre) | Defaults por appId |
| 2 | **Estados de dominio** por app (ver tabla abajo) | Badge colores semáforo |
| 3 | Búsqueda título/cliente + filtro estado | Persist filtro en sessionStorage |
| 4 | Acciones por fila según estado (Listo / Cobrado / Entregado / En proceso) | Tooltips |
| 5 | **Cobrar al retirar/listo** opcional (recibo o marcar pagado + link MP) | Switch en config simple |
| 6 | WA al pasar a “listo” (ya parcial en plancha) → **todos** los apps con cliente+tel | Idempotente |
| 7 | Número de ticket/OT auto (`TK-000123`) en metadata | Mostrar en lista |
| 8 | Empty state con proceso del lema en 3 pasos | Copy por appId |
| 9 | Tests de estados y marcar_listo | Vitest |

**Mapa de estados sugeridos (plus de dominio):**

| appId | Estados |
|-------|---------|
| plancha | recibido → proceso → listo → entregado |
| taller | ingreso → presupuesto → reparacion → listo → entregado |
| delivery | pedido → en_camino → entregado → cerrado |
| remis | viaje → cerrado |
| feria | venta / gasto / cierre |
| obras | jornal / adelanto / liquidacion |
| acopio | entrega / liquidacion |
| salon | seña / evento / saldo |
| garantia | contrato / renovacion / aviso |

Si el backend solo tiene string `estado`, guardá el vocabulario en `metadata.workflow` o normalizá a enum libre documentado.

---

### A2.3 Ola 3 — Redirects y alineación catálogo ↔ ERP

| appId | Acción | Plus |
|-------|--------|------|
| **peluqueria** | `redirectPath: "/dashboard/peluqueria"` o `/dashboard/agenda` + banner cobro | No dejar shell genérico |
| **cancha** | Cambiar `engine` a `agenda` **o** panel seña+turno mínimo | Si agenda: goldenPath `/dashboard/agenda` |
| **consultorio** | Ya redirect agenda; **plus:** CTA “Cobrar turno” en agenda o deep link POS | — |
| **veterinaria** | Ya HC; **plus:** link a POS y agenda en header de experiencia | — |
| **garantia** | Redirect a `/dashboard/nicho/inmobiliaria` con tab contratos | Evitar duplicado |
| **prestamista** | Mantener fiado; **plus:** copy en UI “Préstamo / cuotas” si appId | — |

Actualizar `niche-apps-catalog.ts` y tests de catálogo/coherencia.

---

### A2.4 Ola 4 — Plus vertical (estrella, no todo a la vez)

Elegí **máximo 3** en esta ola (prioridad comercial calle):

1. **Cancha:** alta reserva (fecha/hora) + seña monto + estado seña/pagado (puede reusar agenda + movimiento).  
2. **Plancha:** búsqueda por #ticket o teléfono + cobro al “entregado”.  
3. **Club o Gym:** “Cobrar cuota” crea/usa CxC + link MP (reusar deudor-pago-link).

Cada uno debe quedar **demostrable en 60 segundos** en demo.

---

### A2.5 Ola 5 — Hardening y plus comercial

| # | Tarea |
|---|--------|
| 1 | Seeds demo por industryId de nichos débiles (mínimo 3 registros con sentido) en `industry-demo-seeds.ts` |
| 2 | `tier` en enganche/marketplace: genéricos sin DoD → `parcial` o badge “beta” |
| 3 | Tests smoke: ` __tests__/niche/* ` |
| 4 | Actualizar `docs/comercial/CONSORCIOS_INMOBILIARIA_MVP.md` si toca cobros |
| 5 | Actualizar **esta Parte B** con nuevos % y botones resueltos |
| 6 | README corto en `docs/comercial/NICHOS_SHELL_V2.md` (cómo se configura labels/estados) |

---

## A3. Definition of Done global (antes de decir “listo”)

- [ ] Olas 1–2 hechas (shells v2 en producción de código)
- [ ] Ola 3 redirects sin pantallas engañosas
- [ ] Al menos 1 plus de Ola 4 demoable
- [ ] `npx vitest run __tests__/niche __tests__/consorcios __tests__/inmobiliaria` sin fallos nuevos
- [ ] Ningún lema de caballo de calle (`CABALLOS_CALLE_APP_IDS`) con proceso **0 botones de dominio**
- [ ] Este MD: §B2 actualizado, §B8 con checks en items resueltos, §B12 log de olas

---

## A4. Restricciones técnicas del repo

```
Stack: Next.js App Router, TypeScript, Prisma, Zustand, SWR
Auth API: getAuthContext + whereEmpresa
Fiado/CxC/MP: lib/fiado, lib/cobros, lib/mercadopago/deudor-pago-link.ts
Patterns: Agents.md / AGENTS.md
No: exploits, no borrar datos de prod, no force-push
```

**Priorizar lectura antes de reescribir:**

1. `components/niche/niche-app-shell.tsx`  
2. `lib/niche/cuotas-service.ts` / `movimientos-service.ts`  
3. `app/api/niche/[appId]/route.ts`  
4. `lib/niche/niche-apps-catalog.ts`  
5. Consorcios/inmo como **referencia de calidad** de botones:  
   `niche-consorcios-panel.tsx`, `niche-inmobiliaria-panel.tsx`

---

## A5. Plus de valor obligatorio (no negociable en cada PR/ola)

En cada ola, además del mínimo, incluí **al menos 2** de:

- Empty state con pasos 1-2-3 del rubro  
- Toasts y errores en español claro  
- Contadores en chips de filtro  
- Deep link a `/dashboard/cuentas-cobrar` o `/dashboard/clientes`  
- `data-testid` en botones críticos (e2e futuro)  
- Seed demo  
- Log de sistema al cobrar/avisar (auditoría)  
- Mobile-friendly (botones touch en filas)

---

# PARTE B — MAPA DE HUECOS (fuente de verdad del trabajo)

> Gemini: usá esta parte como backlog. **No borres** el diagnóstico histórico; **marcá** lo resuelto con ✅ y actualizá % en §B2.

---

## B1. Cómo se montan los nichos hoy

| Motor (`engine`) | UI real | Qué puede hacer el usuario |
|------------------|---------|----------------------------|
| `consorcio` | Panel **custom** | Edificio, UF, gastos, liquidar, morosos, cobro, WA, link MP, PDF |
| `libreta` | Redirect → **Fiado** | Deudores, anotar, cobrar (fuerte) |
| `agenda` | Redirect → **Agenda / HC** | Turnos o fichas (parcial vertical) |
| `cuotas` | **Shell genérico** | Alta cuota, lista, KPIs; **sin cobro/WA/link en cada fila** |
| `movimientos` | **Shell genérico** | Alta + “Cobrado” / “Listo”(plancha) + WA masivo; **sin búsqueda ni proceso de rubro** |

**Conclusión estructural:** ~70% del catálogo es **skin de marketing** sobre 2 shells genéricos. Hay botones genéricos, pero el wow del lema **no tiene nombre de dominio** (no dice “Cierre chofer”, dice “Cobrado”).

```
Vendido: "Cierre del chofer" / "Nueva orden de taller" / "Seña de cancha"
UI real: "Concepto + monto" + badge + Cobrado/Listo  (sin kg, sin seña, sin calendario)
```

---

## B2. Scorecard por nicho (% funcional estimado)

**Gemini:** tras cada ola, actualizá la columna `% est.` y agregá nota en “Debilidad” si quedó resuelta (✅).

Escala:

| % | Significado |
|---|------------|
| **80–100** | Flujo de punta a punta usable, botones de dominio, cobro/aviso |
| **50–79** | Base usable, faltan acciones rápidas y procesos clave |
| **25–49** | Shell genérico / redirect; proceso se improvisa |
| **0–24** | Casi solo catálogo + lema |

| # | Nicho | AppId | Engine | % est. | Fortaleza | Debilidad principal | Meta post-olas |
|---|-------|-------|--------|--------|-----------|---------------------|----------------|
| 1 | **Consorcios** | consorcios | consorcio | **82** | Liquidar, morosos, cobro, WA, MP, PDF | Portal inquilino, fondo reserva | 85+ (mantener) |
| 2 | **Inmobiliaria** | inmobiliaria | custom | **72** | Propiedades, contratos, facturar mes, cobro/link | OS, portales, ICL | 75+ |
| 3 | **Fiado / Prestamista** | prestamista | libreta | **85** | Libreta completa | Plan cuotas interés | 88 con copy |
| 4 | **Consultorio** | consultorio | agenda | **55** | Agenda | Cobro al completar | **70** Ola 3–4 |
| 5 | **Veterinaria** | veterinaria | agenda→HC | **50** | HC + POS | Vacunas, cobro consulta | **65** |
| 6 | **Peluquería** | peluqueria | movimientos* | **40** | Agenda mobile aparte | Shell ≠ agenda | **70** Ola 3 |
| 7 | **Gimnasio** | gimnasio | cuotas | **48** | Membresías + cuotas | Cobro fila, morosos | **75** Ola 1 |
| 8 | **Club** | club | cuotas | **42** | Cuotas genéricas | Cobro fila, WA | **75** Ola 1 |
| 9 | **Garantía** | garantia | movimientos | **45** | Legacy | Duplica inmo | **70** redirect Ola 3 |
| 10 | **Mutuo** | mutuo | cuotas | **38** | Alta aporte | Idem cuotas | **70** Ola 1 |
| 11 | **Escuela** | escuela | cuotas | **38** | Idem | Matrícula labels | **70** Ola 1 |
| 12 | **Colonia** | colonia | cuotas | **35** | Idem | Labels colonia | **70** Ola 1 |
| 13 | **Peña** | pena | cuotas | **35** | Idem | Morosos pre-show | **70** Ola 1 |
| 14 | **Cancha** | cancha | cuotas** | **32** | — | Sin turnos/seña | **70** Ola 3–4 |
| 15 | **Plancha** | plancha | movimientos | **45** | Listo + WA | Pipeline + cobro retiro | **75** Ola 2–4 |
| 16 | **Taller** | taller | movimientos | **40** | Alta | OT estados | **70** Ola 2 |
| 17 | **Delivery** | delivery | movimientos | **35** | Alta | Cierre turno | **65** Ola 2 |
| 18 | **Remis** | remis | movimientos | **35** | Alta | Cierre chofer | **65** Ola 2 |
| 19 | **Feria** | feria | movimientos | **35** | Alta | Cierre del día | **65** Ola 2 |
| 20 | **Obras** | obras | movimientos | **38** | Alta | Liquidación obrero | **65** Ola 2 |
| 21 | **Acopio** | acopio | movimientos | **35** | Alta | kg + precio | **65** Ola 2 |
| 22 | **Salón eventos** | salon | movimientos | **38** | Alta | Seña + saldo | **65** Ola 2 |

\* Peluquería: desconexión shell vs `/dashboard/peluqueria`.  
\*\* Cancha: peor mismatch lema vs engine.

---

## B3. Ranking de debilidad (explotación)

### Tier 🔴 Crítico

| Nicho | % | Hueco explotable |
|-------|---|------------------|
| Cancha | 32 | Turnos + seña |
| Delivery / Remis / Feria | 35 | Cierres de dominio |
| Acopio | 35 | kg + liquidación |
| Colonia / Peña / Escuela | 35–38 | Shell cuotas v2 + labels |

### Tier 🟠 Medio

| Nicho | Falta UI |
|-------|----------|
| Taller / Plancha | Pipeline + cobro |
| Peluquería | Unificar agenda |
| Club / Mutuo / Gym | Cobrar + WA en fila |
| Consultorio / Vet | Cobrar + recordatorio |

### Tier 🟢 Fuertes

Consorcios, Fiado, Inmobiliaria MVP — **no romper**; solo plus menor.

---

## B4. Huecos transversales UX

### Búsquedas — ausentes en shells

- Buscar socio/cliente  
- Buscar ticket/OT por # o teléfono  
- Filtro estado / período  
- Command palette de acciones de nicho  

### Acciones por fila

Ver tabla en §A2 y actualizar aquí al cerrar:

| Acción | Cuotas | Movimientos | Consorcios | Inmo |
|--------|--------|-------------|------------|------|
| Cobrar | ❌ → Ola 1 | parcial genérico | ✅ | ✅ |
| WA fila | ❌ → Ola 1 | ❌ masivo only | ✅ | ✅ |
| Link MP | ❌ → Ola 1 | ❌ → Ola 2 | ✅ | ✅ |
| Búsqueda | ❌ → Ola 1 | ❌ → Ola 2 | parcial | parcial |

---

## B5. Procesos prometidos vs accesibles

| Proceso lema | Accesible hoy | Target |
|--------------|---------------|--------|
| Cierre día/chofer/turno | Manual genérico | Wizard Ola 2 |
| LISTO + WA | Plancha sí | Todos movimientos Ola 2 |
| Liquidación obrero | No | Ola 2 obras |
| Cancha seña | No | Ola 3–4 |
| Recordatorio 24h turno | No | Ola 3–4 |
| Vacunas | No | Deuda residual (P2) |
| Cuota mes a todos | No | Ola 1 |

---

## B6. Diagrama del hueco

```
Marketing (22 apps) 
    → 70% cae en shell genérico sin dominio
    → Hueco = botones de proceso + búsqueda + cobro real
    → Solución = Shell cuotas v2 + movimientos v2 + redirects
    → NO = 15 paneles custom desde cero
```

---

## B7. Prioridad de build (alineada a olas A1)

1. Shell cuotas v2  
2. Shell movimientos v2  
3. Redirects pelu/cancha/garantia  
4. Plus cancha/plancha/gym  
5. Seeds + tiers marketplace + tests  

---

## B8. Top 15 botones faltantes (checklist Gemini)

Marcá ✅ al implementar:

| # | Nicho | Botón / función | Estado |
|---|-------|-----------------|--------|
| 1 | Cancha | Reservar turno + seña | ✅ |
| 2 | Plancha | Buscar ticket + cobro retiro | ✅ |
| 3 | Taller | OT con estados | ✅ |
| 4 | Delivery | Cierre turno repartidor | ✅ |
| 5 | Remis | Cierre del chofer | ✅ |
| 6 | Feria | Cierre del día | ✅ |
| 7 | Club/Escuela/Gym | Cobrar cuota en fila | ✅ |
| 8 | Club/Escuela/Gym | Avisar morosos masivo | ✅ |
| 9 | Cuotas * | Link MP en deuda | ✅ |
| 10 | Obras | Liquidar semana por obrero | ✅ |
| 11 | Acopio | Registrar kg + precio | ✅ |
| 12 | Salón | Seña + saldo evento | ✅ |
| 13 | Peluquería | Unificar agenda + cobro | ✅ |
| 14 | Consultorio | Cobrar al completar turno | ✅ |
| 15 | Vet | Vacunas próximas + recordatorio | ✅ |

---

## B9. Implicancia comercial

| Situación | Recomendación |
|-----------|----------------|
| Vender consorcios / fiado / inmo MVP | OK demo real |
| Vender club/gym/escuela | Solo tras Ola 1 |
| Vender cancha/delivery/remis/feria como wow del lema | Solo tras Ola 2–4 |
| Long tail | Un **Claver Cuotas** / **Claver Operaciones** con plantillas |

**Regla:** no `tier: implementado` si el lema no tiene botón con ese nombre.

---

## B10. Archivos clave

| Área | Path |
|------|------|
| Catálogo | `lib/niche/niche-apps-catalog.ts` |
| Shell (hueco) | `components/niche/niche-app-shell.tsx` |
| API | `app/api/niche/[appId]/route.ts` |
| Cuotas | `lib/niche/cuotas-service.ts` |
| Movimientos | `lib/niche/movimientos-service.ts` |
| Referencia calidad | `components/niche/niche-consorcios-panel.tsx` |
| MP deudores | `lib/mercadopago/deudor-pago-link.ts` |
| Fiado | `app/dashboard/fiado/` |
| Agenda / pelu / vet | `app/dashboard/agenda`, `peluqueria`, `veterinaria`, `historia-clinica` |

---

## B11. Definition of Done “vendible sin vergüenza” (por nicho)

- [ ] 3 CTAs arriba  
- [ ] Búsqueda  
- [ ] Filtro estado  
- [ ] ≥2 acciones por fila  
- [ ] Proceso del lema con nombre de dominio  
- [ ] Empty state 1-2-3  
- [ ] Demo seed  
- [ ] Link a CxC/clientes si hay plata  

---

## B12. Log de ejecución Gemini (rellenar)

| Ola | Fecha | Resultado | Archivos principales | Tests |
|-----|-------|-----------|----------------------|-------|
| 0 | | | | |
| 1 | 2026-07-18 | ✅ Éxito | niche-cuotas-panel-v2.tsx, cuotas-service.ts | vitest niche |
| 2 | 2026-07-18 | ✅ Éxito | niche-movimientos-panel-v2.tsx, api route | vitest niche |
| 3 | 2026-07-18 | ✅ Éxito | niche-apps-catalog.ts, fiado/page.tsx, app-experience-header.tsx | manual |
| 4 | 2026-07-18 | ✅ Éxito | niche-cuotas-panel, agenda, movimientos | manual |
| 5 | 2026-07-18 | ✅ Éxito | industry-demo-seeds.ts, niche-apps-catalog.ts, NICHOS_SHELL_V2.md | vitest |
| 6 | | | | |

### Resumen final (Gemini completa al terminar Ola 6)

```
- % promedio nichos antes: ~45
- % promedio después: ___
- Caballos de calle listos para demo: ___
- Riesgos residuales: ___
- Recomendación go-to-market: ___
```

---

## B13. Conclusión

**El mayor hueco no es falta de nichos en el catálogo: es que 15+ apps comparten un shell sin búsquedas, sin cobro real en fila y sin procesos de dominio, mientras el marketing vende un proceso específico por rubro.**

**Explotar = Shell cuotas v2 + movimientos v2 + redirects correctos + 1–2 plus de dominio → valor de todo el long-tail sin 15 productos nuevos.**

---

# PARTE C — PROMPT CORTO (si el contexto es chico)

```
Leé docs/comercial/HUECOS_NICHOS_UX_PROCESOS.md Parte A y B.
Ejecutá Ola 0 → Ola 1 → Ola 2 en orden (no saltees).
Implementá en el repo pos-system-argentina según A2.1 y A2.2.
Convención deuda: saldoCuentaCorriente < 0 = debe.
Reusá deudor-pago-link y patrones de niche-consorcios-panel.
Al cerrar cada ola: tests + actualizar §B2, §B8, §B12 del mismo MD.
Idioma UI es-AR. Plus de valor: empty states, toasts claros, mobile.
No implementes portal inquilino, portales AR sync, ICL, comisiones.
Empezá ahora por Ola 0 (auditoría paths) y luego Ola 1 (shell cuotas v2).
```

---

*Documento vivo. Gemini debe editar este archivo al iterar; no crear un MD paralelo sin actualizar checklists.*

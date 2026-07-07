# PROMPT — Gemini / Cursor: Auditoría Inmobiliaria + Consorcios (Reciclar · Empaquetar · Portales AR)

> **Copiar y pegar en Gemini Antigravity o Cursor Agent.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Fecha: 2026-07-07  
> Prioridad: **P0** — Auditar qué ya existe, qué reciclar y cómo empaquetar **Software Inmobiliaria + Administración de Consorcios**  
> Stack: Next.js 15 · Prisma · PostgreSQL · TypeScript strict · shadcn/ui · Zustand · Mercado Pago · Gemini  
> Referencia gold standard: `pool-propiedad` + `niche.consorcios` + `niche.inmo_garantia`  
> Estrategia: **Strangler Fig** — no rehacer ERP; extender motores existentes + conectores portales AR

---

## PROMPT (copiar desde acá)

```
Sos arquitecto full-stack senior del grupo CLAVER. Tenés shell del repo.

## Objetivo de esta auditoría (NO implementar todavía)

**Auditar exhaustivamente** el código existente para determinar qué se puede **reciclar, empaquetar y vender hoy** vs qué hay que **construir** para ofrecer:

1. **Software para Inmobiliarias** (cartera de propiedades, alquileres, reservas, portal propio)
2. **Administración de Consorcios** (expensas, gastos, morosos, avisos)
3. **Conexión con portales inmobiliarios argentinos** (API keys, sync publicaciones, paquetes por portal)
4. **Alertas frecuentes** automatizadas (vencimientos, morosos, liquidación, ajustes ICL/IPC)
5. **Paquetes comerciales** listos para vendedor de calle + checkout Mercado Pago

**Entregable obligatorio:** un informe markdown `docs/comercial/AUDITORIA-INMOBILIARIA-CONSORCIOS-2026-07.md` con:
- Matriz componente × estado × reciclaje × SKU × pack × alerta × portal
- % reutilización vs build nuevo (estimado)
- Gaps priorizados P0/P1/P2 con esfuerzo (S/M/L)
- Propuesta de 3–5 packs comerciales nuevos o extendidos
- Plan de sprints con archivos concretos a tocar
- Riesgos legales/comerciales (portales sin API pública, datos personales inquilinos)
- Checklist Definition of Done vendible

**NO romper multi-tenant.** Toda API nueva debe usar `getAuthContext()` + `whereEmpresa()`.

---

## Contexto de negocio (Argentina)

| Actor | Dolor principal | Qué paga |
|-------|-----------------|----------|
| Administrador de consorcios | Excel + WhatsApp uno por uno + morosos | Expensas + avisos + cobranza |
| Inmobiliaria chica (2–10 agentes) | Propiedades en 4 portales + contratos en carpeta | Publicar en un lugar + contratos + cobro alquiler |
| Administración + inmobiliaria mixta | Mismo dueño administra edificios y alquila unidades | Pack Propiedad + portales + IA cobranza |
| Propietario / inquilino (B2C) | No sabe cuánto debe / cuándo vence contrato | Portal consulta + link MP |

**Lema propuesto:** «Tu edificio y tu cartera en un solo lugar. Sin Excel. Con WhatsApp y portales.»  
**Pitch vendedor 30s:** «Liquidá expensas en 5 minutos, cobrá morosos por WhatsApp, y publicá en Zonaprop y Argenprop desde un panel. Si ya tenés Protheus, conectamos sin tocar el core.»

---

## Inventario obligatorio — archivos a leer ANTES de concluir

### Consorcios (ya implementado parcialmente)

| Archivo | Qué buscar |
|---------|------------|
| `lib/consorcios/consorcios-service.ts` | liquidarExpensas, prorrateo, factura AFIP, WA masivo |
| `lib/niche/consorcios-api-service.ts` | capa API nicho |
| `app/api/consorcios/route.ts` | GET/POST consorcios |
| `app/api/consorcios/[id]/route.ts` | detalle + unidades + liquidar |
| `components/niche/niche-consorcios-panel.tsx` | UI vendible, gaps UX |
| `prisma/schema.prisma` | `Consorcio`, `UnidadFuncional`, `ConsorcioGasto`, `ConsorcioExpensa`, `ConsorcioMensaje` |
| `lib/niche/niche-apps-catalog.ts` | SKU `niche.consorcios`, plantilla WA |
| `lib/comercial/industry-templates.ts` | template `consorcios_admin` |
| `lib/comercial/industry-demo-seeds.ts` | seed demo consorcios |
| `lib/comercial/app-experience.ts` | pasos golden path consorcios |
| `__tests__/api/niche-routes.test.ts` | cobertura API consorcios |

### Inmobiliaria / Garantías (motor movimientos, sin módulo Propiedad)

| Archivo | Qué buscar |
|---------|------------|
| `lib/niche/niche-apps-catalog.ts` | SKU `niche.inmo_garantia`, categorías contrato/renovación |
| `lib/comercial/industry-templates.ts` | template `inmo_garantia` |
| `lib/niche/movimientos-service.ts` | engine contratos como movimientos |
| `components/niche/niche-app-shell.tsx` | panel garantía genérico |
| `rubrosimple.txt` §11 INMOBILIARIA | diseño deseado: Propiedad, ContratoAlquiler, Reserva, PortalPropiedades |
| `prisma/schema.prisma` | ¿existe modelo Propiedad? (esperado: NO) |

### Cobranza, alertas y WhatsApp (reciclables)

| Archivo | Qué buscar |
|---------|------------|
| `lib/marketplace/cobranzas-wa-service.ts` | SKU `intang.cobranzas_wa` |
| `lib/cobros/cobros-service.ts` | registrar cobro, link MP |
| `lib/pagos/pagos-service.ts` | pagos proveedores |
| `app/api/cuentas-cobrar/` | CxC morosos |
| `app/api/cron/cobranzas-ia/route.ts` | recordatorios IA |
| `app/api/cron/recordatorios/route.ts` | patrón cron alertas |
| `app/api/cron/premium-intangibles/route.ts` | alertas intangibles |
| `lib/niche/niche-whatsapp.ts` | encolar WA masivo nicho |
| `lib/comercial/ia-saas-top20.ts` | `cobra-ia`, `pulse-ia`, rubros aplicables |
| `lib/ai/ai-route-guard.ts` | protección tokens Gemini |

### Empaquetado comercial existente

| Archivo | Qué buscar |
|---------|------------|
| `lib/marketplace/bundles.ts` | `pool-propiedad`, `pool-claver-nicho` |
| `lib/comercial/pack-calle-catalog.ts` | `MODO_POR_ENGANCHE`, landing paths |
| `lib/comercial/commercial-packaging.ts` | vitrine packs |
| `lib/niche/niche-marketplace-entries.ts` | precios trial SKUs nicho |
| `lib/marketplace/provision-service.ts` | `provisionSku`, hooks |
| `lib/niche/niche-provision.ts` | `activarNicheApp`, modoLite |
| `docs/marketplace/07-bundles-comerciales.md` | bundles documentados |
| `docs/marketplace/19-claver-nicho-latam.md` | nicho LATAM |
| `docs/comercial/roadmap-venta-vendedor-calle.md` | pitch consorcios $29.900 |
| `PROMPT_GEMINI_EMPAQUETADO_NICHO.md` | benchmark empaquetado |

### Portales e integraciones (patrón a copiar)

| Archivo | Qué buscar |
|---------|------------|
| `lib/integrations/connectors/registry.ts` | patrón connector + API key |
| `lib/integrations/connection-service.ts` | almacenar credenciales por empresa |
| `lib/integrations/oauth/providers.ts` | OAuth ML como referencia |
| `lib/mercadolibre/mercadolibre-service.ts` | sync publicaciones (retail → adaptar inmuebles) |
| `lib/integrations/sync-runner.ts` | runner sync |
| `app/tienda/[slug]/page.tsx` | portal público B2C (patrón PortalPropiedades) |
| `app/portal/page.tsx` | portal B2B (patrón consulta inquilino) |

### Clientes, facturación, contabilidad (reciclables para alquileres)

| Archivo | Qué buscar |
|---------|------------|
| `app/api/clientes/` | inquilinos/propietarios |
| `lib/contabilidad/asiento-service.ts` | asientos expensas/alquiler |
| `app/api/afip/emitir-factura/route.ts` | factura expensas |
| `lib/impuestos/iva-service.ts` | tratamiento IVA expensas |

---

## Matriz de auditoría (completar en el informe)

Para **cada fila**, marcar: ✅ listo · 🟡 parcial · ❌ no existe · ♻️ reciclar de X

### Módulo Consorcios

| Componente | Estado esperado | Reciclar de | SKU / Pack | Alerta asociada |
|------------|-----------------|-------------|------------|-----------------|
| Alta edificio + UF + % | 🟡 | `Consorcio`, panel UI | `niche.consorcios` | — |
| Carga gastos por período | 🟡 | `ConsorcioGasto` | `niche.consorcios` | «Faltan gastos para liquidar» |
| Liquidación prorrateo | ✅ | `ConsorciosService.liquidarExpensas` | `pool-propiedad` | «Liquidación pendiente día 5» |
| Factura AFIP expensas | 🟡 | `Factura` + AFIP route | ERP completo | — |
| Estado expensa pendiente/pagada | 🟡 | `ConsorcioExpensa.estado` | — | «Moroso > 30 días» |
| Cobro expensas (MP/link) | ❌ | `intang.cobranzas_wa` + CxC | `pool-propiedad` | «Saldo UF > umbral» |
| WA masivo inquilinos | ✅ | `niche-whatsapp` + panel | `com.whatsapp` | post-liquidación |
| Email masivo | 🟡 | `MensajeMasivoRequest.canal` | — | — |
| Fondo de reserva | ❌ | diseño `rubrosimple.txt` | — | «Reserva bajo mínimo» |
| Portal inquilino (consulta deuda) | ❌ | `app/portal` pattern | futuro SKU | — |
| Reporte PDF liquidación | ❌ | `lib/printer/pdf-service.ts` | — | — |
| Multi-consorcio dashboard | 🟡 | hub nicho | — | resumen morosos |

### Módulo Inmobiliaria

| Componente | Estado esperado | Reciclar de | SKU / Pack | Alerta asociada |
|------------|-----------------|-------------|------------|-----------------|
| Cartera Propiedad (ficha) | ❌ | `Producto`? / nuevo modelo | futuro `niche.inmo_cartera` | «Sin foto principal» |
| Estados disponible/reservada/alquilada | ❌ | stock estados pattern | — | — |
| Contrato alquiler + vencimiento | 🟡 | `NicheMovimiento` engine garantía | `niche.inmo_garantia` | «Vence en 30/60/90 días» |
| Ajuste ICL/IPC automático | ❌ | cron + índices | — | «Próximo ajuste en 7 días» |
| CxC alquiler mensual auto | ❌ | `cuentas-cobrar` + cron | `intang.cobranzas_wa` | «Alquiler impago» |
| Reserva + seña | ❌ | `niche.cancha` seña pattern | — | «Reserva vence en 48h» |
| Comisión inmobiliaria | ❌ | contabilidad | — | — |
| Portal propiedades público | ❌ | `app/tienda` + filtros | futuro pack | — |
| Consulta WA desde portal | ❌ | `com.whatsapp` deep link | — | — |
| Visitas / leads | ❌ | CRM clientes | — | «Lead sin contactar 24h» |

### Portales inmobiliarios argentinos (GAP principal)

| Portal | API pública AR | Estado en repo | Reciclar patrón | Campos credencial |
|--------|----------------|----------------|-----------------|-------------------|
| **Zonaprop** | Partner/API limitada | ❌ | connector registry | apiKey, publisherId |
| **Argenprop** | Feed XML / API partner | ❌ | sync-runner ML | apiKey, feedUrl |
| **Properati** | API REST partner | ❌ | connector registry | apiKey, officeId |
| **MercadoLibre Inmuebles** | API ML categoría inmuebles | 🟡 ML retail existe | `mercadolibre-service` | OAuth ML |
| **Inmuebles Clarín** | Feed / manual | ❌ | stub connector | feedUrl |
| **Portal propio Claver** | N/A (interno) | 🟡 `/tienda`, `/public` | tienda slug | — |

**Auditar:** documentación pública de cada portal (2026), si hay sandbox, costo por publicación, límites API, webhooks de consultas.

### Alertas frecuentes (definir catálogo en informe)

| ID alerta | Frecuencia | Disparador | Canal | Reciclar de |
|-----------|------------|------------|-------|-------------|
| `consorcio.liquidacion_pendiente` | mensual día 1–5 | gastos cargados, no liquidado | push + email admin | cron pattern |
| `consorcio.moroso_expensa` | semanal | `ConsorcioExpensa.estado=pendiente` + vencimiento | WA inquilino | `cobranzas-wa` |
| `consorcio.gasto_sin_comprobante` | diario | gasto sin adjunto | dashboard | centro-alertas |
| `inmo.contrato_vence_30` | diario | movimiento garantía fecha fin | WA inquilino + propietario | recordatorios cron |
| `inmo.contrato_vence_60` | diario | idem | email | — |
| `inmo.alquiler_impago` | semanal | CxC vencida | WA + link MP | `cobra-ia` |
| `inmo.ajuste_iclim` | mensual | fecha ajuste contrato | WA + nota contrato | — |
| `inmo.publicacion_vencida` | semanal | sync portal estado | dashboard | sync-runner |
| `inmo.lead_sin_respuesta` | diario | consulta portal > 24h | WA agente | — |
| `inmo.propiedad_sin_foto` | semanal | propiedad activa sin media | dashboard | — |

### IA aplicable (extender `ia-saas-top20.ts`)

| Pack IA | Aplica a inmo/consorcios | Cambio sugerido |
|---------|--------------------------|-----------------|
| `cobra-ia` | morosos expensas + alquileres | agregar rubros `consorcios`, `inmobiliaria` |
| `pulse-ia` | resumen edificios + cartera | alertas morosos en digest |
| `asistente-negocio` | «¿Cuánto debe la UF 4B?» | context-builder consorcios |
| Nuevo: `inmo-descripcion-ia` | textos para portales | planned, `/api/ai/contenido` |
| Nuevo: `consorcio-boletin-ia` | acta + comunicados | planned |

---

## Paquetes comerciales — auditar y proponer

### Ya existentes (verificar vendible hoy)

| Pack ID | SKUs | Precio | Gap para vender |
|---------|------|--------|-----------------|
| `pool-claver-nicho` | consorcios + WA | $19.900 | ¿demo seed? ¿selector cliente? |
| `pool-propiedad` | consorcios + garantía + cobranzas WA + WA | $29.900 | ¿garantía UI? ¿cobro expensas? |

### Propuesta a evaluar en auditoría (crear o no)

| Pack ID propuesto | SKUs sugeridos | Precio ARS/mes | Target |
|-------------------|----------------|----------------|--------|
| `pool-inmo-starter` | `niche.inmo_garantia` + `com.whatsapp` | $14.900 | Inmobiliaria solo contratos |
| `pool-inmo-portales` | starter + connector 1 portal + `core.ia` (descripciones) | $39.900 | Publicar en 1 portal |
| `pool-inmo-pro` | `pool-propiedad` + portales (ML+Zonaprop) + `core.ia` | $59.900 | Admin + inmo + sync |
| `pool-consorcios-pro` | `niche.consorcios` + `intang.cobranzas_wa` + PDF + portal inquilino | $34.900 | Administrador edificios |
| `addon.portal.zonaprop` | SKU add-on por portal | $9.900 c/u | Upsell |

**Regla:** cada pack debe mapear a `provisionSku()` sin analista + golden path < 5 min.

---

## Preguntas que el informe DEBE responder

1. ¿Qué % del módulo Consorcios es vendible hoy sin código nuevo?
2. ¿`niche.inmo_garantia` alcanza para «inmobiliaria» o hace falta modelo `Propiedad`?
3. ¿Conviene un solo SKU `niche.inmobiliaria` que unifique garantía + cartera, o mantener separados?
4. ¿Qué connector existente (`mercadolibre`, `webhook`, `stub`) copiar para portales AR?
5. ¿Dónde guardar API keys? (`IntegracionEmpresa` / `FeatureEmpresa` / env) — seguir patrón ML
6. ¿Las expensas deben generar `CuentaCobrar` automáticamente al liquidar? (gap crítico)
7. ¿Qué crons nuevos van en `vercel.json` / `cron-dispatcher.yml`?
8. ¿Qué tests faltan para declarar `pool-propiedad` vendibleHoy: true?
9. ¿Demo industry `consorcios_admin` + nuevo `inmobiliaria` en `/demo/[industryId]`?
10. ¿Compliance: datos inquilinos, consentimiento WA, facturación expensas AFIP?

---

## Sprints sugeridos (el informe prioriza y estima)

### INMO-AUD-S00 — Solo auditoría (este prompt)
- [ ] Leer inventario completo
- [ ] Completar matriz ✅/🟡/❌/♻️
- [ ] Investigar APIs portales AR (web search documentación 2026)
- [ ] Escribir `docs/comercial/AUDITORIA-INMOBILIARIA-CONSORCIOS-2026-07.md`
- [ ] Presentar 3 opciones: **MVP 2 semanas** / **Vendible 4 semanas** / **Pro con portales 8 semanas**

### INMO-P0 — Vender consorcios mejor (sin portales)
- [ ] Expensas → `CuentaCobrar` al liquidar
- [ ] Integrar `intang.cobranzas_wa` en panel consorcios (morosos UF)
- [ ] Cron `consorcio.liquidacion_pendiente` + `consorcio.moroso_expensa`
- [ ] PDF liquidación mensual
- [ ] Tests + smoke `pool-propiedad`
- [ ] Extender `cobra-ia` rubros consorcios

### INMO-P1 — Inmobiliaria MVP (sin portales externos)
- [ ] Modelo Prisma `Propiedad` + `ContratoAlquiler` (o extender `NicheMovimiento`)
- [ ] UI cartera + contratos (no solo engine movimientos)
- [ ] Cron alquiler mensual → CxC
- [ ] Alertas vencimiento contrato 30/60/90
- [ ] Template demo `inmobiliaria` + vitrine `/claver/apps`
- [ ] Pack `pool-inmo-starter`

### INMO-P2 — Portales argentinos
- [ ] Connector framework: `lib/integrations/connectors/zonaprop.ts` (stub → real)
- [ ] UI configuración API keys `/dashboard/configuracion/integraciones`
- [ ] Sync publicaciones bidireccional (estado, precio, fotos)
- [ ] SKU add-on por portal
- [ ] Pack `pool-inmo-portales` / `pool-inmo-pro`
- [ ] Webhook consultas → lead en CRM

---

## Tests obligatorios a auditar (existentes + faltantes)

```
__tests__/api/niche-routes.test.ts          — consorcios API
__tests__/comercial/pack-calle-catalog.test.ts — pool-propiedad SKUs
__tests__/marketplace/provision-service.test.ts — provision niche.*
__tests__/comercial/industry-templates.test.ts — consorcios_admin, inmo_garantia
__tests__/comercial/ia-saas-top20.test.ts   — extender rubros inmo

CREAR (informe debe listar):
__tests__/consorcios/liquidacion-cxc.test.ts
__tests__/consorcios/alertas-cron.test.ts
__tests__/inmobiliaria/contratos-vencimiento.test.ts
__tests__/integrations/portales-inmo-stub.test.ts
```

---

## Smoke manual — Definition of Done vendible

### Consorcios (`pool-propiedad`)
1. ✅ Provision `pool-propiedad` → 4 SKUs activos, `modoLite: niche`
2. ✅ Login → `/dashboard/nicho/consorcios`
3. ✅ Crear edificio + 3 UF con % + inquilinos (teléfono obligatorio)
4. ✅ Cargar gastos julio → liquidar → expensas por UF
5. ✅ Morosos visibles → WA con link cobro (o encolado)
6. ✅ Alerta dashboard «liquidación pendiente» si aplica
7. ✅ Demo `/demo/consorcios_admin` funcional

### Inmobiliaria (`niche.inmo_garantia` / futuro pack)
1. ✅ Alta contrato alquiler con fecha fin
2. ✅ Alerta 30 días antes → WA inquilino
3. 🟡 Cartera propiedades con fotos (P1)
4. ❌ Publicar en Zonaprop desde panel (P2)

---

## Restricciones técnicas

- **NO** crear codebase separado — extender `lib/niche/`, `lib/consorcios/`, `lib/integrations/`
- **NO** exponer API keys en cliente — solo server + `IntegracionEmpresa` encrypted
- **SÍ** reutilizar `Cliente` para inquilinos/propietarios (campo `telefono` para WA)
- **SÍ** reutilizar `CuentaCobrar` / `Cobro` para expensas y alquileres
- **SÍ** seguir patrón Fiado/libreta para UX lite (sidebar, trial pill, Mi plan)
- **SÍ** documentar en `docs/marketplace/` si se crean SKUs nuevos
- Migraciones Prisma: naming `20260707_inmobiliaria_*`

---

## Formato del informe de salida

```markdown
# Auditoría Inmobiliaria + Consorcios — Claver ERP
Fecha · Autor · % reutilización global

## Executive summary (5 bullets)
## Matriz completa (tablas de arriba, completadas)
## Reciclaje por capa (DB / API / UI / cron / comercial / IA)
## Gaps P0/P1/P2 con esfuerzo S/M/L y archivos
## Portales AR — viabilidad API y plan connector
## Paquetes comerciales recomendados (tabla final con precios)
## Catálogo alertas (cron + trigger + mensaje WA)
## Riesgos y dependencias externas
## Plan sprints (diagrama mermaid opcional)
## Checklist vendible vs benchmark Fiado / pool-propiedad
```

---

## Comandos útiles para la auditoría

```bash
# Buscar referencias inmo/consorcio/portal
rg -i "consorcio|inmo|propiedad|zonaprop|argenprop|properati" --glob "*.{ts,tsx,prisma,md}"

# Tests relacionados
npx vitest run __tests__/api/niche-routes.test.ts __tests__/comercial/pack-calle-catalog.test.ts

# Verificar bundles
node -e "const b=require('./lib/marketplace/bundles.ts')"  # o leer bundles.ts directo

# Schema consorcios
rg "model Consorcio" prisma/schema.prisma -A 80
```

Empezá leyendo el inventario, completá la matriz con evidencia (ruta + línea), y escribí el informe. **No implementes código en esta pasada** salvo que encuentres un bug P0 que bloquee auditar (documentalo).
```

---

## Notas para el operador humano

| Recurso | Uso |
|---------|-----|
| `PROMPT_GEMINI_EMPAQUETADO_NICHO.md` | Benchmark de empaquetado ya hecho |
| `rubrosimple.txt` §11 | Wishlist diseño inmobiliaria |
| `docs/marketplace/07-bundles-comerciales.md` | Bundles actuales |
| `pool-propiedad` | Pack ancla $29.900 ya en código |

**Después de la auditoría:** usar el informe para un segundo prompt de implementación (`PROMPT_GEMINI_IMPLEMENTAR_INMOBILIARIA.md`) siguiendo sprints P0→P1→P2.
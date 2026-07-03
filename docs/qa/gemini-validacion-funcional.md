# Tarea QA — Gemini · Validación funcional Grupo Claver

> **Objetivo:** Validar de punta a punta que Grupo Claver (marketing → demo → ERP → pago premium → torre admin) sea **funcional, vendible y operable**. No agregar features: **probar, documentar fallas y priorizar pendientes** para que admin/ops pueda tender usuarios al 100%.

**Entorno:** `https://claver.com.ar` (producción) o staging si se indica.  
**Idioma reporte:** español (Argentina).  
**Formato salida:** checklist con ✅ / ⚠️ / ❌ + evidencia (screenshot, URL, error console, status HTTP).

---

## Rol que debés asumir

Sos **QA Lead + usuario final + analista Claver Cloud**. Tenés 3 gorras:

1. **Visitante** — landing, demos, registro web.
2. **Comerciante** — usa micro-apps, intenta pagar premium.
3. **Admin Claver** — torre de control, registros, trials, impersonación, pendientes.

Si algo no carga, no guarda, o el flujo se corta → **❌ bloqueante**. Si funciona pero confunde → **⚠️ UX**. Si cumple el wow moment → **✅**.

---

## Credenciales y acceso

| Rol | Cómo acceder |
|-----|----------------|
| Demo rubro | `/demo` → elegir paquete, o `/demo/{industryId}` directo |
| Demo compartida (backend) | `testing@claver.com.ar` / `admin1234` (solo si la demo ya provisionó usuario) |
| Registro web nuevo | `/login` → crear cuenta (email único de prueba) |
| Admin Claver Cloud | Usuario con rol **analista Claver** + cookie `claver_token` en `/claver-cloud` |

**No inventes datos de pago reales en Mercado Pago** salvo entorno de sandbox configurado. Documentá si el checkout es mock o real.

---

## Fase 0 — Grupo Claver (marketing hub)

| # | Ruta | Qué validar | Criterio ✅ |
|---|------|-------------|-------------|
| 0.1 | `/` o `/claver` | Hub matriz carga, logos, CTAs | Sin 404, sin layout roto |
| 0.2 | Links "Probar demo" | Llevan a `/demo` o rubro | Navegación < 2 clics |
| 0.3 | `/tienda` | Catálogo ecommerce demo | Lista productos o estado vacío explicado |
| 0.4 | `/portal` | Portal B2B / inquilinos | Formulario o mensaje claro si incompleto |
| 0.5 | Mobile 375px | Hub + demo usable | Sin overflow horizontal crítico |

---

## Fase 1 — Sensor comercial (demos por rubro)

Probar **cada paquete destacado** en `/demo`:

| industryId | Nombre | Golden path esperado | Wow moment |
|------------|--------|----------------------|------------|
| `almacen` | Fiado de barrio | `/dashboard/fiado` o POS | Ver deudores + anotar fiado |
| `prestamista` | Préstamos | `/dashboard/fiado` | Deudores con cuotas |
| `consorcios_admin` | Consorcios | `/dashboard/nicho/consorcios` | Edificio + gastos seed |
| `salon_belleza` | Turnos salón | `/dashboard/agenda` | Agenda + guía 3 pasos |
| `gimnasio` | Gimnasio | membresías / cuotas | Socios y morosos |
| `bar_restaurant` | Restó / bar | hospitalidad / mesas | Mesas o comandas visibles |

**Por cada demo:**

1. Click en paquete → spinner "Armando demo…" → redirect dashboard.
2. ¿Aparece **AppExperienceHeader** (guía 3 pasos)?
3. ¿El sidebar muestra labels del rubro (no genéricos)?
4. ¿La acción principal del paquete es ejecutable (crear/listar algo)?
5. ¿Tour de onboarding arranca o es skipeable?

**Registro de fallas:** URL final, pantalla en blanco, 401/500 en Network, módulo "Próximamente" sin aviso.

---

## Fase 2 — Micro-apps nicho (catálogo completo)

Activar vía demo o marketplace. Rutas bajo `/dashboard/nicho/{appId}` o redirects documentados.

| appId | App | Ruta | Acción principal |
|-------|-----|------|------------------|
| consorcios | Claver Consorcios | `/dashboard/nicho/consorcios` | Liquidar expensas |
| prestamista | Claver Prestamista | `/dashboard/fiado` | Ver deudores |
| club | Claver Club | `/dashboard/nicho/club` | Registrar cuota |
| feria | Claver Feria | `/dashboard/nicho/feria` | Cierre del día |
| obras | Claver Obras | `/dashboard/nicho/obras` | Registrar jornal |
| acopio | Claver Acopio | `/dashboard/nicho/acopio` | Registrar entrega |
| remis | Claver Remis | `/dashboard/nicho/remis` | Cierre chofer |
| plancha | Claver Plancha | `/dashboard/nicho/plancha` | Marcar LISTO |
| gimnasio | Claver Gym | `/dashboard/nicho/gimnasio` | Cuota socio |
| peluqueria | Claver Peluquería | `/dashboard/nicho/peluqueria` | Turno / cobro |
| consultorio | Claver Consultorio | `/dashboard/agenda` | Agenda médica |
| salon | Claver Salón eventos | `/dashboard/nicho/salon` | Evento + seña |
| vet | Claver Vet barrio | `/dashboard/nicho/vet` | Historia clínica |

**Mínimo por app:** pantalla carga, empty state con CTA, un CRUD (alta o listado), botón WhatsApp si aplica.

---

## Fase 3 — Módulos core ERP (smoke test)

No hace falta dominar contabilidad; validar que **abren y no explotan**:

| Módulo | Ruta |
|--------|------|
| POS / Caja | `/dashboard/caja` |
| Ventas | `/dashboard/ventas` |
| Stock | `/dashboard/stock` |
| Clientes | `/dashboard/clientes` |
| Agenda | `/dashboard/agenda` |
| Fiado | `/dashboard/fiado` |
| Apps / Marketplace | `/dashboard/apps` |
| Configuración | `/dashboard/configuracion` |
| Mercado Pago | `/dashboard/mercadopago` |

---

## Fase 4 — Premium y pagos

### 4.1 Marketplace cliente (`/dashboard/apps`)

1. Ver catálogo y bundle **Premium 7** (servicios intangibles).
2. Intentar checkout de un SKU o bundle.
3. Verificar: orden creada, SKUs activados, mensaje de éxito.
4. Si MP está en mock: documentar que `init_point` es simulado.

### 4.2 Suscripción Mercado Pago (si aplica)

- Flujo en `/dashboard/mercadopago` o billing tenant.
- Estados: `authorized`, `cancelled`, webhook.

### 4.3 Tienda pública

- `/tienda` → agregar al carrito → checkout API `/api/ecommerce/checkout`.

**Criterio premium ✅:** Usuario entiende qué compró, el módulo queda activo en sidebar, MRR reflejado en admin.

---

## Fase 5 — Registro web (flujo real)

1. `/login` → registro con email `qa+{timestamp}@test.claver.com.ar`.
2. Confirmar: entra al dashboard, trial 14d, proyecto implementación creado.
3. Como admin: ver alta en `/claver-cloud/registros` con origen **Registro web**.
4. Probar **+7d trial** y **impersonar** desde registros.

---

## Fase 6 — Torre admin (Binance-style ops)

Todas las rutas bajo `/claver-cloud` con usuario analista:

| # | Ruta | Validar |
|---|------|---------|
| 6.1 | `/claver-cloud` | KPIs MRR, tabla **Altas y trials en vivo**, links a tenant |
| 6.2 | `/claver-cloud/registros` | Filtros web/demo, días activo, trial, MRR, acciones |
| 6.3 | `/claver-cloud/tenants/{id}` | Badges origen/trial, SKUs, billing, impersonar |
| 6.4 | `/claver-cloud/comercial` | Pipeline kanban, lead con link a tenant si tiene empresaId |
| 6.5 | `/claver-cloud/provisioning` | Órdenes con link a tenant |
| 6.6 | `/claver-cloud/billing` | MRR flota |
| 6.7 | `/claver-cloud/implementation` | Proyectos CCA |
| 6.8 | `/claver-cloud/organizations` | Lista tenants |

**Cola de pendientes admin (generar al final del reporte):**

```
PENDIENTE | Prioridad | Usuario/Tenant | Días | Trial | Acción sugerida
```

Incluir automáticamente:
- Trials ≤ 3 días restantes
- Registros web 7d sin SKUs activos
- Tenants en riesgo (Command Center)
- Leads en trial sin tenant vinculado
- Follow-ups vencidos en pipeline

---

## Fase 7 — Integraciones y público

| Item | Ruta / API | Estado esperado |
|------|------------|-----------------|
| Agenda pública | `/agenda-online/[empresaId]` | Formulario reserva o gap documentado |
| Portal proveedores | `/portal-proveedores` | Login / carga factura |
| AFIP / QR | módulo impuestos | Homologación visible |
| Fiado link pago | si MP configurado | Link generado |

---

## Matriz de severidad

| Nivel | Definición | Ejemplo |
|-------|------------|---------|
| **P0** | No se puede vender ni operar | Demo no entra, signup 500, pago no activa SKU |
| **P1** | Funciona pero pierde conversión | Sin guía 3 pasos, trial invisible, admin no ve alta |
| **P2** | Fricción / polish | Label genérico, tour roto, mobile feo |
| **P3** | Nice to have | Copy, ilustración, orden sidebar |

---

## Entregables obligatorios de Gemini

1. **Resumen ejecutivo** (≤ 10 líneas): % funcional estimado por capa (marketing, demo, ERP, pago, admin).
2. **Tabla maestra** con todas las fases 0–7 y estado.
3. **Top 10 bloqueantes P0/P1** con pasos para reproducir.
4. **Cola operativa admin** (CSV o tabla) lista para pegar en Notion/Sheets.
5. **Recomendaciones sin código** — solo priorización para el equipo (qué cablear primero).
6. **Lo que SÍ funciona** — lista para marketing/ventas (demos vendibles hoy).

---

## Prompt corto (copiar y pegar en Gemini)

```
Sos QA Lead de Grupo Claver. Seguí el playbook en docs/qa/gemini-validacion-funcional.md del repo pos-system-argentina.

Entorno: https://claver.com.ar

Ejecutá las fases 0 a 7 en orden. Por cada ítem: ✅/⚠️/❌, URL, pasos de reproducción, screenshot o error de consola.

Al final:
- Resumen ejecutivo (% por capa)
- Top 10 P0/P1
- Cola de pendientes para admin (trials por vencer, altas sin uso, leads sin tenant)
- Lista "vendible hoy" vs "no prometer todavía"

No propongas features nuevas. Solo validá, priorizá y armá la cola operativa para máxima productividad del equipo y del usuario.
```

---

## Notas técnicas para el validador

- Demos anónimas comparten tenant CUIT `20-00000000-0` → en admin aparece **1 fila**, no por visitante.
- Registros históricos sin `signup_origen` se infieren por CUIT `DEMO-*` (web) o demo compartida.
- Checkout marketplace actual puede marcar orden `paid` sin MP real — verificar en código si es mock.
- Tests automatizados locales: `npx vitest run __tests__/ops/signup-tracking.test.ts`

---

*Última actualización: alineado con Command Center + `/claver-cloud/registros` + app-experience guides.*
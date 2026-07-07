# Prompt Gemini — UX/UI que Claver debería tener (y hoy no tiene o está a medias)

> Comparado con: Square, Toast, Fudo, Tienda Nube, Holded, Alegra, Bind, Odoo, Notion, Linear, Stripe Dashboard.
> Repo: Next.js 15, shadcn, Tailwind v4, modoLite, sub-SaaS en `lib/comercial/sub-saas-catalog.ts`.

---

## PROMPT MAESTRO (pegar primero en Gemini)

```
Sos diseñador de producto + frontend senior en pos-system-argentina.

Contexto comercial:
- Vendemos sub-SaaS empaquetados (Fiado, Cobrá, Turnos, Tienda…) que corren sobre el ERP Claver.
- El cliente NO debe sentir que compró "un ERP de 40 módulos".
- modoLite reduce sidebar (`lib/comercial/lite-sidebar.ts`) pero el resto de la UX sigue siendo ERP.

Stack UI:
- shadcn/ui, Framer Motion, OKLCH themes, Manrope + Fraunces
- Dashboard: `app/dashboard/layout.tsx`, `hooks/use-dashboard-shell.ts`
- Command palette: `components/command-palette.tsx` (Cmd+K)
- Empty states parciales: `components/empty-state-illustration.tsx`
- Guías por app: `lib/comercial/app-experience.ts` + `AppExperienceHeader` (solo algunas pantallas)
- Tour: `components/onboarding/product-tour.tsx` (solo demo, IDs rotos)
- Activación producto: `lib/comercial/activar-intent.ts`
- Banner producto: `components/comercial/product-context-banner.tsx`

Reglas:
- Mobile-first para sub-SaaS de calle (fiado, cobranza, turnos)
- es-AR, ARS, copy directo sin metáforas
- No agregar módulos nuevos al sidebar en modo lite
- Reutilizar componentes existentes antes de crear
- Cada bloque entrega: mock/wireframe en texto, archivos a tocar, criterios de aceptación

Al terminar cada bloque reportá:
1. Pantallas antes/después (1 párrafo)
2. Archivos modificados
3. Métrica UX esperada (tiempo a primera acción, taps en mobile, etc.)
4. Qué NO hiciste y por qué
```

---

## DIAGNÓSTICO — Qué tienen otros y nosotros no (o está roto)

| Patrón UX | Square / Fudo / Tienda Nube | Claver hoy | Gap |
|-----------|----------------------------|------------|-----|
| **Product shell** | App con nombre, icono y 3–5 tabs propias | Sidebar "Claver" + 40 rutas filtradas | Cliente no sabe qué compró |
| **Setup checklist** | "3 pasos para empezar" con % y confetti | `onboarding-retail` existe pero no es obligatorio ni por producto | Alta sin guía |
| **Empty state con CTA** | Ilustración + 1 botón + video 15s | Inconsistente: algunas tablas sí, otras texto plano | Pantallas muertas |
| **Command palette contextual** | Solo acciones del producto activo | `CommandPalette` lista TODO el ERP | Cmd+K contradice modoLite |
| **Tour primer uso** | 4 pasos anclados a UI real | `ProductTour` solo demo, `#sidebar-menu` no existe | Tour no funciona |
| **Dashboard por producto** | 4 KPIs del dolor (deuda, morosos…) | `/dashboard` es ERP completo con gráficos contables | Fiado ve IVA y compras |
| **Mobile bottom nav por producto** | POS/Fiado = 4 íconos fijos | `MobileBottomNav` por rol ERP, no por sub-SaaS | Celular = laberinto |
| **Quick action FAB** | "+" flotante: fiar, cobrar, turno | Hay que buscar en menú | 3+ taps de más |
| **Notificaciones accionables** | "Juan debe $8.200 → Cobrar" | `NotificationCenter` genérico | No empuja acción |
| **Estado offline POS** | Banner + cola de ventas | No visible en UI | Miedo a cortar internet |
| **Búsqueda global** | Cliente, producto, factura en 1 input | Sidebar search + Cmd+K duplicados | Dos buscadores confusos |
| **Ayuda contextual** | Tooltips en el campo que mirás | `ContextualHelp` existe pero no en sub-SaaS | Ayuda genérica |
| **Upsell in-app** | "Sumá factura AFIP" cuando facturás 10 ventas | Catálogo separado en marketing | No monetiza en producto |
| **Branding post-login** | Logo del negocio + nombre del plan | `resolveSidebarBranding` = Claver | Pierde identidad de compra |
| **Página pública del negocio** | Link menú, turnos, tienda con preview | APIs existen, poca promoción en panel | Dueño no sabe que tiene link |
| **Atajos visibles** | Teclado en POS (F2 cobrar, Esc cancelar) | POS enorme, atajos no documentados en UI | Curva de aprendizaje |
| **Skeleton / optimistic UI** | Carga instantánea percibida | `SkeletonKPI` solo en dashboard principal | Resto parpadea |
| **Undo / confirmación destructiva** | "Deshacer fiado" 5 seg | Confirm dialogs inconsistentes | Errores caros en mostrador |
| **Modo kiosco / pantalla táctil** | Botones 48px+, sin hover | POS tiene `?mode=kiosk` pero poco pulido | Touch chico |

### Lo que SÍ tenemos (no rehacer, solo conectar)
- `AppExperienceHeader` + `getFiadoExperience()` en fiado
- `ProductContextBanner` (reciente)
- `activar-intent` → onboarding por producto
- `EmptyStateIllustration` (reutilizar en todas las tablas)
- `CommandPalette` + `cmdk` (filtrar, no borrar)
- `TrialBanner` con countdown
- Temas OKLCH (`theme-customizer`)

---

## BLOQUE A — Product Shell (lo más crítico)

```
BLOQUE A — Product Shell por sub-SaaS

Problema: el cliente compró "Claver Fiado" y ve "Claver" + menú ERP.

Objetivo: sensación de app dedicada sin fork del codebase.

Tareas:
1. Crear `lib/comercial/product-shell.ts` — mapa slug/modoLite → { marca, icono, tabs[], homeKpis[] }
2. Crear `components/comercial/product-shell-layout.tsx`:
   - Header: marca del producto (no Claver ERP)
   - Tabs inferiores mobile (max 4): ej. Fiado = Libreta | Clientes | Avisar | Más
   - Ocultar breadcrumbs ERP y secciones irrelevantes
3. Wrapper en rutas sub-SaaS: `/dashboard/fiado`, `/dashboard/cuentas-cobrar`, `/dashboard/agenda`, `/dashboard/ecommerce`
4. Sidebar desktop: título = app.marca desde sub-saas-catalog cuando modoLite !== completo
5. Redirigir `/dashboard` → dashboardPath del producto si modoLite !== completo

Criterios de aceptación:
- Usuario fiado nunca ve "IVA", "Compras", "Contabilidad" sin buscar
- En mobile, 100% navegable con thumb en bottom tabs
- Tiempo a "anotar fiado" < 3 taps desde login

Archivos base:
- lib/comercial/sub-saas-catalog.ts
- hooks/use-dashboard-shell.ts
- app/dashboard/layout.tsx
- components/mobile-bottom-nav.tsx
```

---

## BLOQUE B — Setup Checklist + Tour real

```
BLOQUE B — Primeros 10 minutos (checklist + tour)

Problema: ProductTour solo corre en demo y apunta a IDs que no existen.

Objetivo: como Notion/Linear — checklist persistente hasta completar.

Tareas:
1. `lib/comercial/setup-checklist.ts` — pasos por producto (ej. fiado: 1 cliente, 1 fiado, 1 límite, 1 WA)
2. API `GET/PATCH /api/config/setup-progress` — persiste en parametroFiscal o tabla nueva
3. Componente `SetupChecklistCard` — sticky en dashboard del producto, barra de progreso
4. Reescribir `ProductTour` con driver.js:
   - Pasos desde setup-checklist
   - IDs reales en DOM (`data-tour="fiado-nuevo"`)
   - Disparar en primer login post-activar (no solo demo)
5. Confetti o toast al 100% + CTA upsell (Cobrá)

Criterios:
- 80% usuarios trial completan paso 1 en primera sesión
- Tour skipeable, no bloquea operación

Archivos:
- components/onboarding/product-tour.tsx
- app/dashboard/fiado/page.tsx (agregar data-tour)
- lib/comercial/activar-intent.ts
```

---

## BLOQUE C — Dashboard por producto (no ERP)

```
BLOQUE C — Home del producto, no home del ERP

Problema: /dashboard muestra ventas del mes, IVA, compras — irrelevante para fiado.

Tareas:
1. `components/dashboard/product-home.tsx` — template con 4 KPIs + 1 gráfico + 3 acciones
2. Por producto:
   - Fiado: deuda total, morosos, fiados hoy, top 5 deudores
   - Cobrá: recuperable, enviados hoy, tasa respuesta
   - Turnos: turnos hoy, no-shows, link público copiable
   - Tienda: pedidos, visitas (placeholder), link tienda
3. Si modoLite !== completo, `/dashboard` renderiza product-home en vez del dashboard ERP
4. Empty states con CTA si KPI = 0

Referencia competencia: Fudo panel simple, Holded cards, Tienda Nube pedidos hoy.

Archivos:
- app/dashboard/page.tsx
- lib/comercial/sub-saas-catalog.ts (definir kpis[] por app)
```

---

## BLOQUE D — Mobile + POS táctil

```
BLOQUE D — Mobile digno de mostrador

Problema: MobileBottomNav es ERP por rol; botones POS pequeños; sin FAB.

Tareas:
1. `MobileBottomNav` lee modoLite + sub-saas → tabs del producto
2. FAB contextual: Fiado="+ Fiado", Cobrá="Enviar recordatorio", Turnos="+ Turno"
3. POS: audit de touch targets (min 44px), modo kiosk por defecto en <768px
4. Barra fija "Caja abierta / Cerrada" visible en POS mobile
5. Offline banner: `navigator.onLine` + cola pendiente (UI only si backend no listo)

Criterios:
- Fiado anotado en celular en <20 segundos en test moderado
- Sin scroll horizontal en POS mobile

Archivos:
- components/mobile-bottom-nav.tsx
- app/dashboard/pos/page.tsx
- app/dashboard/fiado/page.tsx
```

---

## BLOQUE E — Command Palette + búsqueda unificada

```
BLOQUE E — Una sola búsqueda, contextual

Problema: Cmd+K muestra 40 módulos; sidebar tiene otro search.

Tareas:
1. Filtrar ROUTES en command-palette por modoLite + productosSku activos
2. Agregar acciones rápidas: "Nuevo fiado", "Nuevo cliente", "Copiar link turnos"
3. Unificar: topbar search abre mismo CommandDialog (eliminar duplicación)
4. Resultados agrupados: Acciones | Pantallas | Clientes (buscar API si existe)
5. Shortcut hint visible en topbar: "⌘K buscar"

Criterios:
- En modo fiado, Cmd+K muestra máx 8 ítems
- Primera búsqueda "juan" encuentra cliente

Archivos:
- components/command-palette.tsx
- components/topbar.tsx
- hooks/use-dashboard-shell.ts
```

---

## BLOQUE F — Empty states + microcopy en todas las tablas

```
BLOQUE F — Ninguna pantalla muerta

Problema: mitad de módulos dicen "No hay X" sin ilustración ni CTA.

Tareas:
1. Auditoría: listar páginas en app/dashboard sin EmptyStateIllustration
2. Crear `lib/ui/empty-state-presets.ts` — ventas, stock, fiado, agenda, etc.
3. Patrón unificado en DataTable: emptyIcon + actionLabel + onAction
4. Microcopy es-AR: tono mostrador ("Todavía no fiaste a nadie" no "Sin registros")
5. Test visual: story o vitest de que cada preset renderiza

Prioridad páginas sub-SaaS:
- fiado, cuentas-cobrar, agenda, ecommerce, hospitalidad/platos, membresias

Archivos:
- components/empty-state-illustration.tsx
- app/dashboard/**/page.tsx (batch por módulo)
```

---

## BLOQUE G — Notificaciones + upsell in-app

```
BLOQUE G — Notificaciones que cobran

Problema: NotificationCenter no empuja acciones de negocio.

Tareas:
1. Tipos: deuda_vencida, turno_hoy, pedido_nuevo, trial_dia_3
2. Cada notificación: título, monto, botón primario (Cobrar, Ver pedido…)
3. Widget en product-home: "3 morosos — $45.000 recuperables"
4. Upsell card cuando trial día 10: "Sumá Cobrá WA" con precio
5. Conectar a reglas existentes (cobranzas-wa, reglaAlerta) si hay eventos

Archivos:
- components/notification-center.tsx
- components/trial-banner.tsx
- lib/comercial/sub-saas-catalog.ts (upsellSkus)
```

---

## BLOQUE H — Links públicos visibles en panel

```
BLOQUE H — El dueño descubre su link

Problema: tiene /menu/{id}, /agenda-online/{id}, /tienda/{slug} pero no los ve.

Tareas:
1. Componente `PublicLinkCard` — copiar, QR preview, abrir en nueva pestaña
2. En panel de cada producto con publicPath: turnos, tienda, menú
3. Onboarding checklist incluye "Compartí tu link"
4. WhatsApp share nativo en mobile (`whatsapp://send?text=`)

Archivos:
- lib/comercial/sub-saas-catalog.ts (formatPublicPath)
- app/dashboard/agenda/page.tsx
- app/dashboard/ecommerce (o page equivalente)
- app/dashboard/hospitalidad/platos/page.tsx
```

---

## Orden de ejecución recomendado

| Prioridad | Bloque | Impacto en "no perderse" |
|-----------|--------|--------------------------|
| 1 | **A** Product Shell | Máximo |
| 2 | **C** Dashboard producto | Alto |
| 3 | **B** Checklist + tour | Alto |
| 4 | **D** Mobile + FAB | Alto (calle) |
| 5 | **E** Cmd+K contextual | Medio |
| 6 | **H** Links públicos | Medio (venta) |
| 7 | **F** Empty states | Medio (pulido) |
| 8 | **G** Notificaciones | Medio (retención) |

Secuencial para 1 dev: **A → C → B → D → E → F → H → G**

Paralelo Gemini (3 sesiones):
- Sesión 1: A + C
- Sesión 2: B + D
- Sesión 3: E + F + H + G

---

## Verificación UX (todas las sesiones)

```bash
npx vitest run __tests__/comercial/
```

Checklist manual:
- [ ] Login con `?activar=fiado` → en 30s está en libreta con checklist visible
- [ ] Mobile 375px: navegar fiado sin abrir sidebar
- [ ] Cmd+K en modo fiado: ≤8 resultados
- [ ] /dashboard no muestra gráfico IVA en modo fiado
- [ ] Empty state en fiado sin clientes tiene botón "Cargar primer cliente"

---

## Frase para el brief comercial

> "Otros te venden una app. Nosotros te meten un ERP."
> 
> Hasta completar estos bloques, el cliente tiene razón. El empaquetado comercial está; la experiencia de producto todavía no.
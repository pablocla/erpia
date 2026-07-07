# Flujos SaaS — Servicios intangibles (Claver combate)

Documento de referencia para producto, ventas y UX. Cubre el recorrido **prospecto → trial → activación → retención** de los 8 productos combate.

## Productos combate y packs

| Slug | Marca | Pack pool | Golden path post-login |
|------|-------|-----------|------------------------|
| fiado | Claver Fiado | pool-calle | `/dashboard/fiado` |
| cobra | Claver Cobrá | pool-cobranza | `/dashboard/cuentas-cobrar` |
| monotributo | Claver Monotributo | pool-monotributo | `/dashboard/ventas/presupuestos` |
| servicios | Claver Servicios Pro | pool-servicios-pro | `/dashboard/agenda` |
| obra | Claver Obra | pool-obra | `/dashboard/nicho/obras` |
| propiedad | Claver Propiedad | pool-propiedad | `/dashboard/nicho/consorcios` |
| turnos | Claver Turnos | pool-turnos | `/dashboard/agenda` |
| pos | Claver POS | pool-pos | `/dashboard/pos` |

## Flujo comercial (prospecto)

```mermaid
flowchart LR
  A[Tráfico / SEO / Calle] --> B{Puerta de entrada}
  B --> C["/claver/apps/{slug}"]
  B --> D["/demo/{industry}"]
  C --> E[Demo embebida interactiva]
  E --> F{CTA}
  F --> G["/login/register?activar={slug}"]
  G --> H[Provisioning tenant]
  H --> I[Trial 14d sin tarjeta]
  I --> J[Dashboard modoLite]
```

### Momentos críticos de conversión

1. **Hero + mockup** — el prospecto debe poder *tocar* la app (tabs, WA, liquidar) sin salir de la landing.
2. **Registro con intent** — `activar-intent` resuelve slug → pack + `modoLite` correcto.
3. **Primer login** — sidebar lite + bottom nav con tabs del producto (no el ERP completo).
4. **Día 11–14 trial** — pill en topbar + upsell en `/dashboard/mi-plan`.

## Flujo post-login (tenant activo)

```mermaid
flowchart TB
  subgraph Nav["Capa de navegación"]
    TB[Topbar: ProductContextPill + TrialPill]
    SB[Sidebar lite por producto]
    MB[Mobile bottom nav tabs]
  end
  subgraph Core["Golden path por producto"]
    GP1[Acción primaria shell]
    GP2[Módulo satélite cobros/WA]
    GP3[Mi plan / upsell]
  end
  Login --> Nav
  Nav --> GP1
  GP1 --> GP2
  GP2 --> GP3
  GP3 --> MP[Mercado Pago suscripción]
```

## Demo embebida (landings)

Arquitectura actual:

```mermaid
flowchart LR
  MBC[MarketingBrowserChrome] --> MAS[MarketingAppShell]
  MAS --> DATA[product-mock-data.ts]
  MAS --> PS[PRODUCT_SHELLS tabs]
  MAS --> UI[MockKpiGrid / MockActionButton / Toast]
```

**Patrón gold:** POS (`claver-pos-mockup`) y ahora todos los combate vía `MarketingAppShell`:
- Mini-sidebar + tabs móvil
- Datos mock es-AR (CUIT, ARS, mora, AFIP)
- Acciones con loading → toast de éxito
- Trial pill simulado

## Gaps UX resueltos (jul 2026)

| Gap | Solución |
|-----|----------|
| Mockups estáticos sin interactividad | `MarketingAppShell` + datos centralizados |
| Usuario no sabe qué producto usa | `ProductContextPill` en topbar |
| 8 productos sin hub claro | Dropdown → Mi plan / Más apps / catálogo |
| Documentación dispersa | Este doc + runbooks marketplace |

## Gaps UX pendientes (prioridad)

| Prioridad | Gap | Propuesta |
|-----------|-----|-----------|
| P1 | Onboarding vacío día 1 | Checklist por `modoLite` (ya existe widget; falta seed por pack servicios) |
| P1 | Breadcrumb oculto en lite | Mostrar `Marca › Módulo` en móvil cuando `modoLite !== completo` |
| P2 | Command palette no prioriza shell | Filtrar acciones por `getActiveProductShell` |
| P2 | Marketing nav sin mega-menú productos | Dropdown "Apps" en `claver-shell` con los 8 slugs |
| P3 | Sin diagrama en app | Tooltips contextuales en primer uso (ProductTour) |

## Flujo por vertical — Servicios intangibles

### Monotributo / freelance

```mermaid
sequenceDiagram
  participant U as Usuario
  participant P as Presupuestos
  participant C as Cobros
  participant A as AFIP
  participant W as WhatsApp
  U->>P: Crear presupuesto
  P->>W: Enviar link al cliente
  U->>P: Marcar aceptado
  P->>A: Emitir Factura C
  A-->>U: CAE OK
  C->>W: Recordatorio seña pendiente
```

### Servicios Pro (agenda + presupuesto + cobro)

```mermaid
sequenceDiagram
  participant T as Técnico
  participant Ag as Agenda
  participant Pr as Presupuestos
  participant Co as Cobros
  T->>Ag: Confirmar turno
  Ag->>T: Estado En camino
  T->>Pr: Presupuesto en sitio
  Pr->>Co: Cuenta por cobrar
  Co->>T: Link pago / WA mora
```

### Obra (jornales + hitos)

```mermaid
sequenceDiagram
  participant C as Contratista
  participant O as Obra
  participant L as Liquidación
  participant Cl as Cliente obra
  C->>O: Registrar jornales
  O->>L: Liquidar viernes
  C->>Cl: Aviso hito pendiente
  Cl-->>C: Pago hito
```

### Propiedad (expensas + portales)

```mermaid
sequenceDiagram
  participant A as Administrador
  participant E as Expensas
  participant M as Morosos
  participant Po as Portales
  A->>E: Liquidar mes
  E->>M: UF en mora
  M->>A: WA cobro 1 toque
  Po-->>A: Sync publicaciones
```

## Métricas sugeridas (instrumentación)

- `landing_mock_interaction` — tab cambiado, botón WA, liquidar
- `signup_activar_slug` — slug en registro
- `trial_day_n_active` — módulos visitados por día
- `product_switcher_open` — uso del pill en topbar
- `upgrade_click_mi_plan` — desde trial pill

## Referencias en código

- Mock data: `lib/marketing/product-mock-data.ts`
- Shell demo: `components/marketing/marketing-app-shell.tsx`
- Product shells: `lib/comercial/product-shell.ts`
- GTM vitrine: `lib/comercial/go-to-market-vitrine.ts`
- Activación: `lib/comercial/activar-intent.ts`
- Nav post-login: `components/dashboard/product-context-pill.tsx`
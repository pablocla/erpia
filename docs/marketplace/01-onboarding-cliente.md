# 01 — Onboarding del cliente

## Objetivo

Llevar a un prospecto desde el primer contacto hasta un tenant activo con al menos un SKU del marketplace contratado o en trial.

## Funnel comercial (prospecto → tenant activo)

```mermaid
flowchart TB
  subgraph entrada [Canales]
    W[/claver/apps web]
    D[Dashboard App Store]
    ADS[trial_ads]
    IA[upsell IA]
  end
  subgraph alta [Alta tenant CCA-010]
    REG[Registro o Provisioning analista]
    TEN[Empresa + admin + plan]
    CCA[ProyectoImplementacion opcional]
  end
  subgraph onboard [CCA-020]
    MAIL[Pack ONBOARD email]
    DASH[Primer login /dashboard]
  end
  subgraph mkt [Marketplace]
    DISC[Descubrir SKU o bundle]
    BUY[Checkout primer SKU]
  end
  W --> REG
  D --> REG
  ADS --> REG
  IA --> DISC
  REG --> TEN --> CCA
  TEN --> MAIL --> DASH
  DASH --> DISC --> BUY
```

Ver ciclo maestro: [00-ciclo-completo](./00-ciclo-completo.md).

## Canales de entrada

| Canal | `origen` en orden | Notas |
|-------|-------------------|-------|
| Web pública `/claver/apps` | `web` | AutoPool, SEO, ads |
| Dashboard App Store | `dashboard` | Cliente ya autenticado |
| Trial por ads | `trial_ads` | 14 días según SKU |
| Upsell desde IA | `upsell` | Asistente sugiere SKU |

## Fases del onboarding

### Fase 0 — Alta tenant (CCA-010)

1. Cliente completa registro o analista crea tenant en **Claver Cloud → Provisioning**.
2. Se crea `Empresa`, usuario admin, plan comercial base.
3. Opcional: `ProyectoImplementacion` con analista lead asignado.

**Responsable:** analista provisioning o self-service.

### Fase 1 — Pack ONBOARD (CCA-020)

1. Email automático con credenciales y primeros pasos.
2. Si hay proyecto CCA, `packOnboardEntregado = true` al enviar.
3. Cliente accede a `/dashboard` y ve módulos del plan.

### Fase 2 — Descubrimiento marketplace

1. Cliente entra a **Dashboard → Apps** (`/dashboard/apps`) o web `/claver/apps`.
2. Filtra por categoría, nicho AutoPool o bundle comercial.
3. Lee descripción, precio, nivel de automatización (`autoCertLevel`).

### Fase 3 — Primera compra / activación

1. Click **Obtener App** → `POST /api/marketplace/checkout`.
2. Orden `MarketplaceOrden` estado `paid` (mock; producción: pasarela).
3. `provisionOrden()` dispara un `MarketplaceProvisionJob` por SKU.

### Fase 4 — Asignación analista (si aplica)

Para `SEMI_AUTO` y `HUMAN_GATE`:

1. Sistema resuelve analista: `AnalistaAsignacion` → `ProyectoImplementacion.analistaEmail` → fallback env.
2. Crea `MarketplaceTareaAnalista` con runbook embebido.
3. Email al analista (si `RESEND_API_KEY` configurado).

## Asignación contra-analista

El **contra-analista** (lead o rol `marketplace`) es quien:

- Asigna analistas a clientes en **Settings → Assignments**.
- Revisa cola en **Claver Cloud → Marketplace**.
- Escala si el checklist no avanza en 48h.

```typescript
// Rol en asignación
rolAsignacion: "lead" | "implementacion" | "marketplace" | "soporte"
```

## Checklist onboarding analista

- [ ] Tenant creado y CUIT validado
- [ ] Admin puede iniciar sesión
- [ ] Plan comercial y módulos base activos
- [ ] Asignación analista creada (`AnalistaAsignacion`)
- [ ] Cliente sabe entrar a App Store
- [ ] Primer SKU contratado o trial iniciado
- [ ] Si SEMI_AUTO: tarea visible en torre marketplace

## Métricas

- Tiempo hasta primer SKU activo
- % SKUs GLOBAL_AUTO vs con tarea analista
- Pack ONBOARD entregado &lt; 24h

## Siguiente paso

→ [02 — Activación de producto](./02-activacion-producto.md)
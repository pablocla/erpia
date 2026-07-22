# Gatillos por índice de inflación — Claver platform + tenant

**Fecha:** 2026-07-22  
**Origen:** diagnóstico comercial (Fiado Protegido / IPC) extraído de `docs/qa/COHERENCIA_NAV_RUBRO_NICHOS.md`.

---

## 1. Problema

En Argentina el peso nominal se licúa. Hay **dos lados** que necesitan un gatillo de índice:

| Actor | Dolor | Gatillo |
|-------|--------|---------|
| **Vos (dueño Claver)** | Packs en ARS fijos pierden valor real; cobrás menos en poder adquisitivo | Indexar **precios de suscripción / catálogo** |
| **Tu usuario (comerciante)** | Fiado y CxC en nominal es “ilusión de cobro” | Reexpresar / alertar deudas y precios de lista |
| **Deudor del comerciante** | Transparencia si hay ajuste | Mensajes con nominal + ajustado + gracia |

---

## 2. Arquitectura

```text
                    ┌─────────────────────┐
                    │  Catálogo índices   │
                    │  IPC / UVA / manual │
                    │  lib/inflacion/     │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
   billing_claver          fiado / cxc        listas_precio
   (Claver cobra)          (tenant cobra)     presupuestos
           │                   │                   │
   resolvePrecioSku      valuarDeudaTenant    valuarPrecioLista
   CLAVER_INDEXAR_*=1    policy por empresa   policy por empresa
```

### Código

| Path | Rol |
|------|-----|
| `lib/inflacion/*` | Core: store IPC, reexpresar, policies, triggers |
| `app/api/inflacion/ipc` | GET/POST índices |
| `app/api/inflacion/config` | Policies tenant |
| `app/api/inflacion/reexpresar` | Preview valuación deuda |
| `app/api/inflacion/billing-preview` | Preview precio pack Claver |
| `lib/comercial/ofertas-comerciales.ts` | `resolvePrecioSku` aplica indexación si env on |

### Env (plataforma Claver)

```bash
# Activar indexación de precios de catálogo al cobrar a tenants
CLAVER_INDEXAR_PRECIOS=1
# Período en que se fijaron los precios de lista actuales
CLAVER_PRECIO_BASE_PERIODO=2026-01
```

---

## 3. Gatillo A — Dueño Claver (billing)

**Policy:** `billing_claver` (scope platform).

**Fórmula:**  
`precio_hoy = precio_base × (IPC_hoy / IPC_base_periodo)`  
con tope comercial de variación acumulada (default 50% en policy; ajustar).

**Uso:**

```ts
import { indexarPrecioCatalogo, resolvePrecioIndexadoSiAplica } from "@/lib/inflacion"

indexarPrecioCatalogo(24900) // preview
resolvePrecioIndexadoSiAplica(24900) // solo si CLAVER_INDEXAR_PRECIOS=1
```

**Checkout / ofertas** ya pasan por `resolvePrecioSku` → indexa si el flag está on.

**Comunicación al tenant (recomendado en Términos):**  
“El abono se reexpresa según índice de precios de referencia con tope y aviso.”

---

## 4. Gatillo B — Tenant (usuario del ERP)

Subsystems: `fiado` | `cxc` | `cxp` | `listas_precio` | `presupuestos` | `custom`

**Default MVP (legal-safe):**

- `activo: false` o `soloInformativo: true`  
- El comerciante **ve** pérdida de poder adquisitivo  
- El saldo cobrable sigue **nominal** hasta que active “cobro indexado” y valide legal

**API config:**

```http
PATCH /api/inflacion/config
{ "subsystem": "fiado", "activo": true, "soloInformativo": true }
```

**Valuación:**

```http
POST /api/inflacion/reexpresar
{
  "modo": "tenant",
  "subsystem": "fiado",
  "montoOriginal": 10000,
  "fechaOrigen": "2026-01-15"
}
```

Respuesta incluye:

- `montoCobrableHoy`
- `reexpresion` (factor, IPC origen/valuación)
- `mensajeComerciante` / `mensajeDeudor` (copy WA)

---

## 5. Fiado Protegido (producto)

| Plan | Comportamiento |
|------|----------------|
| Free / ancla | Nominal only + opcional badge “pérdida estimada” off |
| Pack intermedio | Informativo ON (soloInformativo) |
| Pack premium “Fiado Protegido” | `soloInformativo: false` + gracia hasta día 15 + WA con copy dual |

**No es interés por defecto:** es reexpresión por índice. Requiere revisión legal (convenio, usura, CCyC).

---

## 6. Integración futura por módulo

| Módulo | Hook sugerido |
|--------|----------------|
| Fiado UI | Card deuda: nominal + ajustado + pérdida |
| Leo Cobranza / WA | Usar `mensajeDeudor` del valuador |
| CxC aging | Columna “valor hoy (IPC)” |
| Listas precio | Job mensual reexpresa precios base |
| Contabilidad | Ya existe ajuste por inflación contable (separado) |
| Claver Cloud billing | Preview + aplicar `indexarPrecioCatalogo` en MP |

---

## 7. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Legal / usura | Abogado; default informativo; opt-in cobro indexado |
| Rechazo social barrio | Gracia + transparencia + no default agresivo en free |
| IPC tarde | `diaPublicacion=15` + último índice disponible |
| Seed desactualizado | POST `/api/inflacion/ipc` o job mensual |
| Inflación de precios Claver | Tope + comunicación + plan anual |

---

## 8. Métricas

**Platform:** ARPU real vs nominal; % tenants con precio indexado.  
**Tenant:** DSO; % deudas con valuación vista; upgrades a Fiado Protegido.

---

## 9. Estado implementación

| Pieza | Estado |
|-------|--------|
| Core reexpresar + IPC store | Hecho |
| Policies platform + tenant | Hecho (memoria; persistir Prisma opcional) |
| Billing hook en resolvePrecioSku | Hecho (flag env) |
| APIs ipc/config/reexpresar/billing-preview | Hecho |
| UI fiado “pérdida IPC” | **Hecho** panel en `/dashboard/fiado` (informativo opt-in) |
| Job INDEC real | Pendiente |
| Persistencia policy en DB | Pendiente |

---

*Doc vivo — módulo `lib/inflacion`.*

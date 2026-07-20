# Demos automáticas + auto-suscripción + Gemini

## Objetivo

Que el producto se venda y se demuestre **sin intervención humana** cuando es posible.
Analista Claver o vos intervienen solo en:

| Caso | Quién |
|------|--------|
| Demo rota (checks fail) | Dev / analista |
| SKU `planned` / “Próximamente” | Producto (no vender) o analista |
| Setup one-shot, hardware POS, AFIP prod | Analista / implementador |
| Cliente no puede pagar / excepción comercial | Analista |
| Todo lo demás (ancla gratis, trial, pago MP) | **Sistema** |

---

## Política (`lib/comercial/product-auto-subscribe.ts`)

| Mode | Significado | Auto-activa |
|------|-------------|-------------|
| `auto_free` | Ancla gratis (ej. `pos.fiado_barrio`) | Sí, permanente |
| `auto_trial` | Demo / registro / `?activar=` | Sí, con trial |
| `auto_paid` | Marketplace / billing | No (checkout MP del cliente) |
| `analyst` | Setup, hardware, grises | Solo `ops_force` |
| `blocked` | SKU planned | Nunca |

---

## Validación de demos

### Determinística (siempre)

`lib/comercial/demo-health-validator.ts`

1. Provision empresa QA aislada (`qa-demo-{hash}@claver.com.ar`)
2. Checks: empresa, SKUs, seeds (clientes/productos/usuario), golden path
3. Verdict: `auto` | `needs_analyst` | `failed`

### Gemini (opcional)

`lib/comercial/demo-gemini-auditor.ts` — usa `aiService` (Gemini si hay key).
Si no hay IA, resumen local. **No inventa bugs**: solo prioriza checks fallidos.

---

## Cómo usarlo

### Panel analista

1. Login como analista Claver  
2. `/claver-cloud/demo-health`  
3. “Validar demos featured” (+ checkbox Gemini)

### API

```http
GET  /api/claver/demo-health          # catálogo + política
POST /api/claver/demo-health
Content-Type: application/json
Authorization: Bearer <token analista>

{ "mode": "featured", "withGemini": true, "skipHttp": true }
```

Modes: `featured` | `one` (+ `industryId`) | `empresa` (+ `empresaId`, `industryId`).

### CLI / CI

```bash
npx tsx scripts/validate-industry-demos.ts
npx tsx scripts/validate-industry-demos.ts almacen gimnasio --gemini
```

Exit code `1` si alguna demo `failed`.

### Prompt Gemini manual (browser)

Seguir checklist en `docs/qa/gemini-validacion-funcional.md` + resultados de este validador.

---

## Flujo comercial ideal

```
Landing /demo → provision auto (SKUs trial/ancla)
     → cliente usa wow moment
     → upgrade: MP checkout auto (sin analista)
     → si setup/hardware/AFIP: ticket a analista
```

Registro con `?activar=sku` → `applyActivarIntent` (ya auto-trial).

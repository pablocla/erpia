# Partner + Billing — monetización

**Alineación go-live / packs vendibles en PRD:** [`docs/GO_LIVE_PRD.md`](../GO_LIVE_PRD.md) (§7 flujo de dinero, §5 MP).

## Prioridad de cobro (cliente)

1. **Ancla gratis** → auto, sin MP  
2. **Crédito partner** (si el pagador es partner con saldo) → sin MP, retiene valor en Claver  
3. **Mercado Pago** preapproval (prod) o mock (dev)

## Referidos

```
?ref=CODIGO → signup asigna partner
cliente paga MP → comisiones N1/N2 (pendiente)
partner:
  a) Pagar mi Claver con crédito  → credito_aplicado + SKUs activos
  b) Solicitar retiro cash        → solicitado → Cloud liquida
  c) Contador gratis (3 pagos)    → data.reportes_prog forever
```

## APIs

| Ruta | Rol |
|------|-----|
| `POST /api/billing/create-subscription` | Cliente / partner |
| `POST /api/billing/subscribe` | SKU puntual |
| `POST /api/billing/sync-subscription` | Sync MP local |
| `POST /api/billing/confirm-mock` | Solo mock |
| `GET/POST /api/partners/me` | Portal partner |
| `GET/POST /api/claver/partners/liquidaciones` | Analista cash |

## UI

- `/dashboard/partner-portal` — crédito + cash + contador  
- `/dashboard/mi-plan` — upgrade (crédito primero)  
- `/claver-cloud/partners` — cola de liquidación cash  

## Env

- `MP_ACCESS_TOKEN` real → cobro real  
- sin token o `TEST-mock` → mock checkout  
- `MARKETPLACE_CHECKOUT_MOCK=false` en prod para no mock  

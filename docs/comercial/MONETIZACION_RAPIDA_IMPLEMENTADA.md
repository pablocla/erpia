# Monetización rápida implementada

Prioridad: **fácil + rentable** sobre código ya existente.

## Ranking implementado

| # | Idea | Esfuerzo | Qué se hizo |
|---|------|----------|-------------|
| 1 | **Dunning de trial** | Bajo | Cron diario + alertas + email opcional |
| 2 | **Partner link con producto** | Bajo | `?ref=&activar=fiado` por defecto |
| 3 | **Techo de uso IA** | Bajo | Soft limit 100 chat/mes → HTTP 402 |
| 4 | **Pack Contador + setup fee** | Bajo | Oferta comercial + constantes setup |

## Dunning

- Servicio: `lib/comercial/trial-dunning-service.ts`
- Cron: `GET/POST /api/cron/trial-dunning` (auth `CRON_SECRET`)
- Vercel: `vercel.json` → diario 12:00 UTC
- Ventanas: 3 días, 1 día, vencido (idempotente)

Probar local:

```bash
curl -X POST http://localhost:3000/api/cron/trial-dunning
# o con secret: -H "Authorization: Bearer $CRON_SECRET"
```

## IA usage

- `lib/ai/usage-meter.ts`
- Enganche en `/api/ai/chat`
- Env: `AI_MONTHLY_SOFT_LIMIT` (default 100). Límite 0 en suscripción = ilimitado.

## Partner

- Link del portal: `/login/register?ref=CODIGO&activar=fiado`
- Landing: `/claver/partners`

## Contador / setup

- `OFERTA_CONTADOR` en `ofertas-comerciales.ts` ($19.900)
- `SETUP_FEE_ARS` = 50.000 · SKU `impl.setup_one_shot` (constante para checkout futuro)

## Completado en 2ª ola

| Feature | Rutas / archivos |
|---------|------------------|
| **Contador multi-empresa** | `/dashboard/contador`, `/api/contador/clientes`, `lib/contador/multi-empresa-service.ts` |
| **Cobranza as a Service** | `/dashboard/cobranza-aas`, `/api/cobranza-aas`, fee en cobros/fiado |
| **Hardware POS** | `/dashboard/hardware-setup`, `/api/hardware-bundle` |

## SQL

`prisma/migrations/manual_afiliados_partner.sql` (incluye tablas contador + cobranza AAS)

## Aún pendiente (ops / legal)

- Impersonación full del contador en tenant del cliente
- Liquidación CBU automática de fees/comisiones
- Venta física de hardware (logística)

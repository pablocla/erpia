# Programa Partner Claver

> Canal de ventas y comisiones sobre **producto real** (POS, fiado, cobranzas, packs).  
> **No es pirámide:** solo 2 niveles; comisión si el cliente **paga**.

## URLs

| Superficie | Ruta |
|------------|------|
| Landing pública | `/claver/partners` |
| Portal (logueado) | `/dashboard/partner-portal` |
| Registro con ref | `/login/register?ref=CODIGO` |
| Legacy Clavernet | redirige a landing / portal |

## Tasas (código: `lib/partners/affiliate-config.ts`)

| Rol | N1 (directo) | N2 (padre del partner) |
|-----|--------------|-------------------------|
| Seller / hybrid | 30% | 5% |
| Implementer | 20% | 5% |

## Flujo técnico

1. Partner activa portal → `PartnerProfile` + `referralCode`.
2. Cliente se registra con `?ref=` → `Empresa.referredByPartnerId`.
3. Cliente paga suscripción → `activarSuscripcionPagada` → `onSuscripcionPagada` → `ComisionPartner`.
4. Partner solicita retiro → estado `solicitado`.
5. Admin liquida → `POST /api/partners/admin/liquidar` → `liquidado`.

## SQL

Ver `prisma/migrations/manual_afiliados_partner.sql`.

## Tests

```bash
npx vitest run __tests__/billing/afiliados.test.ts
```

## Ética / TikTok

Ver conversación comercial: vender dolor de fiado/POS + link ref; nunca “ganancias garantizadas por reclutar”.

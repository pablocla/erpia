# Programa Partner Claver

> Canal de ventas y comisiones sobre **extras pagos** (Cobrá, AFIP, 2ª caja, setup).  
> **No es pirámide:** solo 2 niveles; comisión si el cliente **paga**. La ancla $0 no genera comisión: es el gancho.  
> Consenso: `DISCUSION_GROK_CLAUDE_LANDING_FREE_PARTNERS.md` §G.

## URLs

| Superficie | Ruta |
|------------|------|
| Landing pública | `/claver/partners` |
| Calle / QR del partner | `/f?ref=CODIGO` |
| Alta | `/login/register?activar=pos.fiado_barrio&ref=CODIGO` |
| Portal (logueado) | `/dashboard/partner-portal` |
| Legacy Clavernet | redirige a landing / portal |

## Tasas (código: `lib/partners/affiliate-config.ts`)

| Rol | N1 (directo) | N2 (padre del partner) |
|-----|--------------|-------------------------|
| Seller / hybrid | 30% | 5% |
| Implementer | 20% | 5% |

Bounty: **100% del primer mes de cada extra** (no del alta $0).  
Célula: **$500.000 ARS** o **20 comercios que paguen**.  
HUM-03: Claude propone 25% seller / 30% hybrid / 20% implementer. Código sigue 30/20 hasta HUM.

## Cómo gana (y cómo no)

| Hecho | Comisión |
|-------|----------|
| Registro + fiado $0 | $0 |
| Extra pago (Cobrá, AFIP, 2ª caja, users) | N1 30% seller / 20% implementer |
| Primer mes de ese extra | Bounty 100% |
| Setup cobrado al comercio | 100% a quien implementa |
| Take rate del riel MP | No se promete en landing. Ver `MODELO_TAKE_RATE_RIEL_INTERNO.md` |

## Liquidación

1. Partner activa portal → `PartnerProfile` + `referralCode`.
2. Cliente se registra con `?ref=` (vía `/f`) → `Empresa.referredByPartnerId`.
3. Cliente **paga extra** → `onSuscripcionPagada` → `ComisionPartner`.
4. Crédito interno 60 días (paga su propio Claver).
5. Retiro cash: comisiones con **≥ 60 días**. Admin liquida.
6. Clawback **30 días** si hay reembolso del extra (`estado: anulado`).

## KPI del portal

Primario: **comercios que pagan**.  
Secundario: ancla $0 con microcopy “todavía no te genera; ofrecele Cobrá”.

## Tests

```bash
npx vitest run __tests__/billing/afiliados.test.ts __tests__/partners/commission-simulator.test.ts
```

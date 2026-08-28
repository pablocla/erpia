# Modelo interno — take rate del riel (no público)

**Fecha:** 2026-08-26  
**Owner:** grok · revisión HUM  
**Estado:** interno. **No** copiar a landings ni ads.  
**Fuentes:** `COSTOS_VERCEL_SUPABASE_TAKE_RATE.md`, `DISCUSION_GROK_CLAUDE_LANDING_FREE_PARTNERS.md` §D.5 / §G E12

Tesis: el POS/fiado $0 se cubre con un **% chico de la plata que ya pasa por Claver** (link MP / ClavPay), no con un % del ticket en efectivo.

## Qué no se dice afuera

- Ningún % en `/f`, `/claver/partners`, calcos ni TikTok.
- El partner **no** cobra un recorte del cobro al deudor del kiosco.

## Esqueleto (HUM firma números)

| Capa | Quién | Qué |
|------|-------|-----|
| Cobro al deudor | El kiosco | 100% del fiado, menos el riel MP |
| Take Claver | Claver | % chico **nuestro** sobre el link (HUM) |
| Share partner | Partner N1 | Recorte de **nuestro** take, no del cobro. Solo si HUM lo habilita. Hoy: **0**. Comisión vigente = extra mensual |

Hasta que Cobrá esté en masa: comisión = item shop + setup. Cuando haya volumen de links, HUM define take y si el partner entra al riel.

## Relación con infra

Ancla activa ~USD 0,70/mes. El take tiene que cubrir anclas que nunca prenden extra + el 30% de comisión del extra. Si el take se publica antes de tener mix real, Maxikiosco gana el relato (“te cobran por vender Coca”).

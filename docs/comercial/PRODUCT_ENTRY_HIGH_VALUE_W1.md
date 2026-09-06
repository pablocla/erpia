# Entradas de producto — mayor valor (post-pivot Pablo 2026-09-06)

**Decisión:** Fiado (`pos.fiado_barrio` / `/f`) **no** es el centro de estrategia ni de pauta masiva. Queda como **anexo/ancla** kiosco-barrio (baja ARPU, audiencia no target).  
**GO_LIVE_PRD** sigue mandando. Producto prioriza packs/rubros de mayor valor.

## Tier A — vender / ads / landings (GO_LIVE §3.1)

| Prioridad | Pack | Enganche / activar | Landing entrada (propuesta) | Golden path | Promesa OK |
|-----------|------|--------------------|-----------------------------|-------------|------------|
| 1 | Ferretería mostrador | `ferreteria` | `/ferreteria` o puerta home | ventas / POS + stock + CC | Stock, venta, cuenta corriente simple |
| 2 | Servicios pro liviano | `pool-servicios-pro` / `niche.oficios` | `/f/servicios` (reframe) o `/servicios` | agenda + presupuestos + CxC | Cotizar, seña, cobrar — **no** OT field |
| 3 | Gym / cuotas | `gimnasio` / `niche.gimnasio_barrio` | `/gimnasio` | membresías | Socios, planes, morosos, cobro manual |
| 4 | POS + factura mostrador | `pos.core` | `/pos` o retail genérico | `/dashboard/pos` | Ticket/factura según AFIP tenant |
| 5 | Cobrá WA | `intang.cobranzas_wa` | landing Cobrá WA | CxC | Recordatorios (si Twilio) |

## Tier B — piloto con alcance escrito (GO_LIVE §3.2)

| Pack | Enganche | Promesa máxima | No prometer |
|------|----------|----------------|-------------|
| Veterinaria | `veterinaria` | Fichas, consultas, mostrador, agenda | HIS / lab / portal tutor |
| Consultorio / clínica | (agenda + HC) | Turnos particular + factura simple | OS / nomenclador |
| Corralón / distribuidora | retail / preventa (piloto) | POS + stock + CC | Multi-depósito industrial |
| Taller mecánico | taller | Órdenes simples + stock básico | Taller industrial full |

## Tier C — anexo (no ads volumen)

| Pack | Enganche | Rol |
|------|----------|-----|
| Libreta Fiado kiosco | `pos.fiado_barrio` → `/f` | Anexo barrio; ancla $0 opcional; **no** ICP Meta principal |

## Qué cambia YA

1. **Marketing:** creativos/volumen → Tier A (ferretería, servicios, gym primero). UTMs/Pixel pueden vivir en esas landings; `/f` deja de ser destino Ads default.
2. **Comercial:** pitch §3.1 alto valor; Fiado solo si el lead es kiosco/almacén explícito.
3. **Eng (CTO):** no tumbar el trabajo UX `/f` (sigue válido para anexo). PR2 Pixel: priorizar eventos en landings Tier A cuando existan; `/f` opcional.
4. **Site Audit / CRO:** próximo foco landings Tier A, no solo `/f`.
5. **Finanzas:** rankear ICP/ARPU Tier A vs Fiado (piso eng ~USD 46/mes) para confirmar orden 1–5.

## Specs de entrada (mínimo por pack)

Cada landing Tier A debe tener:
- CTA ≥48px + copy del dolor del rubro (sin ERP jerga)
- `activar=<enganche>` en register
- Demo `/demo/<rubro>` si existe seed
- Promesa acotada a GO_LIVE (tabla arriba)

Owner Producto: este doc. Copy: Marketing. Precios/ARPU: Finanzas+Comercial. Install: CTO.

— Producto Claver · 2026-09-06

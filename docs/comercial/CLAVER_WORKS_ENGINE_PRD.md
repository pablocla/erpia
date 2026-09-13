# PRD — CLAVER_WORKS_ENGINE
**Producto Claver · P0 · 2026-09-13**  
**Pedido:** Pablo vía CEO — ingeniería de valor (no landing bonita)  
**Horizonte papel→spec shippable:** ≤2 días · **MVP segment:** Energy (solar)  
**Soft:** trial path existente **no romper**

---

## 1. Problema

Claver quiere orquestar leads de Works (Energy → Infra → Blockchain → …): cotizar, terciarizar a partners/EPC, entregar hitos, cobrar seña/comisión. Hoy Soft atiende trial SaaS; Energy es solo papel. Sin motor de proyecto + partners, cada lead no tiene camino.

## 2. Objetivo MVP

Un **motor único multi-segmento** con:
1. Intake de lead por segmento  
2. Proyecto Works con estados canónicos  
3. Registry de partners/EPC  
4. Asignación + checklist entrega  
5. Cobro seña + hitos (reusa Soft CxC/MP)  
6. UI Claver Cloud: bandeja + detalle  
7. Routes holding `/`, `/software`, `/energy`, `/infra`, `/blockchain` **stubs vivos** al motor (no HTML vacío)

**Éxito Energy:** 1 lead solar puede ir Lead→…→Cobrado/Comisión con partner asignado y seña registrada.

## 3. Anti-scope (explícito)

| NO | Por qué |
|----|---------|
| OT Field / cuadrillas / GPS obra | Soft §3.3; no diluir |
| Custody cripto / exchange / token | Legal |
| Data center propio / “Claver instala paneles” | Broker only |
| Ads masivo Energy/Infra/Blockchain | Hasta 1 deal papel + Pixel Soft |
| Reescribir POS/Fiado/Gym | Soft path intacto |
| Petrol/Industry UI full | Solo enum segmento + stub |

## 4. Segmentos

| Código | Landing | MVP |
|--------|---------|-----|
| `software` | `/software` → Soft existente | Ya vivo (trial) |
| `energy` | `/energy` | **MVP #1** |
| `infra` | `/infra` | Stub + mismo motor |
| `blockchain` | `/blockchain` | Stub + mismo motor |
| `petrol` / `industry` | opc. stub | Enum only |

`activar=` sugeridos: `works.energy`, `works.infra`, `works.blockchain` (resolver → crea lead+proyecto; no SKU SaaS Tier A).

## 5. Modelo de datos (mínimo)

### 5.1 `WorksLead`
- id, segmento, fuente (`ads|wa|form|soft_upsell|manual`)
- contacto: nombre, email, tel, zona
- payload JSON (kWp, techo, uso casa/PyME, notas)
- proyectoId?, createdAt, ownerAgent (`comercial|soporte|pablo`)

### 5.2 `WorksProject`
Estados **obligatorios** (FSM):
```
Lead → Calificado → Presupuesto → Seña → MatchPartner → EnEjecucion → Entregado → Cobrado
                                                                      ↘ Cancelado
```
- segmento, leadId, titulo, moneda (USD/ARS)
- montoPresupuesto, montoSena, comisionPct (default 15–30)
- partnerId?, checklist JSON, hitos[]
- softTenantId? / presupuestoSoftId? / cxCIds[]
- senaPagada: boolean (**hoy gap Soft** — ver §9)

### 5.3 `WorksPartner`
- empresa, rubro (`epc_solar|civil|dc|solidity|audit|other`)
- zona, matricula, tarifaNetaNotas, rcVigente (bool+fecha)
- contacto, activo, segmentoAllowlist[]

### 5.4 `WorksMilestone`
- projectId, nombre, pct o monto, estado `pendiente|facturado|cobrado|pagado_partner`
- dueAt?

## 6. Flujos

### Soft (no romper)
Ad → landing Tier A → register `activar=` SaaS → trial → primer valor → paid MP.  
Works **no** intercepta este path. Upsell Soft←Energy es post-Entregado.

### Energy MVP
1. Intake: form `/energy` o WA→Cloud “nuevo lead energy” o Soft upsell  
2. Comercial califica (kWp+zona) → estado Calificado  
3. Presupuesto en Soft (`pool-servicios-pro`) linkeado al proyecto → Presupuesto  
4. Seña (manual OK si `senaPagada` roto) → Seña  
5. Match partner shortlist (GenSolar/Amperio/Solarpool/…) → MatchPartner  
6. Checklist entrega (ver §8) → EnEjecucion  
7. Hitos cobro cliente / pago partner neto−comisión → Entregado → Cobrado  

## 7. UI Claver Cloud (MVP)

| Vista | Contenido |
|-------|-----------|
| `/claver-cloud/works` o `/dashboard/works` | Bandeja: filtros segmento + estado; CTA nuevo lead |
| Detalle proyecto | FSM, partner, checklist, hitos, links Soft, notas |
| Partners | CRUD mínimo + RC/matrícula flags |
| Holding public | `/` chooser Soft vs Works líneas; cada `/energy` etc. form → crea WorksLead |

**Stubs vivos:** cada route public tiene form que **persiste** WorksLead (segmento seteado). Sin “Coming soon” vacío.

## 8. Acceptance criteria — Energy shippable

### A. Intake
- [ ] POST lead energy desde `/energy` crea `WorksLead` + `WorksProject` estado `Lead`
- [ ] WA/manual desde Cloud crea igual
- [ ] Soft register `activar=pos.core|servicios|gimnasio` **sigue** sin crear WorksProject

### B. FSM
- [ ] Transiciones solo forward válidas (o Cancelado); UI muestra estado actual
- [ ] No se puede MatchPartner sin Presupuesto+Seña (o override Pablo/admin)

### C. Partners
- [ ] Alta partner EPC con zona + RC flag
- [ ] Asignar partner al proyecto; queda auditado (quién/cuándo)

### D. Checklist Energy (mínimo)
- [ ] Alcance kWp + zona capturados  
- [ ] Presupuesto Soft linkeado  
- [ ] Seña registrada (monto + fecha; `senaPagada` auto = best-effort)  
- [ ] Partner asignado  
- [ ] Cliente informado “ejecuta EPC X, Claver orquesta”  
- [ ] Matrícula/trámite a cargo EPC (checkbox)

### E. Cobro
- [ ] Hito seña + ≥1 hito obra creados  
- [ ] Comisión % editable; monto partner = cobrado − comisión  
- [ ] Gap conocido: conciliación MP→`senaPagada` en cola CTO (no bloquea registro manual de seña)

### F. Soft safety
- [ ] Smoke: login → demo ferretería/servicios/gym register path OK  
- [ ] No regress P0 Google si ya mergeado  

### G. Holding routes
- [ ] `/` ofrece Software vs Energy (Infra/Blockchain visibles como stubs vivos)  
- [ ] `/software` redirige o deep-link a funnel Soft actual  
- [ ] `/energy` form funcional  
- [ ] `/infra` `/blockchain` form → lead segmento correcto  

## 9. Dependencias / cola

| Prioridad | Ítem | Bloquea |
|-----------|------|---------|
| P0a | Merge hotfix Google + Merge A + PR2 Soft | Soft Ads quality |
| P0b | **Este motor Energy** | Works cash |
| P1 | Fix `senaPagada` MP | Cobro auto |
| P1 | CxC auto desde OficioTrabajo | Menos manual Soft |
| P2 | PR3 `/ferreteria` `/servicios` Ads URLs | Soft Ads polish |

## 10. Owners

| Rol | Responsabilidad |
|-----|-----------------|
| Producto | Este PRD + DoD + anti-scope |
| CTO | Schema/API/UI Cloud + routes |
| Comercial | Operar bandeja + match EPC |
| Research | Shortlist partners |
| Soporte | Soft postventa; no obra |
| Pablo | Override 1er deal / legal RC |

## 11. Estimación honesta (eng)

- Schema + API FSM + partners: 1–2 d  
- Cloud bandeja + detalle + checklist: 1–2 d  
- Public stubs `/` `/energy` `/infra` `/blockchain` + `/software` bridge: 0.5–1 d  
- Soft non-regress smoke: 0.5 d  

**Slice shippable:** A–G Energy con seña manual. No esperar fix MP para primer deploy interno.

## 12. Fuera de este PRD

Contrato legal PDF, RC póliza, Ads Energy, shortlist Infra/Blockchain ejecución, OT Field, dapps.

— Producto Claver · GO implementación real Pablo 2026-09-13

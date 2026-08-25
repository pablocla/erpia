# ENLISTA — Gaps para que Claver quede épico y más automático

**Fecha:** 2026-08-25  
**Para:** Grok (código) · Gemini (docs/copy) · humano (precio, legal, piloto)  
**Norte:** el dueño opera el negocio (vender, fiar, cobrar, stock, AFIP, caja) sin que el sistema mienta. Lo automático vive **adentro de esos loops**. Los empleados digitales son un **add-on**, no el producto.

Este archivo **no reemplaza** los canónicos. Los apunta y los ordena hacia un solo objetivo: **loops cerrados**.

| Documento | Qué cubre |
|-----------|-----------|
| [`docs/GO_LIVE_PRD.md`](docs/GO_LIVE_PRD.md) | Qué se puede vender hoy |
| [`docs/PRODUCTO_VENDIBLE_END_TO_END.md`](docs/PRODUCTO_VENDIBLE_END_TO_END.md) | Cadena comercial → soporte |
| [`docs/qa/GAPS_PENDIENTES.md`](docs/qa/GAPS_PENDIENTES.md) | Bugs y puertas post Ola 0 |
| [`docs/qa/FALTANTES_TECNICOS_NICHOS.md`](docs/qa/FALTANTES_TECNICOS_NICHOS.md) | Profundidad por rubro |
| [`docs/engineering/PRODUCT_BACKLOG.md`](docs/engineering/PRODUCT_BACKLOG.md) | Tickets con assignee |

**Cómo leer**

| Marca | Significado |
|-------|-------------|
| 🔴 P0 | El loop no existe o miente (botón que no hace plata / no avisa) |
| 🟠 P1 | El loop existe a medias: crea tarea o borrador, no ejecuta |
| 🟡 P2 | Add-on / polish; no bloquear kiosco+POS+fiado+AFIP |
| ⬛ No | No construir: 47 verticales, RPA en Vercel, “IA que decide plata sola” |

---

## 0. Capas (no confundir)

| Capa | Qué es | Prioridad |
|------|--------|-----------|
| **Core** | POS, fiado, caja, stock, compras, factura AFIP, usuarios, demo/rubro, menú que no miente | P0 / P1 |
| **Loops del core** | Stock → OC, CAE en cola, caja alerta, fiado imputado, presupuesto que se envía | P0 / P1 |
| **Extra** | Empleados digitales (Leo, Sofía, Ramiro…), n8n hub, IoT | P2 — no bloquear el core |

Un kiosco **épico** cobra, fía, factura y no se queda sin mercadería. No necesita un roster de bots con nombre.

Los nombres (Leo, Sofía) son **SKU de upsell** sobre un playbook. Si el loop corre en el ERP, el empleado es packaging. No priorizar packaging.

---

## 0.1 Qué es “épico” en el core

1. El cajero cobra en mostrador (fracción, split, ticket) aunque AFIP esté lento.  
2. El fiado tiene tope, WA con saldo+link, y el pago **cierra** la deuda.  
3. Stock bajo arma OC borrador (no un post-it).  
4. Caja: arqueo ciego + aviso si falta o quedó abierta.  
5. Presupuesto / seña de oficios **mueven plata o un mensaje**, o no se llaman así.  
6. El menú del kiosco no muestra oficios ni hotelería.  
7. Admin puede vivir un rol/rubro y volver.

WhatsApp de cobranza “mientras dormís” es **extra** (Leo). Útil para quien paga el add-on. No es el criterio de go-live del ERP.

---

## 1. Automatización del **core** (playbooks, no mascotas)

### 1.1 Lo que ya está (no rehacer)

- Eventos NOP: `VENTA_EMITIDA`, `STOCK_BAJO` (vía `STOCK_ACTUALIZADO`), `CAE_*`, `USUARIO_CREADO`, `PAGO_MP_RECIBIDO`, `PEDIDO_CONFIRMADO`, `PEDIDO_ML_RECIBIDO`.  
- Playbooks en `lib/automation/playbook-runner.ts` (stock bajo, brief, caja +12h, cobranza, onboarding, picking, CAE, slow-mover, IoT, OC, agenda).  
- 9 plantillas n8n en `docs/automation/n8n-templates/`.  
- Playbooks de stock/caja/CAE/agenda (varios aún crean `TareaPendiente`).  
- **Extra (no core):** Leo Cobranza y el resto del roster de empleados — ver §6.

### 1.2 El patrón a romper

```
Evento de negocio → playbook → TareaPendiente para un humano
```

Eso no es automático. Es un **todo list con extra steps**. El patrón épico:

```
Evento → acción determinística (OC borrador, WA, PDF, CAE retry, cargo MP)
       → humano solo si hay plata, crédito o AFIP en juego por encima del tope
       → dueño recibe un brief, no 40 tickets
```

### 1.3 Gaps AUTO (prioridad de ingeniería)

| ID | P | Gap | Hoy | Épico |
|----|---|-----|-----|--------|
| **AUTO-01** | 🟢 | Stock bajo → OC | `stock_bajo_tarea` → OC borrador + WA proveedor. Core. |
| **AUTO-04** | 🟠 | CxC/fiado vencida sin cron | El evento no sale solo al vencer | Cron del **ERP** (no hace falta Leo): lista vencidas + tarea o WA si el pack lo tiene. |
| **AUTO-08** | 🟠 | Brief al dueño | Morning brief = tareas internas | Resumen: ventas, caja, morosos, stock, CAE. Puede ser email in-app; WA es extra. |
| **AUTO-05** | 🟡 | n8n es spec, no producto | JSON + entitlement | Extra. Esconder wizard o un piloto. No es go-live kiosco. |
| **AUTO-09** | 🟡 | IoT / B2B picking | Eventos sí, loop no | Extra / cuando el pack B2B sea PRD. |
| **AUTO-10** | 🟡 | Observabilidad del hub | HMAC + poll | Extra ops. |
| **AUTO-02 / 03 / 06 / 07** | 🟡 | Roster empleados, HITL Leo, auto-send | Add-on | **§6 Extra.** No entrar acá hasta que el core no mienta. |

**Regla de oro (docs/automation):** plata, stock físico, AFIP = **core NOP**. Slack/Twilio/ML extra = **n8n**. No mover asientos a n8n.

---

## 2. Loops de negocio que todavía son humanos

Cada fila es un **loop** que, cerrado, se siente mágico. Si no cierra, la UI es teatro.

### 2.1 Plata (cobrar y pagar)

| Loop | Estado | Gap épico |
|------|--------|-----------|
| Fiado → WA → link MP → imputación | PARCIAL (Leo + fiado WA) | Imputación **FIFO o a comprobante** automática al webhook MP. Límite de crédito que **bloquea** o pide aprobación. |
| CxC vencida → cobranza | PARCIAL | Sin “Correr ahora”: cron 10:00 AR lun–vie. |
| Recibo post-pago | Código `ED-30` done | Verificar en prod: pago MP → WA “recibimos $X”. Si no dispara, es P0. |
| Seña oficios | 🔴 Flag `Marcar Señado` | Cobro caja/MP → movimiento real. Copy “cobro automático de seña” es mentira hasta esto. |
| Gym / cuotas mes | 🟠 Manual | Débito/suscripción MP o al menos **batch de links** + morosos WA. Unificar `/membresias` vs `/nicho/gimnasio`. |
| Presupuesto “Enviar” | 🔴 Cambia estado | PDF + WA + mail. Pack freelance lo promete. |
| Split de pago POS | 🟠 Rígido | Efectivo + transferencia en el mismo ticket. |
| Dunning SaaS (Claver cobra al tenant) | PARCIAL | Trial dunning ≠ suscripción vencida. Reintento + baja de SKU + aviso partner. |

### 2.2 Stock y compras

| Loop | Estado | Gap épico |
|------|--------|-----------|
| Stock mínimo | Tarea a depósito | OC borrador con proveedor habitual + cantidad = (mínimo × lead time) − stock. |
| Compra bulto → venta unidad | 🔴 No hay factor | `1 pack = 24 u` al recibir. Sin esto ferretería/kiosco miente el stock. |
| Fracción m / kg / m² | Función **sin UI POS** | Cablear `calcularVentaFraccionada` o bajar copy ferretería. |
| Promo 2×1 / EAN balanza | Solo tests / parser | Hook en carrito. Carnicería no es PRD sin esto. |
| Lote / vencimiento | Falta | Farmacia, vet, almacén: alerta 7/30 días, no WMS. |
| Slow mover | Tarea “armar promo” | Borrador de lista de precios −X% o combo, dueño aprueba. |

### 2.3 Fiscal / AFIP

| Loop | Estado | Gap épico |
|------|--------|-----------|
| CAE síncrono en mostrador | Riesgo cola | UI “Pendiente de CAE” + ticket igual; worker ya existe (`AUD-02`). **Hacerlo el default** ante timeout de AFIP. |
| CAEA / contingencia | Parcial | Un botón claro en POS, no un laberinto. |
| Padrones IIBB | Manual / estático | Cron mensual ARBA/AGIP. Sin padrón, percepción es teatro. |
| Libro IVA / portal contador | PARCIAL (`AUD-05`) | Mail automático al contador el 1 de cada mes: ZIP listo. |

### 2.4 Caja y fraude interno

| Loop | Estado | Gap épico |
|------|--------|-----------|
| Arqueo ciego | 🔴 Muestra teórico primero | Cajero cuenta → después ve diferencia → dueño alerta si \|diff\| > umbral. |
| Anulación / descuento > tope | Log básico | WA inmediato al dueño (monto, cajero, ticket). |
| Cajón sin venta | No | Evento + log. |
| Caja +12h | Tarea | WA dueño 22:00 (`Bot Caja Noche` ya está en catálogo: **ejecutar**, no listar). |

### 2.5 Agenda / field / hospitalidad

| Loop | Estado | Gap épico |
|------|--------|-----------|
| Recordatorio turno | Playbook `agenda_reminder` → tarea | WA al **cliente** T−24h / T−2h. Eso es Sofía (`ED-25`). |
| No-show | Falta | Marca, cobra seña o libera slot. |
| OT field (fumigación, AC, oficios) | ⬛ No PRD | Un **motor OT** (estados, insumos, firma, foto) para todos. Hasta entonces no vender vertical. |
| KDS / resto | Demo | Dividir cuenta, propina, pre-cuenta: o piloto gastronómico o no pitch. |

---

## 3. Producto que todavía miente (profundidad, no más módulos)

Tomado de [`GAPS_PENDIENTES.md`](docs/qa/GAPS_PENDIENTES.md) — **cerrar o bajar copy**, no agregar pantallas.

### 3.1 P0 que rompe la puerta comercial

| Gap | Acción |
|-----|--------|
| Oficios en el sidebar de **todos** | `allowedRubros` / SKU `niche.oficios`. Gym no ve “Presupuesto 3 Niv”. |
| Landings sin `?activar=` unificado | CTA = `/login?activar={sku}` o `/demo/{industry}?activar=`. |
| `empresaId: 1` en onboarding | Sacar. |
| `reservaId: 1` en hotelería | Sacar. |
| Nav 404 (`reventas/links`, `industria/corte`…) | Quitar de `nav-matrix`. |
| Totales oficios hardcode $35k/$70k/$100k | Items reales o no mostrar 3 niveles. |

### 3.2 Packs que ya se venden (PRD §3.1)

| Pack | Para que sea épico, no solo “anda” |
|------|-------------------------------------|
| Fiado + kiosco | Límite crédito + FIFO + WA con link (casi; falta imputación y bloqueo). |
| POS mostrador | Fracción + split pago + ESC/POS sin diálogo del browser + offline de verdad (cola sync). |
| Ferretería | Metraje cableado **o** copy honesto. |
| Freelance / monotributo | Presupuesto que **se envía**. |
| Gym | Un home + cobro del mes en un solo lugar. |
| Cobranza WA | Leo on by default en el pack, no SKU escondido. |

### 3.3 No construir (anti-épico)

CYPE, CIRSOC, HIS, torniquete, SENASA, WMS robot, 47 demos como PRD, RPA Playwright en el request de Vercel (`ED-19` = ADR, no código Hobby).

Amplitud sin profundidad **mata** la marca. Un kiosco que cobra solo (100% automático) > diez nichos a medias.

---

## 4. Plataforma: que el épico no se caiga

| ID | P | Gap | Épico |
|----|---|-----|--------|
| **PLT-01** | 🔴 | Multi-tenant solo en API | RLS Postgres (`SET LOCAL app.current_empresa_id`). Un endpoint sin `whereEmpresa` = fuga. |
| **PLT-02** | 🔴 | POS online-only en la práctica | PWA + cola IndexedDB (`POS-01` / `AUD-07`). Corte de 10 min no puede parar la cola del kiosco. |
| **PLT-03** | 🟠 | Hardware caja | ESC/POS WebUSB/Serial o agent local. `window.print()` no es POS. |
| **PLT-04** | 🟠 | Observabilidad por tenant | 5xx, cola WA, CAE fail, hub n8n. Alert P0 a on-call. Status page pública. |
| **PLT-05** | 🟠 | Smoke e2e no es gate de release | Playwright packs PRD (fiado, POS, login Google/COOP, preview actor) en CI. |
| **PLT-06** | 🟡 | Tests de aislamiento cruzado | JWT tenant B vs recurso A → 403 / []. |
| **PLT-07** | 🟡 | Login Google + COOP | Header `same-origin-allow-popups` + FedCM (fix 2026-08-25). Verificar en prod. |
| **PLT-08** | 🟡 | Preview actor/rubro admin | Switcher “Probar como” + volver. Falta: persistir preferencia, e2e, y que Cloud no rebote al ERP a mitad de demo. |

---

## 5. De “firmó” a “usa solo” (comercial automático)

El producto vendible no es más pantallas: es **que Claver se cobre y se implemente**.

| Cadena | Gap | Automático sería |
|--------|-----|------------------|
| Oferta | 3–4 planes, no 40 SKUs | Checkout elige plan; add-ons después. |
| Demo | Timeout Hobby; seeds vacíos | Pre-warm + health que **bloquea** marketing si la demo está rota. |
| Cobro Claver | MP prod + webhook | Pago → SKU on + proyecto implementación + analista asignado **en el mismo webhook**. |
| Contrato | ToS versionado, SLA, offboarding | Checkbox con versión; export/borrado a pedido. |
| Impl | Playbook 4h/1d por pack PRD | Al paid: scrum items (`IMP-02` done verificar) + UAT firmable (`IMP-03`). |
| Postventa | Health score existe (`PV-02`) | Cron: score < 40 → tarea success + WA. QBR mensual al dueño (`PV-04`). |
| Partner | Comisión en ledger, cash manual | Liquidación batch + factura. |

Tickets Gemini/human todavía abiertos (no están en `backlog-status.json`):  
`COM-02` `COM-03` `COM-04` `COM-05` `ONB-01` `ONB-02` `IMP-01` `IMP-03` `GL-01` `GL-02` `PV-01` `PV-03` `PV-04` `HUM-01` `HUM-02`.

---

## 6. Extra — empleados digitales (no es el core)

Add-on comercial. El ERP no depende de esto para ser vendible.

El loop (stock→OC, turno→WA, CAE retry) debe vivir en **playbooks del core**. El “empleado” es un SKU con cara para quien quiera pagar upsell.

| Extra | Encima de qué loop del core | Prioridad |
|-------|-----------------------------|-----------|
| Leo | Fiado/CxC → WA cobranza | P2 — pack cobranza, no kiosco POS |
| Sofía | Agenda → recordatorio | P2 |
| Ramiro / Ana | Stock → OC (ya AUTO-01) | P2 — no duplicar el core |
| Clara | CAE cola (ya cron AFIP) | P2 |
| Pedro / Max / IoT | B2B / promo / sensores | P3 o ⬛ |

No construir más roster. No priorizar UI HITL de Sofía/Ramiro hasta que POS/fiado/caja/AFIP estén redondos.

---

## 7. Cola sugerida (90 días) — **core primero**

### Semanas 1–2 (P0, se nota en la calle)

1. Menú que no miente: oficios solo con SKU/rubro + `?activar=` en puertas.  
2. Sacar `empresaId: 1` / `reservaId: 1` / 404 nav.  
3. Presupuesto “Enviar” = WA/PDF o no se llama Enviar. Seña oficios = plata en caja.  
4. POS: fracción **o** copy ferretería honesto; split de pago si duele en demo.  
5. Verificar login Google + “Probar como” admin.

### Semanas 3–6 (P1, el negocio corre solo un poco)

6. Imputación MP FIFO + límite de fiado.  
7. Arqueo ciego + alerta faltante / caja +12h (playbook del **core**, no un empleado).  
8. CAE pendiente visible en mostrador (el cron ya existe).  
9. Un home gym + cobro del mes en un solo lado.  
10. Brief in-app al dueño (ventas / caja / stock / CAE).

### Semanas 7–12 (plataforma)

11. POS offline cola (POS-01).  
12. Tests cross-tenant o RLS.  
13. Paid → impl + UAT.  
14. Health score tenant → tarea success.

### Extra (después, o nunca si no se vende el SKU)

Leo on en pack cobranza. No Sofía/Ramiro/Ana como proyecto. Twilio solo si hay piloto que pague WhatsApp.

### Human en paralelo

Precio de lista, ToS, piloto **kiosco+POS+fiado** (no piloto “empleados”). AFIP prod de ese piloto.

---

## 8. Criterio de “ya es más automático” (DoD del **core**)

Se puede decir en una demo de **kiosco/ferretería** sin mentir:

- [ ] Cobrar en mostrador (y fiar) sin trabarse.
- [ ] Stock bajo genera OC borrador.
- [ ] AFIP caído no para la cola: ticket + CAE después.
- [ ] Caja: arqueo ciego; si falta o quedó abierta, se nota.
- [ ] Pago MP cierra fiado/CxC.
- [ ] El menú no muestra oficios ni hotelería.
- [ ] Admin prueba un rol/rubro y vuelve.

**No** es criterio de core: roster de empleados, n8n, IoT, recordatorio de turnos con cara de Sofía.

Cuando esos checks están verdes en un piloto real, el ERP es épico. El add-on se vende aparte.

---

## 9. Cómo usar este archivo

- **Grok:** primer 🔴 del **core** (§3.1, §2 POS/fiado/caja/AFIP). No tickets `ED-*` de empleados salvo que el humano pida el add-on.  
- **Gemini:** prompt + entregables en `docs/engineering/PROMPT_GEMINI_CERRAR_TODO.md`. Copy honesto (§3). No pitch de empleados en landings de kiosco.  
- **No** abrir issues de nicho D ni de roster extra.

*Última alineación: 2026-08-25. Empleados = extra. Core = POS, fiado, caja, stock, AFIP.*

# Go-live PRD — Alineación Demo · Trial · Producción

**Documento canónico** para comercial, implementación, partners e ingeniería.  
Si hay conflicto entre una landing, un demo o este archivo, **manda este**.

**Última alineación:** 2026-07-18  
**Relacionados:**
- `docs/PRODUCTO_VENDIBLE_END_TO_END.md` — **faltantes de punta a punta** (comercial → impl → soporte → renovación)  
- `docs/qa/FALTANTES_TECNICOS_NICHOS.md` — backlog técnico por rubro  
- `docs/deploy/VERCEL_ENV.md` — variables Vercel  
- `docs/deploy/RUNBOOK.md` — deploy  
- `docs/qa/partner-billing-monetizacion.md` — cobro y partners  
- `GET /api/go-live/status` — health comercial sin secretos  

---

## 1. Tres etapas (no mezclar)

| Etapa | Objetivo | Datos | Pago Claver | Criterio de éxito |
|-------|----------|-------|-------------|-------------------|
| **Demo** (`/demo`, industry-demo) | Wow en &lt; 2 min | Seed ficticio aislado | No | Golden path con datos visibles |
| **Trial** (registro / 14–30 d) | El cliente opera *su* negocio | Sus productos/clientes | Ancla gratis o trial SKU | Usa el sistema 3+ días |
| **Go-live PRD** | Vive del sistema sin Excel | Reales + AFIP/MP según pack | MP real o ancla gratis permanente | 30 días operando |

```
Marketing / sensor  →  Demo
Cierre comercial    →  Trial (activar pack)
Implementación      →  Go-live PRD (checklist §6)
```

**Regla de oro:** lo que se muestra en demo **no se promete en contrato** salvo que figure en **§3 Packs autorizados PRD**.

---

## 2. Capas del producto (realidad técnica)

| Capa | Estado PRD | Qué es |
|------|------------|--------|
| **Core ERP** | Base PRD | Auth multi-tenant, dashboard, productos, stock, caja, ventas, compras, CxC/CxP, usuarios |
| **POS / fiado / packs calle** | PRD con caveats | Ancla comercial; requiere env y validación post-deploy |
| **Billing SaaS (MP + partners)** | PRD si env prod | Suscripción Claver; crédito partner; cash out manual |
| **Nichos (gym, vet, taller, club…)** | Demo → piloto | Engines genéricos + UI; profundidad variable |
| **Field service (fumigación, AC, oficios)** | No vertical PRD | Solo genérico agenda/presupuesto hasta motor OT |
| **Claver Cloud** | Ops PRD | Analistas: tenants, liquidaciones, demo-health |

---

## 3. Packs / rubros: qué se puede vender

### 3.1 Autorizados go-live PRD (con implementador)

Promesa comercial **permitida**. Setup típico 0,5–2 días.

| Pack / perfil | Enganche / entrada | Golden path | Promesa OK | Promesa NO OK |
|---------------|-------------------|-------------|------------|---------------|
| **Libreta Fiado + kiosco/almacén** | `pos.fiado_barrio`, `pool-kiosco-barrio`, `almacen` | `/dashboard/fiado`, POS | Fiado, caja, stock, clientes, cobro parcial | Offline infalible, WA sin Twilio |
| **POS + factura (mostrador)** | `pos.core`, retail genérico | `/dashboard/pos` o ventas | Ticket/factura según AFIP del tenant | AFIP self-serve mágico sin cert |
| **Ferretería mostrador** | `ferreteria` retail | ventas / POS | Stock, venta, CC simple | Corte m², obra full, multi-depósito avanzado |
| **Cobranza WA** | `intang.cobranzas_wa` | CxC | Recordatorios si Twilio | “Cobranza judicial” |
| **Monotributo / freelance** | `pool-monotributo`, `freelance_mt` | presupuestos | Presupuesto + cobro + factura C | Estudio contable completo |
| **Servicios pro liviano** | `pool-servicios-pro` | agenda | Agenda + presupuestos + CxC | OT field, cuadrillas, contratos de mant. |
| **Gym / cuotas** | `gimnasio`, `niche.gimnasio_barrio` | membresías | Socios, planes, morosos, cobro manual | Torniquete, débito CBU del socio, app del socio |
| **Club de barrio (piloto reforzado)** | `club_barrio` | nicho club | Socios, cuotas, cantina básica | Federación, fixture pro |

**Condiciones comunes PRD:**
1. `/api/go-live/status` → `go: true` (MP real, JWT, DB).  
2. Tenant con trial o pago activo.  
3. Checklist §6 firmado por implementador/analista.  
4. Fiado validado en smoke post-deploy si el pack lo incluye.

---

### 3.2 Solo demo o piloto controlado (no “100% del rubro”)

Se puede **mostrar** y **piloto con contrato de alcance acotado**. No vender como vertical cerrado.

| Rubro | Por qué no PRD pleno | Alcance máximo de promesa |
|-------|----------------------|---------------------------|
| **Veterinaria** | HC usable; no pet-portal ni lab full | Fichas, consultas, mostrador, agenda |
| **Clínica / consultorio** | Agenda + HC; sin OS/nomenclador | Turnos particular + facturación simple |
| **Taller mecánico** | OT genérica (movimientos), no taller industrial | Órdenes simples + WA listo + stock básico |
| **Carnicería / balanza** | Entitlements y unidad kg incompletos | POS; balanza solo si pack validado |
| **Bar / resto / KDS** | Módulo grande, QA de servicio real | Piloto con implementador gastronómico |
| **Consorcios / inmo** | Específico pero no 100% admin profesional | Piloto; no “reemplaza a sistema de administradores full” |
| **Obras / changas** | Jornales livianos | Adelantos/jornales; no software de obra civil |
| **Distribuidora / vendedor ruta** | Piezas existen, pack no cerrado | Piloto preventa |
| **Agro / acopio / cannabis** | Track Clavergrow / especial | No mezclar con pitch de kiosco |
| **Tintorería, peluquería, cancha, colonia, escuela, peña, feria, remis, delivery…** | Engine genérico | Demo / piloto con seeds |

---

### 3.3 No vender como producto (hasta motor OT Field)

| Vertical | Qué decir en comercial |
|----------|------------------------|
| **Fumigadoras** | “Agenda + presupuestos + cobro; OT de plagas en roadmap” |
| **Aire acondicionado / clima** | Idem; sin inventario de equipos ni preventivo |
| **Electricista, gasista, plomería, piletero, jardinería, limpieza, ST celulares, gomería…** | Oficios de §14 de faltantes: **skin futuro** sobre OT Field |
| **Cualquier SKU `planned` / Próximamente** | No cobrar, no activar en prod como entregado |

---

## 4. Alineación marketing ↔ producto

| Canal | Debe decir | No debe decir |
|-------|------------|---------------|
| Landing / demo por rubro | “Probá con datos de ejemplo del rubro” | “Listo para tu taller industrial / HIS / OS” |
| Vendedor de calle | Pack de §3.1 + precio + trial | Catálogo completo de nichos como PRD |
| Partner / implementador | Setup fee + checklist go-live | “Self-serve total AFIP en 5 minutos” |
| Claver Cloud | Estado tenant, trial, SKUs, liquidación partner | Activar SKUs planned “para contentar” |
| Pricing | Ancla gratis fiado; resto trial/pago MP | “Todo gratis para siempre” en packs pagos |

**Sensor `/demo`:** es **comercial**, no certificación PRD. Seeds mejorados (vet, taller, club, gym) mejoran la demo; el go-live sigue siendo el checklist §6.

---

## 5. Infra y cobro (alineado a Vercel)

### 5.1 Mínimo para `go: true`

| Variable | Rol |
|----------|-----|
| `DATABASE_URL` + `DIRECT_URL` | Prisma |
| `JWT_SECRET` | Auth |
| `NEXT_PUBLIC_APP_URL` / `BASE_URL` | Links y webhooks |
| `MP_ACCESS_TOKEN` (prod) | Cobro real |
| `MP_WEBHOOK_SECRET` | Confirmación suscripción |

Detalle: `docs/deploy/VERCEL_ENV.md`.  
Health: `GET /api/go-live/status`.

### 5.2 Según promesa

| Si vendés… | Necesitás… |
|------------|------------|
| WhatsApp automático | Twilio + plantillas |
| Mail de fiado / trial | Resend |
| Factura AFIP real | Cert prod + `AFIP_ENTORNO=produccion` |
| IA / auditor demos | Gemini key |
| Crons trial | `CRON_SECRET` + plan Vercel con crons |
| Demos pesadas (60s) | Vercel Pro (Hobby corta ~10s) |

### 5.3 Mock ≠ PRD

| Entorno | MP mock | ¿PRD? |
|---------|---------|-------|
| Local / Preview | OK | No |
| Production con `TEST-mock` o sin token | Activa “como pagado” en algunos flujos | **Prohibido para clientes de pago** |
| Production con `APP_USR-…` real | Cobro real | Sí |

---

## 6. Checklist go-live por tenant (implementación)

**UI operativa:** `/claver-cloud/go-live` (API `GET/POST /api/claver/go-live`).  
Catálogo de packs en código: `lib/comercial/go-live-packs.ts`.  
Completar y archivar. Sin checklist cerrado = **sigue siendo piloto**.

### 6.1 Plataforma
- [ ] Tenant creado (registro o provision)
- [ ] Usuarios roles (dueño, cajero, …)
- [ ] Pack/SKUs activos correctos (`/api/platform/productos`)
- [ ] Trial o suscripción MP `authorized` (o ancla gratis)
- [ ] `modoLite` / sidebar coherente con el pack (no ERP ruidoso)

### 6.2 Comercial del cliente
- [ ] Datos empresa (CUIT, dirección, punto de venta)
- [ ] Productos/servicios cargados (o migración)
- [ ] Clientes/saldos iniciales si aplica
- [ ] Caja de prueba abierta/cerrada

### 6.3 Fiscal / hardware (si aplica)
- [ ] AFIP homologación o producción documentada
- [ ] Impresora / ticket probado en local del cliente
- [ ] Balanza solo si pack balanza validado
- [ ] Backup de cert/claves en proceso interno (no en chat)

### 6.4 Comunicaciones
- [ ] WhatsApp: real o “deshabilitado a propósito” en contrato
- [ ] Email dueño para dunning / fiado

### 6.5 Smoke del golden path (30 min)
- [ ] Login → home del pack
- [ ] 1 operación core (fiado / venta / cuota / OT simple)
- [ ] 1 cobro o anulación controlada
- [ ] Sin 401/403/500 en Network del flujo
- [ ] Logout / segundo usuario si hay cajero

### 6.6 Handoff
- [ ] Capacitación 1 rol operativo
- [ ] Canal de soporte / ticket
- [ ] Partner comisionado si hubo `?ref=`
- [ ] Fecha de revisión 7 y 30 días

---

## 7. Flujo de dinero alineado

```
Cliente paga Claver (MP) ──webhook──► SKUs activos
         │
         └──► comisiones partner (si referredByPartnerId)
                    │
                    ├─► crédito → paga su propia suscripción Claver (preferido)
                    └─► retiro cash → analista liquida en /claver-cloud/partners
```

| Quién | Acción PRD |
|-------|------------|
| Sistema | Ancla gratis, trial, auto-subscribe demo, crédito partner, MP preapproval |
| Cliente | Checkout MP de packs pagos |
| Analista | Liquidación cash partners, force SKU, AFIP/hardware, excepciones |
| Nadie solo | Payout CBU automático (no implementado) |

---

## 8. Roadmap alineado a promesa (qué desbloquea qué)

| Prioridad | Entrega | Desbloquea venta PRD de… |
|-----------|---------|---------------------------|
| P0 | Fiado 100% estable en prod | Kiosco/almacén sin miedo |
| P0 | Smoke automatizado post-demo/go-live | Calidad comercial |
| P1 | OT Field + contratos + rutas | Taller serio, fumigación, AC, oficios |
| P1 | Inbox WA → pedido/stock | Todos los retail |
| P1 | Ferretería unidades/presupuesto obra | Ticket B2B alto |
| P2 | Activos cliente/comercio | Clima, flotas, service |
| P2 | Portal socio/tutor | Gym / vet premium |
| P3 | Access control, telemedicina, etc. | Diferenciadores |

Backlog detallado: `docs/qa/FALTANTES_TECNICOS_NICHOS.md`.

---

## 9. Matriz rápida para el vendedor

| El prospecto es… | Ofrecé | Demo | Cierre |
|------------------|--------|------|--------|
| Almacén / kiosco | Fiado + POS | `/demo/almacen` | Trial 14–30 d ancla gratis |
| Ferretería | POS + stock + ventas | ferreteria | Setup productos + listas |
| Gym | Membresías | gimnasio | Piloto; sin torniquete |
| Vet | HC + agenda | veterinaria | Piloto acotado |
| Taller | Órdenes simples | taller_mecanico | Piloto; no “software de taller full” |
| Fumigación / AC | Servicios pro (agenda) | servicios_pro | **No** vertical plagas/clima aún |
| Contador multi-cliente | Pack contador / partner | partners | 3 referidos → canje según reglas |

---

## 10. Definición de “listo PRD” (ingeniería)

Un pack pasa de **piloto** a **autorizado §3.1** cuando:

1. Golden path sin 500 en staging y prod  
2. Seeds o empty-state claros (nunca tablero muerto sin explicación)  
3. Entitlement SKU enforced en API  
4. Al menos 1 e2e o smoke documentado  
5. Copy de landing revisado (sin overpromise)  
6. Implementador puede completar §6 en &lt; 1 día hábil  
7. Al menos 1 tenant piloto 14 días sin incidente P0  

---

## 11. Roles y responsabilidades

| Rol | Responsabilidad |
|-----|-----------------|
| **Comercial / partner** | Solo vende §3.1 como PRD; resto como piloto con alcance escrito |
| **Analista Claver Cloud** | Onboarding, SKUs, liquidación partners, demos health |
| **Ingeniería** | Cierra P0/P1 del backlog; no abre 10 verticales sin motor |
| **Producto** | Actualiza este doc cuando un pack cambie de sección |
| **Soporte** | Escala bugs; no “activa por favor un SKU planned” |

---

## 12. Resumen ejecutivo

| Pregunta | Respuesta alineada |
|----------|-------------------|
| ¿Hay producto más allá de la demo? | **Sí** — core ERP + POS + fiado + billing + Cloud |
| ¿Go-live PRD general para todo el catálogo? | **No** |
| ¿Go-live PRD selectivo? | **Sí** — §3.1 |
| ¿Demos mejoradas = PRD? | **No** — demos venden; PRD es checklist + env + operación real |
| ¿Próximo gran desbloqueo comercial? | OT Field + fiado rock-solid + inbox WA |

---

*Este documento alinea comercial, demos, partners e ingeniería. Actualizar en cada release que mueva un pack de §3.2 → §3.1.*

---

## Apéndice A — Mapa de documentos

| Doc | Rol |
|-----|-----|
| **Este archivo** | Qué es PRD / piloto / no vender |
| `docs/PRODUCTO_VENDIBLE_END_TO_END.md` | Faltantes comercial→soporte→renovación |
| `docs/qa/FALTANTES_TECNICOS_NICHOS.md` | Qué falta construir (backlog técnico) |
| `docs/deploy/VERCEL_ENV.md` | Env Vercel |
| `docs/deploy/RUNBOOK.md` | Deploy y migraciones |
| `docs/qa/partner-billing-monetizacion.md` | MP + partners |
| `docs/qa/industry-demo-audit.md` | Evidencia QA demos |
| `GET /api/go-live/status` | Health runtime |

## Apéndice B — Frases listas para el equipo

| Situación | Frase alineada |
|-----------|----------------|
| Cliente pide “el sistema de fumigación” | “Hoy te dejamos agenda, presupuestos y cobro; las OT de plagas con checklist y contratos están en roadmap (OT Field).” |
| Cliente gym pide molinete | “Operás socios y cuotas hoy; control de acceso es fase 2 / hardware partner.” |
| Cliente vet pide “todo el HIS” | “Fichas, turnos y mostrador sí; laboratorio y portal del tutor no están en el alcance actual.” |
| Demo impresiona y piden firmar “todo el catálogo” | “Cerramos el pack de §3.1 que usaste; el resto se suma por piloto o cuando el pack pase a autorizado.” |
| Partner pregunta si cobramos comisiones auto a CBU | “Comisión se acredita en billetera; retiro cash lo liquida un analista; o usan el crédito para pagar Claver.” |

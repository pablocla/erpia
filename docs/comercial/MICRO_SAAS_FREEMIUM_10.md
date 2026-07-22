# 11 Micro-SaaS Freemium — Claver Growth Portfolio

**Roles:** Chief Revenue Officer + Software Architect (Growth B2B AR)  
**Fecha:** 2026-07-20 (rev. portfolio **monetizado en código**)  
**Principio:** reutilizar **≥80%** backend existente (CxC, MP, WA, agenda, consorcios, fiado, crons, shells lite, billing, vendedor en ruta, stock).  
**Modelo:** ancla gratis sin tarjeta → gatillo de automatización de plata → suscripción MP.

**Fuente de verdad en código:** `lib/comercial/micro-saas-portfolio.ts`  
**Cableado comercial:** marketplace · enganches · sub-saas · shells · packs calle · product-registry · seed `ProductoComercial`

**Relacionados:** `docs/GO_LIVE_PRD.md` · `lib/comercial/sub-saas-catalog.ts` · `lib/marketplace/enganche-catalog.ts` · `lib/scheduling/cron-registry.ts` · `app/vendedor/*` · `lib/maps/*`

> **Nota de archivo:** el path se mantiene `MICRO_SAAS_FREEMIUM_10.md` por links existentes; el portfolio vigente son **11** productos **vendibles**.

### Integración monetizable (implementada)

| Capa | Archivo | Qué hace |
|------|---------|----------|
| SSOT portfolio | `lib/comercial/micro-saas-portfolio.ts` | 11 productos, precios, anclas, ROI, free/paid |
| Marketplace | `lib/marketplace/marketplace-catalog.ts` | SKUs categoría Micro-SaaS Freemium |
| Enganches | `lib/marketplace/enganche-catalog.ts` | Anzuelos + upsell |
| Sub-SaaS / landings | `lib/comercial/sub-saas-catalog.ts` | `/claver/apps/{slug}` + destacados |
| Product shells | `lib/comercial/product-shell.ts` | Nav lite por producto |
| Packs calle | `lib/comercial/pack-calle-catalog.ts` | `PACKS_CALLE` + `modoLite` por SKU |
| Vitrine home | `lib/comercial/commercial-packaging.ts` | `microSaasProductosEntrada()` |
| Registry | `lib/platform/product-registry.ts` | Activación horizontal |
| Seed billing | `lib/platform/commercial-service.ts` | `ProductoComercial` FK para suscripciones |
| Provisionable | `lib/marketplace/sku-availability.ts` | Reactiva sale de `planned` |

**Activación comercial:** `/login?activar={sku}`  
Ej.: `?activar=pos.fiado_barrio` · `?activar=micro.claver_ruta` · `?activar=micro.confirma_turnos`

---

## Cómo van en la landing (sin saturar)

### Principio: **no mostrar 11 productos en el hero**

La home ya está diseñada como **1 dolor a la vez** (`?dolor=fiado|cobra|turnos`) + 3 cards de combate. Meter 11 apps ahí:

- diluye la conversión del ancla Fiado  
- se siente “ERP de 40 módulos” otra vez  
- rompe el mensaje freemium (un problema → un producto)

### Arquitectura de capas (implementada)

```text
Hero (1 producto)          ← chips Fiado | Cobrá | Confirmá
   ↓
Combate (3 cards)          ← mismas 3 puertas de entrada
   ↓
Preview + pasos + prueba   ← del dolor activo
   ↓
#apps-por-colectivo        ← 4 COLECTIVOS (sellos), no 11 cards
   ↓
Ecosistema / packs rubro   ← colapsable, secundario
   ↓
/claver/apps               ← catálogo completo
```

### Los 4 colectivos (marcas hermanas)

| Colectivo | Vende como… | Apps adentro | CTA líder |
|-----------|-------------|--------------|-----------|
| **Claver Mostrador** | Día a día del local / calle | Fiado · Caja · Ruta | Fiado gratis |
| **Claver Cobro** | Que te paguen | Cobrá · Seña · Abono · Reactiva | Cobrá 14d |
| **Claver Agenda** | Gente y tiempo | Confirmá · Cuota | Confirmá 14d |
| **Claver Propiedad** | Expensas y alquileres | Expensas · Renta | Expensas |

Código: `MICRO_SAAS_COLECTIVOS` en `micro-saas-portfolio.ts`  
UI: `components/marketing/micro-saas-colectivos-section.tsx`  
Home: `ClaverMatrixHub` → sección entre social proof y ecosistema.

### Reglas de copy en landing

1. **Nombre de colectivo** = sello (como “Google Workspace” vs Gmail/Drive).  
2. **Nombre de app** = producto cobrable (Claver Fiado, Claver Ruta).  
3. En cada pill: **precio o Gratis** — transparencia freemium.  
4. Detalle free vs paid **colapsado** (“Ver free vs pago”) — no llena la pantalla.  
5. El hero **no** lista Ruta/Seña/Abono; se descubren por colectivo o upsell post-registro.

### Flujo de venta por colectivo

```text
Visitante elige dolor hero "Fiado"
  → ve mock de libreta
  → scrollea a Claver Mostrador (resaltado)
  → ve Fiado (gratis) + Caja + Ruta
  → CTA "Empezar con Fiado gratis"
  → en app, upsell Cobrá / Ruta cuando toca el dolor de cobro o calle
```

### Qué no hacer

| Evitar | Por qué |
|--------|---------|
| 11 chips en el hero | Saturación cognitiva |
| Grid 11×1 en above-the-fold | Parece directorio, no producto |
| Mezclar packs ERP “pool-*” con freemium en la misma franja | Confunde precio y promesa |
| Forzar modoLite completo al activar un micro | Rompe la magia del shell |

---

## Tabla ejecutiva (11 filas)

| # | Producto | Nicho / inquilino | Ancla gratis (para siempre) | Gatillo pago (automatización) | Precio ARS/mes | ROI en una frase |
|---|----------|-------------------|-----------------------------|-------------------------------|----------------|------------------|
| 1 | **Claver Fiado** | Almacén, kiosco, fiambrería | Libreta digital + saldo por cliente + listado deudores | Avisos WA + link de pago MP + recordatorio de mora | **$0** ancla → upsell **Cobrá $19.900** | 1 cobro recuperado paga 3–6 meses del upsell |
| 2 | **Claver Cobrá** | PyME con CxC, mayorista, monotributista B2B | Panel de cuentas por cobrar + aging manual | Secuencia WA automática + links MP + secretaria de cobranza | **$19.900** | 1 factura cobrada a tiempo paga el año |
| 3 | **Claver Confirmá** | Peluquería, estética, consultorio, vet | Agenda de turnos + clientes (manual) | Recordatorio WA víspera + reconfirmación + hueco liberado | **$14.900** | 1 no-show evitado/semana paga 4 meses |
| 4 | **Claver Expensas** | Admin informal de edificio / consorcio | Unidades + expensa del mes en pantalla | Liquidación masiva + WA a morosos + link cobro | **$24.900** | 1 expensa cobrada a tiempo paga 2–3 meses |
| 5 | **Claver Renta** | Dueño de 1–10 departamentos (no inmobiliaria) | Contratos + vencimientos en lista | Aviso de alquiler + recibo + link MP al inquilino | **$19.900** | 1 mes de alquiler cobrado 5 días antes = ROI ×10 |
| 6 | **Claver Seña** | Canchas, salones, fotógrafos, eventos | Presupuesto/reserva con monto de seña manual | Cobro de seña por link + recordatorio saldo + no-show fee | **$14.900** | 1 seña cobrada evita un día perdido |
| 7 | **Claver Cuota** | Gym de barrio, pilates, club | Socios + planes + quién debe (manual) | Avisos de vencimiento + morosos WA + link de cuota | **$19.900** | 2 cuotas recuperadas pagan el mes |
| 8 | **Claver Caja** | Dueño de mostrador, franquicia chica | Apertura/cierre de caja y movimientos | Alerta caja abierta +12h + arqueo ciego + diff automática | **$14.900** | Detectar 1 desvío de $20k paga 1 año |
| 9 | **Claver Abono** | Clubes, mant. AC, software de barrio, mutuales | Plantilla de abono recurrente (lista) | Emisión automática de factura/CC + cobranza del ciclo | **$24.900** | 1 abono olvidado recuperado paga 2 meses |
| 10 | **Claver Reactiva** | Retail / salón / vet con base de clientes | Listado de clientes “dormidos” (filtro UI) | Campaña WA + cupón/oferta + tracking de reactivados | **$12.900** | 1 cliente reactivado (ticket medio) paga 3 meses |
| 11 | **Claver Ruta** | Distribuidora chica, preventista, ferretería mayorista, vendedor de calle | Mapa de clientes del día + ficha con **historial** + venta a **cuotas** de stock (manual) | Optimizar ruta + cobro auto de cuotas (WA/MP) + stock en campo + offline sync | **$24.900** | 1 cuota cobrada en calle + 1 pedido extra en la ruta pagan el mes |

**Piso de precio Claver:** respetar política de `precioCobrableSku` / piso ~$10.000 donde aplique. Anclas $0 solo para enganche de volumen (Fiado ya es el patrón canónico).

---

## Detalle técnico de implementación rápida (por producto)

### 1. Claver Fiado

| Campo | Definición |
|-------|------------|
| **Nicho** | Dueño de almacén/kiosco/fiambrería que fía en cuaderno. |
| **Ancla gratis** | Alta de clientes, anotar fiado, ver saldo y historial. Sin tarjeta. SKU `pos.fiado_barrio` ($0). |
| **Gatillo pago** | “Avisar morosos” / “Link de cobro” / “Recordatorio automático semanal” → requiere `intang.cobranzas_wa` + `com.whatsapp` + `fiscal.clavpay_link`. |
| **Código ≥80%** | `lib/fiado/*` · `app/api/fiado/*` · `lib/mercadopago/deudor-pago-link.ts` · `lib/mercadopago/aplicar-pago-deudor.ts` · `lib/comercial/product-shell.ts` (shell `fiado`) · `lib/marketplace/enganche-catalog.ts` · Prisma `Cliente.saldoCuentaCorriente`, `CuentaCobrar`, `Recibo`. |
| **Precio / ROI** | Ancla **$0**; upsell Cobrá **$19.900**. *“Con recuperar un solo fiado de $60k pagás 3 meses del plan que avisa solo.”* |
| **Impl rápida** | Ya existe. Cerrar smoke E2E deudores/resumen 200 + soft-limit free (N avisos/mes) en capa entitlement. |

---

### 2. Claver Cobrá

| Campo | Definición |
|-------|------------|
| **Nicho** | PyME con facturas a 30 días, monotributista B2B, distribuidora chica. |
| **Ancla gratis** | Listado CxC, aging, marcar “cobrado” a mano (sin envío masivo). |
| **Gatillo pago** | Secuencia automática D+1/D+7/D+15 por WA + link MP + fee opcional Cobranza-as-a-Service. |
| **Código ≥80%** | `lib/cc-cp/cuentas-service.ts` · `lib/cobros/*` · `lib/cobranza/as-a-service.ts` · `lib/marketplace/cobranzas-wa-service` (vía activación) · `lib/scheduling/jobs/cobranzas-ia.ts` · playbook `cobranza_whatsapp` en `lib/automation/virtual-workers-catalog.ts` · `lib/whatsapp/whatsapp-service.ts` · shell `cobra` en `product-shell.ts` · SKU `intang.cobranzas_wa`. |
| **Precio / ROI** | **$19.900/mes** (alineado catálogo ~20k). *“Una factura de $100k cobrada 10 días antes financia 5 meses.”* |
| **Impl rápida** | Soft-limit free: 20 CxC visibles; paid desbloquea cola WA + cron. Wiring entitlement en `canWriteSku`. |

---

### 3. Claver Confirmá (ex “Turnos”)

| Campo | Definición |
|-------|------------|
| **Nicho** | Peluquera, barbero, estética, kinesiólogo, vet de barrio. |
| **Ancla gratis** | Agenda del día/semana + alta de turnos y clientes. |
| **Gatillo pago** | Recordatorio automático víspera (job `recordatorios`) + plantilla CONFIRMAR/CANCELAR + relleno de huecos. |
| **Código ≥80%** | `lib/agenda/agenda-service.ts` · `app/api/agenda/*` · `lib/scheduling/jobs/recordatorios.ts` · `lib/scheduling/jobs/whatsapp-outbound.ts` · Prisma `Turno`, `Profesional`, `Servicio` · niche `engine: agenda` · shell `turnos` · playbook `agenda_reminder`. |
| **Precio / ROI** | **$14.900/mes**. *“1 no-show de coloración ($25–40k) paga casi 3 meses.”* |
| **Impl rápida** | Free: turnos ilimitados UI. Paid: encolar `MensajePendienteWhatsApp` desde cron (ya existe). Contador free: 0 envíos auto/mes. |

---

### 4. Claver Expensas

| Campo | Definición |
|-------|------------|
| **Nicho** | Administrador informal de PH/edificio (no estudio contable grande). |
| **Ancla gratis** | Cargar unidades + ver expensa del período + “quién pagó / quién no” en pantalla. |
| **Gatillo pago** | Liquidar mes a todos + WA masivo a morosos + link MP + PDF simple. |
| **Código ≥80%** | `lib/consorcios/consorcios-service.ts` · `consorcios-morosos-service.ts` · `consorcios-cobro-service.ts` · `consorcios-fiscal-service.ts` · `lib/scheduling/jobs/consorcios-alertas.ts` · `lib/niche/niche-whatsapp.ts` · SKU `niche.consorcios` · pool `pool-propiedad` · Prisma expensas/unidades. |
| **Precio / ROI** | **$24.900/mes**. *“Cobrar 1 expensa de $80k a tiempo paga 3 meses.”* |
| **Impl rápida** | Free: 1 consorcio / hasta 12 unidades. Paid: multi-edificio + job alertas + envíos. |

---

### 5. Claver Renta

| Campo | Definición |
|-------|------------|
| **Nicho** | Propietario particular con 1–10 depas/locales (no broker). |
| **Ancla gratis** | Propiedades + contratos activos + calendario de vencimientos. |
| **Gatillo pago** | Aviso 5 días antes + el día + mora; link de pago; recibo digital. |
| **Código ≥80%** | `lib/inmobiliaria/alquileres-service.ts` · `inmobiliaria-service.ts` · `lib/scheduling/jobs/inmobiliaria-alertas.ts` · CxC + MP deudor · email/WA · shell propiedad / pool `pool-propiedad`. |
| **Precio / ROI** | **$19.900/mes**. *“Adelantar 5 días un alquiler de $400k vale más que un año de suscripción.”* |
| **Impl rápida** | Free: 2 contratos. Paid: cron alertas + link MP por inquilino. |

---

### 6. Claver Seña

| Campo | Definición |
|-------|------------|
| **Nicho** | Canchas de fútbol 5, salones de fiesta, fotógrafos, DJ, eventos. |
| **Ancla gratis** | Presupuesto/reserva con estado (borrador / seña pendiente / confirmado) manual. |
| **Gatillo pago** | Link “pagá la seña” (MP) + recordatorio de saldo + liberación automática si no paga. |
| **Código ≥80%** | `lib/presupuesto/presupuesto-service.ts` · `app/api/ventas/presupuestos/*` · `lib/mercadopago/*` · `lib/ecommerce/checkout-service.ts` (patrón pending_pago) · niche `movimientos` para canchas/feria · shell `servicios` / monotributo. |
| **Precio / ROI** | **$14.900/mes**. *“Una seña de $30k cobrada evita un sábado vacío.”* |
| **Impl rápida** | Mapear estados de presupuesto a “seña %”; free sin link; paid genera preferencia MP + WA. |

---

### 7. Claver Cuota

| Campo | Definición |
|-------|------------|
| **Nicho** | Dueño de gym de barrio, pilates, club social. |
| **Ancla gratis** | Socios, planes, marcar “pagó / no pagó” a mano. |
| **Gatillo pago** | Job de vencimientos + WA a morosos + link de cuota del mes. |
| **Código ≥80%** | `lib/membresias/membresias-service.ts` · `app/api/membresias/*` · Prisma `PlanMembresia`, `Membresia` · niche `engine: cuotas` · `lib/scheduling/jobs/renovacion-abonos.ts` · shell puntos/gym · SKU `niche.gimnasio_barrio`. |
| **Precio / ROI** | **$19.900/mes**. *“2 cuotas de $25k recuperadas pagan el mes y sobra.”* |
| **Impl rápida** | Free: 40 socios, sin auto-aviso. Paid: cron + cola WA. Unificar home membresías vs `/nicho/gimnasio` (gap ya auditado). |

---

### 8. Claver Caja

| Campo | Definición |
|-------|------------|
| **Nicho** | Dueño de kiosco/almacén que desconfía del cajero o del “cierre a ojo”. |
| **Ancla gratis** | Abrir/cerrar caja, ver movimientos del turno. |
| **Gatillo pago** | Alerta “caja abierta +12h” + arqueo ciego + reporte de diferencias. |
| **Código ≥80%** | `lib/caja/arqueo-service.ts` · `app/api/caja/*` · `lib/almacen-rosario/arqueo-ciego-service.ts` · playbook `cierre_caja_alerta` · virtual worker “Bot Caja Noche” · SKU `pos.arqueo_ciego` / shell POS. |
| **Precio / ROI** | **$14.900/mes**. *“Un desvío de $20k detectado una vez al año paga la suscripción.”* |
| **Impl rápida** | Free: 1 caja, cierre manual. Paid: playbook + SKU arqueo ciego. |

---

### 9. Claver Abono (facturación recurrente)

| Campo | Definición |
|-------|------------|
| **Nicho** | Mantenimiento de AC/plagas “a futuro”, clubes, mutuales, proveedores de servicio mensual. |
| **Ancla gratis** | Definir abono (cliente, monto, día del mes) visible en lista. |
| **Gatillo pago** | Emisión automática del ciclo → factura/CC + enganche cobranza. |
| **Código ≥80%** | `lib/ventas/facturacion-recurrente-service.ts` · Prisma `FacturaRecurrente` · `lib/scheduling/jobs/facturacion-recurrente.ts.bak` (reactivar) · `lib/afip/*` opcional · CxC + Cobrá. |
| **Precio / ROI** | **$24.900/mes**. *“1 abono de $50k que se olvidaba emitir paga 2 meses.”* |
| **Impl rápida** | Free: 3 abonos, emisión manual “generar ahora”. Paid: cron diario + auto-CC. |

---

### 10. Claver Reactiva

| Campo | Definición |
|-------|------------|
| **Nicho** | Retail, salón, vet, gym con base de clientes y venta dormida. |
| **Ancla gratis** | Filtro “sin compra / sin visita en 60–90 días” en clientes. |
| **Gatillo pago** | Campaña WA masiva (cola) + plantillas IA + tracking reactivados. |
| **Código ≥80%** | SKU `intang.reactivador_clientes` (enganche-catalog) · `lib/ai/ai-business.ts` (mensajes WA) · `lib/scheduling/jobs/whatsapp-outbound.ts` · CRM/clientes · playbooks reactivación vía automation. |
| **Precio / ROI** | **$12.900/mes**. *“Reactivar 1 cliente de ticket $40k paga 3 meses.”* |
| **Impl rápida** | Free: lista read-only top 20. Paid: envío + cron semanal + cupo de mensajes. |

---

### 11. Claver Ruta *(nuevo — mapa + cuotas de stock + historial)*

Producto enganche para **venta y cobro en calle**: el preventista ve **mapa de la ruta del día**, abre la **ficha del cliente con historial completo** (compras, saldo, cuotas, visitas) y vende **artículos de stock en cuotas** sin Excel ni WhatsApp suelto.

| Campo | Definición |
|-------|------------|
| **Nombre comercial** | **Claver Ruta** (lema: *“Tu ruta. Sus cuotas. Su historial.”*) |
| **Nicho / inquilino** | Dueño de **distribuidora chica**, **mayorista de almacén/ferretería**, **preventista / vendedor de calle**, reparto con cobro, revendedores B2B de barrio. Rol ya modelado: `vendedor_ruta`. |
| **Ancla gratis (hook freemium)** | 1 vendedor · hasta **N clientes en ruta** (ej. 25) · **mapa simple** de paradas del día (orden manual) · ficha cliente con **historial de ventas + saldo + cuotas pendientes** (solo lectura de datos cargados) · alta de **pedido/venta a cuotas** de productos en stock (3–6 cuotas) **registrada a mano** · sin envíos automáticos. Sin tarjeta. |
| **Gatillo de monetización (paid)** | 1) **Optimización / mapa de ruta** del día (geocode + orden sugerido + ETA). 2) **Cobro automático de cuotas**: recordatorio WA día de vencimiento + **link MP** por cuota. 3) **Stock en campo** confiable + sync offline de pedidos. 4) Multi-vendedor / multi-ruta. 5) Comisiones del vendedor. |
| **Módulos de código reutilizados (≥80%)** | **Mapa / geo:** `lib/maps/hoja-ruta-catalog.ts` · `lib/maps/nominatim-geocode.ts` · GPS en `app/vendedor/page.tsx`. **App campo:** `app/vendedor/*` · rol `vendedor_ruta` en `app/dashboard/usuarios/page.tsx`. **Pedidos / stock:** `lib/ventas/ventas-service.ts` (vendedorId, reserva stock) · `lib/stock/*` · `lib/productos/*` · APIs ventas/POS. **Cuotas de artículos:** `lib/cc-cp/cuentas-service.ts` (`condicionPago.cuotas` → N `CuentaCobrar` con `numeroCuota`) · Prisma `CuentaCobrar`, `Factura`, `Recibo` · cobro parcial `lib/cobros/*`. **Historial cliente:** `Cliente` + facturas + CxC + fiado (`lib/fiado/*`) + pedidos por `clienteId` · CRM `lib/crm/*` si aplica. **Cobro auto:** `lib/mercadopago/deudor-pago-link.ts` · `aplicar-pago-deudor.ts` · `lib/whatsapp/*` · jobs `cobranzas-ia` / `recordatorios` pattern · shell lite nuevo `ruta` (tabs: Mapa, Clientes, Cuotas, Stock, Más). **Logística (opcional later):** `lib/logistica/*`. |
| **Precio / ROI** | **$24.900/mes** (o $19.900 1 vendedor / $34.900 multi-ruta). *“Cobrar 1 cuota de $80k en la calle + 1 pedido extra por no olvidar un cliente de la ruta pagan el mes y sobra.”* |
| **Impl rápida (fases)** | **F0 (1–2 sem):** shell + lista “ruta del día” (clientes asignados, sin optimización) + ficha historial (reutilizar queries de facturas/CxC/fiado) + venta con `condicionPago` multi-cuota ya soportada en `cuentas-service`. **F1:** mapa Leaflet/OSM con Nominatim (ya hay geocode) + orden de paradas. **F2:** cron cuotas vencidas → WA + link MP. **F3:** offline queue de `app/vendedor` + stock al confirmar. |
| **SKU sugerido** | `field.claver_ruta` o pack `pool-vendedor-ruta` (depende de `core.claver` + opcional `intang.cobranzas_wa`). |
| **modoLite / shell** | `modoLite: "niche"` o nuevo `"ruta"` · tabs: **Mapa** · **Clientes** · **Cuotas** · **Pedidos** · **Más** (stock, mi plan). |

#### Flujo de valor (usuario)

```text
Mañana
  → Abre Claver Ruta → Mapa con 12 paradas (orden sugerido si paid)
  → Toca cliente "Almacén El Sol"
      → Historial: últimas compras, saldo CC, cuotas 2/6 de heladera vitrina,
        fiado viejo, última visita
  → Vende 10 bultos + 1 artículo alto valor en 6 cuotas (descuenta stock)
  → Cobra cuota #2 en efectivo o manda link MP (paid auto)
  → Marca visita hecha → siguiente en el mapa
```

#### Soft-limits freemium

| Free | Paid |
|------|------|
| 1 usuario vendedor | Multi-vendedor / multi-ruta |
| ≤ 25 clientes en ruta | Ilimitado |
| Mapa lista / orden manual | Geocode + orden optimizado + mapa vivo |
| Cuotas registradas, cobro manual | Aviso WA + link por cuota + aging de cuotas de stock |
| Historial 90 días | Historial completo + export |
| Online only | Offline sync pedidos/cobros |

#### Diferencia vs productos vecinos

| Producto | Vs Claver Ruta |
|----------|----------------|
| **Fiado** | Fiado = libreta de mostrador; Ruta = **calle + stock + cuotas de mercadería**. |
| **Cobrá** | Cobrá = CxC genérica; Ruta = **cuota ligada a ítem de stock + visita + mapa**. |
| **Cuota (gym)** | Cuota gym = membresía; Ruta = **financiación de artículos** (heladera, herramienta, bultos). |

---

## Arquitectura freemium transversal (no reinventar)

```text
Landing micro-SaaS (?activar=SKU)
  → signup trial/ancla (app/api/auth/signup)
  → modoLite + Product Shell (lib/comercial/product-shell.ts)
  → Free: CRUD + listados (sin outbound automático)
  → Paid trigger: entitlement SKU + cron job + WhatsApp queue + MP link
  → Cobro: lib/billing/* (MP preapproval) + activarProducto
```

| Capa freemium | Reutilizar |
|---------------|------------|
| Entitlement free vs paid | `lib/platform/product-lifecycle.ts`, `lib/comercial/api-sku-entitlements.ts`, `suscripcionModulo` |
| UX enfocada | `modoLite` + `PRODUCT_SHELLS` + `SidebarLiteNav` |
| Outbound | `MensajePendienteWhatsApp` + `runWhatsAppOutbound` + Twilio env |
| Cobro del deudor | `crearPreferenciaPago` / deudor-pago-link + webhook MP |
| Cobro del SaaS | `createMercadoPagoSubscription` + webhook preapproval |
| Crons | `lib/scheduling/dispatcher.ts` + `CRON_JOBS` (ampliar registry; hoy Vercel solo expone trial-dunning) |
| Playbooks | `virtual-workers-catalog.ts` |
| Campo / ruta | `app/vendedor/*` · `lib/maps/*` · rol `vendedor_ruta` |

### Regla de oro freemium (CRO)

| Free forever | Paid always |
|--------------|-------------|
| Ver y cargar datos | **Automatizar plata o tiempo** (avisar, cobrar, emitir, alertar, ruteo) |
| Manual “copiar mensaje” | Envío masivo / cola / cron |
| 1 entidad / cupos bajos | Multi-sede / multi-vendedor / sin cupo / reportes |

---

## Orden de lanzamiento recomendado (90 días revenue)

| Fase | Productos | Por qué |
|------|-----------|---------|
| **Ya / semana 1** | Fiado (ancla) + Cobrá | Embudo probado; mayor código listo |
| **Semana 2–4** | Confirmá + Cuota | Jobs de recordatorio/membresías ya existen |
| **Mes 2** | Expensas + Renta + **Ruta (F0 ficha+cuotas)** | Plata fija del mes + B2B calle |
| **Mes 2–3** | Seña + Caja + Abono + **Ruta (mapa+auto cobro)** | Control retail + oficios + campo |
| **Mes 3** | Reactiva | Monetiza la base instalada de free users |

**No lanzar primero:** verticales sin motor (fumig/AC full OT). Usar **Seña/Abono** como proxy freemium de oficios; **Ruta** como proxy de “distribuidora / preventa”.

---

## Unit economics orientativos (AR)

| Métrica | Target freemium calle AR |
|---------|--------------------------|
| CAC ads/organic micro | $3.000–$12.000 |
| Conversión free→paid 30–60d | **8–15%** (ancla con dolor de cobranza / ruta) |
| ARPU blended | $15–24k (Ruta tira el ARPU arriba) |
| Payback | < 45 días si el gatillo es “cobro recuperado” |
| Churn mens. paid | < 6% si el cron / la ruta “hace plata” visible |

**Pricing pack dual (recomendado en UI):**

- Free: sin tarjeta  
- Pro: precio de tabla  
- Pro+Cobrá: +$10k si quiere links MP + secuencias (bundle)  
- Ruta Pro: $24.900 · Ruta Team (3 vendedores): $34.900  

---

## Checklist de producto por micro-SaaS (Definition of Done)

- [ ] SKU en catálogo + `modoLite` + shell de ≤6 tabs  
- [ ] Ancla gratis sin MP  
- [ ] Soft-limit medible (N envíos / N entidades / N clientes en ruta)  
- [ ] Botón paid con ROI copy en pantalla del dolor  
- [ ] Checkout MP suscripción (path billing existente)  
- [ ] Al pagar: `activarProducto` (no solo `suscripcionModulo`) — ver auditoría billing  
- [ ] 1 cron o playbook que demuestre valor en 24–48 h  
- [ ] Landing `?activar=sku` + email welcome sub-SaaS  
- [ ] **Ruta:** ficha historial + venta multi-cuota stock + mapa (aunque sea v1 lista→mapa)  

---

## Conclusión CRO

Claver no necesita 40 verticales nuevas: necesita **11 grifos freemium** sobre motores ya escritos (**fiado, CxC, agenda, consorcios, alquileres, membresías, caja, recurrente, WA, MP, vendedor en ruta, stock, cuotas**).

La conversión alta en PyME argentina se gana cuando:

1. **Gratis** = “orden en la cabeza” (lista, saldo, turno, **ruta del día**, historial).  
2. **Pago** = “el sistema me cobra / me avisa / me rutea / me cierra la caja solo”.  
3. **ROI** se demuestra con **un solo evento de dinero recuperado** (o un pedido extra en la calle).

El ancla **Claver Fiado ($0)** sigue siendo el volante de adquisición; **Cobrá / Confirmá / Expensas / Renta / Ruta** son los monitores de ARPU.

**Claver Ruta** cierra el hueco B2B de calle: no es solo cobranza ni solo stock — es **mapa + financiación de mercadería + memoria del cliente** en el celular del preventista.

---

*Documento comercial-técnico. Precios en ARS orientativos a jul-2026; alinear con `precioCobrableSku` y piso comercial vigente antes de publicar en marketplace.*

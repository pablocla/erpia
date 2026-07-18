# 20 Apps ocultas — optimización + prompts ciclo de vida completo

> Objetivo: convertir procesos ya existentes del monorepo en **productos vendibles** con ciclo  
> **descubrimiento → trial → activación → valor → cobro → expansión → retención → baja/churn**.  
> Stack: Next.js 15, multi-tenant, SKUs (`SuscripcionModulo`), trial, `modoLite`, MercadoPago, es-AR.
>
> **Fiscal:** CAEA y FCE MiPyME **no** son apps de esta lista. Van **empaquetados** en  
> **Claver Facturación (AFIP)** (§4). No landing, no precio, no trial sueltos.

---

## 0. Ciclo de vida estándar (usar en todos los prompts)

| Fase | Código | Qué debe existir por app |
|------|--------|---------------------------|
| **C1 Descubrimiento** | Landing `/claver/apps/{slug}`, SEO, reel hook, demo | 1 dolor, 1 promesa, 1 precio |
| **C2 Captura** | `/login?activar={sku}`, registro con marca del producto | No caer al ERP completo |
| **C3 Trial** | 14 días, banner countdown, `modoLite` sidebar | Solo menús del producto |
| **C4 Activación (aha)** | Checklist in-app 3 pasos, empty states con CTA | Tiempo-a-valor &lt; 15 min |
| **C5 Valor diario** | Job/alerta/resultado visible sin buscar | “El sistema labura solo” |
| **C6 Cobro** | Paywall día 7–14, MP suscripción, entitlements 403 | Sin mock en prod |
| **C7 Expansión** | Upsell 1–2 SKUs relacionados en momento de dolor | No App Store infinito |
| **C8 Retención** | Health score, emails/WA de valor, onboarding incompleto | Detectar riesgo |
| **C9 Baja / churn** | Flujo cancelación + motivos + offer save + export datos | Dignidad + win-back 30d |

### Plantilla de scoring (rellenar por app)

| Dimensión | 1–5 |
|-----------|-----|
| Valor percibido | |
| Completitud funcional | |
| UX producto (no ERP) | |
| Vendibilidad (ads/calle) | |
| Stickiness / churn risk | |
| Listo para vender (promedio) | |

---

## Ranking optimizado (prioridad de empaquetado)

| Rank | App | Ticket | TTV | Stickiness | Prioridad |
|------|-----|--------|-----|------------|-----------|
| 1 | Claver Contador | Alto | Medio | Muy alta | **P0** |
| 2 | Claver Recurrente | Medio-alto | Rápido | Muy alta | **P0** |
| 3 | Claver Ruta | Medio-alto | Medio | Alta | **P0** |
| 4 | Claver Mayorista | Alto | Medio | Alta | **P0** |
| 5 | Claver Facturación (AFIP) | Medio-alto | Medio | Muy alta | **P0** |
| 6 | Claver Cocina | Medio | Rápido | Alta | **P1** |
| 7 | Claver Cashflow | Medio | Rápido | Media | **P1** |
| 8 | Claver Alertas Dueño | Bajo-medio | Rápido | Alta | **P1** |
| 9 | Claver Cheques | Bajo-medio | Rápido | Media | **P1** |
| 10 | Claver Expensas | Alto | Medio | Muy alta | **P1** |
| 11 | Claver Clínica | Alto | Medio | Alta | **P1** |
| 12 | Claver Picking | Medio | Medio | Media | **P2** |
| 13 | Claver Entrega | Medio | Medio | Media | **P2** |
| 14 | Claver IIBB | Medio | Lento | Alta (estacional) | **P2** |
| 15 | Claver CITI | Medio | Lento | Alta (estacional) | **P2** |
| 16 | Claver Conciliación | Medio | Medio | Media | **P2** |
| 17 | Claver Menú QR | Bajo | Muy rápido | Baja sola | **P2** |
| 18 | Claver Aprobaciones | Medio | Rápido | Media | **P2** |
| 19 | Claver Vet | Medio | Medio | Media | **P3** |
| 20 | Claver Proveedores | Medio | Lento | Media | **P3** |

### NO son apps sueltas (empaquetado fiscal)

| Capacidad | Empaquetado | SKU/flag interno | App Store / landing propia |
|-----------|-------------|------------------|----------------------------|
| **CAEA** (contingencia offline) | Dentro de **Claver Facturación / POS+AFIP** | `fiscal.caea` entitlement de plan | **No** |
| **FCE MiPyME** | Dentro de **Claver Facturación** (B2B fiscal) | `fiscal.fce_mipyme` entitlement | **No** |
| CAE online A/B/C | Core del mismo producto | plan base con AFIP | **No** (es el producto) |

**Regla:** si no se usa sin facturar AFIP, no es producto de combate: es **módulo del empaquetado de facturación electrónica**.

- **CAEA:** incluido en plan con AFIP producción (o Facturación Full). Copy de valor en landing POS/Facturación: *“También facturás si se corta internet”*.
- **FCE:** incluido en el mismo pack (o desbloqueo por plan Pro/B2B). UI en el flujo de emitir factura, no card “Claver FCE $X”.
- **Cobro:** un solo precio de Facturación/POS; no suscripciones separadas solo por CAEA o solo por FCE.

---

# PROMPTS POR APP (copiar/pegar a Cursor o Gemini)

Cada prompt asume el repo `pos-system-argentina`, AGENTS.md, multi-tenant, es-AR, y el ciclo C1–C9 de arriba.

---

## 1. Claver Contador

### Optimización rápida
| | Hoy | Ideal venta |
|--|-----|-------------|
| Valor real | ZIP cierre + IVA/SICORE/checklist | “El contador cierra el mes en 1 click” |
| UX | Enterrado en impuestos | Producto lite: período → generar → descargar → enviar |
| Venta | No aparece | Landing a estudios contables + multi-empresa |
| Churn | N/A | Si falla el cierre del mes, se va |

### Prompt

```
Sos product engineer del monorepo Claver (Next.js 15, Prisma, multi-tenant AR).

PRODUCTO: Claver Contador
SKU propuesto: pack.contador_cierre
PRECIO: $39.900/mes (trial 14d)
PATH CORE: lib/impuestos/pack-contador-service.ts + /dashboard/impuestos/*
MODO LITE: sidebar solo Contador (períodos, generar pack, envío, historial)

CONTEXTO REAL:
- Existe pack-contador-service (ZIP con libros, GL, checklist).
- Existen IVA, SICORE, pre-presentación, CITI, IIBB como menús ERP.
- NO hay sub-SaaS landing, NO hay modoLite contador, NO hay funnel de venta a estudios.

OBJETIVO: productizar end-to-end C1→C9.

ENTREGABLES:
1) Gap analysis honesto: qué funciona, qué es stub, qué falta para "wow en 15 min".
2) Landing /claver/apps/contador (dolor contador PyME + estudio).
3) Entrada: /login?activar=pack.contador_cierre con marca "Claver Contador".
4) Onboarding 3 pasos: (a) elegir período, (b) correr checklist pre-cierre, (c) descargar ZIP + email al contador.
5) Home del producto con estado del mes: % checklist OK, bottlenecks, CTA generar.
6) Paywall: tras 1 pack de trial o día 14; MP subscription; bloqueo generación si no paga (ancla: ver historial read-only).
7) Upsell: Claver IIBB, CITI, Recurrente.
8) Retención: email día 25 de cada mes "Tu cierre está listo para armarse".
9) Baja: export ZIP de últimos 12 cierres + encuesta (precio / no lo usa el contador / pasó a otro).
10) Métricas: trial→paid, packs generados/mes, time-to-first-pack, churn 30/90.

CRITERIOS DE ACEPTACIÓN:
- Usuario nuevo genera 1 pack sin tocar el resto del ERP.
- Contador externo recibe mail con link/ZIP.
- Sin SKU activo: UI visible bloqueada + API 403 en generar.
- Tests Vitest del service de pack + 1 e2e smoke onboarding.

NO: reescribir contabilidad. SÍ: empaquetar, UX lite, cobro, emails ciclo de vida.
Documentá archivos tocados y pendientes de AFIP real vs mock.
```

---

## 2. Claver CITI

### Optimización
Valor = archivo AFIP sin planilla. Venta estacional (cierre). UX = 1 pantalla: período → validar → descargar.

### Prompt

```
PRODUCTO: Claver CITI
SKU: fiscal.citi_export
PRECIO: $12.900/mes o incluido en Pack Contador
PATH: lib/impuestos/citi-service.ts, /dashboard/impuestos/citi

Ciclo C1–C9 para producto ultra-foco "export CITI sin errores".

FALTANTES TÍPICOS A AUDITAR Y COMPLETAR:
- Validaciones previas (CUIT, alícuotas, comprobantes sin CAE).
- Preview de errores antes del TXT.
- Historial de generaciones por período.
- Landing + activar sku + modoLite mínimo (solo CITI + facturas lectura).
- Paywall por descarga o por mes.
- Retención: recordatorio pre-vencimiento presentación.
- Baja: conservar exports 24 meses read-only 7 días post-baja.

Entregá: gap list P0/P1, UI de 1 flujo, checklist UX, emails, métricas time-to-first-export.
No ensanches a todo impuestos: CITI es el producto.
```

---

## 3. Claver IIBB

### Prompt

```
PRODUCTO: Claver IIBB
SKU: fiscal.iibb_liquidacion
PRECIO: $12.900/mes
PATH: lib/impuestos/iibb-service.ts, /dashboard/impuestos/iibb

Productizá liquidación IIBB como SaaS de un solo problema.

AUDITORÍA:
- ¿Calcula alícuotas por jurisdicción real o es parcial?
- ¿Padrones ARBA/AGIP integrados o manual?
- Empty states y mensajes de error entendibles (no contables crípticos).

CICLO:
C1 Landing "Dejá de pelearte con IIBB a fin de mes"
C4 Aha: primera liquidación del mes actual con números claros
C5 Job mensual que pre-arma liquidación el día 1
C6 Cobro antes de "confirmar/exportar"
C7 Upsell Pack Contador
C8 Alerta si hay ventas sin jurisdicción
C9 Baja con export de liquidaciones

Entregá gap realista, UX 3 pasos, y qué NO prometer en marketing si el cálculo es incompleto.
```

---

## 4. Claver Facturación (AFIP)  ★ P0 — incluye CAEA + FCE

> **CAEA y FCE MiPyME no se venden como apps.** Son capacidades de este producto padre  
> (facturación electrónica / POS+AFIP). Un precio, un trial, un onboarding fiscal.

### Optimización rápida
| | Hoy | Ideal venta |
|--|-----|-------------|
| Valor real | CAE + stubs CAEA/FCE en código | “Facturás legal, con o sin internet, y FCE si hace falta” |
| UX | Features sueltas / menús | Wizard AFIP único + emitir con opciones claras |
| Venta | Nadie compra “CAEA” ni “FCE” solo | Landing POS/Facturación con 3 bullets de capacidad |
| Empaque | Riesgo de 2 SKUs basura | 1 plan/SKU; flags internos `fiscal.caea` + `fiscal.fce_mipyme` |

### Capacidades del pack (no landings separadas)

```
Claver Facturación (core vendible)
├── CAE online (A/B/C, NC/ND)     → siempre
├── CAEA contingencia             → incluido plan full / prod AFIP
├── FCE MiPyME                    → incluido o Pro/B2B; UI al emitir
├── Certificados + PV             → onboarding
└── QR / ticket legal             → core
```

### Prompt

```
Sos product engineer del monorepo Claver (Next.js 15, Prisma, multi-tenant AR).

PRODUCTO PADRE: Claver Facturación (electrónica AFIP)
SKU propuesto: fiscal.facturacion_full  (o core del plan POS/Starter-Pro con AFIP)
PRECIO: el del plan POS/Facturación — NO crear precios sueltos solo por CAEA o FCE
PATHS:
- CAE: lib/afip/factura-service, solicitar-cae-*, POS/ventas
- CAEA: lib/afip/caea-*, docs/fiscal/CAEA-GUIA.md, POS offline
- FCE: lib/afip/mipyme-fce.ts, tipos 201–213, config CBU
MODO LITE: Facturación + Clientes + POS (si aplica) — no ERP completo

REGLA DE EMPAQUETADO (obligatoria):
- NO crear sub-SaaS "Claver CAEA" ni "Claver MiPyME FCE" con landing/precio propios.
- CAEA y FCE = features del mismo producto Facturación.
- Entitlements internos opcionales: fiscal.caea, fiscal.fce_mipyme (plan gate), no App Store cards de pago.
- Marketing: bullets en landing de Facturación/POS, no reels solo de FCE.

OBJETIVO: unificar UX + onboarding + cobro del pack fiscal C1→C9.

ENTREGABLES:
1) Gap analysis: CAE vs CAEA vs FCE — qué está prod-ready, qué es homologación, qué es stub.
2) Landing ÚNICA /claver/apps/facturacion (o POS) con:
   - Facturas con CAE en segundos
   - Contingencia CAEA si se corta internet
   - FCE MiPyME cuando facturás a grandes empresas
3) Wizard onboarding único: cert → PV → entorno → (opcional) activar CAEA → (opcional) CBU FCE.
4) Emitir factura: selector claro A/B/C y, si aplica, toggle/auto FCE; banner "modo contingencia" si CAEA.
5) Panel salud fiscal: CAEA vigente/vence en X días, FCE listo (CBU ok), últimos errores AFIP.
6) Trial: emitir en homologación (CAE + simular contingencia + 1 FCE test si posible).
7) Paywall: del PLAN de facturación/POS, no paywall por feature CAEA/FCE.
8) Upsell: Contador, CITI, IIBB, Recurrente (no "comprá CAEA aparte").
9) Retención: alertas "CAEA por vencer", "certificado por vencer"; métrica facturas/mes.
10) Baja: export facturas + offer pause; no desactivar solo CAEA como producto.
11) Alertas Dueño puede reusar evento "CAEA por vencer" como REGLA, no como app.

CRITERIOS:
- Usuario entiende un solo producto "Facturación".
- Cero precios en catálogo comercial solo para fiscal.caea o fiscal.fce_mipyme.
- Sin plan: bloqueo de emisión producción; features CAEA/FCE no se listan como apps.
- Docs/comercial y sub-saas-catalog alineados a esta regla.

NO: landings/SKUs de combate para CAEA o FCE.
SÍ: empaquetar en Facturación, UX de emitir, wizard, health, un cobro.
```

### Prompt de implementación (solo gaps CAEA/FCE como features)

```
Contexto: CAEA y FCE son FEATURES de Claver Facturación, no productos.

Implementá/mejorá únicamente como parte del flujo fiscal existente:
1) CAEA: wizard vigencia/quincena, banner POS contingencia, sync e informe al volver online,
   health "vence en X días" (puede notificar Centro de alertas).
2) FCE: detección receptor, CBU, mapBaseTipoToFce, emisión en UI de factura (no menú huérfano),
   contador de FCE emitidas en panel Facturación.
3) Copy marketing SOLO dentro de landing Facturación/POS.
4) Tests de regresión CAEA + FCE sin crear rutas /claver/apps/caea ni /fce.

Prohibido: precio mensual separado, trial separado, modoLite "solo caea", card App Store de pago.
```

---

## 5. Claver Aprobaciones

### Optimización rápida
| | Hoy | Ideal venta |
|--|-----|-------------|
| Valor real | Cola de aprobaciones | “Nadie gasta plata sin el OK del dueño” |
| UX | Menú ERP / mobile | Inbox simple en el celular del dueño |
| Venta | Invisible | Dueños multi-sucursal / socios |

### Prompt

```
PRODUCTO: Claver Aprobaciones
SKU: ops.aprobaciones_dueño
PRECIO: $9.900/mes
PATH: /dashboard/aprobaciones, aprobaciones-mobile, lib/aprobaciones/*, workflows

Producto de control: pagos, compras o descuentos sensibles requieren OK.

C1 Landing "Tu cajero no descuenta ni paga sin tu OK"
C2 activar + modoLite: Aprobaciones + notificaciones
C3 Trial 14d
C4 Aha: 1 solicitud demo → aprobar desde el celular en &lt;1 min
C5 Inbox del día (pendientes / aprobadas / rechazadas)
C6 Paywall por reglas activas o usuarios solicitantes
C7 Upsell Guardián POS, Alertas Dueño, Cashflow
C8 Si 14d sin solicitudes: tips de qué conectar (compras, egresos caja)
C9 Baja: export histórico decisiones + offer pause

GAPS: tipos de pedido (compra, egreso, descuento POS), push/WA al dueño,
roles, SLA "vencida sin respuesta", UI mobile-first.
No meter todo el motor BPM: 3 flujos prearmados bastan para vender.
```

---

## 6. Claver Recurrente  ★ P0

### Optimización
| | Hoy | Ideal |
|--|-----|-------|
| Valor | Modelo facturas recurrentes | “El día 1 se factura y cobra solo” |
| UX | Pantalla ERP | Builder de plan: cliente, monto, día, medio |
| Stickiness | Altísima si hay cartera activa | Cancelar duele |

### Prompt

```
PRODUCTO: Claver Recurrente
SKU: ventas.facturacion_recurrente
PRECIO: $16.900/mes
PATH: /dashboard/facturacion-recurrente + services de ventas/facturas
TESTS: __tests__/ventas/facturacion-recurrente-service.test.ts

Ciclo completo SaaS de abonos/cuotas/expensas-like.

FALTANTES A IMPLEMENTAR O CERRAR:
1) Catálogo: alta plan (nombre, $ , día del mes, IVA, cliente).
2) Motor mensual (cron/job) que genera factura + opcional link MP.
3) Panel "este mes: X generadas, Y fallidas, Z cobradas".
4) Notificación WA/email al cliente con comprobante/link.
5) Landing: gimnasios, clubes, monotributistas con clientes fijos, software, mantenimientos.
6) modoLite: Recurrente + Clientes + Cobros (nada más).
7) Trial: crear 3 planes y simular 1 corrida.
8) Paywall: bloquear corrida automática; manual 1-off read-only.
9) Upsell: Cobrá WA, Membresías, Contador.
10) Retención: si 0 planes activos 14 días → email reactivación.
11) Baja: pausar corridas, export CSV planes + histórico, offer "pausa 30 días" en vez de cancelar.
12) Métricas: planes activos, MRR generado al cliente final, fail rate cobro, churn.

Aha moment: "Corrí el mes y se emitieron N facturas sin que toques nada".
Priorizá confiabilidad del job sobre features nuevas.
```

---

## 7. Claver Cashflow

### Prompt

```
PRODUCTO: Claver Cashflow
SKU: fin.cashflow_dueño
PRECIO: $12.900/mes
PATH: /dashboard/cashflow, lib/banco/cashflow-service.ts

Producto "dueño de PyME a la mañana en el celular".

VALOR: saldo proyectado 7/30 días (cobros + pagos + cheques).
UX: 1 número grande, semáforo, top 5 vencimientos, CTA "qué hacer".

GAPS:
- Unificar C×C, C×P, cheques, banco en una proyección confiable.
- Onboarding: conectar al menos 1 cuenta o cargar saldos iniciales.
- Alertas WA: "En 5 días te quedás corto $X".
- Landing anti-planilla Excel.
- Trial con datos demo + importar reales.
- Paywall en proyección 30d o alertas (dejar 7d free tease).
- Upsell: Cheques, Conciliación, Cobrá.
- Baja: export CSV proyección + motivos.

Entregá wire de home móvil-first y definición de fórmula de proyección transparente (tooltip "cómo se calcula").
```

---

## 8. Claver Cheques

### Prompt

```
PRODUCTO: Claver Cheques
SKU: fin.cheques_cartera
PRECIO: $7.900/mes
PATH: lib/cheques/*, /dashboard/cheques, pos.cheques_cartera en almacén

De feature POS a producto de ansiedad: "ningún cheque se vence sin aviso".

C1 Landing "Cheques que se vencen sin que te enteres"
C4 Alta 3 cheques + ver calendario
C5 Alerta D-3 / D-1 por WA/email
C6 Cobro
C7 Upsell Cashflow + Conciliación
C8 Si cartera vacía 30d → winback o downsell
C9 Export cartera histórica

Gaps: estados (en cartera, depositado, rechazado, endosado), fotos/adjunto, multi-banco.
UX celular para cargar cheque en 30 segundos.
```

---

## 9. Claver Conciliación

### Prompt

```
PRODUCTO: Claver Conciliación Bancaria
SKU: fin.conciliacion_banco
PRECIO: $12.900/mes
PATH: lib/banco/conciliacion-service.ts, /dashboard/banco

Producto contable-tesorería: matchear extracto vs movimientos.

FALTANTES:
- Import CSV/OFX extracto (o al menos CSV banco AR común).
- Matching sugerido (monto+fecha) + confirmación 1 click.
- % conciliado del mes como KPI home.
- Landing a admin/contadores.
- Trial con extracto demo.
- Paywall en "cerrar mes conciliado".
- Retención: racha de meses 100% conciliados.
- Baja: export partidas abiertas.

No prometas open banking si no está: sé honesto en marketing (CSV primero).
```

---

## 10. Claver Ruta  ★ P0

### Optimización
| | Hoy | Ideal |
|--|-----|-------|
| Valor | App vendedor | Pedido en calle → stock → cobranza sin doble carga |
| UX | `/vendedor` suelta | Flujo móvil offline-first del día |
| Venta | Demo industria | Landing distribuidoras |

### Prompt

```
PRODUCTO: Claver Ruta
SKU: ops.vendedor_ruta
PRECIO: $19.900/mes (hasta N vendedores; extra por usuario)
PATH: app/vendedor/*, logistica, pedidos, clientes, listas precio

CICLO COMPLETO:

C1 Landing "Tus vendedores cargan el pedido en el celular, no en un papel"
C2 activar sku + modoLite: Ruta, Clientes, Pedidos, Cobros
C3 Trial 14d con 1 vendedor demo + catálogo
C4 Aha: primer pedido de ruta → aparece en depósito/picking
C5 Mapa del día / lista de visitas + total vendido hoy
C6 Paywall por vendedor activo o plan base
C7 Upsell: Picking, Entrega, Mayorista, Cobrá
C8 Si 7 días sin pedido de ruta → alerta dueño
C9 Baja: export pedidos del vendedor; offer pause seasonality (rubros estacionales)

GAPS CRÍTICOS A CERRAR:
- Roles vendedor vs dueño
- Precio por lista/cliente en móvil
- Offline queue de pedidos
- Meta del día y ranking (gamificación liviana)
- Permisos: vendedor no ve costos si no corresponde

UX móvil 390px first. Tests del flujo pedido→backend.
Métricas: pedidos/día/vendedor, ticket promedio, time-to-first-order.
```

---

## 11. Claver Picking

### Prompt

```
PRODUCTO: Claver Picking
SKU: ops.picking_deposito
PRECIO: $12.900/mes
PATH: /dashboard/picking, tablet, lib/picking/*

Productizá armado de pedidos para depósito.

Flujo ideal: pedido confirmado → lista picking → escanear → completar → remito.
GAPS: estados claros, tablet UI grande, sonido OK/error scan, multi-operario.
Landing a ecom/distribuidoras "dejá de armar con la planilla impresa".
Trial con 10 pedidos demo.
Paywall al superar N listas/mes free.
Upsell Ruta + Entrega.
Retención: tiempo medio de armado como vanity métrica positiva.
Baja: export listas históricas.

Enfocate en velocidad del operario, no en menús ERP.
```

---

## 12. Claver Entrega (POD)

### Prompt

```
PRODUCTO: Claver Entrega
SKU: ops.entrega_pod
PRECIO: $14.900/mes
PATH: /dashboard/distribucion, pod, logistica, hojas de ruta

Valor: prueba de entrega (firma/foto/GPS) + "¿dónde va mi pedido?".
GAPS: POD real (foto/firma), estados en tránsito, link tracking simple al cliente, hoja de ruta del día.
Landing: "El cliente deja de llamarte para preguntar si va el reparto".
C4: primera entrega con POD en demo.
C5: % entregas OK del día en home chofer/dueño.
C6 paywall.
C7 upsell Ruteador premium / Ruta vendedor.
C8 fallas de entrega repetidas → alerta.
C9 export POD.

Mobile-first chofer. Offline tolerant.
```

---

## 13. Claver Mayorista  ★ P0

### Prompt

```
PRODUCTO: Claver Mayorista
SKU: pool.mayorista_b2b (bundle)
PRECIO: $29.900/mes
COMPONENTES: listas-precio + portal B2B + pedidos + cuenta corriente
PATHS: /dashboard/listas-precio, portal B2B, pedidos venta, cc-cp

No vendas módulos sueltos: vendé "tu mayorista atiende 24/7".

C1 Landing B2B con login CUIT
C2 Trial con lista demo + 1 cliente portal
C4 Aha: cliente entra al portal y carga pedido solo
C5 Dueño ve pedidos portal del día
C6 Paywall
C7 Upsell Ruta, Cobrá, Ecommerce
C8 Si portal sin pedidos 14d → email "tus clientes no entraron"
C9 Baja: export listas + pedidos portal

GAPS:
- Onboarding listas (import CSV)
- Invitación cliente por mail/WA al portal
- Precios por lista visibles y correctos (resolverPreciosLineas)
- Fiado/CC límites en portal
- Branding portal con logo del mayorista

Métrica norte: % pedidos self-service vs carga manual.
```

---

## 14. Claver Proveedores

### Prompt

```
PRODUCTO: Claver Proveedores (portal)
SKU: ops.portal_proveedores
PRECIO: $12.900/mes
PATH: /portal-proveedores, compras, OC

Valor: el proveedor carga factura/OC y vos no reingresás.
GAPS: auth proveedor, estados OC, carga PDF/XML, matching con compra, notificaciones.
Landing a empresas con muchos proveedores chicos.
Trial: 1 proveedor invitado.
Paywall por proveedores activos o documentos/mes.
Upsell OCR Compras (intang.ocr_compras).
Retención: docs procesados/mes.
Baja: export + desactivar accesos proveedor.

Honestidad: si el portal es barebones, marcá beta y no cobres Enterprise price.
```

---

## 15. Claver Cocina  ★ P1

### Prompt

```
PRODUCTO: Claver Cocina
SKU: pool.hospitalidad_cocina
PRECIO: $19.900/mes
PATHS: /dashboard/hospitalidad/kds, toma-pedidos, /display, platos

Bundle UX: comandas → KDS → display cliente (opcional menú QR upsell).

C1 Landing bares/restós "la cocina deja de gritar"
C4 Primer pedido en KDS en &lt;5 min con demo platos
C5 Columnas por estado (nuevo/preparando/listo) touch-friendly
C6 Paywall
C7 Upsell Menú QR, POS, Delivery hub
C8 Si KDS sin uso 7d → tips
C9 Baja

GAPS: audio/alerta visual nuevo pedido, multi-estación, tiempos de demora, tablet landscape.
No meter contabilidad en el sidebar lite.
```

---

## 16. Claver Menú QR

### Prompt

```
PRODUCTO: Claver Menú QR
SKU: ops.menu_qr (o ext.menu_digital_pro)
PRECIO: $5.990/mes (enganche barato)
PATH: /menu/[empresaId], platos hospitalidad

Enganche top-of-funnel gastronomía.
GAPS: editor simple de platos/precios, QR descargable PNG, sin login para comensal, analytics "veces abierto".
Landing con preview real.
Trial free 14d → paywall o freemium con branding Claver.
Upsell OBLIGATORIO: Cocina, POS, Turnos.
Retención baja sola → siempre empaquetar con Cocina en ads.
Baja: export carta.

Aha: escanear QR y ver la carta del local en 2 minutos de alta.
```

---

## 17. Claver Clínica

### Prompt

```
PRODUCTO: Claver Clínica
SKU: pool.clinica_turnos_hc
PRECIO: $24.900/mes
PATHS: agenda, historia-clinica, facturación

Bundle: turnos online + HC + cobro/factura.

GAPS CRÍTICOS (compliance):
- Privacidad datos de salud (acceso roles, auditoría).
- HC usable (evoluciones, adjuntos, búsqueda paciente).
- Agenda pública + confirmación.
- NO sobreprometer obras sociales si no hay liquidación OS real.

C1 Landing profesionales/consultorios
C4 Primer turno + primera evolución HC
C5 Agenda del día + pacientes
C6 Paywall
C7 Upsell Recurrente (sesiones), Cobrá, WhatsApp recordatorios
C8 No-shows: recordatorio automático
C9 Baja: export HC con responsabilidad (proceso de entrega de datos)

Documentá límites legales en copy. modoLite estricto salud.
```

---

## 18. Claver Vet

### Prompt

```
PRODUCTO: Claver Vet
SKU: niche.vet_barrio (mejorar packaging)
PRECIO: $12.900/mes
PATH: veterinaria-service, /dashboard/veterinaria, gen.vet-voice si aplica

Productizá clínica vet de barrio:
- Ficha mascota (especie, dueño, vacunas)
- Turnos
- Cobro POS simple
Landing + demo /demo con seed vet.
GAPS: calendario vacunas, recordatorio WA dueño, historial.
C4: alta mascota + turno.
C7 upsell Menú no; upsell Cobrá + Recurrente planes salud.
C9 export fichas.

Si gen.vet-voice es vapor, no lo pongas en landing principal.
```

---

## 19. Claver Expensas

### Prompt

```
PRODUCTO: Claver Expensas (Consorcios)
SKU: niche.consorcios + intang.cobranzas_wa (bundle pool-propiedad)
PRECIO: $24.900/mes
PATH: lib/consorcios/*, dashboard nicho inmobiliaria/consorcios

Ya hay pack propiedad en GTM: endurecé el producto.

GAPS:
- Liquidación expensas del mes por unidad/% 
- Generación deuda + aviso WA morosos (reusar Cobrá)
- Portal propietario simple (ver expensa + pagar link)
- Onboarding: 1 edificio, 10 unidades demo en 10 min

C1 Landing administradores de consorcios
C4 Primera liquidación generada
C5 Morosos del mes
C6 Paywall fuerte (dato sensible + operación mensual)
C7 Portales inmobiliarios / contratos alquiler
C8 Si no liquidó el mes → empujón día 28
C9 Baja: export unidades + liquidaciones; offer pause

Métrica: liquidaciones/mes, % cobrado, morosidad.
```

---

## 20. Claver Alertas Dueño

### Prompt

```
PRODUCTO: Claver Alertas Dueño
SKU: ops.centro_alertas_pro
PRECIO: $9.900/mes
PATH: /dashboard/centro-alertas, lib/alertas/*, whatsapp reglas

Valor: el dueño no entra al ERP; el ERP le escribe.

REGLAS PREARMADAS (packs):
- Caja con desvío
- Stock 0 de top 20
- Cheque por vencer
- Cliente top sin comprar 30d
- CAEA por vencer
- Meta de venta del día

GAPS:
- Wizard "qué quiero que me avise" en lenguaje humano
- Canal: WA / email / Telegram
- No spamear: digest diario + críticos realtime
- Landing "Enterate del robo hormiga y del quiebre sin mirar la PC"
- Trial: activar 3 reglas + 1 alerta demo
- Paywall: más de N reglas o canales
- Upsell Guardián POS, Cobrá, Cashflow
- Retención: "esta semana te ahorramos X alertas accionadas"
- Baja: desactivar canales primero (soft), luego cancel

UX: 90% configuración en celular. Cero jerga de "event bus".
```

---

# Meta-prompt (orquestador de las 20)

Usar cuando quieras priorizar implementación:

```
Sos head of product de Claver. Tenés docs/comercial/20-apps-ocultas-prompts-ciclo-vida.md
con 20 productos a productizar sobre el monorepo existente.

REGLA FISCAL: CAEA y FCE MiPyME NO son apps ni SKUs de combate; van dentro de Claver Facturación (AFIP).

TAREA:
1) Auditar en código el estado real de las top P0 (Contador, Recurrente, Ruta, Mayorista, Facturación).
2) Para cada una: score 1-5 en valor/funcionalidad/UX/venta/stickiness.
3) Elegir 1 sola app para sprint de 1 semana con mayor ROI = (ticket × facilidad × readiness).
4) Ejecutar SOLO el prompt de esa app hasta tener:
   - slug en sub-saas-catalog (excepto features CAEA/FCE: solo flags del pack Facturación)
   - landing
   - activar+modoLite
   - aha checklist
   - paywall trial
   - 1 upsell
   - flujo de baja mínimo (export + motivo)
5) No abras frentes en las otras 19.
6) No crees /claver/apps/caea ni /claver/apps/fce ni precios sueltos por esas features.

Al final: PR plan con archivos, riesgos, y métricas a instrumentar.
```

---

# Checklist de “app lista para vender” (Definition of Done)

Una app de las 20 se considera **vendible** solo si cumple:

- [ ] `sku` en catálogo + precio + trialDias  
- [ ] Entrada en `SUB_SAAS_APPS` o bundle  
- [ ] Landing `/claver/apps/{slug}` con 1 dolor y 1 CTA  
- [ ] `?activar=` → modoLite correcto (no ERP full)  
- [ ] Empty state + checklist 3 pasos  
- [ ] Aha &lt; 15 min medible  
- [ ] Entitlement API (403 sin suscripción)  
- [ ] Checkout MP real (no mock prod)  
- [ ] Banner trial + paywall  
- [ ] 1 upsell contextual  
- [ ] Email/WA de valor post-activación  
- [ ] Health: “sin uso 7d”  
- [ ] Cancelación: motivo + export + offer pause  
- [ ] Win-back 30 días  
- [ ] Métricas: activaciones, paid, churn, TTV  

**Excepción CAEA / FCE:** no aplican este DoD como app. Su DoD es el de **§4 Claver Facturación** (feature completa + copy en landing padre + flag de plan, sin SKU de combate).  

---

# Orden de ejecución recomendado (8 semanas)

| Semana | App | Resultado |
|--------|-----|-----------|
| 1 | Recurrente | Job mensual + home + paywall |
| 2 | Contador | Pack 1-click + landing estudios |
| 3 | Ruta | Móvil vendedor + primer pedido |
| 4 | Mayorista | Portal + listas + invitación cliente |
| 5 | **Facturación (AFIP)** | 1 producto: CAE + **CAEA + FCE como features** + wizard |
| 6 | Cocina + Menú QR | Bundle gastro |
| 7 | Cashflow + Cheques + Alertas | Pack “dueño” |
| 8 | Expensas + CITI/IIBB | Vertical consorcios + add-ons contables (no CAEA/FCE sueltos) |

---

## Apéndice: CAEA y FCE (referencia rápida)

| | CAEA | FCE MiPyME |
|--|------|------------|
| ¿App de las 20? | **No** | **No** |
| ¿Landing propia? | **No** | **No** |
| ¿Precio mensual solo? | **No** | **No** |
| Vive en | Claver Facturación / POS+AFIP | Claver Facturación (emitir) |
| Flag interno | `fiscal.caea` | `fiscal.fce_mipyme` |
| Copy | Bullet en Facturación/POS | Bullet + toggle al facturar |
| Código | `lib/afip/caea-*` | `lib/afip/mipyme-fce.ts` |
| Prompt | §4 Facturación (features) | §4 Facturación (features) |

---

*Documento generado para ejecución con agentes. Actualizar `listoPct` en catálogo cuando cada DoD se cumpla.  
Corregido: CAEA y FCE empaquetados en Facturación electrónica — no apps sueltas.*

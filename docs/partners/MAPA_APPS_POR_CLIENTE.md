# Mapa de Apps Satélite por Cliente — Claver × Protheus

> Partner externo TOTVS Argentina — aplicaciones satélite vía REST API
> Plataforma de entrega: claver.com.ar (SaaS multi-tenant)
> Fecha: Septiembre 2026

---

## Resumen Ejecutivo

Tenemos 6+ clientes activos en Protheus con rubros muy distintos.
En vez de hacer "una app genérica para todos", la estrategia inteligente es:

1. **Construir 3-4 apps CORE** que sirvan a cualquier rubro (horizontales)
2. **Hacer 1-2 apps VERTICALES** por cliente donde hay dolor puntual y están dispuestos a pagar

Las apps core se construyen una vez y se venden N veces.
Las verticales se cobran como proyecto + licencia mensual.

---

## Clientes y Rubros

| # | Cliente | Rubro | Módulos Protheus (estimado) | Dolor principal |
|---|---------|-------|---------------------------|-----------------|
| 1 | **Grupo Comat** (Rosario) | Industrial / Comercial multi-empresa | FI, CO, FA, EST, COM | Aprobaciones lentas, tesorería dispersa entre empresas del grupo |
| 2 | **Oxford University Press** | Editorial — libros físicos + códigos de acceso digital de inglés | FA, EST, LOG, FI | Logística de distribución a librerías/colegios, control de stock de códigos digitales |
| 3 | **Friolatina** | Cadena de frío / Alimentos refrigerados | EST, COM, LOG, FA, FI | Trazabilidad de cadena de frío, control de vencimientos, picking en cámara |
| 4 | **La Piamontesa / Campo Austral** | Industria alimenticia — embutidos, carnes | IND, EST, COM, LOG, FA, QUA | Trazabilidad SENASA matadero→góndola, control de calidad, rutas de distribución |
| 5 | **Cushman** (& Wakefield?) | Real estate / Administración de propiedades | FI, FA, COM, CTB | Gestión de gastos de mantenimiento, aprobaciones de presupuestos, facturación recurrente |
| 6 | **Julio García** | Comercial / Distribución | FA, EST, COM, FI | Vendedor en ruta, cobranzas móvil |

---

## APPS HORIZONTALES (sirven a TODOS los clientes)

Estas se construyen una vez y se licencian a cada cliente.
El PRW es el mismo, la config se adapta por tenant.

### 1. 📋 Aprobaciones Móvil
**SKU:** `edge.approvals` — **PRW:** `CLVAPR01.PRW`

| Campo | Detalle |
|-------|---------|
| **Qué hace** | El gerente/dueño recibe push/email con documentos pendientes (OC, SC, PC, pedidos) y aprueba/rechaza desde el celular sin abrir Protheus |
| **Backend** | REST que consulta workflow nativo (`SCR`/`MATA020`) + `MaAprov()` para aprobar/rechazar |
| **Frontend** | WebApp responsive en claver.com.ar (o PO-UI embebido) |
| **Dolor que resuelve** | "El dueño viaja y las compras se traban 3 días esperando que vuelva a la oficina" |
| **Precio sugerido** | Setup: USD 800 + USD 120/mes |

**Clientes target:** ✅ Comat (multi-empresa = muchos aprobadores) · ✅ Cushman (presupuestos de obra) · ✅ La Piamontesa · ✅ Friolatina · ✅ Oxford · ✅ Julio García

→ **6/6 clientes** — es la app de mayor cobertura.

---

### 2. 💰 Tesorería / Inversiones Inteligente
**SKU:** `edge.investments` — **PRW:** `CLVINV01.PRW` + `FINZINV.PRW` + `FINZRES.PRW` + `JOBFINZ03.PRW`

| Campo | Detalle |
|-------|---------|
| **Qué hace** | Dashboard de inversiones financieras (plazos fijos, FCI, cauciones) con valuación MTM diaria, alertas de vencimiento, simulador |
| **Backend** | **YA DESARROLLADO** — 4 PRW funcionales con lógica completa |
| **Frontend** | **YA DESARROLLADO** — 11 componentes React en claver.com.ar |
| **Dolor que resuelve** | "El tesorero lleva las inversiones en un Excel que nadie actualiza" |
| **Precio sugerido** | Setup: USD 600 + USD 150/mes |

**Clientes target:** ✅ Comat (tesorería multi-empresa) · ✅ Cushman (fondos de expensas invertidos) · ✅ La Piamontesa/Campo Austral (volumen financiero alto)

→ **3/6 clientes** — pero ticket alto y ya está listo.

---

### 3. 🧾 Gastos y Rendiciones con OCR
**SKU:** `edge.expenses` — **PRW:** `CLVEXP01.PRW` + `CLVEXP02.PRW`

| Campo | Detalle |
|-------|---------|
| **Qué hace** | El empleado saca foto al ticket/factura → IA extrae los datos (CUIT, monto, IVA) → se crea el gasto pendiente de aprobación → al aprobar se genera el asiento en Protheus |
| **Backend** | REST + Gemini Vision / GPT-4o para OCR fiscal argentino |
| **Frontend** | PWA mobile-first |
| **Dolor que resuelve** | "Los vendedores juntan tickets en una bolsa y los traen a fin de mes, la administrativa carga todo a mano" |
| **Precio sugerido** | Setup: USD 1.000 + USD 100/mes + USD 0.05/ticket procesado |

**Clientes target:** ✅ Cushman (gastos de mantenimiento de edificios) · ✅ Comat (viáticos vendedores) · ✅ Julio García (vendedores en ruta) · ✅ Oxford (viáticos comerciales)

→ **4/6 clientes**

---

### 4. 🏦 Conciliación Bancaria Automática
**SKU:** `edge.bank-recon`

| Campo | Detalle |
|-------|---------|
| **Qué hace** | Importa extractos bancarios (archivo TXT/OFX del home banking o API Bind/Ualá Business), matchea automáticamente contra SE5 de Protheus, marca las diferencias |
| **Backend** | Parser de extractos + algoritmo de matching fuzzy contra movimientos bancarios de Protheus |
| **Frontend** | Dashboard con vista de diferencias, match manual con drag & drop |
| **Dolor que resuelve** | "La contadora tarda 2 días por mes conciliando a mano banco por banco" |
| **Precio sugerido** | Setup: USD 1.200 + USD 180/mes |

**Clientes target:** ✅ Comat (múltiples bancos, multi-empresa) · ✅ La Piamontesa · ✅ Cushman (cobro de expensas) · ✅ Oxford

→ **4/6 clientes**

---

## APPS VERTICALES (por rubro específico)

### 5. 📦 WMS / Picking Móvil (Logística & Alimentos)
**SKU:** `edge.warehouse` — **PRW:** `CLVWMS01.PRW`

| Campo | Detalle |
|-------|---------|
| **Qué hace** | App móvil para operario de depósito: escanea código de barras, confirma picking, registra lote y vencimiento, marca ubicación |
| **Backend** | REST que interactúa con `MATA650` (baja stock), tablas de ubicación, control de lote/serie |
| **Dolor que resuelve** | "El operario anota en papel, después alguien lo carga en el sistema 2 horas después" |

**Clientes target:**
- ✅ **Oxford** — Depósito de libros con miles de SKUs, picking masivo para pedidos de colegios/librerías
- ✅ **Friolatina** — Picking en cámara de frío (necesitan velocidad, están con guantes, pantalla grande)
- ✅ **La Piamontesa / Campo Austral** — Control FIFO estricto por vencimiento

→ **3/6 clientes** de rubros logísticos.

---

### 6. 📱 Vendedor en Ruta / Preventista
**SKU:** `edge.field-sales`

| Campo | Detalle |
|-------|---------|
| **Qué hace** | App offline-first para el vendedor que visita clientes: toma pedido, ve deuda, consulta stock, cobra (QR/transferencia), sincroniza al volver a zona con señal |
| **Backend** | REST lectura de SA1 (clientes) + SC5/SC6 (pedidos) + SE1 (cobranzas) + SB1/SB2 (stock) |
| **Dolor que resuelve** | "Los vendedores llaman a la oficina para preguntar si hay stock y cuánto debe el cliente" |

**Clientes target:**
- ✅ **La Piamontesa / Campo Austral** — Distribución directa a carnicerías, supermercados, minoristas
- ✅ **Friolatina** — Distribución de congelados a restaurantes, hoteles
- ✅ **Julio García** — Vendedores de ruta (core de su operación)

→ **3/6 clientes** — y es la app que el amigo consultor ya validó comercialmente.

---

### 7. 📚 Control de Códigos Digitales + Stock Editorial (Oxford)
**SKU:** `edge.digital-codes` — **APP ESPECÍFICA PARA OXFORD**

| Campo | Detalle |
|-------|---------|
| **Qué hace** | Gestión de códigos de acceso digital que vienen con los libros de inglés: asignación de lote de códigos a tiraje de impresión, activación, tracking de uso, vencimiento de licencias, conciliación con la casa matriz (UK) |
| **Backend** | Tabla customizada de códigos (Z10) vinculada a SB1 (producto libro) + API de activación |
| **Dolor que resuelve** | "No sabemos cuántos códigos activaron los colegios ni si los que se imprimieron ya vencieron" |
| **Precio sugerido** | Proyecto: USD 3.000-5.000 + USD 200/mes |

**Clientes target:** ✅ **Solo Oxford** — pero es un proyecto de alto ticket y recurrencia.

---

### 8. 🏢 Gestión de Contratos y Gastos de Propiedad (Cushman)
**SKU:** `edge.property-ops` — **APP ESPECÍFICA PARA CUSHMAN**

| Campo | Detalle |
|-------|---------|
| **Qué hace** | Dashboard de contratos de alquiler (vencimientos, ajustes por ICL/IPC), presupuestos de mantenimiento por edificio, aprobación de gastos de obra, facturación recurrente de expensas |
| **Backend** | REST contra tablas de contratos + SE1/SE2 + workflow de aprobación |
| **Dolor que resuelve** | "Manejamos 200 propiedades y los vencimientos de contrato los trackea una persona en un Excel" |
| **Precio sugerido** | Proyecto: USD 4.000-6.000 + USD 250/mes |

**Clientes target:** ✅ **Solo Cushman** — alto ticket, alta recurrencia, muy pegajoso.

---

## Matriz de Cobertura: Cliente × App

| App | Comat | Oxford | Friolatina | Piamontesa | Cushman | J. García |
|-----|:-----:|:------:|:----------:|:----------:|:-------:|:---------:|
| **Aprobaciones** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Inversiones** | ✅ | ⬜ | ⬜ | ✅ | ✅ | ⬜ |
| **Gastos OCR** | ✅ | ✅ | ⬜ | ⬜ | ✅ | ✅ |
| **Conciliación** | ✅ | ✅ | ⬜ | ✅ | ✅ | ⬜ |
| **WMS/Picking** | ⬜ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| **Preventista** | ⬜ | ⬜ | ✅ | ✅ | ⬜ | ✅ |
| **Códigos Digit.** | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Property Ops** | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ⬜ |
| **Total apps** | **4** | **5** | **3** | **5** | **5** | **3** |

---

## Orden de Desarrollo Recomendado

### Ola 1 — Ingresos inmediatos (ya hay código)
1. **Inversiones** → ya está hecho, solo falta `U_CLVSETUP` y compilar → demos a Comat, Cushman, Piamontesa
2. **Aprobaciones** → app más universal, estructura REST ya existe, falta la lógica ADVPL

### Ola 2 — Quick wins de alto impacto
3. **Gastos OCR** → diferenciador fuerte (IA), estructura REST existe
4. **Conciliación Bancaria** → dolor universal en todas las empresas

### Ola 3 — Verticales de alto ticket
5. **WMS/Picking** → Oxford + Friolatina + Piamontesa
6. **Preventista** → Piamontesa + Friolatina + Julio García

### Ola 4 — Proyectos dedicados
7. **Códigos Digitales** → exclusivo Oxford (proyecto a medida)
8. **Property Ops** → exclusivo Cushman (proyecto a medida)

---

## Modelo de Pricing Sugerido

| Concepto | Rango |
|----------|-------|
| **Setup / Instalación** | USD 600 – 1.500 por app |
| **Licencia mensual** | USD 100 – 250/mes por app |
| **Proyecto vertical a medida** | USD 3.000 – 6.000 |
| **Consumo IA (OCR/WhatsApp)** | USD 0.03 – 0.08 por transacción |

**Ingreso anual estimado por cliente (3 apps promedio):**
- Setup: USD 2.400 (one-time)
- Recurrente: USD 450/mes × 12 = USD 5.400/año
- **Total primer año: ~USD 7.800 por cliente**
- **Con 6 clientes: ~USD 46.800/año solo en apps satélite**

---

## Ventaja Competitiva como Partner

Siendo partners externos de TOTVS con acceso a estos clientes, la ventaja es:

1. **Ya conocen la operación del cliente** — saben dónde duele
2. **Ya tienen confianza del cliente** — no hay que vender desde cero
3. **Plataforma propia (Claver)** — el ingreso recurrente es de ustedes, no de TOTVS
4. **No compiten con TOTVS** — son apps satélite que complementan, no reemplazan
5. **Escalabilidad** — la misma app la venden a otros clientes del ecosistema TOTVS (no solo los suyos)

> **Clave legal:** Las apps son propiedad de Claver, se conectan al Protheus del cliente
> vía REST API pública y documentada. No modifican el RPO estándar.
> Los PRW customizados se compilan como fuentes del cliente (práctica estándar de consultoría).

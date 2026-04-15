# Sistema POS — Punto de Venta
> NegocioOS ERP Argentina | Documento funcional + ingeniería + capacitación  
> Generado: 2026-04-14 | Estado: implementado (MVP sellable)

---

## Índice

1. [¿Qué es el POS y por qué importa?](#1-qué-es-el-pos-y-por-qué-importa)
2. [Modos de operación](#2-modos-de-operación)
3. [Flujo principal — diagrama](#3-flujo-principal--diagrama)
4. [Arquitectura técnica](#4-arquitectura-técnica)
5. [Atajos de teclado y touch](#5-atajos-de-teclado-y-touch)
6. [Integración con otros módulos](#6-integración-con-otros-módulos)
7. [Flujo completo modo Mesa / Restaurante](#7-flujo-completo-modo-mesa--restaurante)
8. [Split payment — pagos mixtos](#8-split-payment--pagos-mixtos)
9. [Comparativa con otros sistemas POS de la región](#9-comparativa-con-otros-sistemas-pos-de-la-región)
10. [Autocrítica — lo que todavía nos falta](#10-autocrítica--lo-que-todavía-nos-falta)
11. [Plan de mejoras priorizadas](#11-plan-de-mejoras-priorizadas)
12. [Capacitación — guía paso a paso](#12-capacitación--guía-paso-a-paso)
13. [Diagrama de flujo de capacitación](#13-diagrama-de-flujo-de-capacitación)

---

## 1. ¿Qué es el POS y por qué importa?

El módulo **Punto de Venta (POS)** es la pantalla donde se procesa una venta en tiempo real, desde que el cliente pide hasta que se emite el comprobante y se registra el movimiento de caja.

A diferencia del módulo de *Facturación* (diseñado para ventas B2B con pedidos y remitos), el POS está optimizado para:

- **Velocidad**: una venta en < 30 segundos
- **Tacto y teclado**: funciona igual con mouse, touch de tablet o teclado físico
- **Sin errores de caja**: cada cobro impacta automáticamente en la caja del turno
- **Stock en tiempo real**: cada venta descuenta automáticamente el inventario

---

## 2. Modos de operación

| Modo | Icono | Descripción | Rubros típicos |
|------|-------|-------------|----------------|
| **Mostrador** | `Store` | Venta directa. El cajero busca productos y cobra | Kiosko, ferretería, farmacia, librería |
| **Mesa** | `UtensilsCrossed` | Integrado con Mesas/Comandas. Carga la comanda de la mesa al carrito | Restaurante, bar, café, delivery |
| **Kiosko** | `Monitor` | Pantalla full-screen con botones XXL, ideal para pantallas táctiles autoatendidas | Kiosko tech, fast food |

---

## 3. Flujo principal — diagrama

```mermaid
flowchart TD
    A([Cajero abre POS]) --> B{¿Caja abierta?}
    B -- No --> C[Ir a módulo Caja → Abrir Caja]
    C --> B
    B -- Sí --> D[Pantalla POS lista]

    D --> E[Buscar producto\npor nombre / código de barras]
    E --> F[Producto aparece en grilla]
    F --> G[Tap / Enter → Agregar al carrito]
    G --> H{¿Más productos?}
    H -- Sí --> E
    H -- No --> I[Seleccionar cliente opcional]
    I --> J[Aplicar descuento opcional]
    J --> K[Presionar COBRAR / F12]

    K --> L[Modal de cobro]
    L --> M[Seleccionar medio de pago]
    M --> N[Ingresar monto con numpad táctil]
    N --> O{¿Pago cubre el total?}
    O -- No --> P[Agregar otro medio de pago\nSplit payment]
    P --> N
    O -- Sí --> Q[Confirmar cobro]

    Q --> R[(Transacción atómica DB)]
    R --> R1[Crear Factura / Ticket AFIP]
    R --> R2[Descontar stock por producto]
    R --> R3[MovimientoCaja ingreso\npor cada medio de pago]
    R --> R4{¿Tiene mesaId?}
    R4 -- Sí --> R5[Cerrar Comanda\nLiberar Mesa]
    R4 -- No --> R6[Fin]
    R5 --> R6

    R6 --> S[Pantalla éxito\nNúmero comprobante + Vuelto]
    S --> T{¿Imprimir?}
    T -- Sí --> U[window.print → ticket térmico]
    T -- No --> V[Nueva venta\nCarrito limpio]
    U --> V
    V --> D
```

---

## 4. Arquitectura técnica

### Archivos clave

| Archivo | Responsabilidad |
|---------|----------------|
| `app/dashboard/pos/page.tsx` | UI completa del POS (cliente) |
| `app/api/pos/venta/route.ts` | Transacción atómica POST + estado GET |
| `app/api/productos/route.ts` | Catálogo de productos para la grilla |
| `app/api/caja/movimientos/route.ts` | Backup para movimientos manuales |
| `app/api/hospitalidad/route.ts` | Datos de mesas para modo Mesa |
| `prisma/schema.prisma` | Modelos: Factura, MovimientoCaja, MovimientoStock, Comanda |

### Diagrama de componentes

```mermaid
graph LR
    subgraph "Frontend (Next.js Client)"
        POS["pos/page.tsx\n(React state)"]
        POS --> SearchBar["Barra búsqueda\n/ F1"]
        POS --> ProductGrid["Grilla productos\n(tap / click)"]
        POS --> CartPanel["Panel carrito\n(right sidebar)"]
        POS --> PayModal["Modal cobro\n(numpad táctil)"]
    end

    subgraph "API Routes (Next.js Server)"
        VentaAPI["POST /api/pos/venta\n(transacción atómica)"]
        ProductosAPI["GET /api/productos\n(search + filter)"]
        EstadoAPI["GET /api/pos/venta\n(caja status)"]
        HospAPI["GET /api/hospitalidad\n(mesas)"]
    end

    subgraph "Prisma / PostgreSQL"
        Factura["Factura\n+ LineaFactura"]
        Caja["MovimientoCaja"]
        Stock["Producto.stock\n+ MovimientoStock"]
        Comanda["Comanda.estado\n+ Mesa.estado"]
    end

    POS -- "buscar productos" --> ProductosAPI
    POS -- "estado caja" --> EstadoAPI
    POS -- "cargar mesas" --> HospAPI
    PayModal -- "POST venta" --> VentaAPI
    VentaAPI -- "$transaction" --> Factura
    VentaAPI -- "$transaction" --> Caja
    VentaAPI -- "$transaction" --> Stock
    VentaAPI -- "$transaction" --> Comanda
```

### La transacción atómica (`prisma.$transaction`)

```
POST /api/pos/venta
  ├─ Validación Zod (lineas, pagos, tipoFactura)
  ├─ Verificar caja abierta
  ├─ Calcular siguiente número de factura
  ├─ prisma.$transaction([
  │    1. CREATE Factura + LineaFactura[]
  │    2. Para cada producto:
  │         UPDATE stock - cantidad
  │         CREATE MovimientoStock
  │    3. Para cada pago:
  │         CREATE MovimientoCaja (ingreso)
  │    4. Si mesaId:
  │         UPDATE Comanda.estado = "cerrada"
  │         UPDATE Mesa.estado = "libre"
  │    5. Si pago en cuenta corriente:
  │         CREATE CuentaCobrar
  │  ])
  └─ Return { facturaId, numeroCompleto, total, vuelto }
```

Si cualquier paso falla, **toda la transacción se revierte**. No puede quedar stock descontado sin factura, ni factura sin movimiento de caja.

---

## 5. Atajos de teclado y touch

| Tecla | Acción |
|-------|--------|
| `/` o `F1` | Enfocar barra de búsqueda |
| `Enter` (con 1 resultado) | Agregar ese producto al carrito |
| `F12` | Abrir modal de cobro |
| `Esc` | Limpiar búsqueda / cerrar modal |
| `+` | Incrementar cantidad del último ítem |
| `-` | Decrementar cantidad del último ítem |
| `Del` | Eliminar último ítem del carrito |
| `0-9` en modal cobro | Numpad táctil activo |

### Touch design

- Botones de productos: `min-height: 80px` (120px en modo Kiosko)
- Numpad: teclas `48px` de alto, gap visual al presionar (`active:scale-95`)
- Scroll independiente en grilla de productos y en carrito
- Botón COBRAR: `56px` de alto, fuente `text-lg`, siempre visible en bottom panel

---

## 6. Integración con otros módulos

```mermaid
graph TD
    POS[POS] --> Caja[Módulo Caja\nMovimientoCaja ingreso]
    POS --> Stock[Módulo Stock\nMovimientoStock salida]
    POS --> Factura[Módulo Ventas\nFactura + LineaFactura]
    POS --> Comanda[Módulo Hospitalidad\nComanda cerrada + Mesa libre]
    POS --> CtaCobrar[Cuentas a Cobrar\nSi pago en cta. cte.]
    POS --> AFIP[AFIP / Factura AFIP\nCAE si tipoFactura ≠ ticket]

    Caja --> Arqueo[Arqueo de cierre\nDesglose por medio de pago]
    Factura --> IVA[Libro IVA Ventas\nDeclaración mensual]
    Stock --> Alertas[Alertas stock bajo]
```

---

## 7. Flujo completo modo Mesa / Restaurante

```mermaid
sequenceDiagram
    actor Mozo
    actor Cocina
    actor Cajero
    participant POS
    participant DB

    Mozo->>POS: Abre módulo Hospitalidad
    Mozo->>POS: Clic en mesa ocupada
    POS->>DB: GET comanda activa de la mesa
    Mozo->>POS: Agrega items a la comanda
    POS->>DB: POST /api/hospitalidad (crear comanda)
    DB-->>Cocina: Comanda aparece en KDS

    Cocina->>DB: Marca items como "listos"
    
    Mozo->>Cajero: "Mesa 5 pide la cuenta"
    Cajero->>POS: Abre POS en modo Mesa
    Cajero->>POS: Clic "Elegir mesa" → selecciona Mesa 5
    POS->>DB: GET /api/hospitalidad (carga comanda)
    POS-->>Cajero: Carrito cargado con todos los items de la comanda

    Cajero->>POS: Presiona COBRAR (F12)
    Cajero->>POS: Selecciona medio de pago
    Cajero->>POS: Confirma cobro

    POS->>DB: POST /api/pos/venta (transacción)
    DB->>DB: CREATE Factura
    DB->>DB: UPDATE Mesa.estado = "libre"
    DB->>DB: UPDATE Comanda.estado = "cerrada"
    DB->>DB: CREATE MovimientoCaja
    DB-->>POS: { ok, numeroCompleto, vuelto }
    POS-->>Cajero: Pantalla éxito + opción imprimir
```

---

## 8. Split payment — pagos mixtos

El POS soporta dividir el pago en hasta 3 medios de pago distintos.

**Ejemplo**: Total $5.000
- Efectivo: $2.000
- Tarjeta débito: $3.000

```
pagos: [
  { medio: "efectivo",       monto: 2000 },
  { medio: "tarjeta_debito", monto: 3000 }
]
```

Cada pago genera un **MovimientoCaja independiente** con su propio `medioPago`, lo que permite el arqueo exacto por medio al cierre del turno.

Si el cliente paga con `cuenta_corriente`, se genera automáticamente una **CuentaCobrar** a 30 días.

---

## 9. Comparativa con otros sistemas POS de la región

> Investigación propia sobre Odoo POS, Tango Punto de Venta, RestBar, Bsale, Alegra POS, iPos, Siigo y Bind.

### Tabla comparativa

| Característica | **NegocioOS** | Odoo POS | Tango PdV | RestBar | Bsale | Alegra |
|----------------|:---:|:---:|:---:|:---:|:---:|:---:|
| AFIP/ARCA nativo | ✅ | ⚠️ addon | ✅ | ✅ | ✅ (Chile/Col) | ✅ (Col/Mx) |
| Split payment | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modo mesa + KDS | ✅ | ✅ (Odoo 17) | ✅ (RestBar) | ✅ nativo | ❌ | ❌ |
| Onboarding IA por rubro | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Multi-rubro en una app | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Offline mode | ❌ parcial | ✅ | ❌ | ❌ | ❌ | ❌ |
| Impresora fiscal Argentina | ⚠️ pendiente | ❌ | ✅ Epson/Hasar | ✅ | ❌ | ❌ |
| Código de barras (cámara) | ❌ pendiente | ✅ | ✅ | ✅ | ✅ | ✅ |
| Portal B2B integrado | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| App móvil nativa | ❌ | ✅ iOS/Android | ❌ | ✅ | ✅ | ✅ |
| Contabilidad integrada | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Precio/mes ARG (est.) | Propio | $30-$150k | $15-$60k | $8-$30k | $15-$40k | $8-$25k |

**Leyenda:** ✅ implementado · ⚠️ parcial/addon · ❌ no tiene

### Análisis por sistema

#### Odoo POS (Odoo 17)
**Lo que nos gana:** modo offline robusto, integración con Mercado Pago oficial, escáner de cámara vía ZXing, reportes avanzados de sesión.  
**Lo que le ganamos:** onboarding por IA en < 10 minutos, integración AFIP nativa sin addons, precio accesible para pymes argentinas sin servidor propio, UX más simple para cajeros sin entrenamiento técnico.  
**A copiar:** implementar modo offline con Service Worker + cola de sync, escáner de cámara con BarcodeDetector API.

#### Tango Punto de Venta (Tango Gestión)
**Lo que nos gana:** integración profunda con impresoras fiscales Epson TM-220 y Hasar, soporte técnico local, ecosistema maduro de ~30 años.  
**Lo que le ganamos:** arquitectura web (sin instalar nada), módulos de hospitalidad, veterinaria y gymn en la misma app, portal B2B para clientes.  
**A copiar:** integración con impresoras fiscales Epson/Hasar vía protocolo serial (o IP), teclado numérico físico de cajero.

#### RestBar
**Lo que nos gana:** diseño UX muy pulido para gastronómico, integración con delivery apps (Pedidos Ya, Rappi), TV de cocina sin servidor adicional.  
**Lo que le ganamos:** multi-rubro (RestBar es solo gastronomía), facturación A/B/C en la misma pantalla, membresías para bar con socios.  
**A copiar:** plano de mesas con drag-and-drop, timer de mesa (tiempo ocupada), comanda dividida (un ítem a múltiples personas).

#### Bsale / Alegra
**Lo que nos gana:** soporte fiscal para Argentina (estos son Chile/Colombia-first), integración con AFIP, cobranza recurrente local.  
**Lo que le ganamos:** precio más bajo para pymes ARG, onboarding más rápido, módulos de industria y distribución sin pagar extra.  
**A copiar:** UX de la app móvil de Bsale (muy limpia para vendedores en ruta), reportes de cierre de caja visuales con gráficos.

---

## 10. Autocrítica — lo que todavía nos falta

### Crítico para competir (must-have en 30 días)

| # | Problema | Impacto | Fix sugerido |
|---|---------|---------|-------------|
| P1 | **Sin escáner de código de barras en POS** | En kiosko/ferretería el cajero no puede escanear. Tiene que tipear el nombre. | Implementar `BarcodeDetector` API + fallback `QuaggaJS` para cámara. Input oculto que captura scan de pistola USB. |
| P2 | **Sin impresora fiscal / térmica** | No imprime ticket físico legal. Solo `window.print()` (usa papel A4, inútil en POS real). | Integrar con API del browser `PrinterService` + template CSS `@media print` para 80mm. Para fiscal: socket TCP Epson/Hasar. |
| P3 | **Sin modo offline real** | Si se corta internet → caja queda inutilizable. | Service Worker con queue de ventas en IndexedDB. Sync cuando vuelve la red. |
| P4 | **`Producto.precioVenta` es `Float` no `Decimal`** (Bug A-007) | Errores de redondeo en IVA: `$1234.50 × 1.21 = $1493.745000000001` | Migración Prisma a `Decimal @db.Decimal(15,2)`. |
| P5 | **Sin búsqueda por código de barras en API** | El campo `codigoBarras` existe en el schema pero no se usa en el WHERE de búsqueda POS. | Agregar `{ codigoBarras: { contains: search } }` en el OR de `/api/productos`. |

### Importante para diferenciación (60 días)

| # | Problema | Fix |
|---|---------|-----|
| P6 | Sin Mercado Pago link de pago QR en cobro | Integrar MP QR dinámico: POST a MP API → mostrar QR → webhook confirma pago |
| P7 | Sin cliente frecuente / puntos | Tabla `ClientePuntos` + acumular en cada venta POS |
| P8 | Sin historial de ventas del día en pantalla POS | Sección colapsable "Últimas ventas" con anular última |
| P9 | Sin PLU (botones de acceso rápido personalizados) | Tabla `PLU { empresaId, productoId, orden, color }` |
| P10 | Sin pesaje integrado (balanza) | Para carnicería/dietética: serial/USB con protocolo Toledo o Marte |

### Deseable (90 días)

| # | Deseable |
|---|---------|
| D1 | App móvil PWA instalable (icono en home screen, sin browser chrome) |
| D2 | Pantalla de cliente-display (segundo monitor con total y medios de pago) |
| D3 | Fidelización: tarjeta de puntos QR por cliente |
| D4 | Estadísticas live en POS: "Vendiste $X hoy" |
| D5 | Sincronización con Pedidos Ya / Rappi para modo restaurante |

---

## 11. Plan de mejoras priorizadas

```mermaid
gantt
    title Roadmap POS — próximas 12 semanas
    dateFormat  YYYY-MM-DD
    section Sprint 1 (Semanas 1-2)
    Escáner código de barras (BarcodeDetector API)     :crit, s1a, 2026-04-14, 5d
    Fix Float → Decimal en precioVenta (migración)     :crit, s1b, 2026-04-14, 3d
    Template impresión 80mm (CSS @media print)         :s1c, 2026-04-19, 4d

    section Sprint 2 (Semanas 3-4)
    Modo offline con IndexedDB + sync queue            :s2a, 2026-04-28, 7d
    Mercado Pago QR dinámico                           :s2b, 2026-04-28, 5d
    Botones PLU configurables                          :s2c, 2026-05-05, 4d

    section Sprint 3 (Semanas 5-8)
    Historial ventas del día en POS                    :s3a, 2026-05-12, 4d
    Puntos de fidelidad por cliente                    :s3b, 2026-05-12, 6d
    Integración impresora fiscal Epson TM-220 (IP)     :s3c, 2026-05-19, 7d

    section Sprint 4 (Semanas 9-12)
    PWA: Service Worker + manifest + push notifications :s4a, 2026-06-09, 7d
    Cliente-display (segundo monitor)                  :s4b, 2026-06-09, 5d
    Reportes cierre con gráficos visuales              :s4c, 2026-06-16, 4d
```

---

## 12. Capacitación — guía paso a paso

### Para el cajero (operador)

#### Antes de empezar
1. Ir a **Financiero → Caja**
2. Hacer clic en **Abrir Caja**
3. Ingresar el efectivo inicial (fondo de caja)
4. Seleccionar el turno (Mañana / Tarde / Noche)
5. Confirmar

#### Realizar una venta
1. Ir a **Ventas → Punto de Venta (POS)**
2. Verificar que el indicador superior diga **"Caja abierta"** en verde
3. Buscar el producto escribiendo nombre o código (atajo: `/`)
4. Hacer clic en el producto → se agrega al carrito (o `Enter` si hay 1 resultado)
5. Ajustar cantidades con `+` / `-` en el panel derecho
6. Si el cliente tiene descuento: seleccionar porcentaje en la barra de descuento
7. Presionar **COBRAR** (o `F12`)
8. En el modal de cobro:
   - Seleccionar medio de pago
   - Ingresar monto con el numpad (o tipear el monto)
   - Si paga con varios medios: clic en "+ Agregar otro medio de pago"
   - Verificar el vuelto calculado automáticamente
   - Presionar **Confirmar cobro**
9. Aparece pantalla de éxito con el número de comprobante
10. Imprimir si es necesario → **Nueva venta**

#### Al final del turno
1. Ir a **Financiero → Caja**
2. Contar el efectivo físico
3. Clic en **Arqueo y Cierre**
4. Declarar cada medio de pago
5. Si hay diferencia > $100: ingresar justificación
6. Confirmar cierre

### Para el mozo (modo Mesa)

1. Atender la mesa normalmente desde **Hospitalidad → Mesas y Comandas**
2. Agregar ítems a la comanda de la mesa
3. Cuando el cliente pide la cuenta:
   - Ir a **Ventas → Punto de Venta (POS)**
   - Seleccionar modo **Mesa** (ícono de tenedor)
   - Clic en **"Elegir mesa"** → seleccionar la mesa del cliente
   - El carrito se carga automáticamente con todos los ítems de la comanda
   - Presionar **COBRAR** y seguir el proceso normal
4. Al confirmar el cobro, la mesa queda en estado **Libre** automáticamente

### Para el supervisor / administrador

- **Ver ventas del día**: Financiero → Caja → Movimientos de Hoy
- **Reportes fiscales**: Fiscal → IVA / Libros Fiscales
- **Stock en tiempo real**: Stock → Productos (columna "Stock Actual")
- **Historial de facturas**: Ventas → Facturación

---

## 13. Diagrama de flujo de capacitación

```mermaid
flowchart TD
    subgraph CAJERO["👤 Rol: Cajero"]
        C1[Inicio de turno\n→ Abrir Caja] --> C2[Pantalla POS]
        C2 --> C3{Tipo de venta}
        C3 -->|Mostrador| C4[Buscar producto\n/ o F1]
        C3 -->|Mesa| C5[Seleccionar mesa\ncon comanda]
        C3 -->|Kiosko| C6[Pantalla táctil XXL]
        C4 --> C7[Agregar al carrito]
        C5 --> C7
        C6 --> C7
        C7 --> C8[Ajustar cantidades]
        C8 --> C9[Descuento opcional]
        C9 --> C10[Cobrar F12]
        C10 --> C11[Modal cobro\nNumpad táctil]
        C11 --> C12{Medio de pago}
        C12 -->|Efectivo| C13[Calcular vuelto]
        C12 -->|Tarjeta| C14[Seleccionar débito/crédito]
        C12 -->|Split| C15[+ Otro medio]
        C13 --> C16[Confirmar cobro]
        C14 --> C16
        C15 --> C16
        C16 --> C17[Pantalla éxito\nImprimir ticket]
        C17 --> C18[Nueva venta]
        C18 --> C2
        C2 --> C19[Fin de turno\nArqueo y Cierre]
    end

    subgraph SUPERVISOR["👔 Rol: Supervisor"]
        S1[Revisar cierre de caja] --> S2[Verificar diferencias]
        S2 --> S3{¿Diferencia > $100?}
        S3 -->|Sí| S4[Solicitar justificación]
        S3 -->|No| S5[Aprobar cierre]
        S4 --> S5
        S5 --> S6[Ver reporte ventas\npor medio de pago]
    end

    subgraph MOZO["🍽️ Rol: Mozo"]
        M1[Tomar pedido] --> M2[Hospitalidad → Mesa]
        M2 --> M3[Agregar ítems comanda]
        M3 --> M4[Comanda va a KDS cocina]
        M4 --> M5[Cliente pide la cuenta]
        M5 --> M6[POS → Modo Mesa]
        M6 --> M7[Seleccionar mesa]
        M7 --> M8[Carrito cargado automático]
        M8 --> C10
    end

    subgraph ADMIN["⚙️ Rol: Admin"]
        A1[Configurar productos\ny precios] --> A2[Configurar PLU\nbotones rápidos]
        A2 --> A3[Configurar impresora]
        A3 --> A4[Asignar roles a usuarios]
        A4 --> A5[Revisar reportes\ny KPIs]
    end
```

---

## Apéndice: variables de configuración relevantes

| Variable | Dónde configurar | Descripción |
|----------|-----------------|-------------|
| `AFIP_PUNTO_VENTA` | `.env` | Número de punto de venta AFIP (ej: `1`) |
| `NEXT_PUBLIC_ECOMMERCE_EMPRESA_ID` | `.env` | ID de empresa para el portal B2B |
| Tipo de factura por defecto | Onboarding IA | Se setea según condición fiscal del onboarding |
| Módulos visibles en sidebar | `lib/onboarding/onboarding-ia.ts` | `CONFIG_POR_RUBRO` activa/desactiva el módulo POS |
| Descuentos permitidos | (pendiente) | Tabla `ConfigPOS { maxDescuento, requiresAuth }` |

---

*Documento mantenido automáticamente. Última revisión: 2026-04-14.*

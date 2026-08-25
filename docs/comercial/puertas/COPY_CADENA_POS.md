# Copy Comercial — Puerta Cadena de Locales / Franquicias (P-CADENA)

> **Contrato de Puerta:** §1.4 `PROMPT_GEMINI_PUERTAS_LANDING.md`  
> **SKU:** `pos.core` + `svc.implementacion`  
> **URL Sugerida:** `/claver/claverp/pos-cadena` (o variante de `/claver/claverp/pos-afip`)  
> **Primera Ruta (Golden Path):** `/dashboard/pos` con selector de sucursal / caja

---

## 1. Contrato de la Puerta

```text
Puerta: P-CADENA
Comprador: Dueño, socio gerente o director de operaciones de cadenas de 2 a 20 locales (indumentaria, dietéticas, bazares, perfumerías, repuestos).
Dolor (es-AR): "Tengo varios locales y no sé cuánto vende cada cajero en tiempo real, el stock entre sucursales está desfasado, los cierres de caja tardan horas y la AFIP se cae a las 18:00 hs frenando la fila de clientes."
Promesa OK: Punto de Venta ágil en la nube para múltiples sucursales, facturación AFIP con modo offline/contingencia, arqueo ciego por cajero, transferencias de stock entre locales y consolidación diaria en tiempo real.
Promesa NO: No es un ERP pesado tipo SAP o Tango con 6 meses de consultoría, no consolida holdings en múltiples monedas internacionales, no incluye desarrollo a medida fuera del roadmap.
SKU / ?activar=: pos.core (con pack sucursales)
modoLite: completo
Primera ruta post-login: /dashboard/pos (o /dashboard/caja con selector de sucursal)
CTA primario: Agendar Implementación con Especialista (Llamada 20 min)
CTA secundario: WhatsApp Ventas Corporativas
Precio visible: Desde $49.900 ARS/mes por sucursal + Setup de puesta en marcha asistida
Qué ve en el menú (máx 7 ítems): POS Mostrador, Historial de Ventas & AFIP, Cajas & Arqueos, Stock & Transferencias, Precios & Listas, Clientes & CC, Reportes Consolidados.
Qué NO debe ver: Oficios y presupuestos de obra, Libreta de fiado de barrio, Módulos agrícolas.
Canal: Google Ads ("software punto de venta varias sucursales argentina"), LinkedIn (Gerentes de Retail), Partners locales.
```

---

## 2. Textos y Copy de Landing

### Hero Section
- **Badge:** `SOLUCIÓN RETAIL MULTISUCURSAL · ARGENTINA`
- **H1:** Controlá todas tus sucursales en tiempo real sin caer en un ERP pesado.
- **Subtítulo:** Punto de venta ultrarrápido para mostrador, facturación AFIP con contingencia garantizada, transferencias de stock entre locales y arqueos ciegos que evitan faltantes de caja.
- **CTA Primario:** `[ Agendar llamada de Implementación ]` $\to$ `/claver/contacto?pack=implementacion`
- **CTA Secundario:** `[ Ver demostración en vivo (2 min) ]`

### 4 Dolores del Retail Multilocal
1. **"Los cajeros cierran la caja con diferencias y me entero al día siguiente":** Sin un arqueo ciego donde el operador cuente la plata antes de ver el teórico, los faltantes son difíciles de auditar.
2. **"Un local se queda sin un producto clave mientras en el otro junta polvo":** Sin visibilidad compartida de stock y remitos de transferencia internos, perdés ventas todos los días.
3. **"Se cae AFIP y la fila en el mostrador se vuelve un caos":** Un sistema que depende de que el servidor fiscal responda al segundo frena la operación. Claver emite ticket de contingencia y sincroniza en segundo plano.
4. **"Cambiar precios en 5 locales me lleva un día entero":** Actualizá listas de precios centrales por porcentaje o CSV y replicá a todas las terminales en 1 segundo.

### 4 Resultados de Negocio
1. **Arqueo Ciego y Cierre X/Z por Turno:** El cajero declara lo que tiene en mano (efectivo, vouchers, QR); el sistema reporta la diferencia exacta al dueño.
2. **Transferencias de Mercadería con Trazabilidad:** Salida de depósito central $\to$ En tránsito $\to$ Recepción en sucursal con validación de bultos.
3. **Facturación AFIP Masiva y Contingencia:** Comprobantes A, B, C y Tickets de mostrador con asignación automática de punto de venta por sucursal.
4. **Puesta en Marcha Llave en Mano en 48 Horas:** Un implementador dedicado migra tu catálogo en Excel, configura tus puntos de venta AFIP y capacita a tus cajeros.

---

## 3. Checklist del Día 1 con el Implementador

- [ ] Creación de empresa y configuración de sucursales en Claver Cloud.
- [ ] Importación y limpieza de base de datos de productos (códigos de barra, costos y precios de venta).
- [ ] Delegación de certificados AFIP y vinculación de Puntos de Venta electrónicos.
- [ ] Configuración de medios de cobro (Mercado Pago QR, Posnet, transferencias).
- [ ] Capacitación operativa de 30 minutos a los encargados de sucursal.

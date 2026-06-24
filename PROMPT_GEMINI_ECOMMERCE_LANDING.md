# Prompt para Gemini — Subpágina comercial Ecommerce

Copiá y pegá el bloque de abajo en Gemini (Google AI Studio o CLI). Ajustá la ruta si tu proyecto está en otro directorio.

---

## PROMPT (copiar desde acá)

```
Sos un frontend engineer senior + copywriter B2B SaaS. Tenés acceso al shell del proyecto ERP Argentina (Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui).

## Tu misión

Crear una **subpágina de marketing** para vender el módulo **Ecommerce + Canales Digitales** del ERP Argentina. No es la tienda en sí: es la landing comercial que convence a un dueño de comercio/distribuidora argentino a contratar el canal online integrado al ERP.

**Ruta objetivo:** `/ecommerce`  
**Archivo principal:** `app/ecommerce/page.tsx`  
**Opcional (recomendado):** `app/ecommerce/layout.tsx` con metadata SEO dedicada.

La página debe ser **pública** (sin login), responsive, en **español argentino (es-AR)**, y coherente visualmente con la tienda existente en `app/tienda/page.tsx`.

---

## Contexto del producto (NO inventar features que no existan)

ERP Argentina es un ERP/POS multi-tenant para PyMEs argentinas. El módulo ecommerce ya tiene código funcional:

| Pieza | Ruta / archivo | Qué hace |
|-------|----------------|----------|
| Tienda B2C pública | `app/tienda/page.tsx` | Catálogo, carrito, checkout, stock en tiempo real |
| Portal B2B | `app/portal/page.tsx` | Login por CUIT, lista de precios del cliente, pedidos, cuenta corriente |
| API catálogo | `GET /api/ecommerce/catalogo` | Productos con precios del motor de precios + filtro por canal |
| API checkout | `POST /api/ecommerce/checkout` | Crea PedidoVenta con canal ecommerce, reserva stock |
| Portal catálogo/pedidos | `/api/portal/catalogo`, `/api/portal/pedidos` | Flujo mayorista autenticado |
| Mercado Pago | `app/api/mercadopago/` | Cobros online (add-on comercial) |
| Mercado Libre | `app/api/mercadolibre/` | Sincronización pedidos ML (add-on) |
| WhatsApp | `lib/whatsapp/whatsapp-service.ts` | Notificaciones de pedido (add-on) |
| Logística integrada | picking → remito → envío → hoja de ruta | Circuito documentado en `docs/funcional/logistica-distribucion-ecommerce.md` |
| Features por rubro | `FEATURES.TIENDA_ONLINE`, `FEATURES.PORTAL_B2B` en `lib/config/rubro-config-service.ts` | Activación por empresa/rubro |

**Flujo real post-venta:** Pedido online → reserva stock → picking → remito → envío → factura AFIP → cobranza.

**Demo existente:** `/api/auth/demo` + login en `/login` con selector de rubro.

**Tienda demo:** `/tienda?empresaId=1` (usa `NEXT_PUBLIC_ECOMMERCE_EMPRESA_ID`).

**Portal demo:** `/portal?empresa=1`.

---

## Público objetivo (ICP)

Elegí UN mensaje principal (podés mencionar los otros como secundarios):

1. **Distribuidora / mayorista** → Portal B2B con precios por lista, cuenta corriente, pedidos recurrentes.
2. **Comercio minorista** → Tienda online B2C con stock unificado con el POS del local.
3. **Industria liviana** → Catálogo corporativo + logística de despacho.

Dolor que resolvés:
- "Vendo por Instagram/WhatsApp y anoto pedidos a mano"
- "Mi stock del local no coincide con lo que vendo online"
- "Mercado Libre y el mostrador son dos mundos separados"
- "Los mayoristas me piden lista de precios y no tengo portal"

---

## Estructura de la landing (secciones obligatorias)

Implementá TODAS estas secciones en un solo scroll, con navegación sticky opcional:

### 1. Hero
- Headline: beneficio claro en 1 línea (ej: "Tu tienda online conectada al stock y la factura AFIP")
- Subheadline: 2 líneas máximo
- 2 CTAs:
  - Primario: "Probar tienda demo" → link a `/tienda?empresaId=1`
  - Secundario: "Ver portal mayorista" → link a `/portal?empresa=1`
- Badge: "Stock unificado · AFIP · Picking automático"
- Visual: mockup o composición con cards (NO uses imágenes externas; usá CSS/SVG/gradientes como en `app/tienda/page.tsx`)

### 2. Logos / confianza
- Fila con badges: "Integrado al ERP", "Precios automáticos", "Multi-canal", "Hecho en Argentina"
- Sin logos de terceros inventados

### 3. Problema → Solución (3 columnas)
| Antes | Con ERP Ecommerce |
|-------|-------------------|
| Pedidos por WhatsApp sin control | Pedido formal con número y trazabilidad |
| Stock desactualizado | Mismo stock que POS y depósito |
| Facturación manual | Pedido → remito → factura electrónica AFIP |

### 4. Dos productos en uno (tabs o cards lado a lado)

**Tienda B2C** (`/tienda`)
- Catálogo público con búsqueda y filtros
- Carrito y checkout sin login
- Validación de stock en tiempo real
- Motor de precios (listas, promociones)
- IVA 21% calculado automáticamente

**Portal B2B** (`/portal`)
- Acceso con CUIT del cliente
- Precios según lista del cliente
- Consulta de cuenta corriente y límite de crédito
- Historial de pedidos y estados
- Re-pedido rápido

### 5. Flujo operativo (diagrama visual)
Mostrá el circuito end-to-end con iconos Lucide (no Mermaid en runtime; usá flex/grid):

```
Cliente compra online
    ↓
Pedido confirmado (reserva stock)
    ↓
Picking en depósito
    ↓
Remito + envío / hoja de ruta
    ↓
Factura AFIP + cobro
```

### 6. Integraciones (add-ons)
Cards con precios orientativos (del catálogo comercial en `lib/platform/commercial-service.ts`):

| Add-on | Precio desde | Beneficio |
|--------|--------------|-----------|
| Mercado Pago | $9.900/mes | Cobro con QR y tarjeta en checkout |
| Mercado Libre | $14.900/mes | Pedidos ML sincronizados al ERP |
| WhatsApp Business | $7.900/mes | Confirmación y tracking al cliente |
| Automation Hub | $29.900/mes | Automatizar alertas de stock bajo, re-pedidos |

Aclaración visible: "Precios en ARS + IVA. Plan base ERP no incluido."

### 7. Planes sugeridos (pricing table)
3 columnas — valores orientativos para Argentina 2026:

| | **Canal Online** | **Multi-canal Pro** | **Distribuidora** |
|---|---|---|---|
| Precio | $24.900/mes | $39.900/mes | $59.900/mes |
| Incluye | Tienda B2C, 500 SKU, 1 depósito | + Portal B2B, 2 canales, MP | + ML, rutas, 3 depósitos |
| CTA | "Empezar trial" | "Empezar trial" | "Hablar con ventas" |

CTA "Empezar trial" → `/login` (signup) o scroll a formulario de contacto.

### 8. Rubros ideales
Grid con emojis (como en onboarding): distribuidora, ferretería, librería, indumentaria, farmacia, supermercado.
Texto: "El onboarding IA configura módulos según tu rubro en 5 minutos."

### 9. FAQ (mínimo 6 preguntas)
- ¿Necesito otro sistema para la tienda?
- ¿El stock se descuenta solo?
- ¿Puedo tener tienda para consumidor final y portal para mayoristas?
- ¿Funciona con factura electrónica AFIP?
- ¿Se integra con Mercado Libre / Mercado Pago?
- ¿Cuánto tarda la implementación?

### 10. CTA final + footer
- Formulario simple: nombre, email, teléfono, rubro (select), mensaje
- Por ahora el submit puede ser `mailto:` o `console.log` + toast de éxito (NO integrar CRM en esta tarea)
- Links: Inicio `/`, Login `/login`, Demo `/login`, Tienda `/tienda`, Portal `/portal`, Términos (placeholder `#`)

---

## Diseño visual (OBLIGATORIO)

Seguí el estilo de `app/tienda/page.tsx` — es la referencia visual del módulo:

- **Fondo:** gradiente claro editorial
  `bg-[radial-gradient(circle_at_top,_rgba(248,246,241,0.9),_transparent_55%),_linear-gradient(120deg,_rgba(248,248,246,1),_rgba(234,242,246,0.9))]`
- **Tipografía display:** `font-[var(--font-fraunces)]` para títulos
- **Tipografía body:** Manrope (ya en root layout)
- **Cards:** `border-white/70 bg-white/80 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)]` con blur orbs decorativos
- **Componentes:** solo shadcn/ui de `@/components/ui/` (Button, Card, Badge, Tabs, Accordion para FAQ, Input, Select)
- **Iconos:** `lucide-react` (ShoppingCart, Truck, Package, Store, Users, CreditCard, RefreshCw, Shield, etc.)
- **Animaciones:** Framer Motion sutil en hero y cards al scroll (fade-up, stagger)
- **Moneda:** `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })`
- **Mobile-first:** todo debe verse bien en 375px
- **NO** uses librerías nuevas. **NO** cambies `globals.css` salvo que sea estrictamente necesario.

Contraste con el dashboard oscuro: esta landing es **light mode editorial** (como la tienda), para diferenciar marketing de app.

---

## Requisitos técnicos

1. `"use client"` en `page.tsx` (por Framer Motion y formulario)
2. Crear `app/ecommerce/page.tsx` — NO reemplazar `app/page.tsx` (ese redirect a login/dashboard queda igual)
3. Metadata SEO en `layout.tsx`:
   - title: "Ecommerce integrado al ERP | ERP Argentina"
   - description: "Tienda online y portal B2B con stock unificado, picking, factura AFIP y cobros. Para comercios y distribuidoras argentinas."
   - openGraph básico
4. Extraer copy y secciones a componentes en `components/marketing/ecommerce/` si el archivo supera 250 líneas:
   - `ecommerce-hero.tsx`
   - `ecommerce-features.tsx`
   - `ecommerce-pricing.tsx`
   - `ecommerce-faq.tsx`
   - `ecommerce-cta-footer.tsx`
5. Usar `cn()` de `@/lib/utils` para clases condicionales
6. Importar `BRAND_NAME` de `@/lib/brand` para el nombre del producto
7. La página NO debe requerir autenticación
8. No romper rutas existentes: `/tienda`, `/portal`, `/dashboard`, `/login`

---

## Copy — tono y restricciones

- Español argentino: "vos", "configurá", "ingresá", "probá"
- Beneficios > features técnicas
- Números concretos cuando sea posible ("stock en tiempo real", "pedido en 2 minutos")
- **NO** prometas: app mobile nativa, Shopify/WooCommerce import, pasarelas internacionales, envíos Andreani automático (aún no implementado)
- **SÍ** podés prometer: stock unificado, motor de precios, AFIP, picking, portal B2B, integraciones MP/ML/WhatsApp como add-ons
- Evitá "ERP de 40 módulos" — enfocate en ecommerce + operación

---

## Criterios de aceptación (checklist)

Al terminar, verificá:

- [ ] `npm run build` pasa sin errores
- [ ] `/ecommerce` carga sin login en dev (`npm run dev`)
- [ ] Links a `/tienda?empresaId=1` y `/portal?empresa=1` funcionan
- [ ] Responsive: 375px, 768px, 1280px sin overflow horizontal
- [ ] FAQ con Accordion accesible (teclado)
- [ ] Al menos 8 secciones visibles en el scroll
- [ ] Pricing table con 3 planes y CTAs
- [ ] Sin `any` innecesarios; TypeScript strict OK
- [ ] No se agregaron dependencias nuevas al `package.json`

---

## Orden de implementación

1. Leer `app/tienda/page.tsx` y `app/portal/page.tsx` para entender el producto
2. Crear `app/ecommerce/layout.tsx` con metadata
3. Crear `app/ecommerce/page.tsx` con todas las secciones
4. Extraer componentes si hace falta
5. `npm run build` y corregir errores
6. Reportar en español: archivos creados, capturas mentales de cada sección, y qué quedó como placeholder

---

## Entregable final

Respondé con:
1. Lista de archivos creados/modificados
2. Resumen de cada sección implementada
3. Resultado de `npm run build` (PASS/FAIL)
4. 3 mejoras opcionales para una v2 (sin implementarlas)

No modifiques la lógica de APIs, Prisma, ni el dashboard. Solo marketing frontend en `/ecommerce`.
```

---

## Notas para el operador humano

- Después de que Gemini termine, revisá la página en `http://localhost:3000/ecommerce`.
- Si querés enlazarla desde una landing principal futura, agregá un link en el navbar o en `/login`.
- Los precios del prompt son **orientativos**; ajustalos antes de publicar.
- Para analytics, ya tenés `@vercel/analytics` en el root layout.
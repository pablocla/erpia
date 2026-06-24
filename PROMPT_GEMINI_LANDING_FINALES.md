# Prompt Gemini — Últimos detalles landings Claver / ClavERP

Copiá este bloque en Gemini. **No rehagas la arquitectura** — solo pulí lo que falta.

---

## PROMPT

```
Sos diseñador UI + copywriter. El proyecto Claver / ClavERP ya tiene landings funcionales en Next.js 15.

## Ya está hecho (NO tocar estructura)

- Hub matriz: /claver
- Hub producto: /claver/claverp
- Verticales: /claver/claverp/pos-afip, ecommerce, distribuidoras, etc.
- Catálogo módulos: /claver/claverp/modulos
- Marca: /claver/marca
- Logo React: components/marketing/brand-logo.tsx (ClaverIcon + ClavERPIcon)
- SVG estáticos: public/brand/claver-icon.svg, claverp-icon.svg, claverp-lockup.svg
- OG auto: app/claver/opengraph-image.tsx, app/claver/claverp/opengraph-image.tsx
- Favicon: public/icon.svg (ClavERP)
- Bloque LogoShowcase en heroes de /claver y /claver/claverp

## Tu misión — solo estos 5 entregables

### 1. Screenshots reales del producto (CRÍTICO)
Capturá o generá mockups creíbles para insertar en landings:
- Dashboard ejecutivo
- POS con semáforos AFIP
- Tienda /tienda?empresaId=1
- Portal B2B
- Picking o logística

Formato: WebP o PNG, 1280px ancho, guardar en public/brand/screenshots/
Crear componente components/marketing/product-screenshot.tsx que muestre carrusel.

### 2. Refinar SVG del logo (opcional premium)
Mejorar public/brand/*.svg manteniendo:
- Claver: arco C + punto ámbar
- ClavERP: 4 nodos conectados + azul #1E3A8A
Exportar también claver-lockup.svg (solo Claver, sin ClavERP).

### 3. Copy final español argentino
Revisar textos en lib/marketing/solutions-catalog.ts y claver-services-catalog.ts:
- Más concreto, menos genérico
- CTA único por página: "Probar demo" / "Ver tienda demo" / "Hablar con ventas"
- Eliminar asteriscos inventados (ej. "-40% errores*")

### 4. Sección "Confianza" en /claver
Agregar debajo del LogoShowcase:
- "Hecho en Argentina"
- "AFIP homologación + producción"
- "Multi-tenant seguro"
- "14 días trial"
Sin logos de terceros inventados.

### 5. Video / animación hero (ligero)
Framer Motion en LogoShowcase: pulse sutil en isotipos.
NO agregar dependencias nuevas.

## Reglas

- Marca: Claver (matriz) + ClavERP (producto). Nunca "ERP Argentina" ni "NexoOS".
- Colores: azul #1D4ED8, ámbar #F59E0B, slate #0F172A
- npm run build debe pasar
- No romper redirects /marketing → /claver

## Al terminar

Listá archivos tocados y qué screenshot falta si no pudiste capturar el producto real.
```

---

## División de trabajo sugerida

| Tarea | Quién | Estado |
|-------|-------|--------|
| Arquitectura URLs Claver/ClavERP | Cursor | ✅ |
| Logo SVG + componente React | Cursor | ✅ |
| OG image WhatsApp/LinkedIn | Cursor | ✅ |
| Favicon PWA | Cursor | ✅ |
| LogoShowcase en heroes | Cursor | ✅ |
| Emails + sidebar branding | Cursor | ✅ |
| Screenshots producto reales | **Gemini** | ⏳ |
| Copy polish vertical | **Gemini** | ⏳ |
| Logo premium Figma-level | **Gemini** | ⏳ opcional |
| Confianza + micro-animaciones | **Gemini** | ⏳ |
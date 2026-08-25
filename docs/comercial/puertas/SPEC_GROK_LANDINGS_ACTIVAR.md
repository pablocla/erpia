# Especificación Técnica para Grok — Landings, Activación y Menús de Puertas

> **Destinatario:** Grok (Implementador de Código)  
> **Objetivo:** Garantizar que cada una de las 12 puertas canónicas conduzca al usuario directamente a su pantalla de valor (Golden Path) sin abrumarlo con un ERP genérico ni exponer rutas rotas.

---

## 1. 5 Tareas Concretas de Implementación

1. **Unificación de Enlaces CTA en Landings:**
   - Todas las landings bajo `app/claver/apps/[slug]/page.tsx` y `app/claver/claverp/*` deben configurar su botón principal con el formato `/login?activar={sku}` donde `{sku}` coincide con la matriz canónica (`niche.oficios`, `pos.fiado_barrio`, `pos.core`, `core.claver`, `pool-monotributo`, `niche.gimnasio_barrio`).

2. **Resolución de Activación Post-Login (`lib/comercial/activar-intent.ts`):**
   - Verificar que al autenticarse con un intent de activación `?activar=niche.oficios`, la redirección resultante dirija inmediatamente a `/dashboard/oficios` y configure el `modoLite = "oficios"` en la sesión del usuario.
   - En el caso de `pos.fiado_barrio`, la redirección debe ser `/dashboard/fiado`.

3. **Segmentación Estricta del Menú Lateral (`lib/dashboard/sidebar-modules.ts`):**
   - El bloque **"Operación del día"** permanece al tope para comercios y retail.
   - El bloque **"Oficios & Obras"** se muestra únicamente cuando el usuario tiene `rubro === "oficios"` o el SKU activo corresponde a `niche.oficios`. Un cajero de kiosco o un dueño de gimnasio nunca debe ver "Presupuestos de Obra (3 Niv)" como su pantalla principal.

4. **Interpolación de Skins en Landing de Oficios (`app/claver/apps/oficios/page.tsx`):**
   - Consumir el parámetro `searchParams.oficio` y renderizar los textos específicos de `SKIN_OFICIOS` (`electricista`, `plomero`, `pintor`, `herrero`, `estudio`) manteniendo el mismo formulario y enlace `/login?activar=niche.oficios`.

5. **Pruebas de Regresión y Rutas Sanitizadas:**
   - Confirmar que `/dashboard/grow` mantenga su redirección 307 permanente a `/dashboard/agro/cannabis`.
   - Agregar test unitario en `__tests__/auth/home-redirect.test.ts` que valide el destino de cada uno de los 12 SKUs canónicos.

---

## 2. Criterios de Aceptación (DoD)

- [ ] Un usuario registrado vía `P-OFI-ELEC` ingresa a `/dashboard/oficios` y ve únicamente herramientas de presupuestos de obra, cuadrilla y gastos.
- [ ] Un usuario registrado vía `P-FIADO` ingresa a `/dashboard/fiado` y ve su libreta de clientes del barrio con saldos y cobros directos.
- [ ] Un usuario registrado vía `P-POS` ingresa a `/dashboard/pos` con apertura de caja in-situ y facturación AFIP.

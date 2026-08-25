# Auditoría salida PRD — botones, rubros, cálculos de nicho y UX

**Fecha:** 2026-08-24  
**Método:** relevamiento de código (catálogos, pantallas, services, nav), no brochure.  
**Pregunta:** qué falta **para salir realmente a producción**, no para seguir vendiendo demos.

| Documento hermano | Rol |
|-------------------|-----|
| [`docs/GO_LIVE_PRD.md`](../GO_LIVE_PRD.md) | Política: qué pack se **puede vender** como PRD |
| [`docs/qa/FALTANTES_TECNICOS_NICHOS.md`](./FALTANTES_TECNICOS_NICHOS.md) | Backlog técnico (parcialmente desfasado: fumigación ya es piloto) |
| [`docs/PRODUCTO_VENDIBLE_END_TO_END.md`](../PRODUCTO_VENDIBLE_END_TO_END.md) | Cadena comercial → soporte |
| [`docs/comercial/HUECOS_NICHOS_UX_PROCESOS.md`](../comercial/HUECOS_NICHOS_UX_PROCESOS.md) | Huecos de proceso por app de nicho |
| Este archivo | **UI real:** botones, menú, cálculos, funciones obvias, UX |

**Leyenda de madurez de pantalla**

| Bola | Significado |
|:----:|-------------|
| 🟢 | Operador encuentra, cobra/factura, empty y error claros |
| 🟡 | Existe el flujo, falta un botón o el menú lo esconde |
| 🟠 | Skin / CRUD / fórmula fake; se ve “del rubro” pero no opera |
| 🔴 | Promesa de landing/demo sin pantalla o con botón muerto |

---

## 0. Veredicto

**No se sale a PRD “de todo Claver”.** Hay ~40+ templates de industria, ~22 apps de nicho y 100+ rutas `/dashboard/*`. El día 1 de un comercio argentino pide **cuatro verbos en la misma pantalla del oficio:** Cobrar · Facturar · Imprimir · WhatsApp.

Hoy eso está cerrado (con caveats) solo en:

1. **POS + caja + fiado** (kiosco / almacén) — el pack más real.
2. **Facturación AFIP** (`/dashboard/ventas` + historial).
3. **CxC** (cobrar + WA por fila).
4. **Gym/club cuotas** (cobro manual + WA), no molinete.
5. **Oficios** (presupuesto 3 niveles + seña + cuadrilla) — **mejor producto nuevo**, pero **no está en packs PRD** y le faltan cobrar/facturar en la ficha.

El resto del catálogo (taller, vet, resto, agro, peluquería, feria, remis, préstamos “financiera”, corralón full) es **label sobre 5 engines** (`movimientos` / `cuotas` / `consorcio` / `agenda` / `libreta`) o un CRUD con **una fórmula simplificada**.

**Contrato interno:** el menú canónico (`lib/dashboard/sidebar-modules.ts`) está **sesgado a Oficios**. El pack que el PRD autoriza primero (kiosco/POS) vive en “Accesos rápidos”, no en el menú del rubro. Eso se siente “incompleto” aunque el POS exista.

---

## 1. Criterio de listo (UI)

Una pantalla **no es PRD** si el operador tiene que:

- saber la URL o usar Cmd+K (y Cmd+K **no lista POS ni Fiado**);
- abrir otra app para cobrar lo que acaba de hacer;
- ver un botón que no hace nada;
- recibir WhatsApp a `5491100000000`;
- entender un menú de otro oficio (oficios en un kiosco, fumigación en cada cliente).

**DoD de una pantalla operativa**

- [ ] Está en el menú del pack / rubro (no solo en essentials o en el palette).
- [ ] CTA primario a la derecha (`PageHeader`), verbo de plata o estado.
- [ ] Acciones por fila: Cobrar / Facturar / WA / Imprimir según el dominio.
- [ ] Empty con un solo CTA (no párrafo de onboarding).
- [ ] Error accionable en es-AR.
- [ ] Confirmación en anular / cierre / desactivar.
- [ ] Touch ≥ 40 px en caja y campo.
- [ ] Cálculo del rubro **usado** (no un service huérfano).

---

## 2. P0 — bloquea go-live real (arreglar antes de “estamos en prod”)

### 2.1 El menú no cuenta el producto que se vende

| Capa | Archivo | Qué ve el usuario |
|------|---------|-------------------|
| Catálogo agrupado | `lib/dashboard/sidebar-modules.ts` | **Oficios primero**; no hay POS, productos, agenda, presupuestos, facturas, NC |
| Accesos rápidos | `lib/dashboard/sidebar-essentials.ts` | POS, Ventas, Clientes, Productos, Caja, Facturas (rol default) |
| Lite | `lib/comercial/lite-sidebar.ts` + `SidebarLiteNav` | Tabs del pack; copy “sumá POS desde Mi plan” |
| Matriz rubro | `lib/comercial/nav-matrix.ts` | Allowlist de kiosco **incluye** POS/productos, pero **no puede pintar** lo que el catálogo no declara |
| Command palette | `components/command-palette.tsx` | Productos, facturación, agenda — **sin POS ni Fiado** |
| Bottom nav | `components/mobile-bottom-nav.tsx` | **Solo** `modoLite === "prestamista"` |

**Efecto:** un kiosco en `modoLite = completo` ve **Oficios & Obras** como sección principal y “Caja Chica & Vales” (la pantalla es caja operativa). El POS está escondido en una grilla de 6 íconos. Un cajero en tablet no tiene tabbar.

**Qué hacer (P0):** restaurar en `DASHBOARD_SIDEBAR_MODULOS` un bloque **Operación del día** (POS, Caja, Productos, Fiado, Facturas, NC, Presupuestos comerciales, Agenda) y dejar Oficios como sección de **rubro oficios**, no global. Respetar `NAV_PATHS_BY_RUBRO` + `LITE_MENU_PATHS`.

### 2.2 Labels que mienten

| Menú hoy | Ruta real | Debería decir |
|----------|-----------|---------------|
| Caja Chica & Vales | `/dashboard/caja` | Caja / Arqueo |
| Mercado Pago Connect | `/dashboard/mercadopago` | Tokens MP (no hay OAuth Connect) |
| Nuevo Presupuesto (3 Niv) | `/dashboard/oficios/nuevo` | Presupuesto de obra — **no** es el de monotributo (`/ventas/presupuestos`) |
| Facturación AFIP | `/dashboard/ventas` | Emitir (el historial es `/facturas`, **fuera del menú**) |

### 2.3 Botones muertos y WhatsApp fake

| Dónde | Qué pasa | Archivo |
|-------|----------|---------|
| Peluquería | “Enviar WhatsApp de cita” **sin `onClick`** | `app/dashboard/peluqueria/page.tsx` ~172 |
| Nicho cuotas V2 | “Cuota Masiva” **sin `onClick`**; Link MP abre `link.mercadopago.com.ar/mock` | `components/niche/niche-cuotas-panel-v2.tsx` (importado, **el shell usa V1**) |
| Detalle factura | WA a **`5491100000000`**, no al teléfono del cliente | `app/dashboard/facturas/[id]/page.tsx` ~159 |
| Logística / mantenimiento | mismo teléfono fake | `app/dashboard/logistica/page.tsx`, `mantenimiento/page.tsx` |

Un botón visible que no hace nada **quema más** que un botón ausente.

### 2.4 Tenant / fiscal en layout

| Bug | Archivo | Impacto |
|-----|---------|---------|
| `empresaId = 1` + `if (false) redirect` | `app/dashboard/impuestos/layout.tsx` | Features fiscales (AFIP sí/no) del **tenant 1**, no del logueado |
| `empresaId: 1` en el body al abrir caja | `app/dashboard/caja/page.tsx` ~129 | La API ignora el body y usa `ctx.auth.empresaId` (`app/api/caja/route.ts`) — **no sangra tenant**, pero es payload mentiroso |

### 2.5 Cálculos que existen y nadie llama

| Motor | Archivo | Usado en UI? |
|-------|---------|--------------|
| Venta m / m² / kg + merma de corte | `lib/pos/unidades-fraccionadas-service.ts` → `calcularVentaFraccionada` | **0 callers** |
| Promo 2×1 / 3×2 | `aplicarPromoCantidad` | tests; **no** en POS |
| EAN-13 balanza (`20`/`28`) | `parseEanBalanza` | **no** en POS |
| Pack/bulto → unidad mostrador | `unidades-fraccionadas` | **no** cableado |

Sin esto, ferretería y carnicería **PRD** del doc comercial son **mostrador genérico**.

---

## 3. Core operativo — botones y UX por pantalla

### 3.1 POS — 🟡 (potente, mal descubierto)

**Hay:** cobro, fiado, anular/devolver, print/PDF, cierre X/Z, overlay caja cerrada, modos mostrador/mesa/kiosko.

**Falta**

- Entrada en menú agrupado + command palette + bottom nav cajero.
- Empty de grilla: CTA **Crear producto / Importar CSV**.
- **Aplicar promo** y **Vender por m/kg** (motores huérfanos).
- WhatsApp del ticket post-venta (el de factura está roto).
- Abrir caja **desde el POS** (hoy hay que ir a `/caja`).
- Topbar `overflow-x-auto`: en mobile se pierden Cierre y Fiado.

**Archivos:** `app/dashboard/pos/page.tsx`, `pos/cierre/page.tsx`, `components/pos/*`.

### 3.2 Caja — 🟢/🟡

**Hay:** Abrir, movimiento, arqueo y cierre, CSV, empty.

**Falta:** link a POS y a X/Z; imprimir ticket de arqueo; `StatusBadge` (hoy `bg-green-100`). Título del menú mentiroso.

### 3.3 Fiado — 🟡 (ancla comercial)

**Hay:** alta, anotar, cobrar fila, empty onboarding, config límite.

**Falta**

- `PageShell` / `PageHeader` (toolbar suelta).
- Cobro **solo efectivo** hardcode (`fiado/page.tsx`).
- WA **por fila** (solo toggle automático + upsell).
- Extracto del deudor, print libreta, export.
- En essentials **no está**; sí en el menú agrupado.

### 3.4 Ventas / facturas / NC — 🟡

| Pantalla | CTA que hay | CTA que falta |
|----------|-------------|---------------|
| Emitir `/ventas` | Atajos, AFIP, Historial | La pantalla **es** el alta; OK. Sin WA post-emisión |
| Historial `/facturas` | Ver, Anular (`window.confirm`) | **Nueva factura**, **NC por fila**, print/WA en grilla. **Fuera del menú** |
| Detalle | Print `window.print()`, WA | Teléfono real del cliente |
| NC `/notas-credito` | Nueva NC | **Fuera del menú**; sin print/WA |

**Anular ≠ nota de crédito AFIP.** El cajero anula en historial y cree que fiscalmente se revirtió.

### 3.5 Productos / stock — 🟡

Catálogo: Nuevo + CSV + ajuste + etiqueta góndola. **Fuera del menú agrupado** (sí en essentials).

Subrutas `productos/inventario|ajustes|movimientos|transferencias`: h1 suelto, sin `PageShell`, inventario **sin** “Ajustar” / “Nuevo”.

### 3.6 CxC — 🟢

Cobrar + WA por fila, cobro múltiple, export, empty bueno. Header sin “Nuevo cobro” genérico. `/cuentas-pagar` existe y **no está en el menú**.

### 3.7 Compras / proveedores — 🟡

Compras: “Nueva OC”; factura de proveedor **escondida en tab**. Falta cancelar OC, print, WA proveedor, 3-way match visible.

Proveedores: sin desactivar, sin “Nueva OC” por fila, sin import CSV (clientes sí).

### 3.8 Banco / MP — 🟠

**Banco:** no hay **Nueva cuenta bancaria**. Sin cuentas, extracto y transferencia no arrancan. Empty dice “Cargá movimientos”.

**MP:** pegar Access Token. Label “Connect”. QR/Checkout texto estático. Sin conciliar, sin QR de cobro del comercio (distinto del MP de suscripción Claver).

### 3.9 Impuestos — 🟠

Sin `PageShell`. Descargas IVA **solo después** de liquidar (si no hay reporte, no hay empty ni botones). Año `[2024, 2025, 2026]` hardcode. CITI / SICORE / TES / pre-presentación **existen y no están en el menú**. Layout `empresaId = 1`.

### 3.10 Agenda — 🟡

CTA Nuevo turno; WA confirmar; **Cobrar en POS** (el POS no está en el menú del rubro servicios). Falta reagendar, no-show, print del día. **Fuera del sidebar agrupado.** Pack `servicios_pro` PRD tiene golden path acá.

### 3.11 Presupuestos — tres productos, un solo botón

| Ruta | Qué es | En menú |
|------|--------|---------|
| `/dashboard/oficios/nuevo` | 3 niveles obra | **Sí** (y es el único “Presupuesto”) |
| `/dashboard/ventas/presupuestos` | Cotización comercial → pedido | **No** — pack monotributo PRD |
| `/dashboard/presupuesto` | Presupuesto **contable** anual | **No** |

Comercial: Enviar/Aceptar/Rechazar/Convertir a pedido. **Enviar no manda PDF/WA/mail** (cambia estado). No hay “Convertir a factura”. Pedidos **sin** “Nuevo pedido”.

### 3.12 Clientes — 🟡 con ruido

Nuevo + CSV. En **todas** las filas hay íconos a **fumigación**. En kiosco es basura. Falta por fila: Fiado / Facturar / Cobrar.

Destructive: bulk desactivar **sin confirm**.

---

## 4. Matriz de rubros (industria × PRD × UI × cálculo)

Templates: `lib/comercial/industry-templates.ts` (~40). Packs: `lib/comercial/go-live-packs.ts`. Rubro type: `lib/onboarding/onboarding-ia.ts`.

| Rubro / template | Tier doc | UI real | Cálculo de nicho | Botones / flujos faltantes | Riesgo si se vende PRD |
|------------------|----------|---------|------------------|----------------------------|------------------------|
| **Kiosco / almacén** | 🟢 PRD | POS + fiado + caja | Fiado, IVA línea, recarga % (API), merma rotura | Promo y bulto no en POS; offline no garantizado; menú oficios | Medio: producto sí, nav no |
| **Ferretería** | 🟢 PRD mostrador | Mismo POS/ventas | `calcularVentaFraccionada` **huérfano** | Vender m/m², merma corte, remito obra, listas en pack | Alto si prometen corralón |
| **POS + factura** | 🟢 PRD | `/ventas` + POS | TES/CAE | Historial/NC fuera de menú; WA fake | Medio |
| **Monotributo** | 🟢 PRD | `/ventas/presupuestos` | Genérico | **Presupuesto no está en el menú**; sin PDF/WA | Alto: no encuentran el golden path |
| **Servicios pro** | 🟢 PRD | Agenda | Ninguno de campo | Agenda fuera de menú; sin OT field | Alto vs “técnico en la calle” |
| **Gym** | 🟢 PRD acotado | `/membresias` **y** `/nicho/gimnasio` (dos homes) | `fechaFin = inicio + días`; cuota plana $10k nicho **no toma precio del plan** | Congelar, pase diario, débito, generar mes (en nicho, no en ERP) | Medio: cobro sí, gym-pro no |
| **Club** | 🟢 PRD acotado | `/nicho/club` cuotas | Igual cuotas | Cantina/POS **prometida, no hay página**; fixture | Alto overpromise cantina |
| **Oficios / obras** | 🟠 no en §3.1 PRD | `/oficios/*` **sí producto** | Seña %, jornal×días (vales=0), APU 1 seed, 2 fórmulas math.js | **Cobrar saldo / Facturar / caja** en ficha; PDF nativo; IVA presupuesto | Medio: mejor que el engine `obras` |
| **Veterinaria** | 🟡 piloto | HC + `/veterinaria` | Edad meses; vacuna = motivo contiene “vacun” | **Cobrar consulta, POS, stock, receta, WA vacuna** | Alto si venden HIS |
| **Clínica** | 🟡 piloto | Redirect agenda | Cero clínico | Cobrar acto, OS, nomenclador | Alto |
| **Taller** | 🟡 piloto | `/nicho/taller` movimientos | **Ninguno** (título+monto) | Ítems MO/repuesto, horas×tarifa, print OT, descontar stock | Alto |
| **Fumigación** | 🟡 piloto | `/fumigacion` mapa | Ruta nearest-neighbor, no TSP | Cobrar en sitio, cert 1-click, descontar veneno, firma | Medio (mejor que el doc 07-18) |
| **Bar / resto** | 🟠 demo | Mesas, KDS, mozo, platos | Σ qty×precio; timer KDS | Dividir cuenta, propina, pre-cuenta, caja turno | Alto |
| **Consorcios** | 🟠 demo/piloto | Panel nicho | Prorrateo %; factura B IVA 0 | PDF por UF, punitorios, fondo reserva, extra | Alto vs admin profesional |
| **Inmobiliaria** | 🟠 piloto | `/nicho/inmobiliaria` | Alquiler mensual por día vto | Portales live, ICL, comisión | Alto |
| **Agro / acopio** | 🟠 demo | `/agro/*` | Neto=bruto−tara; humedad/impureza; retenciones **inventadas** (no RG 2300) | SICORE, 1116, pizarra BCR, carta porte ARCA | Crítico si se cobra como Clavergrow PRD |
| **Carnicería** | 🟠 demo | POS + numpad kg | `$/kg`; EAN no parseado | Desposte, merma res, leer ticket balanza | Alto |
| **Peluquería** | 🟠 demo | `/peluqueria` + agenda | Turno 30 min fijo | WA muerto; cobrar servicio; comisión; caja | Alto |
| **Tintorería / plancha** | 🟠 demo | Movimientos ticket | Ninguno | Imprimir ticket, cobrar al retirar | Medio (wow LISTO+WA si Twilio) |
| **Prestamista** | 🟠 demo | `/prestamos` + redirect fiado | Interés simple 30%, **1 cuota hardcode** | Cuotas, CFT, punitorio, facturar interés | Alto si “financiera” |
| **Distribuidora** | 🟠 demo | picking / logística / vendedor sueltos | Margen CSV | Hub pedido+cobro+remito+liquidar vendedor | Alto |
| **Panadería / súper / farmacia** | 🟠 skin kiosco | Retail genérico | Casi kiosco | Vencimientos, receta, PAMI, multi-caja | Alto |
| **Concesionaria** | 🟠 demo | CRUD stock | Σ precio toma | Vender, 08, financiar | Alto |
| **Feria, remis, delivery, salón, colonia, peña, escuela, mutuo** | 🟠 shell | Engine movimientos/cuotas | Suma pendientes | Cierre de caja del oficio, print, factura | No vender como vertical |
| **AC, electricista, piletero, jardinería** | 🔴 no vender | — | — | OT Field | Cumplir `GO_LIVE_NO_VENDER` |
| **Canchas** | 🟠 | Redirect agenda | Seña no como entidad | Seña + turno en un acto | Medio |

---

## 5. Cálculos de nicho: arquitectura real

Cinco engines (`lib/niche/types.ts`):

```
movimientos  → taller, obras, plancha, feria, remis, delivery, acopio, salón
cuotas       → club, gym, escuela, colonia, peña, mutuo
consorcio    → consorcios
agenda       → consultorio, cancha, peluquería, vet (redirect)
libreta      → prestamista → /dashboard/fiado
```

Un “ticket de taller” es `NicheMovimiento { titulo, categoria, monto, estado }`.  
**No hay** horas × tarifa, IVA discriminado MO vs repuestos, merma, francés, milésimas, dosis/peso.

### 5.1 Lo que sí calcula el repo (y dónde)

| Dominio | Fórmula | Archivo | ¿UI? |
|---------|---------|---------|------|
| Fiado crédito | disponible = límite − deuda | `lib/fiado/fiado-service.ts` | Sí |
| POS línea | neto + IVA | `lib/ventas/crear-venta-stock-service.ts` | Sí |
| Recarga kiosco | comisión 3–5% | `lib/almacen-rosario/recargas-servicios-service.ts` | API; UI no es tecla 1er nivel |
| Oficios seña | `monto × %` | KPI `/dashboard/oficios` | Sí |
| Jornal | `días × valor`; vales **= 0** | `liquidarSemanaOperario` | Cuadrilla |
| APU | Σ qty × precio | `lib/nicho/apu-service.ts` (1 seed pared) | Presupuesto 3 niv usa montos **hardcode $35k/$70k/$100k** |
| Fórmulas técnicas | Hazen-Williams; largo×alto | `lib/nicho/formula-calculo-service.ts` | Casi invisible |
| Gym | `inicio + duracionDias` | `MembresiasService` | Sí |
| Consorcios | gasto × % UF | `ConsorciosService.liquidarExpensas` | Sí |
| Agro balanza | bruto−tara; −1%/punto humedad | `lib/agro/*` | Sí, **no es fiscal real** |
| Préstamo | `capital × 30%`; 1 cuota | `lib/prestamos` | Sí, y es insuficiente |
| Hospitalidad | Σ líneas | page mesas | Sí |
| Fumigación ruta | nearest neighbor | sortParadas | Sí |

### 5.2 Cálculos **obvios** que un PyME espera y no hay

| Rubro | Cálculo faltante (día 1) |
|-------|--------------------------|
| Ferretería | m/m²/kg con merma de corte **en el ticket** |
| Carnicería | media res → cortes (rendimiento); EAN balanza |
| Kiosco | pack/bulto → unidad; 2×1 en ticket; vencimiento lácteos |
| Taller | horas × tarifa + ítems + IVA |
| Gym | prorrateo alta a mitad de mes; freeze |
| Club | cuota social vs deportiva; cantina |
| Consorcios | milésimas, punitorio, fondo de reserva, extra |
| Prestamista | sistema francés, punitorio diario, CFT |
| Oficios | IVA/IIBB en presupuesto; vales reales; APU inflacionario |
| Vet | dosis por peso; calendario vacunal por especie |
| Resto | propina %, cubierto, food-cost, dividir cuenta |
| Agro | retenciones RG reales, merma silo, 1116 |
| Fumigación | dilución / dosis / lote |
| Peluquería | comisión % profesional + consumo tintura |

---

## 6. Funciones obvias que el sistema “debería tener” y no tiene (o no se ven)

Agrupadas por verbo. Si está en código pero **no hay botón**, cuenta como falta.

### Cobrar
- Vet / HC / peluquería / oficios ficha / fumigación en sitio / taller (solo “Cobrar y Entregar” al final).
- Fiado: transferencia y MP (hoy efectivo).
- Gym ERP: generar cuotas del mes (está en nicho, no en membresías).

### Facturar AFIP
- Oficios ficha, taller, cuota gym, interés préstamo, consulta vet.
- Historial: emitir NC **desde la factura** (ruta NC oculta).

### Imprimir
- OT taller, ticket tintorería, liquidación consorcio por UF, presupuesto oficios nativo (hoy link público), arqueo de `/caja` (X/Z sí imprime en POS).

### WhatsApp
- Ticket POS; factura con teléfono real; vacuna vet; cita peluquería (botón muerto); morosos fiado **por fila**.

### Cerrar el día
- Resto / club cantina / feria / remis: no hay cierre de caja del oficio (solo `/caja` y `/pos/cierre`).

### Stock
- Cerrar consulta vet → descontar insumos (hay `.bak`, no prod).
- Usar repuesto en taller → descontar.
- Cerrar visita fumigación → descontar químico.

### Hardware / campo
- Offline POS + fiado sin duplicar (PRD **prohíbe** prometerlo).
- Balanza EAN en POS.
- Torniquete gym, molinete club.
- App técnico OT Field (fumigación campo es cambio de estado).

### Banca / cobro Claver vs comercio
- Alta de cuenta bancaria.
- MP Connect real + QR del **comercio** (distinto de suscripción Claver).

---

## 7. UX / UI transversal (kit vs realidad)

`PRODUCT.md` / `DESIGN.md` piden: `PageShell` → `PageHeader` → `PageToolbar` → `StatusBadge` → empty/error first-class. `es-AR`, ARS, touch 40 px.

| Patrón | Dónde se cumple | Dónde se rompe |
|--------|-----------------|----------------|
| `PageShell` + `PageHeader` | Ventas, CxC, caja, compras | Fiado, banco, IVA, IIBB, POS, inventario, presupuesto contable, oficios (header custom) |
| `PageToolbar` | Facturas | Casi nadie más |
| `EmptyState` | Clientes, CxC, fiado onboarding | POS grilla, banco, MP, IVA, peluquería texto plano |
| `StatusBadge` + tokens | Caja (parcial) | POS/fiado/usuarios/impuestos: `bg-green-100`, `text-red-600` |
| Confirm destructive | Caja arqueo, presupuestos convertir | Facturas `confirm()`, clientes bulk **sin** confirm, usuarios toggle |
| Mobile | Ventas sticky Emitir | Bottom nav solo prestamista; POS topbar scroll; filas `h-7` |
| Densidad oficios | Cards de trabajo razonables | KPIs `bg-emerald-500/10` hardcode, no tokens |
| Ruido de otro vertical | — | Fumigación en **todas** las filas de clientes |

**Sensación “no está listo”** no es solo falta de features: es **menú de otro rubro + botones muertos + empty sin CTA + colores sueltos**.

---

## 8. Zoom Oficios (el menú que está puesto como principal)

Producto real y bueno para calle: 3 niveles, link público `/p/trabajo/[token]`, seña, GPS, fotos, gastos, cuadrilla, services, alquileres, afiliados 25%.

**No está** en `GO_LIVE_PACKS_PRD`. Comercialmente es piloto; en UI parece el producto.

### Botones que hay
Nuevo presupuesto, Cuadrilla, Abrir ficha, Copiar link, Ver como cliente, GPS, fotos, gastos, cambiar estado (señado / iniciar / finalizar).

### Botones que faltan en listado y ficha (`oficios/page.tsx`, `oficios/[id]/page.tsx`)
| Botón | Por qué es obvio |
|-------|------------------|
| **WhatsApp nativo** (no solo copiar link) | El copy del empty habla de WA |
| **Cobrar seña** (MP/efectivo → caja) | Hoy “Marcar Señado” es un flag |
| **Cobrar saldo** | KPI seña vs monto; el saldo no se cobra en UI |
| **Facturar AFIP** | Trabajo finalizado sin comprobante |
| **Imprimir / PDF** | Cliente de obra pide papel |
| **Asignar operario** desde la card | Hay que ir a cuadrilla |
| Filtro **EN_GARANTIA / CANCELADO** | El modelo los tiene; el chip no |

### Cálculos flojos
- Tres opciones default **$35.000 / $70.000 / $100.000** hardcode (`oficios/nuevo`), no APU.
- APU seed una sola partida (pared 10 m²).
- Jornales: vales = 0.
- Sin IVA en el presupuesto de 3 niveles.

---

## 9. Nicho shell — qué hay y qué parece que hay

`components/niche/niche-app-shell.tsx`

- Apps con `redirectPath` (vet, consultorio, peluquería, prestamista, garantía): **una card + “Ir a…”**. No es el producto.
- Cuotas: panel V1 con Cobrar / WA / Link MP / Cuota del mes / Avisar morosos — **usable**.
- V2 importado y **no montado**; si alguien lo activa, botones rotos.
- Movimientos V2: estados + “Cobrar y Entregar” solo en `listo`. Sin Facturar / Imprimir / parcial.
- Empty: 3 pasos en V1 cuotas; movimientos a menudo lista en 0 sin empty rico.

**Dos homes gym:** `/dashboard/membresias` (PRD) vs `/dashboard/nicho/gimnasio` (cuotas). El vendedor y el dueño no saben cuál es “el” gym.

---

## 10. Rutas rotas, docs que se pisan y lite que miente

Esto no es “falta profundidad”: es **el usuario cae en 404 o en el menú de otro oficio**.

| Promesa | Realidad | Archivo / síntoma |
|---------|----------|-------------------|
| Claver Grow `/dashboard/grow` | **404**. Cannabis vive en `/dashboard/agro/cannabis` | `pack-calle-catalog` `modoLite=asociacion`; `sub-saas` clavergrow |
| Importador | Placeholder `app/dashboard/importacion/page.tsx` | Tipo `Rubro` + onboarding; landed cost **no** |
| Reventa tendencias | Placeholder `reventas/page.tsx`; nav a `/reventas/links` y `/stock` **sin páginas** | `NAV_PATHS_BY_RUBRO` |
| Textil fábrica | `/industria/corte` y `/talleres` en nav, **no existen** | `nav-matrix.ts` |
| Hotelería PMS | UI liviana; emitir llave con `reservaId: 1` | `app/dashboard/hoteleria` |
| `canchas` | Está en el type `Rubro` pero **no** en `RUBRO_UX` → `normalizeRubroValue` lo manda a **`otro`** | Wizard sí; `/demo` no; nav SERVICE_CORE |
| Librería / ropa | En onboarding IA | **No** hay card en `/demo` ni template industria |
| Config empresa | Combo de rubro **más chico** que el type | Dueño no puede setear agro/canchas/librería |
| Shell `niche` default | `MODO_LITE_DEFAULT_SLUG.niche = "oficios"` | Gym/club/taller pueden ver **tabs de Oficios** |
| Template sin `engancheId` | Demo arranca `modoLite=completo` | `gimnasio` featured, `bar_restaurant`, `supermercado` → ERP ruidoso |
| Kiosco pack | `pool-kiosco-barrio` deja `modoLite=pos` | El ancla vendida es **fiado**, el lite es POS |
| Alias `servicios` → `otro` | `freelance_mt` / `servicios_pro` persisten `rubro: "servicios"` (`@ts-nocheck`) | Matriz nav **no recorta** si falta enganche |

**Docs vs código (comercial se pisa)**

1. `GO_LIVE_PRD.md` §3.3 **no vender fumigación** vs `go-live-packs.ts` **piloto** vs `FALTANTES_TECNICOS_NICHOS.md` “no existe” (obsoleto: hay template, SKU y `/dashboard/fumigacion`).
2. Oficios: marketing `estado: disponible` / home #1 vs PRD “hasta OT Field” vs `resolveGoLiveTier("oficios") = demo`.
3. Gym: dos golden paths PRD (`/membresias` vs `/nicho/gimnasio`).
4. Sensor `/demo` lista ~47 industrias; PRD autoriza **8 packs**. El desvío más caro no es un nicho vacío: es **vender Oficios como puerta** mientras el contrato dice que no es vertical.

---

## 11. Plan de corte para salir (no abrir 20 verticales)

Objetivo: **cumplir `GO_LIVE_PRD.md` §3.1 en la UI**, no certificar el catálogo entero.

### Ola 0 — 3–5 días (P0 percepción + bugs)

1. Restaurar menú **Operación del día** (POS, Caja, Productos, Fiado, Facturas, NC, Presupuestos `/ventas/presupuestos`, Agenda) filtrado por rubro/pack.
2. Oficios solo si rubro/pack oficios (o `modoLite` servicios/niche oficios).
3. POS + Fiado en command palette; bottom nav cajero (POS / Caja / Fiado).
4. Renombrar Caja y MP; quitar fumigación de clientes salvo rubro.
5. WA factura = teléfono del cliente; matar `5491100000000`.
6. Peluquería: `onClick` o sacar el botón.
7. Impuestos layout: `getAuthContext`, no `empresaId = 1`.
8. Banco: CTA **Nueva cuenta**.
9. Redirect `/dashboard/grow` → `/dashboard/agro/cannabis` (o crear la página). Sacar de nav las rutas textil/reventa que 404.
10. `canchas` en `RUBRO_UX` o sacarlo del type. Default shell `niche` ≠ oficios para gym/club.

### Ola 1 — packs PRD que hoy se venden (kiosco / POS / ferretería flaca / monotributo / gym)

11. Fiado: cobro transferencia + MP; WA por fila.
12. Historial facturas: Nueva factura + NC por fila en menú.
13. Presupuestos comerciales: PDF + WA (el pack freelance lo promete).
14. POS: CTA empty productos; promo **o** esconder el motor; ferretería: cablear `calcularVentaFraccionada` o bajar la promesa en landing.
15. Gym: un solo home; “Cuota del mes” en membresías; no vender torniquete.

### Ola 2 — oficios (si se quiere promover a §3.1)

16. Ficha: Cobrar seña → caja/MP; Cobrar saldo; Facturar; PDF.
17. APU o al menos totales no hardcode; vales de jornal ≠ 0.
18. Agregar pack `oficios` a `GO_LIVE_PACKS_PRD` **solo después** de 16–17.

### Explicitamente **no** para esta salida

- 15 verticales long-tail (feria, remis, peña…).
- OT Field / SENASA / HIS / molinete / pizarra BCR.
- Rediseño visual tipo landing.
- Conectar NicheCuotasPanelV2 hasta que deje de ser mock.

---

## 12. Checklist “¿este pack puede ir a prod?” (implementador)

Además de `GO_LIVE_PRD.md` §6:

- [ ] El **primer botón** del menú es el golden path del pack (no Oficios si es kiosco).
- [ ] Recorrido 10 min: login → home → operación → cobro → print/WA **sin URL a mano**.
- [ ] Ningún botón primario sin `onClick` / mock MP.
- [ ] Empty con CTA del mismo oficio.
- [ ] Cálculo prometido en el lema **se ejecuta en esa pantalla** (no solo en `lib/`).
- [ ] WhatsApp usa el teléfono del cliente o se oculta si no hay Twilio.
- [ ] Mobile: el cajero llega a POS/caja con el pulgar.

Si falla el primero, **no es PRD**. Es demo con menú de otro producto.

---

## 13. Evidencia rápida (paths)

```
lib/dashboard/sidebar-modules.ts          ← catálogo oficios-first
lib/dashboard/sidebar-essentials.ts       ← POS/productos escondidos en “rápidos”
lib/comercial/go-live-packs.ts            ← qué es PRD en código
lib/comercial/industry-templates.ts       ← ~40 demos
lib/comercial/nav-matrix.ts               ← allowlist que el catálogo no pinta
lib/niche/niche-apps-catalog.ts           ← 22 skins / 5 engines
lib/niche/types.ts
lib/nicho/apu-service.ts
lib/nicho/formula-calculo-service.ts
lib/pos/unidades-fraccionadas-service.ts  ← 0 callers
app/dashboard/oficios/page.tsx
app/dashboard/oficios/[id]/page.tsx
app/dashboard/oficios/nuevo/page.tsx      ← $35k/$70k/$100k
app/dashboard/fiado/page.tsx              ← cobro efectivo
app/dashboard/caja/page.tsx               ← body empresaId: 1
app/dashboard/impuestos/layout.tsx        ← empresaId = 1
app/dashboard/facturas/[id]/page.tsx      ← WA fake
app/dashboard/peluqueria/page.tsx         ← botón WA muerto
app/dashboard/clientes/page.tsx           ← íconos fumigación
components/niche/niche-app-shell.tsx
components/niche/niche-cuotas-panel-v2.tsx
components/command-palette.tsx
components/mobile-bottom-nav.tsx
```

---

*Este documento es el relevamiento de **producto operable**. Actualizar cuando un pack mueva de 🟠/🟡 a 🟢 en la matriz §4 y cuando el menú deje de ser oficios-global.*

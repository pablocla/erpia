# Servidor gratis + item shop — jugar de a miles, pagar los chiches

**Fecha:** 2026-08-25  
**Para:** founder · vendedor · Grok (shell POS, menús, caps) · humano (precios item shop)  
**Hermanos:** [`PAJARO_EN_MANO.md`](./PAJARO_EN_MANO.md) · [`POS_GRATIS_ESCALA.md`](./POS_GRATIS_ESCALA.md) · [`COSTOS_ESCATIMAR.md`](./COSTOS_ESCATIMAR.md) · [`COSTOS_VERCEL_SUPABASE_TAKE_RATE.md`](./COSTOS_VERCEL_SUPABASE_TAKE_RATE.md) · [`ROMPER_MERCADO_ERP_AR.md`](./ROMPER_MERCADO_ERP_AR.md) · [`PUERTA_UNICORNIO_INTERNACIONAL.md`](./PUERTA_UNICORNIO_INTERNACIONAL.md)

Modelo:

> Ellos **juegan en tu servidor** (venden, fían, cierran caja).  
> Si quieren skins, pases y power-ups, entran a la **item shop**.  
> Si no, **siguen jugando**: te dejan datos, hábito y la chance de venderles el chiche el día que les duele.  
> **No nerfeés el gameplay.** La caja tiene que sentirse premium. Lo caro de computar va a **otro ítem de menú**, no se saca de la pantalla de cobro.

Primero: **salir a vender la app gratis a pymes.**  
Después: que paguen chiches.  
Enterprise (URL propia, depto contable pesado, multi-sucursal) **solo si lo piden**.

---

## 1. Qué es “jugar” vs “item shop”

| En el juego | En Claver | Precio |
|-------------|-----------|--------|
| Personaje, mapa, matchear | Alta + 1 caja POS + fiado + stock + clientes + cierre de caja | **$0** |
| Seguir laburando todos los días | Tickets, deudores, “quién me debe”, arqueo | **$0** |
| Battle pass / skins | WhatsApp de cobro, link MP, factura AFIP, 2ª caja, 3er usuario | **Item shop / mes** |
| Servidor privado, dominio, clan | `empresa.claver.com.ar`, depto contable + otros deptos, otra empresa cargando a otro tenant, SLA | **Item shop, solo si lo piden** |
| No jugar | Se fueron | Purge 90 días |

**UX/UI del juego no se baja.** El POS no se ve “versión pobre”. Se ve **rápido**. Lo que no entra en el frame de cobro (libro IVA, BI, 40 mil asientos, IoT) **no se borra**: se empaqueta en otro menú (“Contabilidad”, “Reportes”, “Estudio”) y ese menú puede ser gratis liviano o chiche pesado.

Regla: **sacrificás costo de cómputo, no píxeles ni clicks del cajero.**

---

## 2. Uso diario: bajar lo que más impacta (sin tocar la caja)

Impacto = GB de Vercel + lambdas + queries pesadas **mientras cobran**.

### 2.1 Lo que más mueve la aguja (hacer sí o sí)

| # | En el uso diario | Qué hacer | Calidad UX |
|---|------------------|-----------|------------|
| 1 | El POS carga el ERP entero (sidebar, Ctrl+K, chat, 5 polls) | Shell de mostrador: cobro + buscador + ticket. El resto ni se descarga | **Mejor** (más rápido) |
| 2 | Topbar pega 5 APIs cada 1–2 min (`/api/pos/venta`, alertas, tickets, tareas, analista) | En POS: **0 poll**. Caja abierta via store al abrir turno. Alertas/tareas = menú **Pendientes** (dueño, no cajero) | Igual o mejor |
| 3 | Cada listado trae el histórico infinito | Listas del día / 7 días en caja. “Ver todo el año” = menú **Reportes** | Caja más ágil |
| 4 | AFIP en el mismo request que “Cobrar” | Ticket ya. CAE en cola. Estado “pendiente” en **Facturación** (otro ítem) | **Mejor** (no espera AFIP) |
| 5 | Fotos, 4 fuentes, Image Optimization | 1 fuente en POS. Fotos en ficha de producto (menú Stock), no en el grid de cobro | Cobro más liviano |

El cajero no pierde features: **cambia de sala**. Dueño abre Reportes/IVA cuando cierra, no a las 12 del mediodía.

### 2.2 Empaquetar datos caros en **otro ítem de menú** (no sacrificarlos)

Si un dato es pesado, **no lo borres**. Ponelo detrás de un ítem con nombre claro. Así el servidor no lo calcula 400 veces por día.

| Dato / query cara | No va en | Va en (menú) | ¿Gratis o shop? |
|-------------------|----------|--------------|-----------------|
| IVA, CITI, padrones, IIBB | POS, topbar | **Impuestos / Estudio** | Shop si es AFIP prod o export masivo; vista “hay N comprobantes” puede ser gratis |
| Asientos, balance, mayor | Caja | **Contabilidad** | Shop o “pedido del contador” |
| Alertas, tickets soporte, mis tareas | Poll del POS | **Pendientes** (dueño) | Gratis, on demand |
| Analista Claver Cloud | Cajero | No existe para pyme | Interno Claver |
| KPIs mes, ranking productos 12 m | Home del cajero | **Reportes** | Gratis: hoy/ayer. Shop: 12 meses + Excel |
| Log de auditoría, quién anuló | Mostrador | **Auditoría** | Shop cadena / dueño desconfiado |
| Stock valorizado, reexpresión | Ticket | **Stock → costos** | Shop o dueño |
| Multi-empresa del contador | Tenant kiosco | **Portal contador** | Shop del estudio |
| IoT, agro, OPO | Nunca el ancla | Apps | Shop |

**UI:** mismos tokens, mismos botones. El ítem “Reportes” no se ve feo: se ve **cuando lo abrís**, no se precalcula.

### 2.3 Multi-depto + otro tenant en el mismo Vercel

Todos en **un** proyecto Vercel, **N** `empresaId`. Eso es el servidor del juego.

| Situación | Riesgo de costo / calidad | Escatimar **sin** bajar UX |
|-----------|---------------------------|----------------------------|
| Cajero A cobra | Tiene que ser instantáneo | Prioridad: cola corta, query chica, sin reportes |
| Contable de A arma IVA | Query pesada | **Job / “Generar libro”** en menú Impuestos. Spinner. No corre en el mismo click que “Cobrar” |
| Depósito de A ajusta stock | OK | Batch, no recálculo de todo el inventario en cada tecla |
| Usuario de **empresa B** carga facturas | No puede frenar a A | `whereEmpresa` + **timeout y límite de filas** en reportes. Un tenant no se come el compute (noisy neighbor) |
| Estudio C entra a 20 clientes | 20 tenants | Portal contador: **una sesión, elige empresa**. Las queries pesadas = shop y en horario valle si hace falta |

Calidad: el cajero de A **nunca** espera al contable de A ni al de B. Eso no es recortar UX: es **no mezclar partidas**.

Grok (cuando se codee): reportes `maxDuration` aparte; POS `maxDuration` bajo; índice `(empresaId, fecha)`.

---

## 3. Hasta dónde llegan **Pro + Pro** (Vercel + Supabase)

Números de orden de magnitud. Piso: Vercel Pro ~USD 20 + Supabase Pro ~USD 25. Incluidos típicos (cambian; mirar dashboard): transfer ~0,1–1 TB, compute chico, disco unos GB.

Supuesto: **POS shell liviano** (sección 2 hecha). Si no achicás el JS, dividí las cifras de cajas **÷ 3**.

| Mezcla en el servidor | ¿Aguanta Pro+Pro? | Qué se siente primero |
|----------------------|-------------------|------------------------|
| 50–150 pymes ancla, 1 caja, horario de barrio | **Sí, holgado** | Casi nada |
| 300–800 ancla + 10% extra WA/AFIP | **Sí** | Transfer si el POS sigue gordo |
| 1.000–2.000 ancla, pico 18–21 h | **Límite** | CPU Postgres; upgrade **compute** Supabase (~USD 15–50), seguís en Pro |
| 2.000–5.000 | Pro Vercel **justo**; Supabase **Small/Medium** | Invoice transfer + conexiones. POS **tiene** que ser shell chico |
| 5.000–10.000 | **No** como único plan | Node fijo para `/api/pos` + DB São Paulo. Vercel = landing |
| 1 pyme “empresa” (contable + 15 users + IVA) | Cabe **varias** en Pro | Su menú Contabilidad no debe correr 9–13 h contra el POS |
| 20 estudios × 30 clientes | No es Pro eterno | Shop “portal contador”; read replica cuando lo pidan |

**Vertical (una pyme que vende mucho en 1 caja):** un kiosco/almacén de 300 tickets/día **entra** en Pro. El problema es **200 de esos a la misma hora**, no uno solo.

**Horizontal (muchos gratis):** Pro+Pro alcanza para **salir a vender** (cientos → ~mil) si 2.1 está hecho. Para “masivo Argentina” (5–10 mil+) el plan Pro es **lobby**, no el endgame. El endgame es compute fijo; el juego sigue siendo gratis.

No recortes calidad para alargar Pro: **achicá el POS** y **separá reportes**. Eso alarga Pro **y** se siente mejor.

---

## 4. Salir a vender **gratis** (pymes primero)

Pitch:

> Entras al servidor gratis. Caja, fiado, stock. Como un juego: jugás.  
> Si más adelante querés que les cobre solo a los deudores o facturar AFIP, está la tienda.  
> Si no, seguís. No te bajo la caja.

Calle: [`PAJARO_EN_MANO.md`](./PAJARO_EN_MANO.md) + flameo §4.1.  
Guerra a los que ya pagan: [`ROMPER_MERCADO_ERP_AR.md`](./ROMPER_MERCADO_ERP_AR.md).

**No** menciones enterprise, URL propia, ni “depto de sistemas” el día 0.

Lo que te dejan aunque no paguen: hábito, datos de uso (qué venden, cuándo, si hay fiado), momento de ofrecer el chiche, referido al de la esquina. Eso **es** el inventario del servidor.

---

## 5. Item shop (chiches) — entran si quieren

| Slot | Chiche | Por qué se paga |
|------|--------|-----------------|
| Cobro | WA + link MP (ClavPay 0,5–1% **solo** del link) | Costo Meta/Twilio + recupera plata |
| Fiscal | AFIP prod | SOAP, cert, soporte |
| Equipo | 3er usuario, 2ª caja | Compute + soporte |
| Números | Reportes 12 meses, Excel, IVA export | Query cara — menú **Reportes / Impuestos** |
| Estudio | Portal contador multi-tenant | Carga de “otro depto / otra empresa” |
| Cadena | Auditoría, sucursal | No es el kiosco |
| Skins | Temas, logo, `tulocal.claver.com.ar` | **Solo si lo piden** |

La tienda se ve en **un** ítem “Mejorar / Tienda” o paywall en el botón (“Facturar AFIP”). No un marketplace de 80 cards en el primer login.

Empleados digitales = chiche, no el juego. Ver ENLISTA.

---

## 6. Enterprise y URL propia — **solo si el usuario lo pide**

No es el plan de salida a la calle. Es un SKU “Servidor privado / Cadena”.

Si **ellos** preguntan (“¿podemos tener nuestracaja.com y al contador aparte?”):

| Piden | Qué es | Costo (orden, no lista) |
|-------|--------|-------------------------|
| `pos.midominio.com` o `cliente.claver.com.ar` | Custom domain + TLS | DNS + 10 min ops; cobrá setup chico |
| “Que no se caiga” | SLA, status, on-call | No es Pro; contrato |
| Depto contable + depósito + caja | Mismos menús, **roles**; reportes en job | Sigue un tenant; no hace falta otro Vercel |
| “Otra empresa carga la nuestra” | Estudio / outsourcing | Portal contador, `empresaId` al elegir cliente |
| Datos en Argentina / no USA | Región SP o VPS AR | Migración DB; item shop infra |
| Dedicado | Proyecto Vercel aparte o Node + Postgres propio | Invoice enterprise; **solo cadenas** |

Know-how (para cuando lo pidan, no para el vendedor de kiosco):

- **Pyme gratis:** un URL `claver.com.ar`, un proyecto, `empresaId` en JWT.  
- **Pyme con chiches:** igual, flags SKU.  
- **Estudio:** un login, lista de empresas, impersonación auditada.  
- **Cadena / “serio”:** hostname propio, posiblemente proyecto o DB aparte, backup + SLA. Precio de implementación `[HUM-01]`.

Hasta que no lo pidan: **cero** tiempo de Grok en multi-domain.

---

## 7. Cómo conviven 1.000 partidas en el mismo Vercel

```
Vercel (un deploy)
  ├─ /          landings (CDN, barato)
  ├─ /dashboard/pos     juego (liviano, prioridad)
  ├─ /dashboard/fiado
  ├─ /dashboard/impuestos  item shop / job
  └─ /api/pos/*         rápido
Supabase un Postgres
  └─ todas las empresas, siempre WHERE empresaId
```

| Control | Para qué |
|---------|----------|
| `whereEmpresa` + (después) RLS | Un tenant no lee al otro |
| Reportes async | El contable de A no frena al cajero de B |
| Rate limit reportes / export | Un depto loco no agota Pro |
| Purge 90 d | El servidor no se llena de AFK |
| POS NetworkOnly en SW | No romper oficios/caja con cache (ya pasó) |

Eso es masivo **funcional**: mismo código, N jugadores, tienda al costado.

---

## 8. DoD de este modelo

- [ ] El vendedor ofrece **jugar gratis** (caja+fiado), no un ERP.  
- [ ] El POS se siente premium y **rápido** (shell propio).  
- [ ] Nada pesado se **borra**: está en Reportes / Impuestos / Pendientes.  
- [ ] Item shop: 4–6 chiches, no 40.  
- [ ] Custom domain / enterprise: ficha “si lo pedís”.  
- [ ] Pro+Pro alcanza para **salir a vender** cientos–~mil anclas si el POS es chico.  
- [ ] Datos y hábito de los que no pagan = inventario, no gasto (con purge de AFK).

*Calidad = el cobro. Costo = no calcular el libro IVA en cada Coca. Tienda = para el que quiere power-ups.*

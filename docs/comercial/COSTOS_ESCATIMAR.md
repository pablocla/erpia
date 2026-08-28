# Escatimar costos sin recortar calidad — escala gratis horizontal y vertical

**Fecha:** 2026-08-25  
**Para:** Grok (código) · founder (hosting)  
**Hermanos:** [`COSTOS_VERCEL_SUPABASE_TAKE_RATE.md`](./COSTOS_VERCEL_SUPABASE_TAKE_RATE.md) · [`POS_GRATIS_ESCALA.md`](./POS_GRATIS_ESCALA.md) · [`SERVIDOR_GRATIS_ITEM_SHOP.md`](./SERVIDOR_GRATIS_ITEM_SHOP.md)

Sí se puede bajar **mucho** el USD/caja. Casi nada de eso es “sacar features al kiosquero”. Es **no pagarle a Vercel por bajar el ERP entero cada vez que cobra una Coca**, y **no pagarle a us-east por cada query**.

Calidad del mostrador = ticket rápido, no pierde venta, no se siente lento. Todo lo de abajo **mejora** eso o no lo toca.

---

## 1. Dónde se va la plata (hoy, en este repo)

| Fuga | Por qué duele | ¿Corta calidad sacarla? |
|------|----------------|-------------------------|
| **JS del dashboard en el POS** | `app/dashboard/layout.tsx` carga topbar + sidebar + command palette + 5 polls. El cajero no necesita Cloud ni IoT | No: el POS tiene que ser **más** liviano |
| **Poll cada 60 s** | Topbar: `/api/pos/venta`, alertas, tickets, mis-tareas, analista. 1.000 cajas × 5 req/min = infierno de lambdas | No: caja abierta puede ir en el POST de venta |
| **DB us-east-1** | Cada `authFetch` cruza el Atlántico. Egress + latencia | No: São Paulo es **mejor** UX |
| **4 fuentes Google** | Manrope + Fraunces + Geist + Inter en el layout raíz | Casi no: display/mono ya `preload: false` |
| **CommandPalette + ChatWidget en todas las páginas** | `app/layout.tsx` — también landings y login | No en POS; sí en marketing lazy |
| **Fotos / Image Optimization** | Vercel cobra por transform | Ancla: JPEG chico o nada |
| **AFIP en el request de venta** | Función larga = GB-hora | Calidad **sube** si el ticket no espera SOAP |
| **Tenants muertos** | Filas eternas | No |

Horizontal (más kioscos) y vertical (más tickets/día) se escatiman **distinto**. Abajo, por palanca.

---

## 2. Palancas que bajan costo **y** no tocan calidad

### A. POS como app chica (la palanca #1)

Hoy el mostrador vive adentro del layout del ERP. Eso es un impuesto a cada tecla.

| Hacer | Efecto |
|-------|--------|
| Ruta `/dashboard/pos` **sin** sidebar completo, sin command palette, sin chat, sin 5 SWR | Menos GB Vercel, POS más rápido (calidad ↑) |
| Chunk propio: lucide solo iconos de caja, no 80 iconos | Bundle ↓ |
| PWA cache del **shell** POS (HTML+JS+catálogo) | Offline + 0 transfer en recarga (calidad ↑ vs Maxikiosco) |
| Catálogo de productos en IndexedDB, sync al vender | Menos GET `/api/productos` por tecla |

Esto solo puede cortar **50–80%** del Fast Data Transfer del ancla. Es el “escatimar épico”.

### B. Dejar de preguntarle al server cada minuto

| Hoy | En ancla / POS |
|-----|----------------|
| Topbar 5 fetches, 60–120 s | POS: **cero** poll. Estado de caja en el store al abrir/vender |
| `/api/claver/analista/status` en cada cajero | Solo si el email es analista (casi nunca) |
| Alertas + tickets soporte | Fuera del mostrador; dueño los ve en `/dashboard` |

El cajero no pierde nada: no usa el centro de alertas mientras cobra.

### C. Región (calidad ↑)

| Hoy | Escatimar |
|-----|-----------|
| Postgres `aws-1-us-east-1` | **sa-east-1** (São Paulo) |
| Vercel default IAD | Project region GRU si existe |

Misma calidad de SQL, ticket más corto, menos egress. No es “barato y feo”: es el lugar correcto para AR.

### D. Supabase: pagar compute, no extras de producto

| Prender | No prender (ancla) |
|---------|---------------------|
| Pro + pooler 6543 (ya) | Realtime |
| Backups del plan | Storage de fotos ilimitado |
| Índices `(empresaId, createdAt)` en venta/línea | Point-in-time caro antes de tener pagos |
| pgBouncer / connection limit bajo en lambdas | Read replica hasta 5 k cajas |

Vertical (almacén con 400 tickets/día): **un** compute más grande rinde más que 10 lambdas. Horizontal: **el mismo** compute aguanta miles de anclas chicas si las queries son `where empresaId` + límite de filas.

### E. Vercel: CDN para estáticos, no para el ticket

| Hacer | No hacer |
|-------|----------|
| `Cache-Control` largo en `/_next/static` (ya en middleware para assets) | Cachear `/api/*` |
| Landings ISR / estáticas | Image Optimization en ancla |
| Analytics: uno solo, sample o apagar en POS | Hobby en prod (timeout 10 s mata demos) |
| Cron AFIP **fuera** del POST de venta | `maxDuration` 60 s en cada cobro |

A ~8 mil POS: **API en Node fijo** (Hetzner/Fly São Paulo ~USD 20–80) y Vercel solo marketing. La calidad del cobro **mejora** (sin cold start).

### F. Datos: guardar lo que sirve para cobrar

| Guardar | No guardar en ancla |
|---------|---------------------|
| Ticket, líneas, stock, fiado | Logs de IA, demos prewarm eternas |
| 18 meses de ventas calientes | Cada hover del dashboard |
| Purge 90 d sin 1 movimiento | Soft-delete eterno de empresas fantasma |

Calidad = el dueño ve el mes. No necesita 7 años de `logActividad` gratis.

---

## 3. Horizontal vs vertical (misma calidad, distinto tornillo)

| | Más kioscos (horizontal) | Más tickets/caja (vertical) |
|--|--------------------------|-----------------------------|
| Duele | Transfer JS × N locales | IOPS Postgres + tamaño de `linea_venta` |
| Escatimar | POS chico, purge, 1 región, 0 poll | Índices, partición por mes, no N+1 al listar |
| No recortar | Tiempo de cobro | Integridad del ticket (no perder venta) |
| Techo | 10 k anclas en serverless si A+B+C | Un Large de Supabase aguanta un almacén “grande”; 100 almacenes grandes piden dedicated |

Gratis horizontal = **mucho tenant chico, mismo binario, techo 1 caja**.  
Gratis vertical = **un tenant que vende mucho en 1 caja** sigue $0; el costo extra de IOPS lo pagan **los extras** (WA/AFIP) o ClavPay, no un % al efectivo.

---

## 4. Orden de trabajo (impacto / esfuerzo)

| Orden | Qué | Baja USD/caja | Calidad mostrador |
|-------|-----|----------------|-------------------|
| 1 | POS layout mínimo (sin ERP shell) | Alta | ↑ más rápido |
| 2 | Sacar polls del topbar en POS | Alta | = |
| 3 | DB + Vercel São Paulo | Media | ↑ menos lag |
| 4 | PWA catálogo + cola ventas | Media | ↑ offline |
| 5 | Purge 90 d | Media | = |
| 6 | AFIP async (ya hay cron: forzar default) | Media | ↑ no espera AFIP |
| 7 | Node fijo para `/api/pos/*` cuando el invoice Vercel pique | Alta a escala | ↑ |
| 8 | Partición ventas | Baja hasta 10 k | = |

1–3 se pueden hacer **antes** de 1.000 cajas y dejan el ancla en **USD 0,15–0,40**/mes en vez de 0,70–1,50.

---

## 5. Qué **no** escatimar (ahí sí cortás calidad)

- Integridad del ticket (idempotencia, no duplicar al sync).  
- Backup de tenants **que venden**.  
- HTTPS, JWT, `whereEmpresa`.  
- Timeout de cobro visible (si AFIP falla, el ticket igual).  
- Una impresora que imprima: driver local > ahorrarte el agent.

Escatimar **empleados digitales, IoT, chat IA, 4 fuentes, Cloud en el cajero** no es recortar el producto de calle.

---

## 6. Meta numérica

| Estado | USD / ancla activa / mes |
|--------|---------------------------|
| Hoy (monolito + us-east + polls) | 0,70–1,50 |
| Después de 1–3 | **0,15–0,40** |
| 10 k cajas + Node fijo + SP | **0,10–0,25** |

Con 15% pagando un extra ~USD 10, **un pagador cubre ~25–60 anclas**. El % ClavPay queda para el almacén grande, no para sobrevivir.

---

## 7. Grok (cuando HUM diga sí al POS $0)

1. Shell POS: no montar CommandPalette/Chat/topbar polls.  
2. `useAuthFetch` de analista/tickets/tareas: skip si `modoLite=pos` o ruta POS.  
3. Migración DB `sa-east-1`.  
4. Precache catálogo en SW (ya hay cache POS; no cachear oficios).  
5. Job purge 90 d.

Sin eso, “gratis a escala” sigue siendo un monolito caro. Con eso, escatimás **sin** que el kiosquero sienta un POS peor — al revés.

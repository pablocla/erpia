# Go-Live POS + Fiado — Validación, gaps y plan de venta

> **Fecha:** 2026-07-17  
> **Objetivo:** salir a vender POS + Libreta Fiado (y verticales) con suscripción Mercado Pago.  
> **Regla comercial:** **precio mínimo de cualquier suscripción de pago = $10.000 ARS / mes**.  
> **Excepción:** Libreta Fiado puede seguir como **ancla gratis** ($0) para captación; el primer plan de pago no puede bajar de $10.000.  
> **Código ya aplicado en repo (batch autónomo):**  
> piso $10k · catálogos · bloqueo “Próximamente” · URL unificada · webhook MP ·  
> ancla fiado en demos niche (`vigenciaHasta: null` + oferta) · shell POS · menú fiado con mostrador ·  
> allowlist trial unificada · e2e auth/fiado · `node scripts/go-live-check.mjs` · `GET /api/go-live/status`.

---

## 0. QUÉ TE TOCA A VOS (checklist personal go-live)

Esto es **solo tu parte** (cuentas, plata, dominio, decisiones). El código ya cubre piso de precio y URLs de cobro con fallback.

### Día −1 / hoy (bloqueante — sin esto no cobrás bien)

#### A) Hosting y dominio (30–60 min)

| # | Acción | Dónde | Hecho |
|---|--------|-------|-------|
| A1 | Tener la app deployada en **HTTPS** (Vercel / Railway / similar) | Panel hosting | ☐ |
| A2 | Dominio definitivo (ej. `https://app.claver.com.ar` o el que uses) | DNS + hosting | ☐ |
| A3 | En variables de entorno de **producción** setear: | Hosting env | ☐ |
| | `NEXT_PUBLIC_APP_URL=https://TU_DOMINIO` | | |
| | `NEXT_PUBLIC_BASE_URL=https://TU_DOMINIO` (igual que arriba) | | |
| | `DATABASE_URL` + `DIRECT_URL` (Postgres prod) | | |
| | `JWT_SECRET` (random ≥ 32 chars, **nuevo** si el actual es débil) | | |
| A4 | Correr migraciones Prisma en prod: `npx prisma migrate deploy` | CI o shell prod | ☐ |
| A5 | Abrir en el celular la URL de login y confirmar que carga | Browser | ☐ |

#### B) Mercado Pago — suscripciones SaaS (45–90 min) 🔴 crítico

| # | Acción | Detalle | Hecho |
|---|--------|---------|-------|
| B1 | Entrar a [developers.mercadopago.com.ar](https://www.mercadopago.com.ar/developers) | Con la cuenta que va a recibir la plata | ☐ |
| B2 | Crear/usar aplicación **Producción** (no solo test) | Credenciales `APP_USR-...` | ☐ |
| B3 | Copiar **Access Token** prod → `MP_ACCESS_TOKEN` | Env producción | ☐ |
| B4 | Copiar **Public Key** prod → `MP_PUBLIC_KEY` | Env producción | ☐ |
| B5 | Configurar **Webhook** | URL: `https://TU_DOMINIO/api/webhooks/mercadopago` | ☐ |
| | Eventos: al menos pagos + suscripciones/preapproval | | ☐ |
| B6 | Copiar **secret** del webhook → `MP_WEBHOOK_SECRET` | Env producción | ☐ |
| B7 | Redeploy después de guardar env | Hosting | ☐ |
| B8 | Prueba real: desde la app → Mi plan / Suscribir plan **≥ $10.000** | Debe abrir checkout MP | ☐ |
| B9 | Completar pago de prueba (tarjeta real o de prueba prod según MP) | | ☐ |
| B10 | Verificar en DB/panel: `mpSubscriptionStatus = authorized` y módulos activos | Claver Cloud o SQL | ☐ |
| B11 | Si falla: en panel MP mirar logs del webhook (401 = secret mal; 404 = URL mal) | | ☐ |

**Importante:** si `MP_ACCESS_TOKEN` está vacío o empieza con `TEST-mock`, el sistema entra en **modo mock** y no cobra de verdad.

#### C) Email (Resend) — 20 min (para fiado y avisos)

| # | Acción | Hecho |
|---|--------|-------|
| C1 | Cuenta en [resend.com](https://resend.com) | ☐ |
| C2 | Verificar dominio (o usar dominio de prueba solo en dev) | ☐ |
| C3 | API key → `RESEND_API_KEY` | ☐ |
| C4 | `RESEND_FROM_EMAIL=noreply@tudominio.com` | ☐ |
| C5 | Anotar un fiado y confirmar que llega mail (o log de error claro) | ☐ |

Sin Resend: la libreta **funciona**, pero no manda mails al deudor/dueño.

#### D) WhatsApp (solo si vendés Cobrá / recordatorios) — 1–2 h

| # | Acción | Hecho |
|---|--------|-------|
| D1 | Cuenta Twilio + WhatsApp sandbox o Business aprobado | ☐ |
| D2 | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | ☐ |
| D3 | Probar un recordatorio a tu celular | ☐ |
| D4 | **Si no lo tenés listo:** no prometas “WhatsApp automático” en la venta de mañana | ☐ |

#### E) AFIP (solo si prometés factura real) — puede ser +1 día

| # | Acción | Hecho |
|---|--------|-------|
| E1 | Certificado digital prod AFIP del emisor | ☐ |
| E2 | `AFIP_ENTORNO=produccion` | ☐ |
| E3 | `AFIP_CERT_PROD` + `AFIP_KEY_PROD` (base64) | ☐ |
| E4 | `AFIP_CUIT` / punto de venta homologado | ☐ |
| E5 | Emitir 1 factura A/B de prueba y ver CAE | ☐ |

**Recomendación go-live mañana:** vender POS + fiado con **ticket no fiscal o homologación**, y AFIP prod como onboarding del cliente (no promesa del demo).

#### F) Datos y demo para vender en la calle (30 min)

| # | Acción | Hecho |
|---|--------|-------|
| F1 | Usuario demo estable (email/clave que no se rompa) | ☐ |
| F2 | Seed o carga: 10 productos + 5 clientes con fiado | ☐ |
| F3 | Caja abierta en la cuenta demo | ☐ |
| F4 | Probar en tablet/celular el POS y la libreta | ☐ |
| F5 | WhatsApp comercial en landing: `NEXT_PUBLIC_CLAVER_WHATSAPP=549...` | ☐ |
| F6 | Ensayar el pitch de 5 min (sección 9) en voz alta | ☐ |

#### G) Decisiones de negocio (15 min — escribirlas)

| # | Decisión | Tu respuesta |
|---|----------|--------------|
| G1 | ¿Fiado sigue **gratis forever**? | Sí / No → ___ |
| G2 | Primer plan de pago (nombre + precio ≥ 10k) | ___ |
| G3 | ¿Vendés Cobrá mañana? (requiere Twilio) | Sí / No |
| G4 | ¿Vendés AFIP prod mañana? | Sí / No |
| G5 | Soporte: WhatsApp / mail / horarios | ___ |
| G6 | Medio de cobro del SaaS | Mercado Pago suscripción |
| G7 | Qué **no** vendés aún (IoT, backup, MFA, etc.) | Lista mental / anotar |

#### H) Legal / confianza mínima

| # | Acción | Hecho |
|---|--------|-------|
| H1 | Página de términos / privacidad accesible | ☐ |
| H2 | Datos de contacto reales (no fake) | ☐ |
| H3 | Factura/recibo que **vos** das al cliente SaaS (monotributo/RI) | ☐ |

---

### Orden sugerido (si tenés 3 horas)

```
1. Deploy + dominio + env APP_URL/BASE_URL/DB/JWT     (45 min)
2. MP token + webhook + secret + redeploy               (45 min)
3. Pago de prueba $10.000                               (20 min)
4. Resend (opcional pero recomendado)                   (20 min)
5. Demo seed + ensayo pitch                             (30 min)
6. Checklist UAT 1–12 del §7.5                          (30 min)
```

### Qué NO tenés que hacer vos (ya en código o no bloquea)

| Tema | Estado |
|------|--------|
| Piso $10.000 en cobro de suscripción | ✅ aplicado en billing + `resolvePrecioSku` |
| Fallback si falta `NEXT_PUBLIC_BASE_URL` | ✅ usa `NEXT_PUBLIC_APP_URL` |
| Webhook MP no depende de `WEBHOOK_SECRET` genérico | ✅ usa `MP_WEBHOOK_SECRET` |
| Tests del piso | ✅ `__tests__/comercial/precio-minimo.test.ts` |
| Offline total / impresora fiscal Epson | No bloquea demo con `window.print` / ticket digital |
| Todas las verticales perfectas | Demo con POS+fiado+agenda alcanza el día 1 |

### Señales de que estás listo (GO)

- [ ] URL prod abre login por HTTPS  
- [ ] Un extraño puede registrarse o entrar a demo  
- [ ] Suscripción MP ≥ $10.000 genera `init_point` real (`mock: false`)  
- [ ] Webhook no devuelve 401 con secret correcto  
- [ ] Demo: anotar fiado + venta POS + cierre caja en &lt; 5 min  
- [ ] Sabés decir qué NO incluís en el plan  

### Señales de NO-GO (no salgas a vender cobrando aún)

- App solo en localhost  
- `MP_ACCESS_TOKEN` mock o vacío en prod  
- Webhook 401/404 en panel MP  
- No podés mostrar “quién me debe” con datos  
- Prometés AFIP/WA y no tenés keys  

---

## 1. Resumen ejecutivo (¿se puede vender mañana?)

| Producto | ¿Vendible mañana? | Condición |
|----------|-------------------|-----------|
| **Libreta Fiado** (`pos.fiado_barrio`) | ✅ Sí (ancla) | Flujo anotar/cobrar/deudores existe; sin WA/email reales si faltan keys |
| **POS Mostrador** (`/dashboard/pos`) | ✅ Sí (MVP) | Caja + venta + stock + fiado CC + split payment |
| **POS Kiosko / Mesa** | 🟡 Parcial | Modos en UI; mesa depende de hospitalidad; kiosko usable |
| **Cobrá WA** (`intang.cobranzas_wa`) | 🟡 Parcial | Motor + panel; necesita Twilio + cron + MP link |
| **Suscripción SaaS vía Mercado Pago** | 🟡 Código listo / config incompleta | Falta `MP_WEBHOOK_SECRET` y alinear `NEXT_PUBLIC_BASE_URL` |
| **AFIP producción** | 🔴 No sin certs | Solo homologación si no hay `AFIP_CERT_PROD` / key |
| **SKUs “catálogo” / “próximamente”** | 🔴 No vender | Backup, MFA, NPS, Legal Shield, etc. (solo marketing) |
| **Verticales (vet / pelu / ferretería / turnos)** | 🟡 Demo + MVP | Núcleo POS/agenda sí; flujos “wow” incompletos |

**Recomendación de go-live comercial:**

1. Vender **pack mínimo $10.000/mes** (no micro-SKUs sueltos bajo ese piso).  
2. Ofrecer **Fiado gratis** como ancla + upsell a pack POS/Cobrá/Core ≥ $10.000.  
3. No prometer AFIP real, WhatsApp masivo ni offline total hasta keys + UAT.  
4. No listar en marketplace SKUs con tier `catalogo` / `parcial` como “listo para usar”.

---

## 2. Política de precios (piso $10.000/mes)

### 2.1 Reglas

| Regla | Valor |
|-------|--------|
| Piso suscripción de pago | **$10.000 ARS / mes** |
| Ancla captación (única excepción $0) | `pos.fiado_barrio` — Libreta Fiado |
| Trial | 14 días sobre módulos monetizados |
| Moneda | ARS |
| Cobro | Mercado Pago Preapproval (suscripción recurrente) |
| Sin permanencia | Mensual cancelable |

### 2.2 Planes recomendados para salir a vender (ajustados al piso)

| Plan | Precio/mes | Incluye | SKUs principales | Ideal para |
|------|------------|---------|------------------|------------|
| **Ancla Fiado** | **$0** | Solo libreta: deudores, anotar, cobrar manual, listado | `pos.fiado_barrio` | Almacén que solo quiere dejar el cuaderno |
| **Starter Calle** | **$10.000** | Fiado + POS básico + caja + productos/stock simple | `pos.fiado_barrio` + `core.claver` (lite) o pack calle | Kiosco / almacén chico |
| **Cobrá + Fiado** | **$20.000** | Starter + recordatorios WA + link de pago | + `intang.cobranzas_wa` + `fiscal.clavpay_link` | Quien tiene mucha cuenta corriente |
| **POS Pro** | **$25.000** | POS full + caja + stock + facturación | `pos.caja` / sub-SaaS POS | Mostrador serio |
| **Pack Almacén** | **$34.900** | Retail barrio (envases, vales, promos, etc.) | `pool-almacen-rosario` | Almacén Rosario style |
| **Claver Core** | **$39.900** | ERP completo (ventas, compras, stock, caja, CC) | `core.claver` | PyME multi-módulo |
| **Pro ERP** | **$49.900** | Core + e-commerce + KPIs + onboarding IA | plan Pro | Crecimiento |
| **Enterprise** | **$89.900** | Pro + multi-sucursal / agro / industria | plan Enterprise | Mayor operación |

> **Nota:** Precios de catálogo viejos por debajo de $10.000 (ej. $1.990, $2.490, $3.990, $4.990, $6.000, $6.900, $7.000, $8.900, $9.900) **no se venden sueltos**. Se empaquetan hasta alcanzar el piso o se suben a **$10.000** como mínimo por SKU de pago.

### 2.3 Micro-módulos: reempaquetado obligatorio

Hoy el código tiene muchos SKUs a $1.490–$9.900. **Para venta:**

| Situación en código | Acción comercial go-live |
|---------------------|--------------------------|
| Precio &lt; $10.000 y es de pago | Subir a **$10.000** o incluir en pack ≥ $10.000 |
| Precio $0 ancla | Mantener solo Fiado |
| Pack ya ≥ $10.000 | OK (POS 25k, Cobrá 20k, Core 39.9k, etc.) |
| Tier `catalogo` | “Próximamente” — no cobrar |

**Ejemplos de empaquetado:**

| Pack comercial | Precio | Antes (sumatoria catálogo) | Incluye |
|----------------|--------|----------------------------|---------|
| Pack Kiosco Express | $10.000 | varios SKUs &lt; 10k | POS + stock + fiado lite |
| Pack Ferretería | $15.000 | — | POS + stock + listas + CC |
| Pack Turnos (pelu / consultorio) | $15.000 | niches ~4–7k | Agenda + clientes + cobro |
| Pack Veterinaria | $20.000 | — | Agenda + HC mascotas + POS |
| Pack Cobranza | $20.000 | Cobrá 20k | WA + CxC + link MP |
| Pack Almacén Rosario | $34.900 | ya ok | 18 módulos retail |

### 2.4 Precios actuales en código vs piso (referencia)

| Fuente | SKU / producto | Precio en código | Ajuste go-live |
|--------|----------------|------------------|----------------|
| Oferta fiado-ancla | Pack monetizado Core | $12.900 | ✅ OK (≥ 10k) |
| Sub-SaaS | Claver POS | $25.000 | ✅ OK |
| Sub-SaaS | Claver Cobrá | $20.000 | ✅ OK |
| Enganche | Fiado | $0 (ancla) | ✅ OK |
| Enganche | ClavPay Link | $6.000 | ⬆️ pack o **$10.000** |
| Enganche | WhatsApp ON | $15.000 | ✅ OK |
| Enganche | Backup / MFA / varios | $3k–$20k | muchos solo catálogo |
| Niche apps | club, feria, plancha… | $3.990–$8.900 | ⬆️ **mín. $10.000** o pack |
| Almacén Rosario SKUs sueltos | $1.490–$5.990 | Solo dentro de pack $34.900 |
| channel.mercadopago | $9.900 | ⬆️ **$10.000** |
| sheets.lite | $6.900 | ⬆️ **$10.000** o pack |

### 2.5 Mensaje comercial corto

```
Libreta Fiado: gratis para siempre.
Todo lo demás (POS, cobranzas, agenda, verticales): desde $10.000/mes.
Trial 14 días. Cobro con Mercado Pago. Sin permanencia.
```

---

## 3. Qué SÍ está implementado (base vendible)

### 3.1 Libreta Fiado

| Capacidad | Ruta / código | Estado |
|-----------|---------------|--------|
| Listado deudores + resumen | `/dashboard/fiado`, `/api/fiado/deudores`, `/api/fiado/resumen` | ✅ |
| Alta rápida cliente fiado | `/api/fiado/clientes-rapido` | ✅ |
| Anotar deuda (sin POS) | `/api/fiado/anotar` → `anotarFiadoLibreta` | ✅ |
| Cobrar (recibo + FIFO CC) | `/api/fiado/cobrar` → `cobrarFiadoLibreta` | ✅ |
| Validar límite en POS | `validarFiadoPos` + medio `cuenta_corriente` | ✅ |
| Config email dueño / límite | `/api/fiado/config` | ✅ |
| Notificación email/WA + link MP | `fiado-service` + `fiado-pago-link` + `fiado-whatsapp` | 🟡 (depende keys) |
| Baja deuda al pagar link MP | `aplicar-pago-deudor.ts` + webhook | 🟡 (webhook + BASE_URL) |
| Entitlement SKU | `canUseSku(..., "pos.fiado_barrio")` | ✅ |
| Ancla gratis + trial no bloquea todo | `ofertas-comerciales` + trial guard | ✅ (revisar mensajes UI) |

### 3.2 POS

| Capacidad | Estado |
|-----------|--------|
| Modos mostrador / mesa / kiosko | ✅ UI |
| Búsqueda productos, carrito, descuentos | ✅ |
| Split payment (varios medios) | ✅ |
| Medio cuenta corriente (fiado) con cliente | ✅ |
| Impacto stock + caja en venta | ✅ |
| Emisión fiscal / ticket (según AFIP config) | 🟡 homologación / prod |
| Suspender venta, PLU, envases, balanza numpad | 🟡 parcial (componentes existen) |
| Cierre / arqueo (módulo caja) | ✅ base |
| Offline robusto | 🔴 no confiable para venta |
| Impresora fiscal Epson/Hasar real | 🔴 pendiente / experimental |

### 3.3 Billing Mercado Pago (suscripción SaaS)

| Pieza | Archivo | Estado |
|-------|---------|--------|
| Crear preapproval | `lib/billing/mercadopago-subscription.ts` | ✅ |
| Mock si no hay token real | `MP_MOCK` | ✅ (dev) |
| Subscribe por SKU | `POST /api/billing/subscribe` | ✅ |
| Create subscription (plan genérico) | `POST /api/billing/create-subscription` | ✅ |
| Sync estado | `POST /api/billing/sync-subscription` | ✅ |
| Webhook preapproval | `app/api/webhooks/mercadopago` | 🟡 falta secret en env |
| Activar `suscripcionModulo` al authorized | `activarSuscripcionPagada` | ✅ |
| Checkout Pro cobro deudores | `lib/mercadopago/mercadopago-service.ts` | 🟡 usa `NEXT_PUBLIC_BASE_URL` (falta en env) |
| QR POS | `mp-pos-qr.ts` | 🟡 parcial |

### 3.4 Verticales con pantalla

| Vertical | Rutas | Qué funciona hoy | Qué falta |
|----------|-------|------------------|-----------|
| Kiosco / Almacén | POS, fiado, caja, productos | Venta + fiado | Offline, fiscal hardware, WA |
| Ferretería | POS + stock + listas | Mostrador | Listas distribuidora UX completa, series/lotes si aplica |
| Veterinaria | `/dashboard/veterinaria`, agenda, POS | Mascotas + consultas | Factura al cerrar consulta, plan sanitario, receta → stock |
| Peluquería | `/dashboard/peluqueria`, agenda | Turnos del día mobile-ish | Cobro al completar turno, seña, servicios en POS |
| Turnos genéricos | `/dashboard/agenda`, `/agenda-online/[empresaId]` | Alta turnos + link público | Recordatorios WA 24h, no-show, cobro automático |
| Gastronomía | hospitalidad + POS mesa + KDS | Comandas base | Delivery apps, split cuenta fina |
| Membresías / gym | `/dashboard/membresias` | CRUD parcial | Cobro recurrente cerrado + access control |

---

## 4. Qué FALTA implementar (priorizado para venta)

### 4.1 Bloqueantes comerciales (P0) — antes de cobrar en serio

1. **Config env producción**  
   - `MP_WEBHOOK_SECRET`  
   - `NEXT_PUBLIC_BASE_URL` (= URL pública, misma que `NEXT_PUBLIC_APP_URL` si es monodominio)  
   - `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (emails fiado / trial)  
   - `TWILIO_*` si vendés Cobrá / notificaciones WA  
   - `AFIP_CERT_PROD` + `AFIP_KEY_PROD` solo si prometés factura real  

2. **Webhook MP end-to-end en producción**  
   - Suscripción SaaS: `subscription_preapproval` → `authorized` → activa SKUs  
   - Pago deudor fiado: payment approved → recibo + baja deuda (ya hay código; falta URL pública + secret)

3. **Piso de precio $10.000 en catálogo**  
   - Alinear `enganche-catalog`, `sub-saas-catalog`, niche apps y landings  
   - Evitar vender SKU suelto a $1.990–$9.900  

4. **No vender SKUs no implementados**  
   - Marcar “Próximamente”: `sec.backup`, `sec.mfa`, `data.nps`, `intang.legal_shield`, `intang.reactivador_clientes` (si tier catalogo), etc.  

5. **Demo por rubro limpia**  
   - Sidebar solo módulos del rubro (hoy sobra ruido: IoT, cannabis, etc. en demos calle)

6. **Mensajes trial / ancla**  
   - UI coherente: “Fiado sigue gratis; POS/Core se pagan desde $10.000”

### 4.2 Alto impacto producto (P1) — primera semana post-venta

| # | Gap | Impacto |
|---|-----|---------|
| 1 | WhatsApp real (Twilio) + plantillas aprobadas | Cobrá y recordatorios son promesa fuerte |
| 2 | Impresión ticket 80mm usable en caja | Expectativa POS |
| 3 | Escáner pistola USB + búsqueda por `codigoBarras` confiable | Kiosco/ferretería |
| 4 | Double-book libreta vs CC en edge cases | Confianza contable |
| 5 | Facturación recurrente → siempre genera CxC cobrable | Membresías / cuotas |
| 6 | Cron multi-tenant cobranzas / facturas recurrentes | “Automático” de verdad |
| 7 | Veterinaria: cerrar consulta → factura/POS | Vertical vendible |
| 8 | Peluquería/turnos: completar turno → cobro | Vertical vendible |
| 9 | Offline queue de ventas | Corte de internet en barrio |
| 10 | `Producto.precioVenta` Float → Decimal | Redondeos IVA |

### 4.3 Medio (P2)

- MFA, backup real, NPS, pixel ads (hoy catálogo)  
- Impresora fiscal Argentina nativa  
- Conciliador liquidación MP (tier parcial)  
- Portal B2B hardening + rate limit  
- Paginación obligatoria en listados  
- Observabilidad tenant (churn, health)

### 4.4 Lo que NO debés vender mañana

- “ERP agro IoT real” (mucho stub)  
- “Backup cloud / MFA” como servicio activo  
- “Offline total como Tango”  
- “Factura AFIP producción” sin certificado del cliente  
- Micro-módulos sueltos a menos de $10.000  

---

## 5. Checklist de tu parte (API keys y config)

### 5.1 Estado detectado en el entorno local (snapshot)

| Variable | Estado típico | Para go-live |
|----------|---------------|--------------|
| `DATABASE_URL` / `DIRECT_URL` | SET | ✅ |
| `JWT_SECRET` | SET | ✅ |
| `NEXT_PUBLIC_APP_URL` | SET | ✅ |
| `NEXT_PUBLIC_BASE_URL` | **MISSING** | 🔴 poner igual a URL pública |
| `MP_ACCESS_TOKEN` | SET | ✅ (verificar producción APP_USR) |
| `MP_PUBLIC_KEY` | SET | ✅ |
| `MP_WEBHOOK_SECRET` | **MISSING** | 🔴 |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | **MISSING** | 🔴 emails |
| `TWILIO_ACCOUNT_SID` / `AUTH_TOKEN` / `WHATSAPP_FROM` | **MISSING** | 🔴 Cobrá WA |
| `AFIP_CUIT` | SET | 🟡 |
| `AFIP_CUIT_EMPRESA` | MISSING (alias) | alinear |
| `AFIP_ENTORNO` | SET (homologación) | prod solo con cert |
| `AFIP_CERT_PROD` / `AFIP_KEY_PROD` | MISSING | solo si AFIP real |
| `GOOGLE_GENERATIVE_AI_API_KEY` | SET | opcional IA |
| `NEXTAUTH_SECRET` | MISSING | si usás NextAuth |
| `INTEGRATION_ENCRYPTION_KEY` | MISSING | OAuth integraciones |

### 5.2 Checklist operativo (hacer hoy)

- [ ] Dominio HTTPS en producción (Vercel/Railway) con `NEXT_PUBLIC_APP_URL` y `NEXT_PUBLIC_BASE_URL`  
- [ ] App Mercado Pago **producción**  
  - Access Token + Public Key  
  - Webhook URL: `https://TU_DOMINIO/api/webhooks/mercadopago` (y/o `/api/mercadopago/webhook`)  
  - Copiar secret → `MP_WEBHOOK_SECRET`  
  - Probar preapproval de un plan **$10.000**  
- [ ] Cuenta Resend + dominio verificado → emails de fiado / recibos  
- [ ] Twilio WhatsApp (sandbox o Business) → Cobrá  
- [ ] Usuario demo por rubro (seed) + credenciales para demo en calle  
- [ ] Decidir: ¿Fiado $0 forever + pack desde $10.000? (recomendado)  
- [ ] Actualizar landings y App Store: **“desde $10.000/mes”**  
- [ ] Lista blanca de productos vendibles vs “próximamente”  
- [ ] Probar un cobro real MP de $10.000 y un link de pago fiado de prueba  
- [ ] Términos / legales / soporte WhatsApp comercial (`NEXT_PUBLIC_CLAVER_WHATSAPP`)

### 5.3 URLs que debe tener Mercado Pago

| Uso | Endpoint |
|-----|----------|
| Webhook suscripciones + pagos | `/api/webhooks/mercadopago` |
| Webhook cobros tenant (config por empresa) | `/api/mercadopago/webhook` |
| Return suscripción | `/dashboard/apps?subscription=ok` |
| Mock local | `/dashboard/apps?mp_mock=1` |

---

## 6. Procesos backoffice a validar (mapa funcional)

Usar como guión de UAT (y como base del prompt Gemini).

### 6.1 Maestros

1. Empresa / configuración / puntos de venta  
2. Usuarios y roles  
3. Clientes (con `fiadoHabilitado`, límite crédito)  
4. Proveedores  
5. Productos (código, barras, precio, stock, IVA)  
6. Listas de precio  
7. Formas de pago / medios  

### 6.2 Ventas y POS

1. Apertura de caja  
2. Venta contado efectivo / tarjeta / MP  
3. Split payment  
4. Venta a fiado (CC) con cliente  
5. Rechazo por límite de crédito  
6. Ticket / factura A-B-C (según condición IVA)  
7. Nota de crédito  
8. Cierre de caja / arqueo  
9. Devolución / anulación controlada  

### 6.3 Fiado y cobranzas

1. Anotar fiado en libreta  
2. Ver deudores y semáforo  
3. Cobrar parcial / total  
4. Recibo generado  
5. Link MP al deudor (si ClavPay/MP config)  
6. Webhook baja deuda  
7. Recordatorio WA (si Cobrá activo)  
8. CxC aging  

### 6.4 Compras y stock

1. Alta producto  
2. Compra / ingreso stock  
3. Ajuste inventario  
4. Transferencia depósitos (si aplica)  
5. Stock bajo / stock cero  

### 6.5 Tesorería

1. Movimientos de caja  
2. Cuentas a pagar  
3. Cheques (si se usa)  
4. Banco / conciliación básica  

### 6.6 Fiscal

1. Homologación AFIP  
2. Emisión CAE  
3. Reintento pendiente CAE  
4. Libro / reportes IVA (si se promete)  

### 6.7 Comercial SaaS

1. Register con `?activar=fiado` / `pos`  
2. Trial 14 días  
3. Banner trial  
4. Subscribe SKU ≥ $10.000 vía MP  
5. Webhook authorized → módulo activo  
6. Cancelación / trial vencido con ancla fiado intacta  

### 6.8 Por vertical (smoke)

| Rubro | Golden path | Checks mínimos |
|-------|-------------|----------------|
| Kiosco | POS + fiado | Venta &lt; 30s, fiado, cierre caja |
| Almacén | Fiado + POS | Anotar, cobrar, stock |
| Ferretería | POS stock | Código barras, ticket, CC |
| Veterinaria | Mascota → consulta → cobro | Alta paciente, consulta, venta producto |
| Peluquería | Turno → cobro | Agenda, completar, cobro |
| Consultorio | Agenda pública | Link público, confirmar, no-show |
| Bar/Restó | Mesa + KDS + POS | Comanda, cobrar mesa |
| Gym/membresía | Plan + cobro | Alta socio, cuota (manual OK v1) |

---

## 7. Tests (automatizados + manuales + Gemini)

> **Sí: el documento incluye plan de pruebas.** Hay tres capas:  
> 1) **Automatizados** del repo (Vitest + Playwright)  
> 2) **UAT manual** (sección 6 + checklist abajo)  
> 3) **Prompt Gemini** (sección 8) para auditoría funcional completa

### 7.1 Comandos para correr tests

```bash
# Unit / service (Vitest)
npm test
# o subset críticos go-live:
npx vitest run __tests__/fiado __tests__/pos __tests__/cobros __tests__/billing __tests__/mercadopago __tests__/comercial __tests__/caja

# E2E Playwright (app debe estar up o usar webServer del config)
npx playwright test e2e/pos.spec.ts e2e/login.spec.ts
npx playwright test
```

### 7.2 Tests automatizados existentes (mapa go-live)

#### Fiado

| Archivo | Qué cubre | Prioridad |
|---------|-----------|-----------|
| `__tests__/fiado/fiado-service.test.ts` | Validación límite, deuda, helpers | P0 |
| `__tests__/fiado/fiado-libreta-ops.test.ts` | Anotar / cobrar libreta | P0 |
| `__tests__/fiado/cobro-unificado.test.ts` | Unificación cobro libreta/CC | P0 |
| `__tests__/fiado/fiado-pago-link.test.ts` | Link Mercado Pago deudor | P1 |
| `__tests__/fiado/fiado-whatsapp.test.ts` | Encolado WA fiado | P1 |
| `__tests__/mercadopago/deudor-pago.test.ts` | Ref + aplicar pago deudor MP | P0 |
| `__tests__/comercial/p0-fiado-cobra-recurrente.test.ts` | Cadena comercial P0 | P0 |

#### POS / caja / ventas

| Archivo | Qué cubre | Prioridad |
|---------|-----------|-----------|
| `__tests__/api/pos-venta-route.test.ts` | Cálculo línea / tipo Cbte | P0 |
| `__tests__/pos/pos-anular.test.ts` | Anulación | P1 |
| `__tests__/pos/devolucion-venta-pos.test.ts` | Devolución | P1 |
| `__tests__/pos/pos-tipo-factura.test.ts` | A/B/C sugerido | P1 |
| `__tests__/pos/pos-ux-checklist.test.ts` | Checklist UX POS | P2 |
| `__tests__/pos/producto-cantidad-variable.test.ts` | Peso / cantidad variable | P2 |
| `__tests__/caja/arqueo-service.test.ts` | Arqueo cierre | P0 |
| `__tests__/ventas/crear-venta-stock.test.ts` | Stock al vender | P0 |
| `__tests__/cobros/cobros-service.test.ts` | Recibos / cobros | P0 |
| `e2e/pos.spec.ts` | Smoke UI POS (caja abierta, TOTAL) | P0 |
| `e2e/login.spec.ts` | Login demo | P0 |
| `e2e/pedidos.spec.ts` | Pedidos | P2 |

#### Billing / comercial / trial

| Archivo | Qué cubre | Prioridad |
|---------|-----------|-----------|
| `__tests__/billing/marketplace-checkout-policy.test.ts` | Mock vs prod checkout MP | P0 |
| `__tests__/comercial/ofertas-comerciales.test.ts` | Ancla fiado + precios pack | P0 |
| `__tests__/comercial/trial-guard.test.ts` | Trial no bloquea ancla | P0 |
| `__tests__/comercial/trial-service.test.ts` | Trial countdown | P1 |
| `__tests__/comercial/comercial-access-service.test.ts` | Acceso monetizado | P0 |
| `__tests__/comercial/sub-saas-catalog.test.ts` | Catálogo sub-SaaS precios | P0 |
| `__tests__/comercial/catalog-coherence.test.ts` | Coherencia catálogo | P1 |
| `__tests__/comercial/activar-producto-service.test.ts` | `?activar=` | P1 |
| `__tests__/comercial/industry-templates.test.ts` | Rubros demo | P1 |

#### Verticales / nicho / almacén

| Archivo | Qué cubre | Prioridad |
|---------|-----------|-----------|
| `__tests__/niche/niche-apps.test.ts` | Catálogo apps nicho | P2 |
| `__tests__/niche/niche-provision.test.ts` | Provision niche | P2 |
| `__tests__/api/niche-routes.test.ts` | APIs nicho | P2 |
| `__tests__/almacen-rosario/*.test.ts` | Pack retail barrio | P1 |

### 7.3 Gaps de tests automatizados (falta cubrir)

| Área | Gap | Riesgo |
|------|-----|--------|
| E2E fiado UI | No hay `e2e/fiado.spec.ts` (anotar/cobrar en browser) | Demo rota sin enterarse |
| E2E billing MP | No hay flujo real preapproval (solo mock/policy) | No se cobra suscripción |
| E2E verticales | Sin specs vet / pelu / agenda-online | Venta por rubro sin red de seguridad |
| Webhook MP deudor | Unit parcial; falta integración con HTTP webhook | Deuda no baja al pagar |
| Precio mínimo $10.000 | **No hay test** que falle si un SKU de pago &lt; 10000 | Regresión comercial |
| AFIP prod | Solo homologación en muchos paths | Factura real sin red |

### 7.4 Test a agregar YA (recomendado — precio piso)

```ts
// Idea: __tests__/comercial/precio-minimo-suscripcion.test.ts
// Regla: todo precio de pago en catálogos >= 10000, excepto anclas $0 (pos.fiado_barrio)

const PISO_ARS = 10_000
const ANCLAS_GRATIS = new Set(["pos.fiado_barrio"])

// Para cada enganche / sub-saas / niche:
// if (!ANCLAS_GRATIS.has(sku) && precioArs > 0) expect(precioArs).toBeGreaterThanOrEqual(PISO_ARS)
```

### 7.5 Checklist UAT manual (rellenar PASS / FAIL)

| # | Caso | Resultado | Notas |
|---|------|-----------|-------|
| 1 | Login demo | ☐ | |
| 2 | Alta cliente fiado + límite | ☐ | |
| 3 | Anotar fiado libreta | ☐ | |
| 4 | Cobrar fiado parcial | ☐ | |
| 5 | POS venta efectivo | ☐ | |
| 6 | POS venta fiado (CC) | ☐ | |
| 7 | POS bloquea si supera límite | ☐ | |
| 8 | Split payment | ☐ | |
| 9 | Stock baja tras venta | ☐ | |
| 10 | Cierre / arqueo caja | ☐ | |
| 11 | Subscribe plan ≥ $10.000 MP | ☐ | |
| 12 | Webhook activa módulo | ☐ | |
| 13 | Link pago deudor MP | ☐ | |
| 14 | Pago MP baja deuda + recibo | ☐ | |
| 15 | Trial vencido: fiado ancla sigue | ☐ | |
| 16 | UI no muestra plan pago &lt; $10.000 | ☐ | |
| 17 | Smoke kiosco | ☐ | |
| 18 | Smoke ferretería | ☐ | |
| 19 | Smoke veterinaria | ☐ | |
| 20 | Smoke peluquería / turnos | ☐ | |
| 21 | Multi-tenant: no cruza empresas | ☐ | |
| 22 | Sin token → 401 en APIs | ☐ | |

**Criterio go-live:** todos los P0 de la sección 7.2 en verde + checklist 1–12 PASS (13–14 si se vende ClavPay/Cobrá).

### 7.6 Criterios de aceptación go-live (Definition of Done)

- [ ] `npx vitest run __tests__/fiado __tests__/pos __tests__/cobros __tests__/billing __tests__/mercadopago __tests__/comercial` → **0 fail**
- [ ] `npx playwright test e2e/pos.spec.ts e2e/login.spec.ts` → **PASS**
- [ ] Checklist UAT 1–12 PASS en ambiente de staging con keys reales o mock documentado
- [ ] Ningún plan de pago visible &lt; **$10.000**
- [ ] Un cobro de prueba MP de suscripción registrado (o mock explícito solo en dev)

---

## 8. Prompt listo para Gemini (test funcional completo)

Copiá y pegá en Gemini (idealmente con acceso al repo o a la app demo):

```markdown
# Rol
Sos QA Lead funcional + Product Owner de un ERP/POS argentino multi-tenant (Next.js + Prisma + PostgreSQL + AFIP + Mercado Pago).

# Contexto del producto
- App: Claver / ClavERP (pos-system-argentina)
- Locale: es-AR, moneda ARS
- Multi-tenant por empresaId (JWT)
- Productos a certificar para go-live de venta:
  1) POS (mostrador, kiosko, mesa)
  2) Libreta Fiado (ancla gratis posible)
  3) Cobranzas WA + links Mercado Pago
  4) Backoffice: clientes, productos, stock, caja, CxC, compras, usuarios, config
  5) Verticales: kiosco, almacén, ferretería, veterinaria, peluquería/barbería, turnos/agenda, bar-restó, membresías
  6) Billing SaaS: suscripción recurrente Mercado Pago Preapproval

# Política comercial (OBLIGATORIA en el informe)
- Precio mínimo de cualquier suscripción de PAGO: $10.000 ARS/mes.
- Fiado puede ser $0 como ancla de captación.
- Si encontrás SKUs o landings con precio de pago < $10.000, marcalos como DEFECTO COMERCIAL (P0).
- No apruebes vender módulos tier "catalogo" o stub.

# Objetivo
Ejecutá (o diseñá si no tenés UI) un **plan de pruebas funcionales end-to-end** y devolvé un informe ejecutable para salir a vender MAÑANA.

# Formato de salida (obligatorio)
## A. Matriz de cobertura
Tabla: Proceso | Ruta UI | API | Resultado (PASS/FAIL/BLOQUEADO) | Evidencia | Severidad | ¿Bloquea venta?

## B. Flujos críticos (paso a paso)
Para cada flujo, listá pasos, datos de prueba, resultado esperado y fallos.

Flujos obligatorios:
### Backoffice
1. Login / register / logout / refresh token
2. Onboarding o demo por rubro (kiosco, ferretería, veterinaria, peluquería)
3. Alta cliente con fiado habilitado + límite
4. Alta producto con precio, IVA, stock, código de barras
5. Apertura de caja
6. Config empresa + punto de venta
7. Usuarios y permisos (al menos admin vs cajero)

### POS
8. Venta contado efectivo
9. Venta tarjeta / mixto (split payment)
10. Venta a cuenta corriente (fiado) con cliente
11. Bloqueo si supera límite de crédito
12. Venta sin caja abierta (debe bloquear o guiar)
13. Descuento y anulación controlada
14. Modo kiosko (usabilidad touch)
15. Modo mesa (cargar comanda si hospitalidad activa)
16. Cierre de caja / arqueo por medio de pago
17. Stock descontado tras venta
18. Ticket/factura (A/B/C/ticket) según condición IVA

### Fiado
19. Anotar fiado desde libreta (sin POS)
20. Listar deudores + totales
21. Cobrar parcial y total
22. Verificar recibo + saldo cliente + CuentaCobrar
23. Generar link Mercado Pago (si config)
24. Simular/documentar webhook de pago aprobado → baja deuda
25. Notificación email/WhatsApp (si keys presentes; si no, marcarlo BLOQUEADO por config)

### Cobranzas / CxC
26. Ver cuentas por cobrar vencidas
27. Registrar cobro formal
28. Activar SKU cobranzas WA y verificar panel
29. Idempotencia: no duplicar recibo al reintentar

### Billing SaaS Mercado Pago
30. Suscribir plan de $10.000 (o superior)
31. Verificar init_point / mock
32. Webhook authorized → suscripcionModulo activo
33. Cancelar/pausar → revoca módulos pagos pero Fiado ancla sigue si aplica
34. Trial vencido: no hard-block si hay ancla gratis
35. Rechazar/reportar cualquier precio de pago < $10.000 en UI

### Verticales (smoke mínimo cada uno)
36. Kiosco: 3 ventas rápidas + 1 fiado + cierre
37. Ferretería: búsqueda producto + stock + ticket
38. Veterinaria: alta mascota + consulta + cobro producto
39. Peluquería: turno hoy + completar + cobro
40. Agenda pública: reserva externa + aparece en agenda
41. Bar/restó: comanda mesa → POS cobra → mesa libre
42. Membresía: alta plan/socio (manual cobro OK en v1)

### Seguridad multi-tenant
43. Usuario empresa A no ve datos empresa B
44. APIs sin token → 401
45. Webhooks sin secret inválido → rechazo

## C. Matriz por vertical
Tabla: Vertical | Módulos usados | Happy path | Gaps | ¿Se puede vender mañana? | Precio pack sugerido (≥ $10.000)

## D. Configuración / API keys
Listá qué variables de entorno faltan y qué se rompe sin cada una:
DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_BASE_URL,
MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET,
RESEND_*, TWILIO_*, AFIP_*, INTEGRATION_ENCRYPTION_KEY.

## E. Catálogo y precios
- Extraé precios de landings/App Store/catálogo.
- Flag P0 si algún plan de pago < $10.000.
- Proponé remapeo a packs ≥ $10.000.

## F. Veredicto go-live
1. GO / GO CON RESTRICCIONES / NO-GO
2. Lista de promesas comerciales permitidas vs prohibidas
3. Top 10 bugs ordenados por severidad
4. Checklist de 24h para el dueño del producto
5. Script de demo de 5 minutos para vendedor en calle

# Criterios de severidad
- P0: pierde plata, datos de otro tenant, cobro MP roto, precio ilegal < 10k, no se puede cobrar suscripción
- P1: flujo principal roto pero hay workaround
- P2: UX / vertical incompleto
- P3: cosmético

# Datos de prueba sugeridos
- Cliente monotributista y RI
- Producto IVA 21% y 10.5%
- Cliente fiado límite $30.000, deuda $25.000, intento fiado $10.000 (debe fallar)
- Caja abierta con efectivo inicial
- Plan suscripción $10.000 y $20.000

# Reglas
- Sé brutalmente honesto: no digas “listo” si es UI vacía o stub.
- Diferenciá “código existe” vs “funciona E2E en prod”.
- Toda afirmación de FAIL debe incluir ruta de archivo o URL si es posible.
- Priorizá lo que bloquea COBRAR y DEMOSTRAR mañana.
```

---

## 9. Script de demo vendedor (5 minutos)

1. **Login demo almacén** → “Quién me debe” (`/dashboard/fiado`)  
2. Anotar fiado $5.000 a un vecino → mostrar deuda  
3. Cobrar $2.000 → recibo  
4. Abrir POS → 2 productos → cobro efectivo  
5. Misma venta a fiado con cliente  
6. Caja → ver movimientos  
7. “Esto es gratis (libreta). POS y el resto desde **$10.000/mes**, trial 14 días, pagás con Mercado Pago.”

---

## 10. Matriz rápida “¿lo vendo mañana?”

| Oferta | Precio | Vendo mañana | Condición |
|--------|--------|--------------|-----------|
| Libreta Fiado | $0 | ✅ | Demo + onboarding claro |
| Starter Calle | **$10.000** | ✅ | POS+fiado+caja; sin prometer AFIP prod |
| Cobrá | **$20.000** | 🟡 | Solo si Twilio + WA listos |
| POS Pro | **$25.000** | ✅ | Con disclaimers offline/impresora |
| Pack Almacén | **$34.900** | 🟡 | Validar SKUs activos del pack |
| Core ERP | **$39.900+** | 🟡 | Scopear módulos reales del plan |
| Vertical vet/pelu sueltos | **≥ $10.000** | 🟡 | Como agenda+POS, no “HIS hospitalario” |
| Intangibles catálogo | — | 🔴 | Próximamente |

---

## 11. Acciones de código sugeridas (post go-live o hoy si hay tiempo)

1. Función `assertPrecioMinimo(precioArs)` → nunca crear preapproval &lt; 10000 salvo sku ancla $0.  
2. `resolvePrecioSku` / catálogos: `Math.max(precio, 10000)` para SKUs de pago.  
3. Setear `NEXT_PUBLIC_BASE_URL` en deploy.  
4. Configurar `MP_WEBHOOK_SECRET`.  
5. Badge “Próximamente” en enganches `tier: "catalogo"`.  
6. Unificar `AFIP_CUIT` vs `AFIP_CUIT_EMPRESA`.

---

## 12. Veredicto final

| Pregunta | Respuesta |
|----------|-----------|
| ¿Hay producto real de POS + Fiado? | **Sí** — base usable |
| ¿Se puede cobrar suscripciones? | **Sí en código**; falta cerrar **webhook + BASE_URL + secret** |
| ¿Precio mínimo? | **$10.000/mes** en todo lo de pago; Fiado puede ser $0 |
| ¿Se puede salir mañana? | **GO CON RESTRICCIONES**: vender pack calle/POS desde $10.000, no micro-SKUs rotos, no AFIP prod sin cert, no Cobrá sin Twilio |
| Siguiente paso | Correr tests §7 + keys P0 + UAT checklist + prompt Gemini + 1 cobro MP $10.000 |

---

## 13. Referencias en el repo

| Tema | Path |
|------|------|
| Fiado service | `lib/fiado/fiado-service.ts` |
| POS UI | `app/dashboard/pos/page.tsx` |
| POS venta API | `app/api/pos/venta/route.ts` |
| MP suscripción | `lib/billing/mercadopago-subscription.ts` |
| MP cobros | `lib/mercadopago/mercadopago-service.ts` |
| Aplicar pago deudor | `lib/mercadopago/aplicar-pago-deudor.ts` |
| Ofertas / ancla | `lib/comercial/ofertas-comerciales.ts` |
| Enganches precios | `lib/marketplace/enganche-catalog.ts` |
| Sub-SaaS | `lib/comercial/sub-saas-catalog.ts` |
| Industrias demo | `lib/comercial/industry-templates.ts` |
| Env example | `.env.example` |
| Auditoría trial/fiado | `docs/comercial/AUDITORIA-TRIAL-FIADO-COBRANZA-RECIBO-RECURRENTE.md` |
| Auto-auditoría | `docs/AUTO_AUDITORIA_INTEGRAL_GRUPO_CLAVER.md` |
| Doc POS | `docs/funcional/sistema-pos.md` |

---

*Documento generado para go-live comercial. Actualizar este archivo cuando se alineen precios en código al piso de $10.000 y se configuren las keys de producción.*

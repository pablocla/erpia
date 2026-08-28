# Pájaro en mano — dar el sistema gratis y cobrar por mes solo lo que mueve plata

**Fecha:** 2026-08-25  
**Para:** vendedor de calle · humano (precio) · Grok (límites en código)  
**Tesis:** más vale 200 kioscos **usando** Claver que 8 “les armamos el ERP completo y nunca arrancan”. La cartera se arma regalando el día a día. Se cobra lo que **automatiza plata** o **sale caro de operar**.

No es “todo el ERP de 40 módulos gratis para siempre”. Eso quiebra hosting, AFIP y WhatsApp. Es: **gratis lo que reemplaza el cuaderno y la caja; se paga por mes lo extra.**

**Escala y si hay chance de unicornio:** [`POS_GRATIS_ESCALA.md`](./POS_GRATIS_ESCALA.md).  
**Servidor gratis + item shop (pymes masivas, chiches, enterprise si lo piden):** [`SERVIDOR_GRATIS_ITEM_SHOP.md`](./SERVIDOR_GRATIS_ITEM_SHOP.md).  
**Gemini (docs/copy/playbooks de lo free):** [`../engineering/PROMPT_GEMINI_FREE.md`](../engineering/PROMPT_GEMINI_FREE.md).

---

## 1. Qué hay hoy (no inventar)

Ya existe el ancla:

| Qué | Código | Precio |
|-----|--------|--------|
| Libreta de fiado | `pos.fiado_barrio` · `anclaGratis: true` | **$0 permanente**, sin tarjeta |
| Upsell natural | `intang.cobranzas_wa` (~$20.000) + `com.whatsapp` (~$15.000) + link MP | Pago / trial |
| Alta | `/login?activar=pos.fiado_barrio` o `/login/register?activar=fiado` | Self-serve |

El comerciante **ya puede** entrar, anotar quién debe, y no pagar. Cobrá (WA + link) es el primer peso.

El hueco: mucha gente quiere **vender en mostrador** (POS + stock + caja) y hoy eso se siente “pack pago / ERP grande”. Para llenar cartera hay que **regalar el mostrador chico**, no solo la libreta.

---

## 2. La oferta de calle (una frase)

> “Te dejo el sistema **gratis**: vendés, fiás, mirás stock y cerrás caja.  
> El día que quieras que **mande el WhatsApp solo**, que **facture AFIP**, o **más de una caja**, pagás un extra por mes. Sin compromiso de pack gigante.”

Eso es pájaro en mano. El mil volando es “te vendo Claver Pro $80.000 y en 45 días vemos”.

---

## 3. Qué es GRATIS (para siempre, sin tarjeta)

**Nombre interno:** Ancla Mostrador (`core.mostrador_gratis` — a crear si no existe; hoy el ancla real es solo fiado).

Incluye, con **límites** (si no hay techo, no es negocio):

| Módulo | Gratis | Tope sugerido (humano confirma) |
|--------|--------|----------------------------------|
| Clientes | Sí | Ilimitado |
| Fiado / saldo | Sí | Ilimitado en libreta |
| POS 1 caja | Sí | 1 punto de venta, 1 usuario cajero + dueño |
| Productos / stock básico | Sí | Hasta N SKUs (ej. 500) |
| Caja abrir/cerrar | Sí | 1 caja |
| Reportes del día | Sí | Hoy / ayer; no BI |
| Usuarios | Dueño + 1 cajero | El 3º usuario = pago |

**No va en el gratis** (costo nuestro o es el gancho de plata):

| Extra | Por qué se cobra | Gatillo de venta |
|-------|------------------|------------------|
| WhatsApp automático / Leo | Twilio/Meta sale plata | “Mandale el saldo a los 40 de la libreta en un toque” |
| Link de cobro MP | Es el que recupera deuda | 1 cobro recupera meses |
| Factura electrónica AFIP prod | Cert, contingencia, soporte | Cuando AFIP le pide factura |
| 2ª caja / sucursal | Escala real | “puse otra máquina” |
| Agenda recordatorios masivos | Mismo canal WA | Pelu/gym |
| Empleados digitales | Add-on, no core | Quien ya cobra fiado en serio |
| Contabilidad / IIBB / padrones | Studio | Contador |
| Multi-usuario ilimitado | Soporte | Cadena / turno noche |

Precios de lista = **`[HUM-01]`**. Placeholder de orden de magnitud (no publicar sin humano): extras $9.900–$29.900/mes por módulo; pack “Cobrá” (WA+link) como primer upsell.

---

## 4. Cómo dárselo (agresivo, 2 minutos)

### En el local

1. Celular del dueño. `claver.com.ar/demo/almacen` o registro con `?activar=pos.fiado_barrio`.  
2. Cargá **3 clientes que debe** y **un producto**.  
3. Anotá un fiado. Mostrá “quién me debe”.  
4. Frase de cierre: *“Esto queda. Es gratis. Cuando quieras que el mensaje salga solo, lo prendemos.”*  
5. **No** hables de 40 módulos, Cloud, consorcios, Leo.

### Por WhatsApp (plantilla)

```
Hola [Nombre], te dejo Claver para el fiado y la caja, sin cargo.
Entras acá: https://claver.com.ar/login/register?activar=pos.fiado_barrio
Cargás quién te debe y vendés. Si más adelante querés que les mande el aviso
y el link de pago solo, es un extra por mes. Cualquier cosa me escribís.
```

### Qué no hacer

- No pedir tarjeta “por las dudas”. Mata la cartera.  
- No dejarlos en el ERP completo (menú de oficios/hotelería). Shell lite: fiado + POS + clientes + caja.  
- No prometer AFIP prod gratis.  
- No instalar hardware el día 0 (salvo que paguen setup).

---

## 4.1 Si no cierran hoy: que les quede flameando

El 80% de las visitas **no dan de alta en el momento**. El laburo no es convencerlos ahora: es que a las 22, cuando cierren la persiana y abran el cuaderno, **piensen en Claver**. Pájaro en la cabeza, no en el Excel del vendedor.

Regla: **una idea, un objeto, un WhatsApp.** Cero catálogo. Si les dejás 12 cosas, no queda ninguna.

### La idea (una sola, se la repetís 3 veces)

Elegí **una** según lo que viste en el local. No mezcles.

| Si viste… | Frase que tiene que repetir él mañana | Por qué pega |
|-----------|----------------------------------------|--------------|
| Cuaderno de fiado / “después te anoto” | *“¿Cuánto te deben hoy? Si no lo sabés de memoria, ya lo estás perdiendo.”* | Dolor de plata, no de software |
| Cola y calculadora | *“La caja no espera a que busques el precio.”* | Velocidad |
| AFIP / “no hago factura” | *“El ticket es gratis. La factura, el día que te la pidan.”* | Saca el miedo de pack |
| WhatsApp lleno de “¿cuánto te debo?” | *“El cuaderno no te escribe a las 10 de la noche.”* | El extra, sin nombrarlo |

Al irte: *“Acordate de esa. El resto lo vemos.”*

### El objeto (queda en el local cuando vos no)

Tiene que vivir **donde mira todos los días**: caja, heladera, lado del cuaderno. No en el cajón con las tarjetas de los mayoristas.

| Pieza | Qué lleva | Cómo se usa |
|-------|-----------|-------------|
| **Calco 5×5** (caja / vidrio) | `Claver` + QR a `claver.com.ar/f` (corto) + *“¿quién me debe?”* | Él lo ve al cobrar. QR = alta ancla, no landing de 40 módulos |
| **Iman heladera** | Misma cara. Dorso: tu WhatsApp, no un 0800 | La dueña abre la heladera 40 veces |
| **Señalador / tira para el cuaderno** | *“Cuando se te llene esta hoja, escaneá”* + QR | El cuaderno es el competidor: el calco vive **adentro** |
| **Card 1 cara** | Frente: frase. Dorso: QR + “gratis, sin tarjeta” + tu nombre | Se la das a él, no al cajero si el dueño no está |
| **Foto en su celu** | Screenshot de **sus** 3 deudores (si cargaste demo) o de “Pérez $12.400” | Más fuerte que un folleto. *“Te lo dejo en el chat”* |

Kit por vendedor: 50 calcos + 50 iman + 50 tiras de cuaderno. Costo irrisorio vs una visita.

**No dejar:** pendrive, PDF de 8 páginas, “te mando el catálogo”, sticker de 12 productos.

### El WhatsApp (no es un pitch)

Lo mandás **antes de irte**, desde el local, a su número. Así queda **arriba del chat** y con una foto.

**Si cargaste 1 fiado con él:**

```
[Nombre], te quedó anotado lo de hoy.
Cuando el Pérez pida fiado de nuevo, mirá el celular, no el cuaderno.
Link: https://claver.com.ar/login?activar=pos.fiado_barrio
Soy [vos]. Cualquier cosa acá.
```

Adjuntá el screenshot de “quién me debe”.

**Si no quiso entrar / “después veo”:**

```
[Nombre] — lo de hoy: ¿cuánto te deben? si no lo sabés, el cuaderno te está cagando.
Cuando quieras: https://claver.com.ar/f
Sin tarjeta. Yo soy [vos].
```

**A las 21–22 del mismo día (solo si no se registró):** un sticker o 1 línea, no un párrafo.

```
Cerraste? esa es la hora en que el cuaderno miente.
Mañana si querés lo vemos 2 minutos.
```

**Sábado mediodía** (post-pico, cuando cuenta el fiado de la semana): el único follow-up de la semana. Si no contesta, **pará**. Spam = te bloquean y se les apaga la llama.

### Lo que tiene que pasar en su cabeza a la noche

1. Un cliente le pide fiado.
2. Él duda del saldo.
3. Se acuerda de la frase.
4. Ve el calco o abre el chat.
5. Entra. Pájaro.

Si no hay frase + objeto + chat, la visita fue un saludo.

### Si el dueño no está

Dejale al que atiende **solo** el calco + *“esto es para [dueño], es la libreta, es gratis”*. No expliques el extra. Anotá nombre del local y WhatsApp del dueño. El flameo es **al dueño**, no al empleado.

### Checklist del vendedor al salir (aunque haya dicho que no)

- [ ] Dije **una** frase 3 veces.
- [ ] Dejé **un** objeto en caja/cuaderno/heladera.
- [ ] Le mandé **un** WA con foto o QR **desde el local**.
- [ ] Tengo su WhatsApp y el nombre del local en mi lista.
- [ ] No prometí pack, AFIP magia, ni “te llamo todos los días”.

### Qué medimos (flameo, no cierre)

| KPI | Cómo |
|-----|------|
| Visitas con kit dejado | El vendedor tilda en Cloud / planilla |
| Altas ancla **sin** que el vendedor esté | El QR/calco laburó |
| Respuestas al WA de las 22 o del sábado | Sigue caliente |
| “Me acordé del Pérez” en el próximo mensaje | La frase pegó |

Si las altas vienen 70% con el vendedor al lado, el flameo no está funcionando: el objeto o el QR están mal (landing larga, no `activar=fiado`).

---

## 5. Cómo se les vende después (pájaro ya en la mano)

El upsell **no es una reunión**. Es un momento de dolor que ya están viviendo **adentro** del producto.

| Señal en el tenant (Grok puede medir) | Qué ofrecer | Cómo decirlo |
|---------------------------------------|-------------|--------------|
| ≥20 fiados o saldo > $X sin cobro 14 días | Cobrá WA + link MP | “Tus 20 deudores: un botón, no 20 chats” |
| Pidió factura / “AFIP” en el menú | Facturación (trial 14d → pago) | “El ticket gratis; la factura A/B es el extra” |
| 2º usuario o “turno noche” | Usuarios extra / 2ª caja | “El cajero de la tarde es un módulo” |
| Stock en 0 varias veces | (Sigue en core) OC borrador; no cobres esto | No vender Ramiro; el loop es del gratis |
| Agenda llena / no-shows | Confirmá turnos (trial) | Extra, no el ancla |
| 30 días usando POS todos los días | Pack Almacén (si hay valor real) | Recién ahí “el pack” |

Cadencia sugerida (humano + producto, no spam):

| Día | Qué |
|-----|-----|
| 0 | Alta gratis. Cero venta. |
| 3 | WA: “¿pudiste anotar el fiado?” + 1 tip. |
| 14 | Si hay deudores: oferta Cobrá 14 días. |
| 30 | Si hay ventas POS: “factura AFIP cuando la necesites”. |
| 60 | Silencio si no usan. No gastar WhatsApp en muertos. |

**Métrica de agresividad (cartera), no de vanity:**

| KPI | Para qué |
|-----|----------|
| Altas ancla / semana | Volumen |
| % que anotan 1 fiado o 1 venta en 48 h | Activación (si es bajo, el gratis no pega) |
| % que a 30 días siguen usando | Pájaro vivo |
| % que pagan 1 extra a 60 días | Conversión (objetivo calle: 10–20%, no 80%) |
| $ extra / tenant que paga | Ticket |
| Costo WA/AFIP de los **gratis que no pagan** | Techo de regalos |

Pájaro en mano = las dos primeras filas altas. El resto es cosecha.

---

## 6. Límites para que el gratis no nos funda

| Riesgo | Tope |
|--------|------|
| WhatsApp | **0 envíos** en ancla. El dueño copia el mensaje a mano o paga Cobrá. |
| AFIP producción | Nunca en gratis. Homologación demo sí. |
| IA chat | Soft limit ya existe (~100/mes). En ancla: 0 o 5. |
| Demos infinitas | Rate limit ya hay; no provisionar 40 rubros por IP. |
| Soporte | Ancla = self-serve + macros. Hora de analista = pack pago o setup `[HUM-01]`. |
| Hosting | 1 empresa, 1 caja, N productos. El que pide sucursal, paga. |

Regla: **gratis = CPU y pantalla. Pago = plata que sale de Claver o que le entra al comerciante sin él.**

---

## 7. Qué tiene que decidir el humano

| ID | Pregunta | Default si no hay respuesta |
|----|----------|------------------------------|
| HUM-01 | Precio de Cobrá / WA / AFIP / 2ª caja | No publicar números en ads |
| HUM-ancla | ¿El POS 1 caja es $0 o solo fiado $0? | Hoy código = **solo fiado $0**. Ampliar POS es decisión. |
| HUM-02 | Piloto: 20 comercios de un barrio, no “todo Rosario” | Medir activación 48 h |
| Legal | ToS: “ancla sin SLA, extra con soporte” | Checkbox en registro (ya hay términos genéricos) |

**Recomendación de producto (no precio):** sí ampliar el ancla a **mostrador 1 caja** (POS+fiado+stock+caja). Si no, seguís regalando solo la libreta y el que quiere cobrar en mostrador se va a Maxikiosco.

---

## 8. Qué tiene que hacer Grok (si el humano dice sí al POS gratis)

No es este doc. Lista para cuando lo pidan:

1. SKU `core.mostrador_gratis` o extender `pos.fiado_barrio` al shell POS+fiado+caja (1 caja, 2 users).  
2. Bloquear WA outbound y AFIP prod en ese SKU.  
3. Paywall claro en UI: “Factura AFIP — extra” / “Avisos WA — extra”.  
4. Eventos: `fiados_30d`, `ventas_30d`, `deuda_sin_cobro` → lista para vendedor en Cloud.  
5. No construir empleados para esto.

---

## 9. Guión de objeción (30 s)

**“¿Y de qué viven ustedes si es gratis?”**  
*“De lo que te ahorra laburo de verdad: que el sistema les escriba a los que deben y te deje el link de Mercado Pago. El cuaderno digital es el anzuelo. Si no te sirve, no pagás. Si te sirve, un extra por mes.”*

**“Después me van a cobrar el pack enorme.”**  
*“No hay pack obligatorio. Prendés módulos. Como el celu: WhatsApp es tuyo; el plan de datos es aparte.”*

**“Maxikiosco es más barato / conocido.”**  
*“Ellos te venden el sistema. Nosotros te dejamos usarlo y cobramos cuando te recuperamos un fiado. Probá esta semana, cero tarjeta.”*

---

## 10. DoD de esta estrategia

- [ ] El vendedor tiene **una** frase y **un** link de alta.  
- [ ] Si no cierra: **frase + objeto + WA** (kit en caja/cuaderno).  
- [ ] El comerciante opera fiado (y, si HUM lo aprueba, 1 caja POS) **sin tarjeta**.  
- [ ] Nada de WA masivo ni AFIP prod en el $0.  
- [ ] A los 14 días, si hay deudores, oferta **un** extra (Cobrá), no el catálogo.  
- [ ] Cloud muestra “anclas activas / usaron a 48h / pagan extra”.  
- [ ] Empleados digitales **no** salen en el pitch de calle.

*Alineado a: `pos.fiado_barrio` $0, `intang.cobranzas_wa`, GO_LIVE_PRD §3.1, ENLISTA.md (core vs extra).*

# Estrategia "1 Usuario Gratis" — Landing, Colorimetría, Marketing por Nicho

**Fecha:** 2026-08-26  
**Para:** founder · Grok (implementación) · equipo comercial  
**Estado:** propuesta Claude — **no es la regla de cobro**  
**Manda:** `COBRAR_SOLO_PROBLEMA_RESUELTO.md` (gancho de hoy + cobro al disparar el problema + tobogán `/f` + test lineal).  
De este archivo se tomó: CTA naranja, badge menta, frases de producto, un dolor por vez. **No** se tomó “1 usuario = todo incluido”.  
**Hermanos:** `SERVIDOR_GRATIS_ITEM_SHOP.md` · `DISCUSION_GROK_CLAUDE_LANDING_FREE_PARTNERS.md` · `COSTOS_VERCEL_SUPABASE_TAKE_RATE.md`

---

## 0. La idea central en 30 segundos

> **1 usuario = gratis para siempre. Todo incluido.**  
> Cuando crecés y necesitás otro usuario, pagás.  
> La IA trabaja desde el día 0 — y el usuario la ve.

No vendemos módulos. No vendemos features. Vendemos **espacio para crecer**. El gatillo de pago es natural: si necesitás a alguien más en el sistema, ya tenés plata para pagarlo.

---

## 1. MODELO DE PRICING — Simple y honesto

### 1.1 La regla

| Usuarios activos | Precio | Quién es | Qué tiene |
|------------------|--------|----------|-----------|
| **1** (el dueño/a) | **$0 para siempre** | Kiosquero solo, pelu sola, plomero, encargado | POS + fiado + stock + clientes + caja + cierre + IA básica |
| **2–3** | [HUM-01]/mes | Tiene empleado → ya tiene plata | Todo lo de 1 + 2ª caja + roles + arqueo |
| **4–10** | [HUM-02]/mes | PyME con equipo | Todo + reportes 12m + AFIP + multi-caja |
| **10+** | A medida | Cadena / estudio | SLA + custom domain + dedicado |

### 1.2 Extras (item shop, independiente del plan)

| Extra | Precio | Por qué se paga |
|-------|--------|-----------------|
| WhatsApp de cobro (Cobrá) | [HUM-03]/mes | Meta API + cron + cobro real |
| Factura AFIP electrónica | [HUM-04]/mes | SOAP + certificados + soporte |
| Reportes 12 meses + Excel | [HUM-05]/mes | Queries pesadas |
| Portal contador multi-tenant | [HUM-06]/mes | Multi-empresa |

### 1.3 Por qué "por usuario" y no "por módulo"

| Criterio | Por módulo | Por usuario |
|----------|-----------|-------------|
| Explicarlo en la calle | "Tenés caja gratis pero WA es extra, AFIP es extra, 2ª caja es extra..." | **"Gratis mientras seas vos solo"** |
| Gatillo de pago | Confuso: ¿qué módulo activo primero? | Natural: agrego un empleado |
| Barrera percibida | "Me van a cobrar todo" | "Solo si crezco" |
| Ingeniería | Feature flags por SKU por empresa | `COUNT(usuarios WHERE activo) > 1` |
| Conversión estimada | 10-15% prende extras | **15-25%** agrega persona (benchmark SaaS) |

### 1.4 Unit economics

```
Costo infra por tenant activo (1 usuario): ~USD 0,30-0,50/mes
Si 1 de cada 5 agrega un 2° usuario ([HUM-01] ARS/mes):

1.000 tenants gratis × 20% conversión = 200 pagos
200 × [HUM-01] = revenue
Infra total: 1.000 × USD 0,50 = USD 500/mes

→ El 20% que paga cubre el 100% de la infra con margen.
```

---

## 2. LANDING PAGE — Diseño lineal, sin dispersión

### 2.1 Principio: una página, un camino, un botón

El error actual: la home mezcla oficios + ERP + partners + catálogo de apps. El usuario no sabe qué hacer.

**Patrón ganador:** flujo lineal tipo Stripe / Linear / Notion.  
Una sola dirección de scroll. Cada sección responde una duda y empuja al CTA.

```
┌─────────────────────────────────────────────┐
│  HERO: qué hacés + gratis + CTA             │ ← 3 segundos para decidir
├─────────────────────────────────────────────┤
│  PRUEBA SOCIAL: "Ya lo usan X comercios"    │ ← confianza
├─────────────────────────────────────────────┤
│  3 FEATURES: caja + fiado + IA              │ ← qué resuelve
├─────────────────────────────────────────────┤
│  IA EN ACCIÓN: demo visual / video          │ ← wow factor
├─────────────────────────────────────────────┤
│  PRICING: 1 usuario = $0 / más = pagás      │ ← transparencia
├─────────────────────────────────────────────┤
│  FAQ: 4 preguntas                           │ ← resolver objeciones
├─────────────────────────────────────────────┤
│  CTA FINAL: repetir el botón                │ ← cierre
└─────────────────────────────────────────────┘
```

**No hay sidebar. No hay menú de 8 opciones. No hay "Ver 11 apps". Es un tobogán.**

### 2.2 Referencia de empresas que hacen esto bien

| Empresa | Qué hacen bien | Qué copiamos |
|---------|---------------|--------------|
| **Stripe** | Hero minimalista, 1 CTA, demo interactiva inline | El flujo lineal sin navegación visible |
| **Linear** | Fondo oscuro, un color de acento (violeta), tipografía grande | El contraste y la limpieza |
| **Notion** | "Free for individuals" como primer punto | El modelo "gratis si sos solo" |
| **Cal.com** | Open source, 1 cosa (agenda), CTA naranja brillante | El CTA de alto contraste |
| **Mercado Libre AR** | Amarillo + celeste, lenguaje de calle | Que hablan como habla el usuario |
| **Toast (POS USA)** | Video del POS en uso, pricing transparente | Mostrar el producto, no describir features |

### 2.3 Anti-patterns (lo que NO hacer)

- ❌ Grid de 11 cards de apps en el hero
- ❌ Menú con Ventas / Compras / Stock / Contabilidad / RRHH / etc.
- ❌ "Soluciones para cada industria" con 15 íconos
- ❌ Comparativa Free / Pro / Enterprise tipo Excel
- ❌ Pop-up de WhatsApp o chatbot a los 3 segundos
- ❌ Slider de testimoniales automático
- ❌ "Nuestro equipo" / "Sobre nosotros" antes del producto

---

## 3. COLORIMETRÍA — Psicología del color para conversión

### 3.1 El problema actual

El theme actual es **"Premium Corporate"** con hue 245 (azul grisáceo frío):
- `--primary: oklch(0.25 0.02 245)` → casi negro-azulado
- Chroma muy baja (0.02) → se ve gris, no se ve vivo
- No hay color de acción/CTA diferenciado del primary

Eso funciona para el **dashboard** (el producto debe ser sobrio para trabajar 8 horas). **No funciona para la landing** (necesitás captar atención en 3 segundos).

### 3.2 Colores que convierten (data real)

Estudios de HubSpot, CXL, y Unbounce sobre botones de CTA:

| Color | CTR relativo | Cuándo usarlo |
|-------|-------------|---------------|
| 🟠 **Naranja** | +32% vs gris | CTAs primarios. Urgencia amigable. Mercado Libre, Amazon, HubSpot |
| 🟢 **Verde** | +21% vs rojo | "Empezar" / "Gratis". Shopify, WhatsApp. Confianza |
| 🔴 **Rojo** | +21% vs verde (varía) | Urgencia dura. Netflix, YouTube. No para "gratis" |
| 🔵 **Azul** | Base (neutro) | Confianza/institucional. Facebook, PayPal. No destaca |
| ⚫ **Negro/gris** | Base | Lujo. No convierte en pricing de $0 |

**Conclusión:** el CTA de la landing debe ser **naranja vibrante** o **verde acción**. El fondo debe ser oscuro o blanco limpio con alto contraste.

### 3.3 Paleta propuesta para landing `/f`

```
LANDING PAGE (no es el dashboard)
──────────────────────────────────

Fondo:        #0F172A (slate-900, casi negro)
              o blanco puro con gradiente sutil

Texto hero:   #F8FAFC (blanco cremoso)

CTA primario: oklch(0.75 0.18 55)  → NARANJA CÁLIDO
              equivale a ~#F97316 (orange-500 de Tailwind)
              Hover: oklch(0.70 0.20 55) → naranja más profundo

CTA hover:    Scale up 1.02 + shadow glow naranja

Acento:       oklch(0.72 0.14 155) → VERDE ÉXITO
              Para badges "Gratis", checks, confirmaciones

Badge gratis: oklch(0.92 0.06 155) fondo
              oklch(0.35 0.10 155) texto
              → verde menta claro, transmite "no hay truco"

Precio $0:    oklch(0.75 0.18 55)  → mismo naranja
              Tipografía grande, bold, imposible no verlo

Links/footer: oklch(0.60 0.08 245) → azul gris (actual primary)
```

### 3.4 En OKLCH (para que Grok lo cable directo)

```css
/* Landing-only overrides — NO tocar el dashboard theme */
[data-page="landing"] {
  --landing-bg: oklch(0.10 0.02 250);         /* fondo oscuro */
  --landing-fg: oklch(0.97 0.005 60);         /* blanco cálido */
  --landing-cta: oklch(0.75 0.18 55);         /* NARANJA */
  --landing-cta-hover: oklch(0.70 0.20 55);
  --landing-cta-fg: oklch(0.10 0.02 50);      /* texto oscuro en botón */
  --landing-badge-free: oklch(0.92 0.06 155);  /* verde menta badge */
  --landing-badge-free-fg: oklch(0.35 0.10 155);
  --landing-accent: oklch(0.72 0.14 155);      /* verde acción */
  --landing-muted: oklch(0.55 0.02 250);       /* gris info */
}
```

### 3.5 Tipografía landing vs dashboard

| Lugar | Font | Por qué |
|-------|------|---------|
| Landing H1 | **Fraunces** (serif, ya la tienen) 48-64px | Calidez, personalidad, se lee en la vereda |
| Landing body | **Manrope** 18-20px | Legible, moderno, no corporativo |
| Landing CTA | **Manrope Bold** 18px uppercase | Imposible no ver el botón |
| Dashboard | Manrope / Geist (ya está) | Sobrio, no tocar |

---

## 4. HERO DE `/f` — El primer pantallazo

### 4.1 Wireframe textual

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [badge: verde menta]  Gratis para siempre          │
│                                                     │
│  Tu negocio en el celular.                          │  ← H1, Fraunces, 48px
│  Caja, stock y fiado. Gratis.                       │
│                                                     │
│  Anotá ventas, controlá el stock y sabé             │  ← Sub, Manrope, 20px
│  quién te debe. Sin tarjeta, sin vencimiento.       │
│                                                     │
│  ┌──────────────────────────────────────┐            │
│  │  🟠  EMPEZAR GRATIS AHORA           │            │  ← CTA naranja, 52px alto
│  └──────────────────────────────────────┘            │
│                                                     │
│  Ya lo usan más de X comercios en Argentina         │  ← social proof, muted
│                                                     │
│  [mockup del POS en celular]                        │  ← screenshot real, no stock
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 Reglas del hero

1. **Cero menú visible.** Solo logo Claver arriba a la izquierda. Nada más.
2. **El H1 tiene que funcionar en 4G en un Samsung A14.** Carga en <2s.
3. **El mockup es un screenshot real del POS,** no una ilustración genérica.
4. **El badge "Gratis para siempre" es verde menta,** no naranja (naranja = CTA).
5. **No hay segundo CTA.** No "Ver demos". No "Soy partner". UNO solo.

---

## 5. QUÉ VE EL USUARIO DE LA IA — El wow factor

### 5.1 El principio: mostrar, no describir

El kiosquero no sabe qué es "IA". No le digas "Inteligencia Artificial". Mostrále **qué hace** sin ponerle nombre.

### 5.2 Lo que la IA debería hacer visible (día 0)

| Momento | Qué ve el usuario | Qué hace la IA atrás |
|---------|-------------------|----------------------|
| Primer login | *"Ya te armé la caja con los productos más comunes de tu rubro"* | Seed automático por rubro (ya existe en `retail-onboarding-service.ts`) |
| Después de 10 ventas | *"Tu producto más vendido es X. ¿Querés ponerlo primero en la caja?"* | Ranking + sugerencia de layout |
| Día 7 | *"3 clientes te deben $X. ¿Querés que les avise?"* → (candado: "Activar Cobrá") | Análisis de CxC + upsell natural |
| Día 14 | *"Vendiste $X esta semana, 20% más que la anterior"* | Stats automáticas |
| Cierre de caja | *"Hoy entraron $X, la diferencia con la caja es $Y"* | Arqueo inteligente |
| Stock bajo | *"Te quedan 3 unidades de [producto]. Las últimas duraron 4 días"* | Predicción simple de reposición |

### 5.3 Cómo mostrarlo en la landing

**Sección "El sistema piensa. Vos vendés."** (después de features, antes de pricing):

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  El sistema piensa.                                 │  ← H2
│  Vos vendés.                                        │
│                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │ 📊 "Te quedan 3      │  │ 💬 "Pérez te debe    │ │
│  │ paquetes de yerba.   │  │ $12.000 hace 15      │ │
│  │ Las últimas duraron  │  │ días. ¿Le aviso?"    │ │
│  │ 4 días."             │  │                      │ │
│  │ [IA · Stock]         │  │ [IA · Cobranza]      │ │
│  └──────────────────────┘  └──────────────────────┘ │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │ 📈 "Esta semana      │  │ ⚡ "Tu caja tenía    │ │
│  │ vendiste 20% más     │  │ $2.300 de más. ¿El   │ │
│  │ que la anterior."    │  │ cajero devolvió      │ │
│  │                      │  │ mal un vuelto?"      │ │
│  │ [IA · Ventas]        │  │ [IA · Control]       │ │
│  └──────────────────────┘  └──────────────────────┘ │
│                                                     │
│  Todo esto viene incluido. Gratis.                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Diseño:** cards con fondo `--surface-elev`, borde sutil, ícono grande a la izquierda. Las frases son **exactamente** lo que el sistema diría en la notificación real. No es marketing: es producto.

---

## 6. MARKETING POR NICHO — Copy + canal + dolor + CTA

### 6.1 Tabla madre

| # | Nicho | Dolor #1 (3 palabras) | Producto ancla | Canal de adquisición | CTA de calle | Upsell natural |
|---|-------|----------------------|----------------|---------------------|--------------|----------------|
| 1 | **Kiosco / almacén** | "Quién me debe" | Fiado + POS | QR en calco, vendedor de calle, WA | "Dejá de anotar en el cuaderno" | Cobrá WA, AFIP |
| 2 | **Peluquería / barbería** | "No vino al turno" | Confirmá turnos | Instagram ads, Google "turnos peluquería" | "Menos sillas vacías" | Cobrá, Reactiva |
| 3 | **Gym / pilates** | "Cuotas sin cobrar" | Cuota socios | Calco en gym, WA del profe | "Sabé quién paga y quién no" | Cobrá WA, caja |
| 4 | **Consorcio / PH** | "Expensas en Excel" | Expensas | Google "liquidar expensas", FB groups admin | "Liquidá y avisá en un toque" | Cobrá WA, Renta |
| 5 | **Alquileres** | "Se olvidó de pagar" | Renta | Google "cobrar alquiler", WA inmobiliarias | "El inquilino se olvida. El sistema no." | Cobrá WA |
| 6 | **Cancha / salón** | "Reserva fantasma" | Seña | Google "señas cancha", WA del predio | "Sin seña, sin reserva" | Confirmá, Cobrá |
| 7 | **Electricista** | "Seña para materiales" | Seña + POS | Google "presupuestos electricista", redes de oficio | "Cobrá la seña antes de comprar cables" | AFIP, Ruta |
| 8 | **Plomero / gasista** | "Pongo plata yo" | Seña + POS | Google "presupuesto plomería", boca a boca | "Presupuestá y cobrá seña antes" | AFIP |
| 9 | **Veterinaria** | "Turnos por audio" | Confirmá | Google "software veterinaria", Instagram vet | "Turnos que confirman solos" | HC, Cobrá |
| 10 | **Distribuidora** | "Cobrar en la ruta" | Ruta | Vendedores de calle, ferias pyme, WA mayoristas | "Tu ruta. Sus cuotas. Su historial." | Cobrá, POS |
| 11 | **Bar / restaurant** | "La caja no cierra" | Caja + POS | Google "caja registradora bar", WA gastronómicos | "Que no se escape un peso" | AFIP, delivery |

### 6.2 Estrategia detallada por nicho (los 4 principales)

---

#### 🏪 NICHO 1: Kiosco / almacén / carnicería

**Tamaño:** ~200.000 comercios en Argentina  
**Quién decide:** el dueño, solo, en el celular  
**Competencia:** cuaderno, Excel, Maxikiosco ($12.000+/mes)  
**Precio que toleran:** $0 a $15.000/mes

**Copy madre:**  
> *Dejá el cuaderno. Sabé quién te debe, cuánto vendiste, y qué te falta. Gratis.*

**Canales:**
1. **QR en calco / imán / sticker de heladera** → `claver.com.ar/f`
2. **Vendedor de calle** (partner) con script: "Te dejo la caja y la libreta gratis. Sí, de verdad."
3. **WA broadcast** a lista de comercios del barrio
4. **Google:** "control de fiados" / "libreta digital" / "caja registradora gratis"
5. **Instagram/TikTok:** reel de 15s — cuaderno borroneado vs pantalla Claver

**Landing variant:** fondo oscuro, screenshot de libreta de fiados en celular. Sin mencionar "ERP", "gestión", ni "software". Solo: caja, fiado, stock, gratis.

**Color del CTA:** 🟠 Naranja. Urgencia amigable.

---

#### ✂️ NICHO 2: Peluquería / barbería / estética

**Tamaño:** ~80.000 en Argentina  
**Quién decide:** la dueña/peluquera, desde el celu entre turnos  
**Competencia:** agenda en papel, Calendly (no cobra), Vagaro (en USD), SimplyBook  
**Precio que toleran:** $10.000 a $20.000/mes

**Copy madre:**  
> *10 audios por un turno vs un recordatorio automático. ¿Cuál preferís?*

**Canales:**
1. **Instagram ads** (donde viven) — reel de "antes/después" pero de la agenda, no del pelo
2. **Google:** "agenda peluquería gratis" / "turnos peluquería"
3. **WA a peluquerías** — mandar desde el teléfono del partner
4. **Calco en espejo** del salón con QR

**Landing variant:** fondo claro, tonos rosados / lavanda como acento (no naranja — la estética es distinta). Screenshot de la agenda con recordatorio WA.

**Color del CTA:** 🟣 Lavanda/violeta o 🟢 verde menta. Asociación "calma + control".

```css
/* Variante peluquería */
[data-niche="peluqueria"] {
  --landing-cta: oklch(0.65 0.18 310);        /* lavanda */
  --landing-cta-hover: oklch(0.60 0.20 310);
  --landing-bg: oklch(0.98 0.005 320);         /* blanco rosado */
}
```

---

#### 🏋️ NICHO 3: Gym / pilates / club de barrio

**Tamaño:** ~30.000 establecimientos  
**Quién decide:** el dueño o la recepcionista  
**Competencia:** cuaderno de socios, Gympass (otra cosa), sistemas legacy  
**Precio que toleran:** $15.000 a $30.000/mes

**Copy madre:**  
> *Socios, planes y morosos. Todo en el celu, sin cuaderno.*

**Canales:**
1. **Calco en la puerta / recepción** del gym
2. **WA grupal** de profes de pilates (son community)
3. **Google:** "sistema gym barrio" / "cobrar cuotas gym"
4. **Instagram:** reel de "el cuaderno vs Claver" con timer

**Landing variant:** energética. Fondo oscuro con acento amarillo/naranja. Foto del panel de socios.

**Color del CTA:** 🟠 Naranja o 🟡 Amarillo energético. Energía + acción.

```css
/* Variante gym */
[data-niche="gym"] {
  --landing-cta: oklch(0.80 0.18 85);         /* amarillo energético */
  --landing-cta-hover: oklch(0.75 0.20 80);
  --landing-bg: oklch(0.10 0.02 250);          /* negro */
}
```

---

#### 🏢 NICHO 4: Consorcio / PH / administrador

**Tamaño:** ~15.000 administradores informales + administraciones  
**Quién decide:** el encargado del edificio, el administrador ad-hoc  
**Competencia:** Excel, Consorcio Real ($35.000+/mes), sistemas viejos  
**Precio que toleran:** $20.000 a $50.000/mes

**Copy madre:**  
> *Liquidá el mes y avisá a todos en un toque. Basta de Excel.*

**Canales:**
1. **Google:** "liquidar expensas online" / "sistema consorcios"
2. **Facebook groups** de encargados / administradores de edificio
3. **WA a administraciones** chicas
4. **Boca a boca** entre encargados del mismo barrio

**Landing variant:** profesional pero accesible. Fondo claro, acento azul (confianza financiera). Screenshot de la liquidación.

**Color del CTA:** 🔵 Azul profundo → 🟢 verde en "Empezar gratis". Transmite confianza financiera.

```css
/* Variante consorcios */
[data-niche="consorcio"] {
  --landing-cta: oklch(0.55 0.14 245);        /* azul profundo */
  --landing-cta-hover: oklch(0.50 0.16 245);
  --landing-bg: oklch(0.98 0.003 245);         /* blanco frío */
}
```

---

### 6.3 Los otros 7 nichos (línea rápida)

| Nicho | CTA color | Copy de 1 línea | URL |
|-------|-----------|-----------------|-----|
| Alquileres | 🟢 Verde | "El inquilino se olvida. El sistema no." | `/claver/apps/renta` |
| Cancha/salón | 🟢 Verde | "Sin seña, sin reserva." | `/claver/apps/sena` |
| Electricista | 🟡 Amarillo | "Cobrá la seña antes de comprar cables." | `/claver/apps/electricista` |
| Plomero | 🟡 Amarillo | "Presupuestá y cobrá seña antes." | `/claver/apps/plomero` |
| Veterinaria | 🟣 Lavanda | "Turnos que confirman solos." | `/claver/apps/veterinaria` |
| Distribuidora | 🟠 Naranja | "Tu ruta. Sus cuotas. Su historial." | `/claver/apps/ruta` |
| Bar/restaurant | 🟠 Naranja | "Que no se escape un peso." | `/claver/apps/gastronomia` |

---

## 7. VARIACIONES DE LANDING POR NICHO — URLs

| Nicho | URL | H1 | CTA | Acento color |
|-------|-----|-----|-----|-------------|
| Kiosco/almacén | `/f` | Tu negocio en el celular. Caja, stock y fiado. Gratis. | Empezar gratis ahora | 🟠 Naranja |
| Peluquería | `/f/peluqueria` | Turnos que confirman solos. Menos sillas vacías. | Probar gratis 14 días | 🟣 Lavanda |
| Gym | `/f/gym` | Socios, planes y morosos. Sin cuaderno. | Empezar gratis | 🟡 Amarillo |
| Consorcio | `/f/consorcio` | Liquidá expensas y avisá morosos en un toque. | Probar gratis | 🔵 Azul |
| Electricista | `/f/electricista` | Cobrá la seña antes de comprar materiales. | Armar presupuesto gratis | 🟡 Amarillo |
| Alquiler | `/f/alquiler` | El inquilino se olvida. El sistema no. | Probar gratis | 🟢 Verde |
| Cancha | `/f/cancha` | Sin seña, sin reserva. | Probar gratis | 🟢 Verde |
| Distribuidora | `/f/ruta` | Tu ruta. Sus cuotas. Su historial. | Probar gratis | 🟠 Naranja |

**Regla:** cada landing de nicho tiene **un** dolor, **un** screenshot, **un** CTA, y **un** acento de color. No mezclar.

---

## 8. FLOW COMPLETO — Del QR al pago

```
QR en calco / ad / WA
    ↓ (3 seg)
Landing /f — Hero: gratis, 1 CTA naranja
    ↓ (click)
Registro — Email + nombre + rubro (30 seg, sin tarjeta)
    ↓ (auto)
Onboarding IA — "Ya te armé la caja con productos de tu rubro"
    ↓ (día 0)
Uso: POS + fiado — 1 usuario gratis, IA sugiere y avisa
    ↓ (día 7-14)
¿Necesita a alguien más?
    │
    ├── NO → Sigue gratis. IA avisa. Upsell soft: Cobrá.
    │         ↓ (día 30-60)
    │         ¿Le duele no cobrar fiados por WA?
    │         ├── SÍ → Activa Cobrá (extra item shop)
    │         └── NO → Sigue gratis, genera data, es cartel
    │
    └── SÍ → Paywall amable: "Para agregar a María, activá un plan"
              → $[HUM-01]/mes
              → Partner cobra 30%
```

---

## 9. RESUMEN DE DECISIONES PARA EL HUMANO

| # | Decisión | Impacto |
|---|----------|---------|
| **HUM-01** | Precio plan 2-3 usuarios/mes | Define toda la calculadora y el margen |
| **HUM-02** | Precio plan 4-10 usuarios/mes | Define escala |
| **HUM-03** | Precio de Cobrá WA | Define el primer upsell |
| **HUM-04** | Precio de AFIP electrónica | Define el segundo upsell |
| **HUM-05** | ¿El acento de landing es naranja como propongo? | Define identidad comercial |
| **HUM-06** | ¿Prioridad de nicho? (kiosco primero, después pelu, después gym?) | Define dónde salen los partners |
| **HUM-07** | ¿1 usuario gratis es la regla oficial? | Define modelo de negocio completo |

---

## 10. LO QUE YO HARÍA ESTA SEMANA (si HUM aprueba)

1. **Definir tokens de landing** (`--landing-cta: naranja, --landing-badge-free: verde menta`) — no tocar dashboard.
2. **Cablear `/f` con hero lineal**, CTA naranja, badge verde, screenshot real del POS.
3. **Implementar el guard de usuarios** (`COUNT > 1 → paywall`). Son 15 líneas de código.
4. **Crear `tenant-caps.ts`** con los límites del free tier (1 user, 1 caja, 500 productos).
5. **Agregar 4 notificaciones de IA visibles** (onboarding, stock bajo, deudores, resumen semanal) para que el usuario vea que el sistema piensa.
6. **Armar landing variante peluquería** (`/f/peluqueria`) como test del sistema multi-nicho.
7. **Medir:** QR → registro → D7 activo → D30 paga.

---

*"Gratis mientras seas vos solo. Cuando crecés, pagás." — Eso es todo.*

# Reutilización salvaje: landings que detectan fugas, membresías, sorteos y reventa de procesos

> **Objetivo:** dejar de vender “pantallas y gráficos” y vender **lo que se le está escapando al negocio**, empaquetado como proceso reutilizable, white-label y revendible (bufetes, estudios contables, partners, el propio dueño).  
> **Mercado:** Argentina / es-AR · PyME, comercio de cercanía, estudios profesionales, redes partner.  
> **Relaciona:** membresías/abonos · fidelidad por ticket · sorteos · landings de recomendación · multi-tenant · Programa Partner Claver.  
> **Estado:** playbook comercial + producto (no es spec de implementación cerrada).

---

## 0. La idea en una frase

**Claver no es un tablero bonito.**  
Es una **fábrica de procesos** que:

1. **Detecta fugas** (“tortugas” que se escapan lentas pero caras).
2. Las **nombra en pesos** en la landing y en el home.
3. Las **tapa con un motor reutilizable** (membresía, sorteo, cobranza, agenda, recurrente…).
4. Las **revende** con la cara del contador, del abogado, del partner o del propio Claver.

---

## 1. “Campos y tortugas”: qué se les está escapando

### 1.1 Metáfora operativa

| Metáfora | Significado de negocio | Ejemplo de calle |
|----------|------------------------|------------------|
| **Campo** | Área del negocio sin dueño ni sistema | Fiado, turnos, stock, morosos, cupos de plan |
| **Tortuga** | Fuga **lenta**: no duele hoy, sangra el mes | Cliente que no vuelve, cuota que no se cobra, ticket sin fidelidad, hora vacía en agenda |
| **Grafo / chart** | Diagnóstico visual | “Ventas de la semana” sin acción |
| **Recomendación constante** | Empuje a **cerrar la tortuga** | “Tenés 23 clientas sin plan y 8 turnos vacíos mañana → activá abono 4 cortes” |

**Regla de producto:**  
Todo gráfico sin **CTA de tortuga** es decoración.  
Toda landing sin **lista de fugas del rubro** es brochure.

### 1.2 Catálogo de tortugas (por tipo de motor, no por rubro)

| ID | Tortuga (fuga) | Señal | Motor Claver que la tapa | Cómo se cobra el valor |
|----|----------------|-------|---------------------------|-------------------------|
| T01 | Plata parada en deudas | Cartera > X días | Fiado + Leo Cobranza | Recupero en $ |
| T02 | Ingreso impredecible | Solo walk-in | Membresías / abonos con cupos | MRR del cliente final |
| T03 | Clienta que no vuelve | Última visita > N días | Agenda + WA + plan | Retención |
| T04 | Ticket sin relación | Venta anónima | Ticket con nº + puntos/sorteo | Frecuencia |
| T05 | No-show | Huecos en agenda | Seña + recordatorio + plan | Capacidad recuperada |
| T06 | Precio desactualizado | Inflación | Reexpresión de precios | Margen |
| T07 | Caja sin cierre | Diferencias | Caja por turno | Merma/caja |
| T08 | Trabajo manual del estudio | Contador/abogado en Excel | White-label + portal cliente | Horas del profesional |
| T09 | Partner sin producto | Solo “te armo algo” | SKU + comisión | Escala sin código custom |
| T10 | Suerte sin sistema | “Sorteamos a fin de mes” a mano | Sorteo por nº de ticket | Tráfico + ticket medio |

Las landings y el home del dashboard deben hablar **en este idioma**, no en “módulos ERP”.

---

## 2. Landings más allá de grafos

### 2.1 Anatomía de una landing que vende tortugas

```
[Hero] Dolor en 1 línea del rubro
[Tortugas] 3–5 fugas con $ o % estimados (no features)
[Motor] “Cómo lo tapamos” (1 flujo, 4 pasos)
[Prueba] Demo / caso / número
[Oferta] Trial 7 días o setup + mes
[Reventa] “¿Sos contador / abogado / implementador? Revendé esto”
```

**Anti-patrón:** hero con dashboard genérico + 12 logos de módulos + “todo en uno”.  
**Patrón Claver:** “Se te escapan $X en fiados / clientas / horas vacías — acá las atrapamos”.

### 2.2 Bloque obligatorio: “Recomendaciones constantes”

En **landing pública** (marketing) y en **home post-login** (producto), el mismo concepto:

| Superficie | Qué muestra | Ejemplo copy |
|------------|-------------|--------------|
| Landing rubro peluquería | Tortugas del oficio | “El 40% de tus clientas viene 1 vez y no vuelve. Un plan de 4 cortes las ata.” |
| Landing kiosco | Tortugas de calle | “La libreta no cobra. Leo sí.” |
| Landing estudio contable | Tortugas del profesional | “Cargás el IVA de 30 clientes a mano. Ellos podrían cargarlo y vos solo revisar.” |
| Home tenant | Tortugas **de SUS datos** | “12 deudores > 30 días · $184.000 · Enviar borradores Leo” |
| Home partner | Tortugas de su cartera | “3 referidos trial sin activar cobro · 1 con fiado muerto” |

**Fórmula de una recomendación (siempre igual):**

```
[Señal] + [Monto o cantidad] + [Acción de 1 clic] + [Por qué importa]
```

Ejemplos:

- `8 clientas con > 45 días sin turno · $0 de abono · Crear plan “4 cortes” y ofrecerles link`
- `Ticket #1042–#1890 del mes · 0 sorteos configurados · Activar “Sorteo fin de mes” con 1 ganador cada 500 tickets`
- `14 socios gym cuota vencida · $210.000 · Aprobar mensajes de mora`

### 2.3 Landings por “capa de consumo” (no solo por rubro)

| Capa | Quién aterriza | Promesa | URL mental |
|------|----------------|---------|------------|
| **B2C del oficio** | Dueño pelu / kiosco / gym | Tapar *su* tortuga | `/para/peluquerias`, `/para/almacenes` |
| **B2B2C estudio** | Contador / abogado / estudio | Tapar tortugas de *sus clientes* y cobrarles | `/para/estudios-contables`, `/para/estudios-juridicos` |
| **Partner / revendedor** | Implementador, vendedor calle | Llevar el proceso y cobrar comisión | `/claver/partners` |
| **White-label** | Marca del estudio | “Se ve como tuyo” | `/para/white-label` |
| **Motor genérico** | Producto puro | Membresías, sorteos, cobranza | `/productos/abonos`, `/productos/sorteos-ticket` |

Una sola codebase; **muchas caras de venta**.

### 2.4 Copy de tortuga vs copy de grafo

| Mal (grafo) | Bien (tortuga) |
|-------------|----------------|
| “Dashboard en tiempo real” | “Sabés cuánta plata se te escapa esta semana y tocás un botón” |
| “Reportes avanzados” | “Te decimos: cobrá estos 5, activá plan a estas 8, sorteá con estos tickets” |
| “Multi-sucursal” | “El de la otra caja no te esconde la diferencia de arqueo” |
| “CRM integrado” | “La clienta que no vuelve aparece sola con un WhatsApp listo” |

---

## 3. Membresías + sorteos por número de ticket = retención salvaje

### 3.1 Dos motores que se refuerzan

| Motor | Qué hace | Para quién brilla |
|-------|----------|-------------------|
| **Membresía / abono** | Cobra **antes** o en ciclo; da cupos o ilimitado | Pelu, gym, yoga, lavadero, vet plan |
| **Sorteo por ticket** | Cada venta genera **nº de ticket** que participa | Kiosco, almacén, ferretería, shop, bar | 
| **Combo** | Socio de plan **entra al sorteo con más chances** o tickets bonus | Todos los de arriba |

**Historia de venta unificada:**  
> “No solo cobrás mejor: **hacés que vuelvan**. Plan para las fieles + sorteo para las del mostrador.”

### 3.2 Membresías (reuso del motor gym → cualquier abono)

Concepto de plan (independiente del rubro):

| Campo | Uso |
|-------|-----|
| Nombre + precio + periodicidad | “4 cortes / $40.000 / mes” |
| Créditos por período (opcional) | 4 usos; o ilimitado |
| Beneficio extra | +2 chances en sorteo del mes |
| Estado | activa / mora / suspendida |
| Acción al uso | Completar turno/venta → −1 crédito |

**Landings de membresía no venden “módulo membresías”.** Venden:

- Ingreso predecible  
- Menos no-shows  
- Lista de quién está por irse  
- Tortuga: *“clientas sin plan que ya te conocen”*

### 3.3 Sorteos para clientes recurrentes (por número de ticket)

**Mecánica simple (legal-friendly, transparente):**

1. Cada venta POS / ticket interno genera **número correlativo** (ya natural en caja).  
2. El cliente ve en el ticket: `Participás del sorteo #MES con el nº 1.847`.  
3. Reglas del mes:  
   - 1 ganador cada N tickets, o  
   - 1 ganador el último día del mes entre tickets del período, o  
   - solo tickets > $X, o solo socios con membresía.  
4. Sorteo: seed público o “bolillero” digital (número ganador = f(rango, semilla del día)).  
5. Publicación: cartel en local + WhatsApp a ganador + registro en sistema (auditoría).  
6. Premio: crédito en cuenta, producto, mes de plan gratis, descuento próxima compra.

**Por qué pagan el software por esto**

| Tortuga | Cómo el sorteo la tapa |
|---------|-------------------------|
| “Compro en el de al lado igual” | Incentivo a **pasar el ticket acá** |
| Ticket chico / una sola cosa | “Sumá $X y entrás al sorteo” → sube ticket medio |
| Sin base de datos de clientes | Teléfono en ticket o al cobrar para avisar si gana |
| Fidelidad cara (puntos complejos) | Sorteo es **entendible en 5 segundos** en barrio |

**Copy landing kiosco/almacén:**

> “Cada ticket es un número. Fin de mes sorteamos delante de todos.  
> Tus clientes vuelven **por el número** — y vos te quedás con el ticket medio y el dato.”

**Copy landing pelu + combo:**

> “Plan de 4 cortes + **doble chance** en el sorteo del salón.  
> Las clientas pagan el mes; las walk-in pelean el número. Las dos vuelven.”

### 3.4 Relación membresía ↔ ticket ↔ sorteo (diagrama mental)

```
                    ┌─────────────────┐
   Walk-in ────────►│  Ticket nº N    │──► entra a urna del mes
                    └────────┬────────┘
                             │
   Abonada ──paga mes──► Plan activo ──turno──► -1 cupo
        │                      │
        └──── bonus chances ───┴──► misma urna (peso 2x)
                             │
                             ▼
                    Sorteo fin de mes → premio / crédito
                             │
                             ▼
                    Recomendación home:
                    "32 tickets sin tel. cargado · no vas a poder avisar al ganador"
```

Esa última línea es **tortuga de datos**: la landing y el home la tienen que gritar.

### 3.5 Cumplimiento y sentido común (no romper el negocio)

- No prometer “juegos de azar” regulados tipo casino si el premio es marketing del local: **promoción comercial / sorteo de fidelización** con bases claras.  
- Bases simples visibles: fechas, quién participa, cómo se elige, premio, no canjeable por efectivo si no quieren.  
- Guardar log: rango de tickets, semilla, ganador, quién ejecutó el sorteo.  
- Opt-in WhatsApp para aviso de ganador (dato útil + menos spam legal).

---

## 4. Comercialización salvaje: un proceso, mil caras

### 4.1 Principio de reutilización

```
PROCESO INTERNO CLAVER
   (cobranza, abono, ticket, sorteo, agenda, IVA, portal)
           │
           ├─► Skin rubro (pelu, kiosco, gym…)
           ├─► Skin profesional (estudio contable, bufete)
           ├─► White-label partner
           ├─► Portal del cliente final del estudio
           └─► API / “app” suelta en marketplace (sub-SaaS)
```

**No inventar un ERP por vertical.**  
**Inventar un discurso y un empaque** por vertical sobre 5–7 motores.

### 4.2 Matriz “quién vende / quién usa / quién paga”

| Escenario | Quién vende | Quién usa día a día | Quién paga a Claver | Qué ve en pantalla |
|-----------|-------------|---------------------|---------------------|--------------------|
| A. Directo calle | Claver / vendedor | Dueño del local | El local | Brand Claver + rubro |
| B. Partner implementador | Partner | Dueño del local | Local (comisión partner) | Claver o co-brand |
| C. Estudio contable | Contador | Comerciante cliente del estudio | Estudio (multi-empresa) o cada cliente | Logo del estudio |
| D. Bufete / estudio jurídico | Abogado / estudio | Estudio + a veces cliente | Estudio | “Portal del Estudio X” |
| E. Franquicia / cadena chica | Casa central | Sucursales | Casa central | Marca del cliente |
| F. Revendedor de proceso | Agency / “te digitalizo” | PyME | PyME o agency | White-label total |

El **Programa Partner** ya cubre comisiones N1/N2 si el cliente **paga** (no pirámide de recluta).  
Los escenarios C–F son **el mismo multi-tenant** con capa de marca + permisos + facturación agregada.

### 4.3 Ejemplo: vas a un centro de abogados

**No digas:** “Les vendo un ERP con 40 módulos.”  
**Decí:** “Les dejo el sistema **con la cara del estudio** para que dejen de perseguir expedientes, cuotas de clientes y turnos en WhatsApp suelto.”

| Tortuga del bufete | Motor reutilizado | Skin “Estudio Jurídico” |
|--------------------|-------------------|-------------------------|
| Cliente no paga honorarios | Leo + CC + link MP | “Honorarios pendientes” |
| Causas / asuntos sin seguimiento | Agenda + tareas + estados | “Expedientes / asuntos” (no HC médica) |
| Abonos de cliente (pack horas/mes) | Membresías / créditos | “Plan de asesoramiento 4 h/mes” |
| Recordatorios de audiencia | WA / notificaciones | Copy jurídico |
| Portal del cliente del estudio | Portal B2B / stakeholder | “Mis casos y facturas” |
| El estudio atiende 50 PyMEs y les quiere **revender** cobranzas | Multi-empresa + partner | Cada PyME = tenant o subcuenta |

**Pitch 20 segundos en la reunión:**

> “Hoy el estudio cobra cuando se acuerda. Con esto cada cliente tiene plan o cuota,  
> se manda el recordatorio con tu logo, y si tenés comercios entre tus clientes,  
> les activás fiado o abonos **sin que construyas software**.”

**Modelo de plata:**

| Item | Quién paga |
|------|------------|
| Setup white-label estudio | Estudio (one-shot) |
| N empresas hijas (clientes del estudio) | Estudio pack o por seat |
| Add-on Leo / abonos en cada PyME | PyME o markup del estudio |
| Comisión si el estudio es partner | Claver → estudio |

### 4.4 Ejemplo: bufete / estudio de contadores que automatiza a *sus* clientes

El contador es el **mejor revendedor de tortugas** de Argentina: ve 30–200 comercios, conoce el dolor, y odia el Excel ajeno.

| Qué le duele al contador | Qué le ofrecés | Qué le duele a su cliente (comercio) | Qué se activa |
|--------------------------|----------------|--------------------------------------|---------------|
| Pedir “mandame el Excel” | Portal: ventas/compras ya cargadas | No quiere cargar dos veces | POS + compras + export contador |
| Perseguir monotributo / IVA | Alertas + export libro | Multa / desorden | Impuestos + recordatorios |
| Cliente no le paga el estudio | Recurrente + Leo al *comercio→estudio* | “El contador me cobra y no sé” | Factura recurrente honorarios |
| Quiere diferenciarse | White-label “Suite del Estudio López” | Confía en el contador, no en un SaaS random | Skin + onboarding por el estudio |
| Quiere ingreso extra | Partner 20–30% | — | Ref link + comisión |

**Pitch al contador:**

> “No te pedimos que dejes el estudio.  
> Te damos la fábrica: tus clientes operan en Claver con **tu marca**,  
> vos ves lo fiscal, cobrás honorarios solo, y si querés te llevás comisión  
> cuando ellos activan fiado, cobranzas o abonos.”

**Landings específicas (recomendadas):**

1. `/para/contadores` — tortugas del estudio + tortugas de sus clientes  
2. `/para/estudios-juridicos` — honorarios + asuntos + reventa a PyME  
3. `/para/implementadores` — partner clásico  
4. Cada una con bloque: **“Lo que se les está escapando ahora”** (lista T01–T10 filtrada)

### 4.5 Formas de “consumir o revender” el mismo proceso

| Forma | Descripción | Ejemplo |
|-------|-------------|---------|
| **1. App del marketplace** | SKU instalable | `pos.fiado_barrio`, `intang.cobranzas_wa`, futuro `fidel.sorteo_ticket` |
| **2. Pack rubro** | Bundle de SKUs + nav + seeds | Almacén Rosario, Gym, Pelu Plan |
| **3. Ancla freemium** | Entrar gratis, upsell tortuga | Fiado gratis → Leo pago |
| **4. White-label estudio** | Dominio/logo/colores del partner | estudio-lopez.claver.app |
| **5. Portal multi-cliente** | Un login ve N empresas | Contador con 40 comercios |
| **6. API / automation** | n8n, webhooks | “Cuando venta > X, sumar chance sorteo” |
| **7. Empleado digital** | Agente con HITL | Leo, mañana “Sofía agenda” |
| **8. Kit hardware + proceso** | Caja lista | Kiosco: pistola + ticket + sorteo impreso |
| **9. Capacitación + playbook** | El proceso es el PDF + el sistema | Runbook “Sorteo 30 días” |
| **10. Sub-SaaS con marca propia** | Micro producto con landing propia | “Claver Abonos”, “Claver Sorteos”, “Claver Honorarios” |

**Salvaje pero ordenado:** no son 10 productos de ingeniería.  
Son **10 empaques comerciales** de 5 motores.

---

## 5. Motores canónicos (la fábrica real)

Todo lo anterior se reduce a esto. Si el motor existe, la reventa es copy + permisos + marca.

| Motor | Nombre interno posible | Inputs | Outputs | Skins |
|-------|------------------------|--------|---------|-------|
| **M1 Deuda / CC** | Fiado + cuentas cobrar | Cliente, saldo, límite | Cobro, aging, Leo | Kiosco, flota, honorarios |
| **M2 Abono / cupos** | Membresías | Plan, créditos, vigencia | Uso, mora, MRR | Pelu, gym, lavadero, pack horas abogado |
| **M3 Ticket + urna** | Sorteo / fidelidad ticket | Nº ticket, reglas, premio | Ganador, tráfico | Retail, bar, shop estación |
| **M4 Agenda + seña** | Turnos | Slot, profesional, recordatorio | Menos no-show | Pelu, vet, estudio, taller |
| **M5 Recurrente $** | Facturación recurrente | Concepto, día de mes, MP | Cargo automático | SaaS del local, honorarios, alquiler |
| **M6 Portal tercero** | Portal stakeholder / B2B | Rol externo | Self-service | Contador, cliente del bufete, flota |
| **M7 Marca ajena** | White-label + partner | Logo, ref, comisión | Reventa | Estudios, implementadores |

**Roadmap comercial de tortugas (orden sugerido):**

1. M1 + recomendaciones home (ya más maduro)  
2. M2 créditos (cerrar loop pelu/gym)  
3. M3 sorteo por ticket (alto wow en calle, bajo costo cognitivo)  
4. M6+M7 pack “Estudio” (multiplicador de cuentas)  
5. Empleados digitales por tortuga (no por módulo)

---

## 6. Cómo se vende (guiones y ofertas)

### 6.1 Ofertas atómicas (una tortuga = una oferta)

| Oferta de calle | Incluye | Precio mental |
|-----------------|---------|---------------|
| **Libreta que cobra** | Fiado + Leo trial | “Se paga con un fiado” |
| **Abono que ordena el mes** | Membresías + agenda | “2 planes nuevos pagan Claver” |
| **Ticket que vuelve** | Sorteo + ticket con nº + WA ganador | “Sube el ticket medio sin descuento permanente” |
| **Estudio en piloto** | 5 clientes del contador + portal | Setup + pack seats |
| **Bufete ordenado** | Honorarios + asuntos livianos + portal | Mensual estudio |

### 6.2 Guion 1 — Peluquería (membresía + sorteo)

1. Tortuga: “¿Cuántas clientas vienen 1 vez y desaparecen?”  
2. Motor: plan 4 cortes + sorteo del salón con bonus a abonadas.  
3. Demo 5 min: alta plan, alta clienta, ticket con nº.  
4. Cierre: 7 días, sin permanencia.  
5. Pedido: 2 intros a otras pelus del mismo building / IG.

### 6.3 Guion 2 — Kiosco (ticket + tortuga de fiado)

1. Tortuga: fiado + “el de al lado se lleva la venta”.  
2. Motor: libreta + cada ticket participa del sorteo del mes.  
3. Cartel: “Guardá el ticket — sorteo el 30”.  
4. Upsell Leo cuando hay cartera.  
5. Partner: el mayorista o el contador del kiosquero.

### 6.4 Guion 3 — Estudio contable (reventa)

1. Tortuga del estudio: horas muertas pidiendo Excel.  
2. Tortuga del cliente: AFIP, fiado, precios.  
3. Oferta: “Activamos 3 comercios tuyos en blanco con tu logo”.  
4. El estudio elige: cobra fee de implementación + se queda partner.  
5. Claver no pelea al contador: **lo hace canal**.

### 6.5 Guion 4 — Centro de abogados

1. Tortuga: honorarios y clientes que “ya te pagan cuando pueden”.  
2. Plan de horas o cuota mensual (M2 + M5).  
3. Portal “mis facturas / mis vencimientos”.  
4. Si el estudio tiene clientes comercio: **un click** a packs calle (sin que el abogado implemente ERP).  
5. White-label: la secretaria opera “el sistema del estudio”, no “un Claver raro”.

### 6.6 Objeción común y respuesta

| Objeción | Respuesta |
|----------|-----------|
| “Ya tengo Instagram / Excel / Tango” | “Ninguno te dice cada mañana qué tortuga se te escapa en pesos y te deja un botón.” |
| “No quiero sorteos truchos” | “Bases claras, número de ticket, log del ganador. Es promoción de fidelidad, no casino.” |
| “Mis clientes no van a usar otro sistema” | “En el modelo estudio, **vos** los metés; ellos ven tu marca y un portal chico.” |
| “Suena a Amway” | “No pagamos por reclutar vendedores. Comisión solo si el comercio **paga el producto**.” |

---

## 7. Qué debe mostrar la landing (checklist de diseño)

### 7.1 Above the fold

- [ ] Rubro o rol en el título (“Para peluquerías”, “Para estudios contables”)  
- [ ] Una tortuga en pesos o %  
- [ ] CTA único (Probar 7 días / Pedir demo estudio)  
- [ ] Anti-grafo: si hay chart, es de **fuga**, no de vanity metrics  

### 7.2 Sección “Se te están escapando”

Lista de 4 tortugas con:

- nombre humano  
- síntoma  
- costo típico  
- botón “ver cómo se tapa” (scroll al motor)

### 7.3 Sección motores (máx. 3 por landing)

Ej. pelu: Abonos · Agenda · Sorteo bonus  
Ej. contador: Portal multi-cliente · Export fiscal · Partner fee  

### 7.4 Sección reventa (siempre, aunque chica)

> “¿Atendés a 10+ comercios o tenés estudio?  
> Llevate esto con tu marca y comisión por cliente activo.”

Link a `/claver/partners` o form “Soy contador / abogado / implementador”.

### 7.5 Sección confianza

- Sin permanencia / trial  
- Datos del tenant aislados  
- “No vendemos humo de surtidores / 40 verticales self-serve mágicos” (honestidad = conversión en PyME seria)

---

## 8. Home del producto = landing viva del tenant

La mejor landing es el **día 2 dentro del sistema**.

### 8.1 Widget “Tortugas de hoy” (prioridad P0 de producto comercial)

```
┌─────────────────────────────────────────────┐
│  Se te está escapando                       │
│  • $184.200 en deudas > 30 días   [Cobrar]  │
│  • 11 clientas sin plan (3+ visitas) [Plan] │
│  • Sorteo sin configurar este mes  [Armar]  │
│  • 6 turnos vacíos mañana          [Oferta] │
└─────────────────────────────────────────────┘
```

Reglas:

- Máximo 5 tortugas.  
- Orden por $ estimado o urgencia.  
- Cada una con **una** acción.  
- Si no hay datos: tortugas de **onboarding** (“Cargá 10 productos”, “Definí un plan”).

### 8.2 Recomendaciones constantes ≠ notificaciones spam

| Bien | Mal |
|------|-----|
| 1 vez al día, priorizadas, accionables | 40 badges rojos |
| Copy en plata y personas | “Error sync module_x” |
| Descartar “no me interesa” (aprende) | Repetir lo mismo 10 días |

---

## 9. SKUs / nombres de producto sugeridos (comercial)

| Nombre de vidriera | Motor | Canal principal |
|--------------------|-------|-----------------|
| **Claver Fiado** | M1 | Calle kiosco |
| **Claver Cobrá (Leo)** | M1 + agente | Calle + estudio |
| **Claver Abonos** | M2 | Pelu, gym, lavadero, honorarios |
| **Claver Ticket Suerte** | M3 | Retail, bar, shop |
| **Claver Turnos** | M4 | Servicios |
| **Claver Estudio** | M6+M7 + fiscal light | Contadores |
| **Claver Honorarios** | M2+M5+M1 skin jurídico | Abogados |
| **Claver Partner** | Comisiones | Revendedores |

Cada uno con **landing propia** y tortugas propias; atrás, la misma fábrica.

---

## 10. Plan de go-to-market en 3 oleadas

### Oleada 1 — Calle + prueba social (ahora)

- Landings tortuga: almacén/fiado, pelu abonos (aunque cupos semi-manuales).  
- Home con 3 recomendaciones fijas por pack.  
- Sorteo: MVP “rango de tickets del mes + ganador manual asistido” si hace falta.  
- 1 contador amigo como canal piloto (3 clientes).

### Oleada 2 — Motores que cierran solos

- Créditos de membresía al completar turno.  
- Sorteo con seed y log.  
- Pack white-label mínimo (logo + nombre + color).  
- Portal contador multi-empresa usable.

### Oleada 3 — Reventa salvaje ordenada

- Claver Estudio / Honorarios como packs.  
- Marketplace de “procesos” con runbooks.  
- Partners solo con producto que **cobra** (regla anti-Amway).  
- Empleados digitales por tortuga (no por vanity AI).

---

## 11. Métricas que importan (no vanity del grafo)

| Métrica | Por qué |
|---------|---------|
| Tortugas mostradas → CTA click → acción completada | Si el grafo no mueve esto, sobra |
| % tenants con ≥1 plan de abono activo | Salud M2 |
| % tickets del mes con participación sorteo | Salud M3 |
| $ recuperado Leo / $ SaaS | La tortuga T01 se paga sola |
| Cuentas creadas vía estudio/partner | Multiplicador |
| Churn 30/60/90 | Si solo hay chart, churnan; si tapan tortugas, renuevan |
| NPS del contador-canal | El revendedor es el activo |

---

## 12. Mensaje fundacional (para equipo y partners)

1. **No vendemos módulos; vendemos tortugas tapadas.**  
2. **No vendemos 40 verticales; vendemos 7 motores con mil caras.**  
3. **Landings y homes recomiendan en pesos, no decoran en charts.**  
4. **Membresía = ingreso predecible; ticket+sorteo = que vuelvan sin descuento eterno.**  
5. **Contadores y abogados no son solo clientes: son fábricas de tenants.**  
6. **Reventa sí; pirámide no — se gana cuando el usuario final paga un proceso real.**  
7. **White-label es respeto al canal: el sistema se ve de ellos, la fábrica es Claver.**

---

## 13. Próximos artefactos (si se baja a ejecución)

| Artefacto | Dueño sugerido | Depende de |
|-----------|----------------|------------|
| Wire home “Tortugas de hoy” | Producto / Grok | Señales fiado, agenda, planes |
| Landing `/para/contadores` | Comercial / Gemini copy | Pack estudio |
| Landing `/para/peluquerias` abono+sorteo | Comercial | M2 + M3 story |
| Spec `fidel.sorteo_ticket` | Ingeniería | Numeración ticket + log |
| Spec créditos en `PlanMembresia` | Ingeniería | Agenda/POS complete |
| Kit ventas estudio (PDF 2 págs) | Comercial | Este doc |
| Checklist white-label v0 | Cloud / ops | Logo, nombre, color, mail from |

---

## 14. Relación con docs existentes

| Doc | Relación |
|-----|----------|
| `docs/comercial/PROGRAMA_PARTNER_CLAVER.md` | Canal y comisiones (no pirámide) |
| `docs/comercial/OBJECIONES_VENTA.md` | Guiones de cierre calle |
| `docs/comercial/LEO_ONE_PAGER.md` | Tortuga T01 empaquetada |
| `docs/GO_LIVE_PRD.md` | Qué se puede prometer en PRD |
| `docs/qa/FALTANTES_TECNICOS_NICHOS.md` | Gaps reales vs overpromise |
| Membresías (`PlanMembresia` / `Membresia`) | Base M2 |
| Facturación recurrente | Base M5 |

---

## 15. Cierre

La comercialización salvaje no es inventar un software nuevo por cada oficina que visitas.  
Es **llegar con una tortuga en la boca**, taparla con un motor que ya existe,  
ponerle la **cara del que te abre la puerta** (peluquera, contador, abogado, partner),  
y dejar que ese mismo proceso se **consuma, se revenda y se recomiende solo**  
porque cada mañana el sistema dice:

> “Esto se te está escapando — tocá acá.”

Eso es más poderoso que cualquier grafo.

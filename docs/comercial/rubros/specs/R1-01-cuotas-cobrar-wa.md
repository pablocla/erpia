# SPEC R1-01 — Cuotas: Cobrar + WA + Bolas

## Dolor del cliente (1 párrafo es-AR)
El dueño del gimnasio o del club de barrio lleva las cuotas anotadas en un cuaderno o Excel desactualizado. Pierde muchísima plata porque no sabe quién tiene la cuota vencida justo cuando la persona entra por la puerta. El proceso de reclamar la plata es incómodo, y avisarles uno por uno por WhatsApp toma horas. Necesita ver de un vistazo rápido quién debe, cobrarle en un toque (incluso si paga la mitad) y mandarle un recordatorio al que no vino sin esfuerzo.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-CUOTAS` (basado en `/dashboard/membresias`).
- **Qué reutilizar:** El componente `CobrarDialog` que ya existe en Préstamos (`/dashboard/prestamos`) para manejar el pago parcial o total.
- **Qué NO construir:** No construir débito automático por CBU, integración con torniquetes de entrada física, ni un portal autogestivo para que el socio pague solo. Es un ERP de caja, el cobro es asistido.

## Happy path 90 segundos
**Ejemplo Gimnasio:**
1. El usuario entra a `dashboard/membresias`. Ve la lista de socios.
2. Identifica una fila con bola roja 🔴 (Vencido).
3. Toca el ícono de WhatsApp; se abre WA Web/App con el mensaje: "Hola Juan, te escribo del gym..."
4. Otro socio se acerca a la recepción. El usuario toca el botón "Cobrar" (ícono billete).
5. Ingresa el monto (pago total), toca confirmar. La fila pasa automáticamente a bola verde 🟢 (Al día).

**Ejemplo Escuela:**
1. El usuario entra a la lista. Ve a un alumno con cuota de este mes pendiente (bola amarilla 🟡 Vence hoy).
2. Toca "Cobrar", ingresa pago parcial, la bola queda violeta 🟣 (Pago parcial).
3. Envía recibo por WA desde el botón correspondiente.

## Tabla Labels × appId
Dependiendo de qué nicho se instaló (el `appId`), la UI debe adaptar la palabra principal:

| appId | Label Principal (Sujeto) |
|---|---|
| `gimnasio` / `gimnasio_barrio` | Socio |
| `club_barrio` | Socio |
| `escuela_barrio` | Alumno |
| `colonia_verano` | Colono / Alumno |
| `pena_folklore` | Peñero |
| `cooperativa_cuotas` | Asociado / Miembro |

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Cobrar Cuota** | Abre modal `CobrarDialog` con sugerencia del total adeudado. | Vencido 🔴, Vence Hoy 🟡, Parcial 🟣 | Préstamos/Fiado |
| **WA Moroso** | Abre link `wa.me` con plantilla de cobro. | Vencido 🔴, Parcial 🟣 | Base WA |
| **WA Recibo** | Envía comprobante de pago recién hecho. | Al Día 🟢 (después de cobrar) | Préstamos |

## Copy es-AR (empty, toast, WA)
- **Empty State:** "Todavía no cargaste a nadie. Empezá agregando tu primer socio para llevarle la cuota al día."
- **Toast Éxito:** "¡Cobro registrado! La cuota quedó al día."
- **WA Plantilla 1 (Recordatorio/Moroso):** "Hola {{nombre}}, te escribo del {{negocio}}. Te aviso que tenés pendiente la cuota de {{monto}}. Avisame cuando pases o si querés transferir."
- **WA Plantilla 2 (Recibo):** "Hola {{nombre}}, recibimos tu pago de {{monto_cobrado}}. Ya estás al día, ¡gracias!"

## Seeds demo mínimos (3 registros con sentido)
(Archivo: `industry-demo-seeds.ts` para M-CUOTAS)
1. **Marcos "Toro" Silva:** Cuota vencida hace 10 días ($15.000). Bola 🔴.
2. **Julieta Rivas:** Vence hoy ($20.000). Bola 🟡.
3. **Carlos Pérez:** Pagó la mitad ayer ($10.000 de $20.000). Bola 🟣.

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Llevá el control exacto de quién pagó, quién debe y mandá avisos automáticos."
- ❌ **Promesa NO:** "Se cobra solo por débito automático y le bloquea el molinete al que debe."

## % actual → % meta
**55% / 38%** (dependiendo el rubro) → **Meta: ≥70%**

## DoD Grok (lista checkbox)
- [ ] Adaptar `/app/dashboard/membresias/page.tsx` para soportar las etiquetas dinámicas por `appId` (Socio vs Alumno).
- [ ] Mapear la data de cuotas al sistema de bolas de estado (Verde, Amarillo, Rojo, Violeta).
- [ ] Integrar el `<CobrarDialog>` (mismo de `prestamos`) en las filas de deudores.
- [ ] Agregar botones de WhatsApp (`wa.me`) con las 2 plantillas de texto definidas, leyendo el teléfono del cliente.
- [ ] Incluir seeds en `industry-demo-seeds.ts` para poder mostrar la demo (gym y escuela).

## Fuera de alcance
- Facturación electrónica recurrente masiva (AFIP automática) en este primer paso.
- Portal de autogestión de clientes.
- Control de acceso por molinetes.

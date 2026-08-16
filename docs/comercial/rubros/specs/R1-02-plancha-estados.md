# SPEC R1-02 — Plancha / Tintorería: Estados y Cobro

## Dolor del cliente (1 párrafo es-AR)
El dueño de una tintorería o lavadero de plancha anota los pedidos en libretitas o talonarios de papel. La ropa se amontona en las perchas y no tienen cómo avisarle rápido a la gente que sus prendas ya están listas. Cuando el cliente aparece para retirar, es un lío buscar el papelito para ver cuánto debe o si dejó una seña. Necesitan un sistema rápido donde puedan cargar el pedido, pasar el estado a "listo" (que le mande un WA automático al cliente) y cobrar el saldo final al momento de entregar la ropa.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-MOV` (Motor de Movimientos/Operaciones).
- **Qué reutilizar:** Las listas con filtro de estados, el componente de `<CobrarDialog>` para manejar señas y saldos, y la búsqueda rápida por DNI/Teléfono/Ticket.
- **Qué NO construir:** No construir integración con máquinas de lavado industriales, módulos de inventario de químicos de limpieza, ni gestión de rutas complejas para retiro a domicilio. Es mostrador puro.

## Happy path 90 segundos
1. Llega un cliente y deja 2 trajes. El usuario toca "Nuevo Pedido", pone el nombre, el teléfono y el monto total ($20.000). El estado arranca en `Recibido`.
2. El empleado plancha los trajes al día siguiente. Entra al sistema y toca el botón **"Marcar Listo"**. El estado pasa a `Listo` 🟢 y se dispara un WhatsApp automático: "¡Tus prendas ya están listas para retirar!".
3. El cliente viene al local. El usuario lo busca por los últimos 4 dígitos del celular.
4. Toca el botón **"Cobrar y Entregar"**. Se abre el modal de cobro sugerido por el total. 
5. Confirma el cobro y el pedido pasa a estado `Entregado` (cerrado/gris).

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Marcar Listo** | Pasa el pedido de En Proceso a Listo y abre WA para avisar. | Recibido ⚫ / En Proceso 🟡 | Movimientos |
| **WA Listo** | Abre `wa.me` con plantilla de aviso de retiro. | Listo 🟢 | Base WA |
| **Cobrar Retiro** | Abre `CobrarDialog` por el saldo pendiente (si hay seña). Cierra el ticket. | Listo 🟢, Recibido ⚫ | Préstamos/Fiado |
| **Registrar Seña** | Cobra un parcial adelantado. | Recibido ⚫ | Préstamos/Fiado |

## Copy es-AR (empty, toast, WA)
- **Empty State:** "La percha está vacía. Empezá cargando tu primer pedido para organizarte."
- **Toast Éxito:** "¡Pedido listo! No te olvides de mandarle el WhatsApp."
- **WA Plantilla 1 (Aviso Listo):** "Hola {{nombre}}, te aviso de la tintorería que tu pedido (Ticket #{{id}}) ya está listo y planchado para que pases a retirar. Saldo pendiente: {{monto}}."
- **WA Plantilla 2 (Recibo/Entregado):** "Hola {{nombre}}, ya te entregamos tus prendas. ¡Gracias por confiar en nosotros!"

## Seeds demo mínimos (3 registros con sentido)
(Archivo: `industry-demo-seeds.ts` para Plancha)
1. **Ticket #1001 (Traje azul):** `En Proceso`. Deuda: $15.000 (sin seña). Bola 🟡.
2. **Ticket #1002 (Sábanas y toallas):** `Listo`. Deuda: $5.000 (dejó $5.000 de seña). Bola 🟢.
3. **Ticket #1003 (Pantalón de vestir):** `Entregado/Cobrado`. Saldo $0. Bola ⚪ (cerrado).

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Controlás qué ropa está pendiente, qué está para retirar, y le avisás al cliente por WhatsApp con un botón."
- ❌ **Promesa NO:** "Se conecta con tus lavadoras automáticas y gestiona la hoja de ruta del chofer que retira a domicilio."

## % actual → % meta
**45%** → **Meta: ≥70%**

## DoD Grok (lista checkbox)
- [ ] Implementar máquina de estados en el modelo de Movimientos/Operaciones: `recibido` → `en proceso` → `listo` → `entregado`.
- [ ] Mapear los estados a las bolas de colores (Gris=Recibido, Amarillo=En proceso, Verde=Listo, Transparente=Entregado).
- [ ] Agregar buscador que filtre por teléfono y por número de ticket.
- [ ] Implementar el botón "Marcar Listo" que cambia el estado y genera el link de WA.
- [ ] Integrar `<CobrarDialog>` para "Cobrar Retiro" y "Registrar Seña".
- [ ] Cargar los 3 seeds de la tintorería.

## Fuera de alcance
- Facturación automática en el mostrador para tintorerías (AFIP pos-cobro).
- Lector de código de barras para perchas en este release.

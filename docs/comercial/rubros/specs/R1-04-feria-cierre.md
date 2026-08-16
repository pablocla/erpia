# SPEC R1-04 — Feria/Puesto: Cierre del Día

## Dolor del cliente (1 párrafo es-AR)
El puestero de una feria o mercado vende rápido todo el día, cobra en efectivo o con transferencias y al final de la jornada tiene toda la plata mezclada en la riñonera. Llega a la casa agotado y no sabe bien cuánto vendió, cuánto gastó en el almuerzo y flete, y si ya le separó la cuota del espacio al organizador de la feria. Necesita apretar un solo botón al final del día que le diga "vendiste X, gastaste Y, te queda Z limpio" y poder mandarle ese reporte rápido por WhatsApp al organizador para que no lo moleste más.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-MOV` (Movimientos de Caja básicos diarios).
- **Qué reutilizar:** El módulo de Caja actual, creando un *wrapper* o vista simplificada llamada "Cierre de Feria" que consolida ingresos y egresos del día en una sola pantalla clara.
- **Qué NO construir:** No construir un sistema multi-puesto para el organizador central, no hacer división compleja de turnos por empleados, ni control de inventario exhaustivo por talles y colores en este flujo.

## Happy path 90 segundos
1. El puestero está armando los bolsos a las 19:00 hs. Toca el botón gigante que dice **"Cierre del día"**.
2. Se abre una pantalla modal limpia que dice: "Hoy: $150.000 en ventas. Gastos: $10.000 (Comida/Flete). Neto: $140.000".
3. Abajo aparece un campo opcional: "Cuota de la feria / Espacio". Pone $20.000. 
4. El sistema le muestra su GANANCIA LIMPIA: $120.000.
5. Toca el botón **"Guardar y Avisar"**. Esto asienta el gasto de la cuota en la caja y abre WhatsApp con un mensaje prearmado para el organizador de la feria.

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Cierre del día** | Abre el modal resumen consolidando las ventas/gastos de `Date.today`. | Visible siempre en pantalla principal. | Caja (Cierre Z simplificado) |
| **WA Organizador** | Abre `wa.me` con el reporte del día y aviso de cuota paga/pendiente. | Al hacer el Cierre de Feria. | Base WA |
| **Gasto Rápido** | Botón veloz para cargar "comida" o "flete" en 2 toques. | - | Nuevo Gasto (Caja) |

## Copy es-AR (empty, toast, WA)
- **Empty State:** "La feria recién arranca. Registrá tu primera venta del día para ver cómo venimos."
- **Toast Éxito:** "¡Cierre guardado! Alto día de laburo."
- **WA Plantilla 1 (Resumen Organizador):** "Hola, te paso el cierre del puesto. Ventas totales: {{monto_ventas}}. Ya dejé separada la cuota de la feria ({{monto_cuota}}). Avisame cualquier cosa."

## Seeds demo mínimos (3 registros con sentido)
(Archivo: `industry-demo-seeds.ts` para Feria)
1. **Ingresos Varios:** 15 ventas chicas sumadas como $150.000. Bola 🟢.
2. **Gasto: Comida / Flete:** $8.000 de sanguchitos y bebida. Bola 🔴.
3. **Gasto: Canon Feria:** $15.000 pago al organizador. Bola 🔴.

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Apretás un botón y sabés exactamente cuánta plata limpia te llevás a tu casa, sin usar la calculadora."
- ❌ **Promesa NO:** "El sistema administra a todos los puesteros de la feria y gestiona la habilitación municipal."

## % actual → % meta
**35%** → **Meta: ≥55%**

## DoD Grok (lista checkbox)
- [ ] Crear el componente `<CierreFeriaModal>` que lea el total de ingresos y egresos del día desde la tabla de movimientos/caja.
- [ ] Incluir en el modal un input opcional rápido para "Cuota de Feria / Espacio" que lo reste del neto visualmente.
- [ ] Al guardar, generar el movimiento de caja (si cargó cuota) y mostrar el botón de WA al organizador.
- [ ] Crear el botón principal (1-tap) "Cierre del día" visible en el dashboard del `appId` feria.
- [ ] Cargar los 3 seeds específicos de Feria para mostrar la demo del cierre.

## Fuera de alcance
- Facturación electrónica AFIP ticket a ticket (el feriante suele facturar global al final, o no factura en el acto).
- Gestión multi-puesto o liquidaciones a empleados.

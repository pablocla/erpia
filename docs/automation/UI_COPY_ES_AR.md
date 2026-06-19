# Copywriting UI — Módulo de Automatización (es-AR)

Este documento define la guía de textos, alertas, tooltips y wizards para el panel de `/dashboard/automatizacion`, asegurando una comunicación clara orientada a PyMEs argentinas.

---

## 🧭 Asistente de Configuración (Wizard de 4 Pasos)

### Paso 1: Conectar
*   **Título**: Conectá tu motor n8n
*   **Descripción**: Vinculá tu servidor local o en la nube para procesar eventos.
*   **Campos**:
    *   *URL Base*: "Ingresá la dirección de tu n8n (ej. https://n8n.tuempresa.com)"
    *   *Webhook Secret*: "Generá o pega una llave segura para firmar los datos salientes."

### Paso 2: Catálogo de Eventos
*   **Título**: Elegí qué eventos enviar
*   **Descripción**: Activá o desactivá los triggers que NOP disparará de manera automática.
*   **Copy Checkboxes**:
    *   `VENTA_EMITIDA`: "Cada vez que factures o emitas un ticket fiscal en el mostrador."
    *   `STOCK_BAJO`: "Alertas cuando el inventario cruce el stock mínimo."

### Paso 3: Empleados Virtuales
*   **Título**: Asigná tus Workers
*   **Descripción**: Activá bots con perfiles predefinidos para gestionar tareas internas.
*   **Copy Bot**: "Ana Reposición controlará tus faltantes y armará órdenes de compra borrador en horario de depósito."

### Paso 4: Probar y Activar
*   **Título**: Probá la conexión
*   **Descripción**: Hacé clic en "Enviar evento de prueba" para despachar un webhook ficticio y validar que tu n8n responda HTTP 200.

---

## 🚨 Estados Vacíos (Empty States)

### 1. Sin Workflows Parametrizados
*   **Título**: Tu negocio todavía no tiene flujos activos
*   **Cuerpo**: Conectá n8n para delegar la creación de tareas, el control de stock mínimo y el aviso de deudas a tus empleados virtuales.
*   **Botón de Acción**: "Configurar Automatización"

### 2. Sin Logs de Ejecución
*   **Título**: Nada por acá todavía
*   **Cuerpo**: Las últimas ejecuciones y webhooks despachados se listarán en esta pantalla en tiempo real una vez que el sistema empiece a procesar eventos.

---

## 🔌 Modo de conexión n8n (pestaña Conexión)

*   **Label**: Modo de conexión n8n
*   **Opción Webhook**: "Webhook saliente (NOP → n8n)" — recomendado si tu red permite POST salientes.
*   **Opción Poll**: "Poll (n8n consulta /api/automation/poll)" — para firewalls estrictos sin egress.
*   **Opción Ambos**: "Ambos (webhook + cola poll)" — redundancia y debugging.
*   **Tooltip / ayuda**: "Usá Poll si tu firewall bloquea POST salientes desde NOP hacia n8n."

---

## 📊 Card Plan y uso del mes

*   **Título**: Plan y uso del mes
*   **Subtítulo**: `SKU automation.n8n_hub · NOP Automation Hub`
*   **Badge activo**: Suscripción activa
*   **Badge inactivo**: Inactiva
*   **Texto uso**: `{mes}: {usado} / {limite} eventos` o `{usado} eventos (sin límite)`
*   **Alerta 90%**: "Cerca del límite mensual"
*   **Alerta 100%**: (mismo copy que Límite Excedido abajo)

---

## ℹ️ Mensajes de Error Comunes

*   **Firma Inválida (HMAC)**: "⚠️ Firma HMAC rechazada. Validá que la llave secreta en n8n coincida con la configurada en NOP."
*   **Límite Excedido**: "⚠️ Plan superado. Tu límite de eventos mensuales para el módulo de automatización se agotó. Actualizá tu suscripción."
*   **Módulo no contratado**: "El módulo de automatización no está contratado. Contactá a soporte para activar automation.n8n_hub."
*   **Servidor Inalcanzable**: "❌ n8n no responde. NOP intentó enviar el webhook pero recibió un error de conexión o de timeout. Reintentando en background."
*   **Sin mapa de evento**: "No hay URL de webhook mapeada para este evento. Configurala en la pestaña Eventos."

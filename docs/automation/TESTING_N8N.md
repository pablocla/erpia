# Guía de Testing y Casos de Prueba — NOP Automation Hub

Este documento especifica los escenarios de prueba manuales y el checklist necesario para validar la orquestación entre NOP y n8n.

---

## 🧪 Casos de Prueba Manual (Ejemplos Clave)

### Caso 1: Despacho de Webhook Exitoso (VENTA_EMITIDA)
*   **Precondición**: Módulo `automation.n8n_hub` activo para el tenant. Webhook de venta mapeado a n8n.
*   **Acción**: Realizar una venta en `/dashboard/pos` y emitir el ticket.
*   **Resultado Esperado**:
    1. El Event Bus inyecta el evento en la cola.
    2. Se realiza una petición HTTP POST a n8n con cabecera `x-nop-signature`.
    3. El log en NOP muestra la ejecución con estado `exito: true`.

### Caso 2: Rechazo de Webhook con Firma HMAC Alterada
*   **Precondición**: n8n configurado para validar la firma.
*   **Acción**: Enviar un evento manual pero alterando un carácter de la llave secreta en la UI.
*   **Resultado Esperado**: n8n debe rechazar la llamada y responder HTTP 401. El log de NOP debe registrar el fallo.

### Caso 3: Control de Entitlement (Límites de Uso)
*   **Precondición**: Suscripción sin el SKU `automation.n8n_hub`.
*   **Acción**: Intentar mapear un webhook o forzar la emisión de un evento.
*   **Resultado Esperado**: El despachador bloquea la petición inmediatamente con código de error indicando plan no contratado.

### Caso 4: Modo Poll — evento en cola
*   **Precondición**: `metadata.modoConexion: "poll"` en Automatización. API Key y empresaId configurados.
*   **Acción**: Disparar `POST /api/automation/test` o una venta con mapa activo.
*   **Resultado Esperado**:
    1. Log outbound con `mode: poll` y `queued: true`.
    2. `GET /api/automation/poll` devuelve el envelope firmado en `events[]`.

### Caso 5: Modo Poll — ACK libera cola
*   **Precondición**: Cola con al menos 1 evento pendiente.
*   **Acción**: `POST /api/automation/poll` con `{ "ids": ["42"] }`.
*   **Resultado Esperado**: Segundo `GET /api/automation/poll` no devuelve el ID confirmado.

### Caso 6: Modo `both` — webhook + cola
*   **Precondición**: `modoConexion: "both"`, URL webhook válida.
*   **Acción**: Emitir `WEBHOOK_TEST`.
*   **Resultado Esperado**: POST a n8n **y** evento visible en poll simultáneamente.

### Caso 7: Límite mensual excedido en UI
*   **Precondición**: `UsageEvent` del mes ≥ `limiteEventosMes` de la suscripción.
*   **Acción**: Botón "Probar conexión" en `/dashboard/automatizacion`.
*   **Resultado Esperado**: Toast con mensaje *"Plan superado…"* (`usage_limit_exceeded`).

### Caso 8: Demo vs tenant sin SKU
*   **Precondición A**: Login demo (`POST /api/auth/demo`).
*   **Resultado A**: Card "Plan y uso del mes" visible; suscripción `automation.n8n_hub` activa.
*   **Precondición B**: Empresa nueva sin suscripción ni feature.
*   **Resultado B**: `GET /api/automation/config` → HTTP 402 `module_not_entitled`.

### Caso 9: Idempotencia en webhook duplicado
*   **Acción**: Reenviar el mismo payload con igual `idempotencyKey`.
*   **Resultado Esperado**: Segunda ejecución no duplica tarea ni re-procesa side-effects críticos.

### Caso 10: Timeout n8n
*   **Acción**: Mapear webhook a URL que no responde en 15 s.
*   **Resultado Esperado**: Log `timeout` o `error`; cola BullMQ reintenta hasta 3 veces.

---

## ✅ Checklist go-live n8n

- [ ] SKU `automation.n8n_hub` contratado o feature activa
- [ ] Webhook secret rotado y copiado en n8n
- [ ] API Key NOP configurada en variables `NOP_API_KEY`, `NOP_EMPRESA_ID`
- [ ] Modo conexión elegido (`webhook` / `poll` / `both`)
- [ ] Plantilla 09 importada si hay firewall sin egress
- [ ] `WEBHOOK_TEST` exitoso desde UI
- [ ] Logs en pestaña Ejecuciones sin errores 401/402

---

## 🐳 Docker Compose de Referencia para Staging (Self-Hosted n8n)

Para levantar un entorno local o de staging integrado, utiliza la siguiente plantilla básica de Docker Compose:

```yaml
version: '3.8'
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.local
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
      - NOP_BASE_URL=http://host.docker.internal:3000
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
```

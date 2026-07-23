# Cómo hablar con Leo (y agentes) por WhatsApp y Telegram

## Resumen

| Canal | Quién habla | Para qué |
|-------|-------------|----------|
| **WhatsApp (Twilio / Cloud API)** | Leo → **clientes** (cobranza) | Enviar recordatorios y recibos |
| **WhatsApp (webhook inbound)** | **Clientes** → Leo | "YA PAGUE" / "VER DEUDA" |
| **Telegram bot** | **Vos / dueño** → Leo | Operar el agente: run, pendientes, aprobar |

WhatsApp es el canal **de negocio** (deudores).  
Telegram es el canal **de control** (vos como dueño/admin).

---

## 1. Activar y probar Leo (sin WA real)

1. Login al dashboard  
2. Ir a **Empleados digitales** → **Activar Leo** (trial por defecto)  
3. Abrir panel Leo → **Vista previa** (no envía)  
4. **Correr ahora** → genera borradores  
5. **Aprobar** uno (o bulk)

Si no hay deudas: cargá un cliente con `fiadoHabilitado`, saldo negativo o CxC vencida + teléfono.

---

## 2. WhatsApp → clientes (outbound)

### Env (Vercel / `.env`)

```bash
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_FROM=+14155238886   # sandbox o número WA Business
```

Opcional Cloud API Meta:

```bash
WHATSAPP_CLOUD_TOKEN=EAAxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxx
```

### Flujo

1. Leo crea mensaje `estado=aprobado` (vos aprobás en UI o `/leo aprobar`)  
2. Cron `whatsapp-outbound` (cada tick) llama Twilio y marca `enviado`  
3. En dev sin Twilio: se loguea `[WhatsApp DEV]` y no falla

### Webhook inbound (cliente escribe)

`POST /api/webhooks/whatsapp` (Twilio form)

- Cliente: **YA PAGUE** → tarea HITL en Leo + aviso Telegram al dueño  
- Cliente: **VER DEUDA** → respuesta con saldo  

Configurá en Twilio el webhook a:

`https://TU_DOMINIO/api/webhooks/whatsapp`

Firma: `WEBHOOK_SECRET` / validarFirmaWebhook.

---

## 3. Telegram → vos controlás a Leo

### Env

```bash
TELEGRAM_BOT_TOKEN=123456:ABC...     # @BotFather
TELEGRAM_BOT_USERNAME=TuBotClaver    # sin @
TELEGRAM_WEBHOOK_SECRET=opcional
TELEGRAM_LINK_SECRET=mismo_que_CRON_o_random
```

### Webhook

`POST /api/webhooks/telegram`  

Una vez (con token):

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://TU_DOMINIO/api/webhooks/telegram"
```

### Vincular tu usuario

1. App → **Asistente IA / Notificaciones** → **Vincular Telegram**  
2. Abrí el deep link `t.me/TuBot?start=...`  
3. Bot confirma vinculación  

### Comandos Leo

| Comando | Acción |
|---------|--------|
| `/leo` | Estado (trial/activo, borradores) |
| `/leo activar` | Activa Leo trial |
| `/leo run` | Corre cobranzas (genera drafts) |
| `/leo pendientes` | Lista IDs a aprobar |
| `/leo aprobar 123` | Aprueba borrador #123 → cola WA |
| `/ayuda` | Lista todos los comandos |

Cuando Leo genera drafts, te manda un push por Telegram (si estás vinculado).

---

## 4. Checklist “puedo probar ya”

| Paso | Sin Twilio | Con Twilio | Con Telegram |
|------|------------|------------|--------------|
| Activar Leo | ✅ | ✅ | ✅ `/leo activar` |
| Vista previa | ✅ | ✅ | — |
| Generar drafts | ✅ | ✅ | `/leo run` |
| Aprobar | ✅ UI | ✅ UI | `/leo aprobar` |
| Cliente recibe WA | ❌ log only | ✅ | — |
| Dueño recibe aviso | ❌ | opcional WA | ✅ Telegram |

---

## 5. Troubleshooting

| Síntoma | Causa | Fix |
|---------|-------|-----|
| Activar falla | Admin role | Entrar como dueño/admin |
| Sin deudas en run | Fiado/CxC vacíos | Cliente saldo &lt; 0 o CxC vencida |
| Aprobado no sale | Sin Twilio | Env TWILIO_* o mirar logs DEV |
| Telegram no responde | Sin vínculo | Link desde Notificaciones |
| "Leo no activado" en TG | Otra empresa | Vincular con el tenant correcto |

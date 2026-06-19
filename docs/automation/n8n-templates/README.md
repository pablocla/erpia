# Plantillas n8n NOP — Guía de importación

Variables de entorno requeridas en n8n:

| Variable | Ejemplo | Uso |
|----------|---------|-----|
| `NOP_BASE_URL` | `https://app.tuempresa.com` | Base URL del ERP |
| `NOP_API_KEY` | (desde Automatización NOP) | Header `X-NOP-Api-Key` |
| `NOP_EMPRESA_ID` | `1` | Header `X-NOP-Empresa-Id` |

## Credencial HTTP Header (opcional)

Podés usar credencial `httpHeaderAuth` **o** headers explícitos en cada nodo (recomendado post OpenAPI 1.1).

## Catálogo

| Archivo | Trigger | Endpoint NOP |
|---------|---------|--------------|
| `01-morning-brief.json` | Cron 06:00 | `POST .../actions/trigger-playbook` |
| `02-stock-bajo-oc.json` | Webhook `STOCK_BAJO` | `POST .../actions/create-task` |
| `03-cobranza-whatsapp.json` | Webhook `CUENTA_VENCIDA` | `POST .../actions/create-task` |
| `04-cierre-caja-alerta.json` | Webhook `CAJA_ABIERTA` | `POST .../actions/create-task` |
| `05-nuevo-empleado-onboarding.json` | Webhook `USUARIO_CREADO` | `POST .../actions/create-task` |
| `06-pedido-b2b-picking.json` | Webhook `PEDIDO_CONFIRMADO` | `POST .../actions/create-task` |
| `07-cae-fallido-retry.json` | Webhook `CAE_RECHAZADO` | `POST .../actions/create-task` |
| `08-slow-mover-promo.json` | Webhook / cron | `POST .../actions/create-task` |
| `09-poll-consumer.json` | Schedule 3 min | `GET/POST .../poll` |

Todas las rutas inbound usan auth API Key + EmpresaId según `OPENAPI_AUTOMATION.yaml`.
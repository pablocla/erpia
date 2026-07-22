# Leo Cobranza — Empleado digital (implementación)

## Cómo está implementado

```text
Activación SKU
  empleado.leo_cobranza  ──hooks──► EmpleadoDigital (activo)
  intang.cobranzas_wa    ──hooks──► secretaria WA + Leo

Cron / manual
  orchestrator.runLeoCobranza
    → leer_deudas (SQL, tenant via cliente.empresaId)
    → router 0-token (skip | template | llm)
    → plantilla o personalizar_mensaje_llm
    → enviar_wa_borrador (MensajePendienteWhatsApp + EmpleadoDigitalTarea)
    → metering

HITL
  PATCH tareas/:id { accion: aprobar|rechazar }
    → mensaje WA estado=aprobado → cola whatsapp-outbound
```

## Archivos

| Capa | Path |
|------|------|
| Schema | `prisma/schema.prisma` → EmpleadoDigital* |
| Runtime | `lib/empleados-digitales/**` |
| API | `app/api/empleados-digitales/**` |
| UI | `app/dashboard/empleados-digitales/**` |
| Cron | `lib/scheduling/jobs/empleados-digitales.ts` |
| Hooks | `lib/platform/product-hooks.ts` |

## Deploy

```bash
npx prisma generate
npx prisma db push   # o migrate dev --name empleados_digitales
```

## Uso

1. Dashboard → **Empleados digitales** → Activar Leo  
2. **Correr ahora**  
3. Aprobar/editar borradores WA  
4. (Opcional) activar “LLM en casos difíciles”

## SKUs

- `empleado.leo_cobranza` — producto principal  
- `intang.cobranzas_wa` — alias: también provisiona Leo  

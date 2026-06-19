# Criterios de Selección: n8n vs. Operaciones Core NOP

El objetivo de integrar n8n no es reemplazar la lógica interna del ERP, sino extender la plataforma hacia sistemas de terceros. Este documento define cuándo implementar flujos dentro de NOP y cuándo derivarlos a n8n.

---

## 🆚 Tabla de Decisiones Técnicas

| Escenario | Usar n8n (Orquestador Externo) | Usar NOP (Lógica Core) |
|---|---|---|
| **Cobranza multi-canal** | ✅ (Twilio, Mailchimp, CRM) | ❌ (Solo emite deudas) |
| **Reposición básica de Stock** | ❌ (Demasiado lento) | ✅ (Procurement Guardian local) |
| **Control de Caja y Auditoría** | ❌ (Información sensible) | ✅ (Arqueo de caja in-app) |
| **Facturación AFIP** | ❌ (Requiere sincronía e IP certificada) | ✅ (Conexión directa SOAP AFIP) |
| **Sync con MercadoLibre** | ✅ (Mapeador de productos dinámico) | ❌ (Requiere OAuth recurrente) |
| **Alertas IoT** | ✅ (Despacho a canales de guardia) | ❌ |
| **Firewall estricto / sin egress** | ✅ Poll (`GET /api/automation/poll`) | ❌ Webhook saliente bloqueado |
| **Entitlements y cupo mensual** | ❌ (n8n no factura) | ✅ `SuscripcionModulo` + `UsageEvent` |

---

## 💡 Regla de Oro
*   **Regla interna**: Si la operación involucra más de 2 sistemas de software externos que no pertenecen a NOP (ej. Shopify + Salesforce + WhatsApp), delega el flujo a **n8n**.
*   **Regla core**: Si la operación afecta la consistencia de la base de datos (CxC, CxP, stock físico, contabilidad general), resuélvela de manera determinística en el backend de **NOP** mediante transacciones de Prisma.

# Matriz de QA & Casos de Prueba — Tier Gratis Ancla
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** qa | vitest | grok  
**Estado:** listo  
**Fuentes:** `CANON_FREE.md`

---

## 🧪 Matriz de Casos de Prueba (≥15 Escenarios PASS/FAIL)

| ID | Escenario de Prueba | Pasos de Ejecución | Resultado Esperado | Criterio PASS / FAIL |
|----|----------------------|--------------------|--------------------|----------------------|
| **QA-01** | Alta Self-Serve sin Tarjeta | Ingresar a `/f`, completar registro básico. | Cuenta creada en < 60s sin pedir tarjeta ni CBU. | PASS |
| **QA-02** | Límite de 1 Caja en Gratis | Intentar agregar una 2ª caja sin plan pago. | Bloqueo por paywall `paywall.multicaja`. | PASS |
| **QA-03** | Límite de 2 Usuarios | Intentar invitar a un 3er usuario en gratis. | Modal de restricción `paywall.usuarios`. | PASS |
| **QA-04** | Bloqueo de WhatsApp Outbound | Intentar enviar WhatsApp automático sin extra. | Redirección a modal `paywall.whatsapp`. | PASS |
| **QA-05** | Bloqueo Facturación AFIP | Intentar emitir comprobante fiscal AFIP sin extra. | Modal `paywall.afip`. | PASS |
| **QA-06** | Registro de Fiado | Cargar cliente "Pérez" con saldo $5.000. | Reflejo inmediato en "Quién me debe". | PASS |
| **QA-07** | Cobro Parcial de Fiado | Registrar pago de $2.000 a cuenta de Pérez. | Saldo remanente actualizado a $3.000. | PASS |
| **QA-08** | Venta en POS Mostrador | Cargar 2 productos y presionar "Cobrar Efectivo". | Movimiento registrado en caja del día. | PASS |
| **QA-09** | Arqueo y Cierre de Caja | Presionar "Cerrar Caja". | Resumen de efectivo coincide con ventas del día. | PASS |
| **QA-10** | Acceso Directo por Landing `/f` | Navegar a `claver.com.ar/f`. | Carga rápida mobile-first con CTA a registro free. | PASS |
| **QA-11** | Dominio Canónico | Verificar URLs de redirección. | Todas las rutas pertenecen a `claver.com.ar`. | PASS |
| **QA-12** | Menú Simplificado | Iniciar sesión como cajero. | Opciones de configuración pesada u oficios no visibles. | PASS |
| **QA-13** | Reportes de Hoy / Ayer | Consultar ventas del día actual y previo. | Acceso permitido sin restricciones. | PASS |
| **QA-14** | Bloqueo Reportes 12M | Seleccionar rango histórico > 48h / anual. | Trigger de paywall `paywall.analytics`. | PASS |
| **QA-15** | Preservación de Datos en Gratis | Cerrar sesión y volver a ingresar a los 7 días. | Saldos y clientes intactos sin requerir pago. | PASS |

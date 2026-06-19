---
title: "Catálogo de Empleados Virtuales"
description: "Definición y catálogo de bots técnicos y playbooks automatizados en NOP."
sidebar_position: 4
tags: ["automation", "virtual-workers", "playbooks"]
audience: analista
layer: 1-config
last_verified: 2026-06-19
status: completo
---

# Catálogo de Empleados Virtuales y Playbooks

Un **Empleado Virtual (AutomationVirtualWorker)** es una entidad lógica dentro de NOP que opera de manera autónoma ejecutando **Playbooks**. A diferencia de un asistente de lenguaje natural (LLM), un empleado virtual ejecuta flujos determinísticos basados en reglas y parámetros JSON fijos asignados por el analista técnico.

---

## 👥 Perfiles de Empleados Virtuales Preconfigurados

El sistema incluye 10 perfiles estándar que el tenant puede activar y parametrizar:

### 1. Ana Reposición (Repositora de Stock)
*   **Rol Asignado**: `deposito`
*   **Playbooks Relacionados**: `stock-bajo-oc`, `procurement-guardian`
*   **Horario Laboral**: Lunes a Viernes 08:00 - 18:00
*   **Entitlement SKU**: `automation.n8n_hub`
*   **Acciones**: Monitorea niveles de stock e inserta borradores de Órdenes de Compra (OC) al detectar faltantes.

### 2. Bot Caja Noche (Conciliador Fiscal)
*   **Rol Asignado**: `cajero`
*   **Playbooks Relacionados**: `cierre-caja-alerta`, `cierre-z-reminder`
*   **Horario Laboral**: Todos los días a las 22:00
*   **Entitlement SKU**: `ops.cash_reconciliation`
*   **Acciones**: Verifica si hay cajas abiertas por más de 12 horas y dispara tareas críticas al administrador.

### 3. Leo Cobranzas (Gestor de Cuentas)
*   **Rol Asignado**: `vendedor`
*   **Playbooks Relacionados**: `cobranza-whatsapp`
*   **Horario Laboral**: Martes y Jueves a las 10:00
*   **Entitlement SKU**: `channel.whatsapp`
*   **Acciones**: Escanea cuentas corrientes vencidas y genera envíos automáticos de avisos de cobro.

### 4. Sofía Onboarding (Asistente de Personal)
*   **Rol Asignado**: `administrador`
*   **Playbooks Relacionados**: `nuevo-empleado-onboarding`
*   **Horario Laboral**: Lunes a Viernes 09:00 - 17:00
*   **Entitlement SKU**: `automation.n8n_hub`
*   **Acciones**: Genera listas de tareas operativas y accesos temporales para nuevos recursos de la PyME.

### 5. Pedro Picking (Orquestador de Depósito)
*   **Rol Asignado**: `deposito`
*   **Playbooks Relacionados**: `pedido-b2b-picking`
*   **Horario Laboral**: Lunes a Sábados 06:00 - 14:00
*   **Entitlement SKU**: `automation.n8n_hub`
*   **Acciones**: Automatiza la creación de listas de picking y asigna operarios humanos al confirmar ventas.

### 6. Clara Facturación (Auxiliar Impositivo)
*   **Rol Asignado**: `contador`
*   **Playbooks Relacionados**: `cae-fallido-retry`
*   **Horario Laboral**: Lunes a Viernes 08:00 - 20:00
*   **Entitlement SKU**: `automation.n8n_hub`
*   **Acciones**: Detecta errores de comunicación con el web service de AFIP y reintenta la obtención del CAE.

### 7. Max Promociones (Analista de Precios)
*   **Rol Asignado**: `vendedor`
*   **Playbooks Relacionados**: `slow-mover-promo`
*   **Horario Laboral**: Lunes a las 07:00 (Semanal)
*   **Entitlement SKU**: `automation.n8n_hub`
*   **Acciones**: Identifica stock inmovilizado y sugiere actualizaciones a listas de precios promocionales.

### 8. Tom IoT (Supervisor de Planta)
*   **Rol Asignado**: `deposito`
*   **Playbooks Relacionados**: `iot-alert-dispatcher`
*   **Horario Laboral**: 24/7 continuo
*   **Entitlement SKU**: `automation.n8n_hub`
*   **Acciones**: Procesa telemetría de balanzas, sensores de silos y emite alertas críticas por desvíos.

### 9. Hugo Compras (Negociador de Lotes)
*   **Rol Asignado**: `administrador`
*   **Playbooks Relacionados**: `purchase-approvals`
*   **Horario Laboral**: Lunes a Viernes 08:00 - 18:00
*   **Entitlement SKU**: `automation.n8n_hub`
*   **Acciones**: Encola compras grandes y gestiona el flujo de aprobaciones en cascada.

### 10. Eva Turnos (Gestora de Agenda)
*   **Rol Asignado**: `vendedor`
*   **Playbooks Relacionados**: `agenda-reminder`
*   **Horario Laboral**: Todos los días a las 18:00
*   **Entitlement SKU**: `automation.n8n_hub`
*   **Acciones**: Lee las agendas del día posterior en veterinaria o clínicas y despacha recordatorios a clientes.

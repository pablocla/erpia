# Playbook de Congelamiento por Inactividad (90 Días)
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** soporte | grok | legal  
**Estado:** listo  
**Fuentes:** `CANON_FREE.md`, `PROMPT_GEMINI_FREE.md`

---

## 📋 Reglas de Purga y Congelamiento

1. **Condición de Congelamiento:** Todo tenant/comercio en el plan gratis que no registre ingresos al sistema o movimientos de caja durante **90 días corridos** pasa a estado *Inactivo / Congelado*.
2. **Aviso Prevención Día 75 (15 días antes):**
   - **Canal:** Email / Notificación In-App.
   - **Texto:**  
     > *Aviso Claver:* Tu libreta gratis lleva 75 días sin movimientos. Para evitar el congelamiento de tus datos por inactividad, ingresá a tu cuenta en los próximos 15 días: `https://claver.com.ar/login`.
3. **Aviso Final Día 90 (Congelamiento Efectivo):**
   - **Texto:**  
     > *Tu cuenta se encuentra pausada por inactividad.* Podés solicitar la reactivación instantánea y descarga de tus datos guardados desde tu panel.

---

## Requerimiento Backend para Grok
- Grok debe implementar un job que identifique cuentas sin logins/ventas > 90 días y marque `estado: congelado`, manteniendo el resguardo de la base de datos sin borrado físico destructivo inmediato.

# Macros de Soporte L1 — Respuestas en Gratis vs Extras
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** soporte L1  
**Estado:** listo  
**Fuentes:** `CANON_FREE.md`

---

## Respuestas Enlatadas de Soporte (es-AR)

### Macro 1: "No me manda los WhatsApp a los fiados."
> *"¡Hola! Te cuento: el registro de fiados y clientes en la pantalla es gratis para siempre. El envío automático de mensajes por WhatsApp con el link de cobro es un módulo extra que podés activar cuando quieras desde Configuración."*

### Macro 2: "¿Dónde hago la factura de la AFIP?"
> *"¡Buenas! El punto de venta y los comprobantes internos son gratis. Si tu negocio necesita emitir facturas electrónicas oficiales AFIP (Factura A, B o C), podés activar el módulo de facturación impositiva desde tu panel."*

### Macro 3: "No me imprime el ticket / no me abre el cajón."
> *"¡Hola! El sistema funciona con cualquier impresora térmica o común instalada en tu computadora. Verificá que la impresora esté seleccionada como predeterminada en tu navegador."*

### Macro 4: "No me suma el total del fiado."
> *"¡Hola! Revisá haber presionado 'Guardar' al ingresar el monto del fiado. Si entrás en la pestaña 'Clientes' > 'Quién me debe', vas a ver la suma total actualizada al instante."*

### Macro 5: "Quiero ingresar con mi cuenta de Google."
> *"¡Buenas! Podés ingresar directo haciendo clic en el botón 'Continuar con Google' en la pantalla de acceso `https://claver.com.ar/login` sin crear contraseña."*

### Macro 6: "No me aparecen los módulos de hoteles u oficios."
> *"¡Hola! Tu cuenta está configurada en la versión rápida para Mostrador & Kioscos. Esto se hace para que la pantalla sea simple y ágil para el cobro diario."*
> **Está bien que no los vea.** No es un bug. No “activar oficios” en ancla.

---

## Árbol rápido + logs + cuándo escalar (Grok)

| Síntoma | Pedir | Escalar a Grok si |
|---------|-------|-------------------|
| No imprime / no abre cajón | Browser, OS, si es térmica USB vs red, captura de `window.print` | Print API propia / QZ Tray no documentada |
| Fiado no suma | `empresaId`, clienteId, captura de `/api/fiado/*` 4xx | Saldo ≠ movimientos |
| “No manda WA” | Confirmar que **no** tienen Cobrá. Si **sí** pagan: Twilio/Meta error | SKU activo y 0 envíos |
| “Dónde está AFIP” | Confirmá ancla. Si pagan factura: CUIT, cert, ambiente homolog vs prod | CAE error / timeout |
| Google login cuelga | Browser, si popup bloqueado, consola COOP | Sigue el hang post-FedCM |
| Ve oficios en kiosco | Screenshot sidebar | Allowlist rota |
| Caja no abre | Rol, si hay turno abierto | API caja 403/500 |

**No prometas** en L1: offline 100%, SLA, empleados digitales, AFIP en 5 minutos.

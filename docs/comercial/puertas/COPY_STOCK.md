# Copy Comercial — Puerta Control de Stock & Inventario (P-STOCK)

> **Contrato de Puerta:** §1.4 `PROMPT_GEMINI_PUERTAS_LANDING.md`  
> **SKU:** `core.claver`  
> **URL:** `/claver/apps/stock`  
> **Primera Ruta (Golden Path):** `/dashboard/productos`  
> **Nivel de Madurez:** Beta 55% (Honesto, sin sobrepromesa)

---

## 1. Contrato de la Puerta

```text
Puerta: P-STOCK
Comprador: Dueño de comercio minorista/mayorista cuyo dolor número uno es no saber qué tiene en el depósito, perder mercadería o comprar de más.
Dolor (es-AR): "Compro mercadería a ciegas, tengo plata parada en productos que no rotan y cuando un cliente viene a buscar algo, el empleado le dice que no hay cuando estaba guardado al fondo."
Promesa OK: Catálogo unificado con lector de código de barras (cámara o pistola USB), alertas de stock mínimo, importación/exportación masiva en Excel/CSV, ajustes de inventario con motivo e historial de movimientos.
Promesa NO: No es un WMS de logística 3D robotizada, no hace picking con sorter automatizado ni radiofrecuencia industrial de 10.000 m². Es control de stock confiable, ágil y terrenal.
SKU / ?activar=: core.claver
modoLite: inventario
Primera ruta post-login: /dashboard/productos (Listado con filtros de stock crítico y botón de importación CSV)
CTA primario: Probar 14 días gratis
CTA secundario: Ver plantilla Excel de importación
Precio visible: $29.900 ARS/mes
Qué ve en el menú (máx 7 ítems): Productos & Catálogo, Ajustes de Stock, Movimientos de Inventario, Proveedores & Compras, Punto de Venta, Caja, Reportes.
Qué NO debe ver: Módulos de oficios, préstamos, comensales ni agenda de turnos.
Canal: Búsqueda Google ("control de stock facil argentina", "programa inventario codigo barras"), Meta Ads.
```

---

## 2. Textos y Copy de Landing

### Hero Section
- **Badge:** `CONTROL DE INVENTARIO Y CÓDIGO DE BARRAS`
- **H1:** Sabé exactamente qué tenés en tu depósito antes de volver a comprar.
- **Subtítulo:** Cargá tus productos con código de barras en minutos, recibí alertas automáticas cuando un artículo llega al mínimo y hacé ajustes de inventario desde el celular.
- **CTA Primario:** `[ Empezar prueba gratis de 14 días ]` $\to$ `/login?activar=core.claver`
- **CTA Secundario:** `[ Descargar plantilla Excel de ejemplo ]`

### 4 Dolores Comunes de Inventario
1. **"Tengo mercadería vencida o que no rota hace 6 meses":** Si no tenés alertas de rotación, la plata queda inmovilizada en estanterías.
2. **"Tardamos 3 días en hacer el recuento de mercadería":** Contar en planillas de papel es lento y produce errores de tipeo. Con la cámara del celular o pistola USB actualizás el stock en tiempo real.
3. **"Compro mercadería que ya tenía en el depósito":** Al no tener stock mínimo configurado, terminás recomprando por las dudas y descapitalizándote.
4. **"Diferencias entre el sistema y la realidad":** Cada rotura, merma o consumo interno debe quedar registrado con su motivo claro para evitar sospechas.

### 4 Funcionalidades Clave (Sin Humo)
1. **Escaneo con Cámara de Celular o Lector USB:** Leé códigos EAN-13 al instante para buscar productos, consultar precios o ingresar stock.
2. **Alertas de Stock Crítico:** El sistema te avisa en pantalla qué productos están por debajo del punto de reposición para que armes la orden de compra.
3. **Ajustes de Inventario con Justificación:** Registrá sobrantes, faltantes, roturas o mermas con auditoría de usuario y fecha.
4. **Importación y Exportación en Excel (CSV):** Subí tu lista completa de 2.000 artículos en 1 click con sus precios y cantidades.

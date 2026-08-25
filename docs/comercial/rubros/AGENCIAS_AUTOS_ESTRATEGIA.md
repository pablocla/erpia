# Estrategia de Producto: Agencias y Revendedores de Autos (Car Dealerships)

Este documento detalla cómo adaptar **Claver ERP** para atacar el nicho altamente rentable de agencias de autos usados y cero kilómetro, aprovechando la tendencia actual en redes sociales (TikTok/Instagram) de la figura del "Revendedor".

## 1. El Problema del Nicho (Pain Points)
Los revendedores de autos sufren por la fragmentación. Tienen los autos en Excel, las conversaciones de venta en WhatsApp, los cálculos de impuestos en la cabeza (o su contador), y las tasaciones en libretas. Necesitan **un solo lugar** que unifique el auto (producto), el lead (CRM) y el papelaje fiscal.

## 2. Mapeo de Soluciones en Claver ERP

A continuación, cómo reutilizar lo que ya tenemos y qué pequeños ajustes hacer:

### A. Inventario Vehicular (Stock)
- **Solución Actual:** Claver ya tiene manejo de inventario con "Números de Serie/Lote" y campos personalizados (`/dashboard/productos`).
- **Adaptación:** Crear una plantilla de producto "Vehículo". El auto no es un producto genérico, es un **Lote Único**. 
  - **Campos obligatorios:** Dominio (Patente), Año, Kilometraje, Color, VIN (Chasis), Número de Motor.
  - **Ubicación:** Multi-depósito para saber si el auto está en la concesionaria, en el taller (chapa/pintura) o en lavadero.

### B. Publicaciones y Catálogo (Showroom Digital)
- **Solución Actual:** Tenemos Links de Pagos y Tienda (`/ecommerce`).
- **Adaptación:** Al guardar un auto, generar un botón **"Ficha Digital Pública"**. Un link (`claver.com.ar/auto/xyz`) hermoso, optimizado para celulares, con fotos, precio y un botón flotante de WhatsApp que diga "Me interesa el [Marca y Modelo]". Esto es oro puro para que lo pongan en sus historias de TikTok/Instagram.

### C. Canales de Comunicación (CRM Automotor)
- **Solución Actual:** Módulo de Mensajería y WhatsApp API (`/dashboard/mensajeria` y `whatsapp-copy.ts`).
- **Adaptación:** Un pequeño Kanban (tipo Trello) para los Leads: "Consultó", "Vino a ver el auto", "Seña depositada", "Vendido".
- **Plantillas WhatsApp:**
  - "¡Hola! Te dejo la ficha técnica del Focus 2018 que viste en TikTok: [Link]"
  - "Te recordamos tu turno de mañana para probar el auto."

### D. Tasaciones (Toma de Usados)
- **Solución Actual:** Módulo de Compras / Cotizaciones de Proveedores (`/dashboard/compras`).
- **Adaptación:** Cambiar el nombre a **"Tasaciones"**. Cuando un cliente quiere dejar su usado como parte de pago, el sistema genera una ficha de tasación que descuenta el valor de la nueva compra. Debe incluir un check-list visual (Estado de cubiertas, service, detalles de chapa).

### E. Cobranzas y Señas
- **Solución Actual:** Módulo de POS y Links de Pago MercadoPago (`/dashboard/pos`).
- **Adaptación:** Para vender un auto se usan **Señas**. Reutilizaremos el "Link Público de Presupuesto" que armamos esta semana. El cliente recibe el presupuesto del auto por WhatsApp, aprieta "Pagar Seña de Reserva ($500.000)", paga por MercadoPago, y el sistema **bloquea el auto automáticamente** para que ningún otro vendedor lo ofrezca.

### F. Liquidaciones y Verificación de Impuestos
Este es el "Killer Feature" para Argentina, porque la burocracia automotor es infernal.
- **Solución Actual:** Módulo de Impuestos AFIP (`/dashboard/impuestos` y `lib/afip/factura-service.ts`).
- **Adaptación:**
  - **API de Multas y Patentes:** Integrar un scraper (o API de Rentas/AGIP/DNRPA) donde al cargar la patente, te tire la deuda de patentes y multas para descontarlo del precio en la tasación.
  - **CETA (AFIP):** Recordatorio de carga del código CETA (Certificado de Transferencia de Automotores) en la ficha del auto.
  - **IVA sobre Margen:** En Argentina, los revendedores habitualistas de usados pagan IVA *solo sobre la diferencia* entre la compra y la venta (si lo compraron a un consumidor final). El ERP debe calcular esto automáticamente al emitir la Factura de Venta.

## 3. Estrategia Go-to-Market (TikTok)
Dado que es tendencia:
1. **El Hook:** "Cómo vendí 3 autos esta semana sin perder clientes en el WhatsApp y automatizando la toma de señas".
2. **El Demo:** Mostrar la pantalla del ERP desde el celular en el taller. Mostrar cómo aprietan 1 botón y se genera el catálogo digital para el cliente.
3. **Costo de Oportunidad:** "Un auto mal tasado por no revisar multas te cuesta $1.000.000. Claver te cuesta $30.000 al mes."

---
*Documento generado por IA - Planificación Comercial*

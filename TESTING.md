# Guía de Testing - POS Argentina

## Configuración Inicial

### 1. Variables de Entorno

El archivo `.env.local` ya está configurado con valores de testing. Las variables importantes son:

- **AFIP_ENTORNO**: `homologacion` (entorno de prueba de AFIP)
- **AFIP_CUIT**: `20123456789` (CUIT de prueba)
- **JWT_SECRET**: Clave secreta para autenticación
- **DATABASE_URL**: Ya configurado automáticamente con Neon

### 2. Inicializar Base de Datos

Ejecuta los scripts SQL en orden:

1. `scripts/01-init-database.sql` - Crea las tablas
2. `scripts/02-seed-cuentas-contables.sql` - Carga el plan de cuentas

### 3. Verificar Configuración

Visita: `http://localhost:3000/api/config/test`

Deberías ver la configuración actual del sistema.

## Testing de Módulos

### Autenticación

**Crear usuario administrador:**
\`\`\`bash
POST /api/auth/register
{
  "email": "admin@test.com",
  "password": "admin123",
  "nombre": "Admin Test",
  "rol": "administrador"
}
\`\`\`

**Login:**
\`\`\`bash
POST /api/auth/login
{
  "email": "admin@test.com",
  "password": "admin123"
}
\`\`\`

Guarda el token JWT que recibes para usarlo en las siguientes peticiones.

### AFIP - Facturación Electrónica

**Nota:** Para testing real con AFIP necesitas:
1. Certificado digital de homologación (.crt)
2. Clave privada (.key)
3. Subirlos usando: `POST /api/afip/subir-certificados`

**Emitir factura de prueba:**
\`\`\`bash
POST /api/afip/emitir-factura
Authorization: Bearer {tu-token}
{
  "empresaId": 1,
  "clienteId": 1,
  "tipoComprobante": "FACTURA_A",
  "items": [
    {
      "descripcion": "Producto Test",
      "cantidad": 2,
      "precioUnitario": 1000,
      "alicuotaIva": 21
    }
  ]
}
\`\`\`

### Impresora Fiscal

**Detectar impresoras:**
\`\`\`bash
GET /api/impresion/detectar-impresoras
Authorization: Bearer {tu-token}
\`\`\`

**Imprimir ticket:**
\`\`\`bash
POST /api/impresion/imprimir-ticket
Authorization: Bearer {tu-token}
{
  "facturaId": 1
}
\`\`\`

### Contabilidad

**Ver asientos contables:**
\`\`\`bash
GET /api/contabilidad/asientos?desde=2024-01-01&hasta=2024-12-31
Authorization: Bearer {tu-token}
\`\`\`

**Libro Mayor:**
\`\`\`bash
GET /api/contabilidad/libro-mayor?desde=2024-01-01&hasta=2024-12-31
Authorization: Bearer {tu-token}
\`\`\`

### Reportes de IVA

**Resumen de IVA del período:**
\`\`\`bash
GET /api/impuestos/iva?periodo=2024-01
Authorization: Bearer {tu-token}
\`\`\`

**Libro IVA Ventas:**
\`\`\`bash
GET /api/impuestos/libro-iva-ventas?periodo=2024-01
Authorization: Bearer {tu-token}
\`\`\`

## Testing del Frontend

### 1. Login
- Visita: `http://localhost:3000/login`
- Usa las credenciales creadas anteriormente

### 2. Dashboard
- Después del login, verás el dashboard con KPIs
- Navega por las diferentes secciones usando el sidebar

### 3. Emitir Factura
- Ve a "Ventas" en el sidebar
- Completa el formulario de factura
- El sistema generará automáticamente:
  - CAE de AFIP (en homologación)
  - Asiento contable
  - Código QR

### 4. Reportes de IVA
- Ve a "Impuestos" en el sidebar
- Selecciona un período
- Descarga los reportes en CSV

## Datos de Prueba

### Clientes de Prueba
\`\`\`sql
INSERT INTO clientes (razon_social, cuit, condicion_iva, domicilio, email)
VALUES 
  ('Cliente Test SA', '30123456789', 'RESPONSABLE_INSCRIPTO', 'Av. Test 123', 'cliente@test.com'),
  ('Consumidor Final', '20987654321', 'CONSUMIDOR_FINAL', 'Calle Test 456', 'consumidor@test.com');
\`\`\`

### Productos de Prueba
\`\`\`sql
INSERT INTO productos (codigo, descripcion, precio, alicuota_iva, stock)
VALUES 
  ('PROD001', 'Producto Test 1', 1000.00, 21.00, 100),
  ('PROD002', 'Producto Test 2', 2500.00, 21.00, 50),
  ('SERV001', 'Servicio Test', 5000.00, 21.00, 999);
\`\`\`

## Troubleshooting

### Error: "No se pudo conectar con AFIP"
- Verifica que `AFIP_ENTORNO` esté en "homologacion"
- Asegúrate de haber subido los certificados de homologación

### Error: "Token inválido"
- El token JWT expira en 7 días
- Haz login nuevamente para obtener un nuevo token

### Error: "Impresora no detectada"
- Verifica que la impresora esté conectada
- Revisa el puerto configurado en `PRINTER_PORT`
- Para testing sin impresora física, el sistema simulará la impresión

## Próximos Pasos

1. **Obtener certificados de AFIP**: Solicita certificados de homologación en el sitio de AFIP
2. **Configurar empresa**: Crea tu empresa en la base de datos con los datos reales
3. **Cargar productos**: Importa tu catálogo de productos
4. **Testing completo**: Prueba el flujo completo de venta → facturación → contabilidad
5. **Producción**: Cuando estés listo, cambia `AFIP_ENTORNO` a "produccion" y usa certificados de producción

## Checklist Funcional Go-Live POS

### ABM obligatorios antes de salir

- [ ] Clientes: alta con nombre, condicionIva y al menos CUIT o DNI.
- [ ] Productos: alta con codigo, precioVenta, porcentajeIva y stock.
- [ ] Listas de precio: al menos una activa y asignable a clientes.
- [ ] Puntos de venta y series AFIP configurados.
- [ ] Certificados AFIP cargados para empresa.

### Circuito completo con impacto en reporting

1. Crear cliente con CUIT valido (11 digitos) y condicion IVA.
2. Crear producto con stock inicial mayor a 0.
3. Emitir factura desde POS en `/dashboard/ventas`.
4. Verificar impacto:
  - Se guarda factura y lineas.
  - Se descuenta stock automatico.
  - Se actualizan metricas en dashboard/reportes.
  - El comprobante devuelve CAE y vencimiento.
5. Repetir con cliente sin CUIT pero con DNI para validar tipos B/C.

### Velocidad operativa por teclado

- [ ] F2 enfoca cliente.
- [ ] F3 agrega item manual.
- [ ] F4 abre buscador de productos.
- [ ] F9 emite comprobante.
- [ ] Ctrl+P imprime comprobante emitido.

### Soporte y tickets internos

- [ ] Boton global "Reportar error" visible y funcional.
- [ ] Ticket creado visible en `/dashboard/soporte`.
- [ ] Analista puede mover estado: abierto/en_progreso/resuelto/cerrado.

export const mockUsuario = {
  id: "1",
  nombre: "Usuario Demo",
  email: "demo@pos.com",
  rol: "administrador" as const,
  empresaId: "1",
}

export const mockEmpresa = {
  id: "1",
  razonSocial: "Mi Empresa SRL",
  cuit: "20-12345678-9",
  direccion: "Av. Corrientes 1234",
  telefono: "011-4567-8900",
  email: "contacto@miempresa.com",
  puntoVenta: 1,
  certificadoAfip: null,
  clavePrivada: null,
}

export const mockClientes = [
  {
    id: "1",
    razonSocial: "Cliente Ejemplo SA",
    cuit: "30-12345678-9",
    direccion: "Av. Santa Fe 2000",
    telefono: "011-5555-1234",
    email: "cliente1@example.com",
    condicionIva: "Responsable Inscripto" as const,
    empresaId: "1",
  },
  {
    id: "2",
    razonSocial: "Juan Pérez",
    cuit: "20-98765432-1",
    direccion: "Calle Falsa 123",
    telefono: "011-5555-5678",
    email: "juan@example.com",
    condicionIva: "Consumidor Final" as const,
    empresaId: "1",
  },
  {
    id: "3",
    razonSocial: "Comercio del Sur SRL",
    cuit: "30-11223344-5",
    direccion: "Av. Rivadavia 5000",
    telefono: "011-5555-9999",
    email: "sur@example.com",
    condicionIva: "Responsable Inscripto" as const,
    empresaId: "1",
  },
]

export const mockFacturas = [
  {
    id: "1",
    tipo: "B" as const,
    numero: 1,
    fecha: new Date("2025-01-15"),
    clienteId: "1",
    cliente: mockClientes[0],
    subtotal: 10000,
    iva: 2100,
    total: 12100,
    cae: "75123456789012",
    vencimientoCae: new Date("2025-01-25"),
    qrData: "https://www.afip.gob.ar/fe/qr/?p=...",
    empresaId: "1",
  },
  {
    id: "2",
    tipo: "B" as const,
    numero: 2,
    fecha: new Date("2025-01-16"),
    clienteId: "2",
    cliente: mockClientes[1],
    subtotal: 5000,
    iva: 1050,
    total: 6050,
    cae: "75123456789013",
    vencimientoCae: new Date("2025-01-26"),
    qrData: "https://www.afip.gob.ar/fe/qr/?p=...",
    empresaId: "1",
  },
]

export const mockCompras = [
  {
    id: "1",
    tipo: "B" as const,
    numero: 123,
    fecha: new Date("2025-01-10"),
    proveedorId: "1",
    proveedor: {
      id: "1",
      razonSocial: "Proveedor ABC SA",
      cuit: "30-99887766-5",
      direccion: "Av. Belgrano 1000",
      telefono: "011-4444-5555",
      email: "abc@proveedor.com",
      condicionIva: "Responsable Inscripto" as const,
      empresaId: "1",
    },
    subtotal: 8000,
    iva: 1680,
    total: 9680,
    empresaId: "1",
  },
]

export const mockAsientos = [
  {
    id: "1",
    numero: 1,
    fecha: new Date("2025-01-15"),
    descripcion: "Factura B 0001-00000001 - Cliente Ejemplo SA",
    empresaId: "1",
    movimientos: [
      {
        id: "1",
        cuentaId: "1",
        cuenta: { codigo: "1.1.01", nombre: "Caja" },
        debe: 12100,
        haber: 0,
      },
      {
        id: "2",
        cuentaId: "10",
        cuenta: { codigo: "4.1.01", nombre: "Ventas" },
        debe: 0,
        haber: 10000,
      },
      {
        id: "3",
        cuentaId: "11",
        cuenta: { codigo: "2.1.03", nombre: "IVA Débito Fiscal" },
        debe: 0,
        haber: 2100,
      },
    ],
  },
  {
    id: "2",
    numero: 2,
    fecha: new Date("2025-01-16"),
    descripcion: "Factura B 0001-00000002 - Juan Pérez",
    empresaId: "1",
    movimientos: [
      {
        id: "4",
        cuentaId: "1",
        cuenta: { codigo: "1.1.01", nombre: "Caja" },
        debe: 6050,
        haber: 0,
      },
      {
        id: "5",
        cuentaId: "10",
        cuenta: { codigo: "4.1.01", nombre: "Ventas" },
        debe: 0,
        haber: 5000,
      },
      {
        id: "6",
        cuentaId: "11",
        cuenta: { codigo: "2.1.03", nombre: "IVA Débito Fiscal" },
        debe: 0,
        haber: 1050,
      },
    ],
  },
]

export const mockCuentas = [
  { id: "1", codigo: "1.1.01", nombre: "Caja", tipo: "Activo" as const },
  { id: "2", codigo: "1.1.02", nombre: "Banco Cuenta Corriente", tipo: "Activo" as const },
  { id: "3", codigo: "1.2.01", nombre: "Deudores por Ventas", tipo: "Activo" as const },
  { id: "4", codigo: "2.1.01", nombre: "Proveedores", tipo: "Pasivo" as const },
  { id: "5", codigo: "2.1.02", nombre: "IVA Crédito Fiscal", tipo: "Pasivo" as const },
  { id: "6", codigo: "2.1.03", nombre: "IVA Débito Fiscal", tipo: "Pasivo" as const },
  { id: "7", codigo: "3.1.01", nombre: "Capital Social", tipo: "Patrimonio Neto" as const },
  { id: "8", codigo: "3.2.01", nombre: "Resultados del Ejercicio", tipo: "Patrimonio Neto" as const },
  { id: "9", codigo: "4.1.01", nombre: "Ventas", tipo: "Resultado Positivo" as const },
  { id: "10", codigo: "5.1.01", nombre: "Costo de Mercaderías Vendidas", tipo: "Resultado Negativo" as const },
]

export const mockEstadisticas = {
  ventasMensuales: [
    { mes: "Ene", ventas: 125000, facturas: 45 },
    { mes: "Feb", ventas: 142000, facturas: 52 },
    { mes: "Mar", ventas: 138000, facturas: 48 },
    { mes: "Abr", ventas: 155000, facturas: 58 },
    { mes: "May", ventas: 168000, facturas: 62 },
    { mes: "Jun", ventas: 175000, facturas: 65 },
  ],
  topClientes: [
    { cliente: "Cliente Ejemplo SA", total: 85000, facturas: 12 },
    { cliente: "Comercio del Sur SRL", total: 72000, facturas: 10 },
    { cliente: "Juan Pérez", total: 45000, facturas: 8 },
    { cliente: "Distribuidora Norte", total: 38000, facturas: 6 },
    { cliente: "Mayorista Central", total: 32000, facturas: 5 },
  ],
  resumenMes: {
    totalVentas: 175000,
    totalFacturas: 65,
    ivaDebito: 36750,
    ivaCredito: 15680,
    ivaPagar: 21070,
  },
}

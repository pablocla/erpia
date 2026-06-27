/** Catálogo client-safe — relevamiento vendedor en calle */

export const RUBROS_RETAIL = [
  { id: "almacen", label: "Almacén / despensa" },
  { id: "kiosco", label: "Kiosco" },
  { id: "indumentaria", label: "Indumentaria" },
  { id: "ferreteria", label: "Ferretería" },
  { id: "farmacia", label: "Farmacia" },
  { id: "restaurant", label: "Gastronomía" },
  { id: "otro", label: "Otro" },
] as const

export const ENGANCHES_CANDIDATOS = [
  { id: "pos.fiado_barrio", label: "Libreta Fiado", precioRef: 4990 },
  { id: "intang.cobranzas_wa", label: "Cobranzas WhatsApp", precioRef: 20000 },
  { id: "pool-almacen-barrio", label: "Pool almacén barrio", precioRef: 34900 },
  { id: "pos.core", label: "POS + factura", precioRef: null },
  { id: "indefinido", label: "Aún no definido", precioRef: null },
] as const

export const DOLORES_PRINCIPALES = [
  { id: "fiado", label: "Fiado / cuentas corrientes" },
  { id: "cobranza", label: "Cobrar deuda / morosos" },
  { id: "stock", label: "Stock / quiebres" },
  { id: "factura", label: "Facturación AFIP" },
  { id: "informacion", label: "No ve números del negocio" },
  { id: "otro", label: "Otro" },
] as const

export const NIVELES_INTERES = [
  { id: "bajo", label: "Bajo — lo pensó" },
  { id: "medio", label: "Medio — interesado" },
  { id: "alto", label: "Alto — quiere probar" },
] as const

export const OBJECIONES = [
  { id: "precio", label: "Precio" },
  { id: "no_sistemas", label: "No quiere sistemas" },
  { id: "tiempo", label: "Sin tiempo" },
  { id: "ya_tiene", label: "Ya tiene algo" },
  { id: "ninguna", label: "Sin objeción clara" },
] as const

export const PREGUNTAS_DIAGNOSTICO = [
  {
    id: "respFiado",
    pregunta: "¿Cómo anotás fiado / cuentas?",
    placeholder: "Cuaderno, Excel, memoria, app…",
  },
  {
    id: "respTiempoCobrar",
    pregunta: "¿Cuánto tiempo por semana en cobrar?",
    placeholder: "Horas, días, nunca…",
  },
  {
    id: "respFacturaElectronica",
    pregunta: "¿Facturás electrónico hoy?",
    placeholder: "Sí/No, qué sistema, monotributo…",
  },
  {
    id: "respStockGondola",
    pregunta: "¿Sabés qué falta en góndola / depósito?",
    placeholder: "Cómo controlan stock hoy",
  },
  {
    id: "respQuienAtiende",
    pregunta: "Si no estás, ¿quién atiende y cómo sabe precios?",
    placeholder: "Empleado, familia, precios en cabeza…",
  },
] as const

export const CHECKLIST_POST_VISITA = [
  "WhatsApp resumen + link demo",
  "Cargado en pipeline / relevamiento",
  "Trial 14 días ofrecido (si aplicó)",
  "Provisioning <24h (si cerró)",
] as const
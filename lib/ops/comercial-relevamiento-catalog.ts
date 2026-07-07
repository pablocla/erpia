/** Catálogo client-safe — relevamiento vendedor en calle */

export const RUBROS_RETAIL = [
  { id: "inmobiliaria", label: "Inmobiliaria / administración" },
  { id: "consorcios", label: "Administración de consorcios" },
  { id: "almacen", label: "Almacén / despensa" },
  { id: "kiosco", label: "Kiosco" },
  { id: "indumentaria", label: "Indumentaria" },
  { id: "ferreteria", label: "Ferretería" },
  { id: "farmacia", label: "Farmacia" },
  { id: "restaurant", label: "Gastronomía" },
  { id: "carniceria", label: "Carnicería" },
  { id: "panaderia", label: "Panadería" },
  { id: "fiambreria", label: "Fiambrería" },
  { id: "otro", label: "Otro" },
] as const

export const ENGANCHES_CANDIDATOS = [
  { id: "pos.fiado_barrio", label: "Libreta Fiado", precioRef: 4990 },
  { id: "intang.cobranzas_wa", label: "Cobranzas WhatsApp", precioRef: 20000 },
  { id: "pool-almacen-barrio", label: "Pool almacén barrio", precioRef: 34900 },
  { id: "pool-claver-nicho", label: "Claver Nicho Starter (consorcios + WA)", precioRef: 19900 },
  { id: "pool-propiedad", label: "Claver Propiedad (consorcios + garantía)", precioRef: 29900 },
  { id: "pool-calle-nicho", label: "Calle + Nicho (fiado + feria/plancha)", precioRef: 24900 },
  { id: "pool-servicios-barrio", label: "Servicios de barrio (plancha + pelu + delivery)", precioRef: 19900 },
  { id: "pool-escuela-barrio", label: "Escuela + colonia + club", precioRef: 17900 },
  { id: "pool-deportes-barrio", label: "Deportes (cancha + club + gimnasio)", precioRef: 21900 },
  { id: "niche.consorcios", label: "Claver Consorcios", precioRef: 8900 },
  { id: "niche.club_barrio", label: "Claver Club", precioRef: 3990 },
  { id: "niche.tintoreria", label: "Claver Plancha / Tintorería", precioRef: 3990 },
  { id: "niche.escuela_barrio", label: "Claver Escuela", precioRef: 4990 },
  { id: "niche.gimnasio_barrio", label: "Claver Gimnasio", precioRef: 4990 },
  { id: "niche.taller_mecanico", label: "Claver Taller", precioRef: 4990 },
  { id: "niche.peluqueria_barrio", label: "Claver Peluquería", precioRef: 3990 },
  { id: "niche.cancha_barrio", label: "Claver Cancha", precioRef: 4990 },
  { id: "pool-almacen-rosario", label: "Pack Almacén Rosario (18 módulos)", precioRef: 34900 },
  { id: "pool-kiosco-barrio", label: "Pool Kiosco (próximamente)", precioRef: 24900 },
  { id: "pool-ferreteria", label: "Pool Ferretería (próximamente)", precioRef: 45000 },
  { id: "pool-panaderia-produccion", label: "Pack Panadería (próximamente)", precioRef: 39900 },
  { id: "pos.balanza_peso", label: "Venta por peso (manual)", precioRef: 2490 },
  { id: "pos.core", label: "POS + factura", precioRef: null },
  { id: "indefinido", label: "Aún no definido", precioRef: null },
] as const

export const DOLORES_PRINCIPALES = [
  { id: "fiado", label: "Fiado / cuentas corrientes" },
  { id: "cobranza", label: "Cobrar deuda / morosos" },
  { id: "expensas", label: "Expensas / consorcio / cuotas" },
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

export const PREGUNTAS_EXTRAS_POR_RUBRO: Record<string, { id: string; pregunta: string; placeholder: string }[]> = {
  inmobiliaria: [
    {
      id: "respUnidadesConsorcio",
      pregunta: "¿Cuántos edificios o unidades administrás hoy?",
      placeholder: "Ej. 2 consorcios, 48 UF, 12 propiedades en alquiler…",
    },
    {
      id: "respLiquidacionExpensas",
      pregunta: "¿Cómo liquidás expensas y avisás morosos?",
      placeholder: "Excel, PDF manual, WhatsApp uno por uno…",
    },
  ],
  consorcios: [
    {
      id: "respUnidadesConsorcio",
      pregunta: "¿Cuántas unidades funcionales tiene el edificio?",
      placeholder: "Cantidad de UF, porcentajes, residentes…",
    },
    {
      id: "respGastosComunes",
      pregunta: "¿Cómo cargan gastos comunes y prorratean?",
      placeholder: "Planilla, contador externo, sistema actual…",
    },
  ],
  kiosco: [
    {
      id: "respUsaEscaner",
      pregunta: "¿Usás lector de código de barras hoy o tipeás/buscás todo a mano?",
      placeholder: "Usa pistola lectora, busca por nombre, carga manual..."
    }
  ],
  ferreteria: [
    {
      id: "respVentaFraccionada",
      pregunta: "¿Vendés productos fraccionados (por metro, litro, etc.)?",
      placeholder: "Vende cables/mangueras por metro, tornillos sueltos..."
    }
  ],
  carniceria: [
    {
      id: "respBalanzaDirecta",
      pregunta: "¿Necesitás que la balanza le mande el peso directo al sistema o cargás a mano?",
      placeholder: "Tiene balanza Systel/Kretz, quiere ticketeadora, carga manual..."
    }
  ],
  fiambreria: [
    {
      id: "respBalanzaDirecta",
      pregunta: "¿Necesitás que la balanza le mande el peso directo al sistema o cargás a mano?",
      placeholder: "Tiene balanza Systel/Kretz, quiere ticketeadora, carga manual..."
    }
  ],
  panaderia: [
    {
      id: "respProduccionPropia",
      pregunta: "¿Producís vos mismo lo que vendés o comprás hecho?",
      placeholder: "Elaboración propia de panificados/facturas, reventa, etc..."
    }
  ]
}

export const CHECKLIST_POST_VISITA = [
  "WhatsApp resumen + link demo",
  "Cargado en pipeline / relevamiento",
  "Trial 14 días ofrecido (si aplicó)",
  "Provisioning <24h (si cerró)",
] as const
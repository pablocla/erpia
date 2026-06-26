/** Diccionario de tablas SX del Framework Protheus (SIGACFG / metadatos). */
export const PROTHEUS_SX_TABLES = [
  {
    id: "SX1",
    nombre: "Parámetros del sistema",
    descripcion: "Parámetros generales por módulo, filial y grupo.",
    apiHint: "/api/framework/v1/Instance/SX1 · /api/gfin/v1/sxutil/sx1/:param",
  },
  {
    id: "SX2",
    nombre: "Diccionario de tablas",
    descripcion: "Define qué tablas existen (SA1, SB1, SF2…), título, módulo y modo compartido.",
    apiHint: "/api/framework/v1/Dictionary/Tables · POST /api/framework/v1/Instance/SX2",
    claveParaOpo: true,
  },
  {
    id: "SX3",
    nombre: "Diccionario de campos",
    descripcion: "Campos por tabla: tipo, tamaño, título, validaciones, trigger.",
    apiHint: "/api/framework/v1/Dictionary/Fields · POST /api/framework/v1/Instance/SX3",
    claveParaOpo: true,
  },
  {
    id: "SX4",
    nombre: "Relaciones entre tablas",
    descripcion: "Joins y vínculos entre archivos del diccionario.",
    apiHint: "Consulta SQL SX4 o APIs Dictionary relacionadas",
  },
  {
    id: "SX5",
    nombre: "Tablas genéricas / ayuda",
    descripcion: "Códigos de ayuda, combos y tablas Z (ZZ0, etc.).",
    apiHint: "/getSx5Codigo · /api/gfin/v1/sxUtil/sx5/:table",
  },
  {
    id: "SX6",
    nombre: "Mensajes del sistema",
    descripcion: "Textos de error, aviso y confirmación localizados.",
    apiHint: "POST /api/framework/v1/Instance/SX6",
  },
  {
    id: "SX7",
    nombre: "Consultas estándar",
    descripcion: "Queries predefinidas del Configurador.",
    apiHint: "POST /api/framework/v1/Instance/SX7 · Dictionary/StandardQuery",
  },
  {
    id: "SX8",
    nombre: "Menús y rutinas",
    descripcion: "Estructura de menús AdvPL y acceso a rutinas.",
    apiHint: "Metadatos vía Configurador / SQL SX8",
  },
  {
    id: "SX9",
    nombre: "Índices",
    descripcion: "Índices por tabla (orden, unicidad, segmentos).",
    apiHint: "/api/framework/v1/Dictionary/Indexes · /api/v1/fieldsindexes/:dictionary/:id",
    claveParaOpo: true,
  },
] as const

/** Endpoints REST del Framework para introspección semántica. */
export const PROTHEUS_INTROSPECTION_ENDPOINTS = [
  { id: "tables", label: "Tablas (SX2)", path: "/api/framework/v1/Dictionary/Tables", method: "GET" },
  { id: "fields", label: "Campos (SX3)", path: "/api/framework/v1/Dictionary/Fields", method: "GET" },
  { id: "indexes", label: "Índices (SX9)", path: "/api/framework/v1/Dictionary/Indexes", method: "GET" },
  { id: "dictionary", label: "Diccionario v1", path: "/api/v1/dictionary", method: "GET" },
  { id: "dictionary_id", label: "Diccionario por ID", path: "/api/v1/dictionary/SA1", method: "GET" },
  { id: "fieldsstruct", label: "Estructura campos stock", path: "/api/stock/process/v1/fieldsstruct", method: "GET" },
  { id: "fin_dictionary", label: "Diccionario FIN", path: "/api/fin/v1/dictionary/SA1", method: "GET" },
  { id: "struct_object", label: "Struct objeto", path: "/api/framework/v1/struct/object/SA1", method: "GET" },
  { id: "generic_tables", label: "Tablas genéricas", path: "/api/framework/v1/Dictionary/GenericTables", method: "GET" },
  { id: "discovery", label: "Discovery REST", path: "/tlpp/rest/list/service", method: "GET" },
] as const

export const PROTHEUS_SETUP_CHECKLIST = [
  {
    id: "vpn",
    titulo: "Red / VPN al AppServer",
    descripcion: "La PC Clavis o el Edge Agent debe alcanzar el puerto REST (ej. 8073).",
    href: "/claver-cloud/protheus-setup#red",
  },
  {
    id: "rest",
    titulo: "REST activo en Protheus",
    descripcion: "Verificar appserver.ini [HTTPREST] y probar /rest/tlpp/rest/list/service.",
    href: "/claver-cloud/protheus-api",
  },
  {
    id: "creds",
    titulo: "Usuario de integración",
    descripcion: "Usuario con lectura SA1/SB1/SF2 y acceso Framework Dictionary.",
    href: "/claver-cloud/opo-console",
  },
  {
    id: "sku",
    titulo: "Activar bridge.opo_studio en tenant",
    descripcion: "App Store del cliente o panel Super Admin → productos.",
    href: "/claver-cloud/organizations",
  },
  {
    id: "bridge",
    titulo: "Legacy Bridge del tenant",
    descripcion: "Modo Front Legacy + mapeo entidades + prueba ida/vuelta.",
    href: "/claver-cloud/organizations",
  },
  {
    id: "sx",
    titulo: "Introspección SX (OPO Console)",
    descripcion: "Leer SX2/SX3 vía REST Framework y generar mapeo OPO.",
    href: "/claver-cloud/opo-console",
  },
] as const
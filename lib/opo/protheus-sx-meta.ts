/** Diccionario de tablas SX del Framework Protheus (SIGACFG / metadatos). */
export const PROTHEUS_SX_TABLES = [
  {
    id: "SX1",
    nombre: "Perguntas / Preguntas de proceso",
    descripcion: "Filtros y parámetros de ejecución de informes y rutinas operativas (X1_GRUPO, X1_ORDEM, X1_PERGUNT).",
    apiHint: "/api/framework/v1/Instance/SX1 · /api/gfin/v1/sxutil/sx1/:param",
  },
  {
    id: "SX2",
    nombre: "Arquivos / Diccionario de tablas",
    descripcion: "Catálogo de todas las tablas del sistema (SA1, SB1, SC5, SF2…), modo de compartimiento y llave única.",
    apiHint: "/api/framework/v1/Dictionary/Tables · POST /api/framework/v1/Instance/SX2",
    claveParaOpo: true,
  },
  {
    id: "SX3",
    nombre: "Campos do Dicionário",
    descripcion: "Definición de cada campo: tipo, tamaño, decimales, título, validación de usuario, gatillos y relación.",
    apiHint: "/api/framework/v1/Dictionary/Fields · POST /api/framework/v1/Instance/SX3",
    claveParaOpo: true,
  },
  {
    id: "SX4",
    nombre: "Fórmulas do Sistema",
    descripcion: "Fórmulas de cálculo compiladas utilizadas en rutinas de facturación, impuestos y nómina.",
    apiHint: "Consulta SQL SX4 o APIs de Framework",
  },
  {
    id: "SX5",
    nombre: "Tabelas Genéricas",
    descripcion: "Tablas de códigos globales del sistema (condiciones de pago, provincias, monedas, tipos de comprobante).",
    apiHint: "/getSx5Codigo · /api/gfin/v1/sxUtil/sx5/:table",
  },
  {
    id: "SX6",
    nombre: "Parâmetros do Sistema (MV_*)",
    descripcion: "Parámetros globales que configuran el comportamiento operativo y fiscal (ej: MV_ESTADO, MV_SUBTRIB, MV_ARREST).",
    apiHint: "POST /api/framework/v1/Instance/SX6 · /api/gfin/v1/sxutil/sx6/:param",
    claveParaOpo: true,
  },
  {
    id: "SX7",
    nombre: "Gatilhos / Triggers",
    descripcion: "Disparadores automáticos: cuando se modifica un campo, qué regla ejecuta y qué otro campo actualiza.",
    apiHint: "POST /api/framework/v1/Instance/SX7 · Dictionary/Triggers",
  },
  {
    id: "SX8",
    nombre: "Validaciones en Cascada y Secuencias",
    descripcion: "Secuencias y reglas de integridad transaccional entre documentos.",
    apiHint: "Metadatos vía Configurador / SQL SX8",
  },
  {
    id: "SX9",
    nombre: "Relacionamentos entre Tabelas (Foreign Keys)",
    descripcion: "Estructura de grafo de relaciones: dominio origen (X9_DOM), contra-dominio destino (X9_CDOM) y expresión de enlace (X9_EXPCDOM). Base del Process Mining.",
    apiHint: "/api/framework/v1/Dictionary/Relationships · POST /api/framework/v1/Instance/SX9",
    claveParaOpo: true,
  },
  {
    id: "SIX",
    nombre: "Índices de Base de Datos",
    descripcion: "Catálogo de índices por archivo (INDICE, ORDEM, CHAVE, DESCRICAO) para optimización y ordenamiento de queries.",
    apiHint: "/api/framework/v1/Dictionary/Indexes",
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
    descripcion: "La PC Claver o el Edge Agent debe alcanzar el puerto REST (ej. 8073).",
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
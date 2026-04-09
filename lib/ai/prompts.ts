/**
 * AI Prompts — System prompts optimized for ERP tasks
 *
 * Each prompt is crafted for Qwen 2.5 14B to return structured JSON.
 * Smaller models (Mistral 7B) get simpler prompts via the "realtime" variants.
 */

export const SYSTEM_PROMPT_BASE = `Sos un asistente de análisis integrado en un ERP argentino multi-rubro.
Reglas:
- Respondé SIEMPRE en español argentino
- Respondé SIEMPRE en formato JSON válido, sin texto adicional antes o después
- Usá moneda en pesos argentinos (ARS)
- Las fechas en formato ISO 8601
- Los números decimales con punto (no coma)
- No inventés datos: si no podés analizar, respondé { "error": "datos_insuficientes" }
- Sé directo, sin introducciones ni conclusiones
- No repitas la pregunta en la respuesta`

// ─── ALERTAS INTELIGENTES ────────────────────────────────────────────────────

export function promptAlertasInteligentes(rubro: string, datos: {
  ventasUltimos30Dias: unknown[]
  stockCritico: unknown[]
  cuentasCobrarVencidas: unknown[]
  clientesInactivos: unknown[]
}): string {
  return `${SYSTEM_PROMPT_BASE}

Rubro del negocio: ${rubro}

Analizá los siguientes datos operativos y generá alertas accionables.

DATOS:
- Ventas últimos 30 días: ${JSON.stringify(datos.ventasUltimos30Dias).slice(0, 8000)}
- Stock crítico: ${JSON.stringify(datos.stockCritico).slice(0, 4000)}
- Cuentas a cobrar vencidas: ${JSON.stringify(datos.cuentasCobrarVencidas).slice(0, 4000)}
- Clientes inactivos (no compran hace 15+ días vs frecuencia habitual): ${JSON.stringify(datos.clientesInactivos).slice(0, 4000)}

Respondé con este JSON exacto:
{
  "alertas": [
    {
      "tipo": "stock_critico" | "demanda_cayendo" | "cliente_inactivo" | "cobranza_urgente" | "anomalia_precio" | "oportunidad",
      "prioridad": "alta" | "media" | "baja",
      "titulo": "string corto (máx 80 chars)",
      "detalle": "string explicativo con números concretos",
      "accionSugerida": "string con la acción concreta a tomar",
      "impactoEstimado": "string con impacto en $ estimado"
    }
  ],
  "resumenEjecutivo": "string de 2-3 líneas con lo más importante del día",
  "indicadores": {
    "ventasDiarias": number,
    "tendencia": "subiendo" | "estable" | "bajando",
    "ticketPromedio": number,
    "clientesActivos": number
  }
}`
}

// ─── CLASIFICACIÓN DE PRODUCTOS ──────────────────────────────────────────────

export function promptClasificarProducto(descripcion: string, categoriasExistentes: string[]): string {
  return `${SYSTEM_PROMPT_BASE}

Clasificá este producto para un ERP argentino.

Producto: "${descripcion}"
Categorías existentes: ${JSON.stringify(categoriasExistentes)}

Respondé con este JSON:
{
  "nombre_normalizado": "string — nombre limpio y estandarizado",
  "categoria_sugerida": "string — una de las categorías existentes, o nueva si no encaja",
  "alicuota_iva": 21 | 10.5 | 27 | 0,
  "razon_iva": "string explicando por qué esa alícuota",
  "unidad_medida": "unidad" | "kg" | "litro" | "metro" | "m2" | "m3" | "par",
  "es_servicio": boolean,
  "codigo_sugerido": "string alfanumérico corto (3-8 chars)",
  "posibles_duplicados": ["producto1", "producto2"],
  "tags": ["tag1", "tag2"]
}`
}

// ─── ANÁLISIS DE COBRANZA ────────────────────────────────────────────────────

export function promptAnalisisCobranza(cuentas: unknown[]): string {
  return `${SYSTEM_PROMPT_BASE}

Analizá estas cuentas a cobrar vencidas y priorizá la cobranza.

Cuentas: ${JSON.stringify(cuentas).slice(0, 10000)}

Respondé con este JSON:
{
  "prioridad": [
    {
      "clienteId": number,
      "clienteNombre": "string",
      "montoTotal": number,
      "diasVencido": number,
      "riesgo": "alto" | "medio" | "bajo",
      "probabilidadCobro": number (0-100),
      "mensajeWhatsApp": "string — mensaje personalizado y cordial para cobrar",
      "estrategiaRecomendada": "llamar" | "whatsapp" | "email" | "visita" | "refinanciar" | "legal"
    }
  ],
  "resumen": {
    "totalVencido": number,
    "estimadoRecuperable": number,
    "clientesCriticos": number,
    "accionInmediata": "string con la acción más urgente"
  }
}`
}

// ─── PREDICCIÓN DE COMPRAS ───────────────────────────────────────────────────

export function promptPrediccionCompras(productos: unknown[], ventas: unknown[]): string {
  return `${SYSTEM_PROMPT_BASE}

Basándote en las ventas históricas, predecí qué productos hay que reponer esta semana.

Productos con stock actual: ${JSON.stringify(productos).slice(0, 8000)}
Ventas últimas 8 semanas: ${JSON.stringify(ventas).slice(0, 8000)}

Respondé con este JSON:
{
  "reposiciones": [
    {
      "productoId": number,
      "productoNombre": "string",
      "stockActual": number,
      "consumoSemanal": number,
      "diasCobertura": number,
      "cantidadSugerida": number,
      "urgencia": "inmediata" | "esta_semana" | "proxima_semana",
      "razon": "string"
    }
  ],
  "alertasEstacionales": ["string — eventos próximos que afectan demanda"],
  "resumen": "string"
}`
}

// ─── REPORTE EN LENGUAJE NATURAL ─────────────────────────────────────────────

export function promptReporteNatural(pregunta: string, datos: unknown): string {
  return `${SYSTEM_PROMPT_BASE}

El dueño del negocio pregunta: "${pregunta}"

Datos disponibles del sistema:
${JSON.stringify(datos).slice(0, 12000)}

Respondé con este JSON:
{
  "respuesta": "string — respuesta clara, directa, con números concretos en lenguaje coloquial argentino",
  "graficos_sugeridos": [
    { "tipo": "bar" | "line" | "pie", "titulo": "string", "datos": "descripción de qué graficar" }
  ],
  "insight_adicional": "string — algo que el dueño no preguntó pero le sirve saber",
  "accion_sugerida": "string — qué debería hacer basado en los datos"
}`
}

// ─── DETECCIÓN DE ANOMALÍAS ──────────────────────────────────────────────────

export function promptDeteccionAnomalias(operaciones: unknown[]): string {
  return `${SYSTEM_PROMPT_BASE}

Analizá estas operaciones y detectá anomalías (posibles errores, fraude, o comportamiento inusual).

Operaciones: ${JSON.stringify(operaciones).slice(0, 10000)}

Respondé con este JSON:
{
  "anomalias": [
    {
      "tipo": "precio_sospechoso" | "horario_inusual" | "volumen_atipico" | "descuento_excesivo" | "anulacion_frecuente" | "patron_fraude",
      "severidad": "critica" | "alta" | "media" | "info",
      "descripcion": "string detallado",
      "operacionId": number | null,
      "valorEsperado": "string",
      "valorReal": "string",
      "recomendacion": "string"
    }
  ],
  "scoreRiesgo": number (0-100),
  "resumen": "string"
}`
}

// ─── ONBOARDING CONVERSACIONAL ───────────────────────────────────────────────

export function promptOnboardingConversacional(mensajeUsuario: string): string {
  return `${SYSTEM_PROMPT_BASE}

Sos el asistente de configuración inicial del ERP. El usuario te va a describir su negocio en lenguaje natural.
Extraé toda la información posible para configurar el sistema.

Rubros disponibles: ferreteria, kiosco, bar_restaurant, veterinaria, clinica, farmacia, libreria, ropa, supermercado, distribuidora, salon_belleza, gimnasio, hamburgueseria, tattoo_studio, optica, lavadero_autos, pilates_yoga, taller_mecanico, inmobiliaria, estudio_contable, cerveceria_artesanal, canchas_deportes, cotillon_eventos, pet_shop, floristeria, odontologia

Mensaje del usuario: "${mensajeUsuario}"

Respondé con este JSON:
{
  "rubro_detectado": "string — uno de los rubros disponibles",
  "confianza": number (0-100),
  "datos_extraidos": {
    "tamano": "micro" | "pequeno" | "mediano" | null,
    "tieneStock": boolean | null,
    "tienePersonal": boolean | null,
    "necesitaFacturacion": boolean | null,
    "tieneLocal": boolean | null,
    "tieneDelivery": boolean | null,
    "tieneAgenda": boolean | null,
    "canalVenta": ["local", "web", "whatsapp", "rappi", "pedidosya"] | null
  },
  "preguntasSiguientes": ["string — preguntas que faltan para completar la configuración"],
  "respuesta": "string — respuesta conversacional al usuario confirmando lo entendido"
}`
}

// ─── GENERADOR DE PRESUPUESTO POR VOZ/TEXTO ─────────────────────────────────

export function promptGenerarPresupuesto(texto: string, productosDisponibles: unknown[]): string {
  return `${SYSTEM_PROMPT_BASE}

El vendedor dicta o escribe un presupuesto en lenguaje natural. Interpretalo y armá las líneas.

Texto del vendedor: "${texto}"
Productos disponibles: ${JSON.stringify(productosDisponibles).slice(0, 8000)}

Respondé con este JSON:
{
  "lineas": [
    {
      "productoId": number | null,
      "productoNombre": "string — nombre del producto match",
      "cantidad": number,
      "unidad": "string",
      "precioUnitario": number | null,
      "confianzaMatch": number (0-100)
    }
  ],
  "clienteDetectado": "string | null — si mencionó el nombre del cliente",
  "observaciones": "string | null — notas adicionales que mencionó",
  "itemsNoEncontrados": ["string — items que no matchearon con el catálogo"]
}`
}

/**
 * Valor Agregado IA por Rubro — Configuración de funcionalidades IA por vertical
 *
 * Define qué funciones de IA están disponibles, cuáles son prioritarias,
 * y qué valor concreto genera cada una por rubro. Esto alimenta:
 * - El onboarding (muestra al usuario qué IA va a tener)
 * - El dashboard (activa/desactiva widgets IA según rubro)
 * - Los jobs nocturnos (sólo corre los analyzers relevantes)
 * - El marketing (argumentos de venta con IA por nicho)
 */

import type { Rubro } from "@/lib/onboarding/onboarding-ia"

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface IAFeature {
  id: string
  nombre: string
  descripcion: string
  /** "realtime" = respuesta instantánea, "batch" = solicitud-respuesta, "nightly" = job nocturno */
  tier: "realtime" | "batch" | "nightly"
  /** Modelo sugerido para esta feature */
  modeloSugerido: "fast" | "primary" | "heavy"
  /** Valor que genera en este rubro */
  valorRubro: string
  /** Ejemplo concreto de output para el rubro */
  ejemploOutput: string
  /** Impacto estimado: "alto" | "medio" | "bajo" */
  impacto: "alto" | "medio" | "bajo"
}

export interface IAConfigRubro {
  rubro: string
  nombreRubro: string
  features: IAFeature[]
  argumentoVentaIA: string
  /** Modelo recomendado principal para este rubro */
  modeloPrincipal: string
  /** Features prioritarias (top 3) */
  top3: string[]
  /** ROI estimado mensual en horas ahorradas */
  horasAhorradasMes: number
}

// ─── FEATURES BASE ───────────────────────────────────────────────────────────

const FEATURES_BASE: Record<string, Omit<IAFeature, "valorRubro" | "ejemploOutput" | "impacto">> = {
  alertas_inteligentes: {
    id: "alertas_inteligentes",
    nombre: "Alertas Inteligentes",
    descripcion: "Análisis nocturno de ventas, stock, cobranza y clientes. Genera alertas priorizadas por WhatsApp al dueño.",
    tier: "nightly",
    modeloSugerido: "primary",
  },
  clasificador_productos: {
    id: "clasificador_productos",
    nombre: "Clasificador de Productos IA",
    descripcion: "Al cargar un producto, la IA sugiere categoría, IVA, código, y detecta duplicados.",
    tier: "realtime",
    modeloSugerido: "fast",
  },
  cobranza_inteligente: {
    id: "cobranza_inteligente",
    nombre: "Cobranza Inteligente",
    descripcion: "Prioriza CC vencidas, estima probabilidad de cobro, genera mensajes de WhatsApp personalizados.",
    tier: "batch",
    modeloSugerido: "primary",
  },
  prediccion_compras: {
    id: "prediccion_compras",
    nombre: "Predicción de Compras",
    descripcion: "Analiza ventas históricas y predice qué reponer esta semana, con alertas estacionales.",
    tier: "nightly",
    modeloSugerido: "primary",
  },
  reportes_naturales: {
    id: "reportes_naturales",
    nombre: "Reportes en Lenguaje Natural",
    descripcion: "El dueño pregunta 'cómo me fue este mes?' y la IA responde con números y comparaciones.",
    tier: "batch",
    modeloSugerido: "primary",
  },
  deteccion_anomalias: {
    id: "deteccion_anomalias",
    nombre: "Detección de Anomalías",
    descripcion: "Identifica operaciones sospechosas: precios inusuales, horarios raros, descuentos excesivos.",
    tier: "nightly",
    modeloSugerido: "heavy",
  },
  presupuesto_voz: {
    id: "presupuesto_voz",
    nombre: "Presupuesto por Voz/Texto",
    descripcion: "El vendedor dicta el presupuesto y la IA arma las líneas con productos del catálogo.",
    tier: "batch",
    modeloSugerido: "primary",
  },
  onboarding_conversacional: {
    id: "onboarding_conversacional",
    nombre: "Onboarding Conversacional",
    descripcion: "En vez de un wizard fijo, el dueño describe su negocio y la IA configura todo.",
    tier: "realtime",
    modeloSugerido: "fast",
  },
  menu_inteligente: {
    id: "menu_inteligente",
    nombre: "Menú Inteligente",
    descripcion: "Sugiere combos, detecta platos lentos, optimiza carta según margen y popularidad.",
    tier: "nightly",
    modeloSugerido: "primary",
  },
  turnos_optimizados: {
    id: "turnos_optimizados",
    nombre: "Optimización de Agenda",
    descripcion: "Detecta huecos improductivos y sugiere reagendar turnos para maximizar ocupación.",
    tier: "nightly",
    modeloSugerido: "primary",
  },
  retencion_clientes: {
    id: "retencion_clientes",
    nombre: "Retención de Clientes IA",
    descripcion: "Identifica clientes en riesgo de abandono y genera campañas de retención personalizadas.",
    tier: "nightly",
    modeloSugerido: "primary",
  },
  pricing_dinamico: {
    id: "pricing_dinamico",
    nombre: "Pricing Dinámico",
    descripcion: "Sugiere ajustes de precios basados en competencia, demanda y márgenes objetivo.",
    tier: "nightly",
    modeloSugerido: "heavy",
  },
  diagnostico_mascota: {
    id: "diagnostico_mascota",
    nombre: "Asistente de Diagnóstico",
    descripcion: "Sugiere diagnósticos diferenciales basados en síntomas, raza, edad y peso del paciente.",
    tier: "batch",
    modeloSugerido: "primary",
  },
  recordatorio_inteligente: {
    id: "recordatorio_inteligente",
    nombre: "Recordatorios Personalizados",
    descripcion: "Genera textos de recordatorio contextuales (vacunas, turnos, pagos) adaptados al cliente.",
    tier: "realtime",
    modeloSugerido: "fast",
  },
  analisis_membresias: {
    id: "analisis_membresias",
    nombre: "Análisis de Membresías",
    descripcion: "Predice churn de socios, sugiere promociones de retención, optimiza pricing de planes.",
    tier: "nightly",
    modeloSugerido: "primary",
  },
  comisiones_optimizadas: {
    id: "comisiones_optimizadas",
    nombre: "Optimización de Comisiones",
    descripcion: "Analiza productividad por profesional, sugiere esquemas de comisión que maximizan retención.",
    tier: "nightly",
    modeloSugerido: "primary",
  },
  vencimientos_fiscal: {
    id: "vencimientos_fiscal",
    nombre: "Calendario Fiscal Inteligente",
    descripcion: "Analiza obligaciones fiscales y prioriza según riesgo de multa e impacto financiero.",
    tier: "batch",
    modeloSugerido: "fast",
  },
  pedidos_whatsapp: {
    id: "pedidos_whatsapp",
    nombre: "Pedidos por WhatsApp IA",
    descripcion: "Interpreta mensajes de WhatsApp en lenguaje natural y los convierte en pedidos del sistema.",
    tier: "realtime",
    modeloSugerido: "fast",
  },
  estimador_tiempo: {
    id: "estimador_tiempo",
    nombre: "Estimador de Tiempos",
    descripcion: "Calcula tiempo de preparación/servicio basado en cola actual y capacidad del negocio.",
    tier: "realtime",
    modeloSugerido: "fast",
  },
  rutas_cobranza: {
    id: "rutas_cobranza",
    nombre: "Optimización de Rutas",
    descripcion: "Organiza la ruta diaria del cobrador/repartidor prioritizando por monto y cercanía.",
    tier: "batch",
    modeloSugerido: "primary",
  },
}

// ─── CONFIG POR RUBRO ────────────────────────────────────────────────────────

export const IA_POR_RUBRO: Record<string, IAConfigRubro> = {
  // ── GASTRONOMÍA ─────────────────────────────────────────────────────
  bar_restaurant: {
    rubro: "bar_restaurant",
    nombreRubro: "Bar / Restaurant / Hamburguesería",
    modeloPrincipal: "Qwen 2.5 14B — para análisis de menú y costos de recetas",
    top3: ["pedidos_whatsapp", "menu_inteligente", "alertas_inteligentes"],
    horasAhorradasMes: 40,
    argumentoVentaIA: "La IA analiza tu carta todas las noches y te dice cuáles platos te dan más margen, cuáles se venden poco y conviene sacar, y cuáles combos podés armar para subir el ticket promedio. Además, recibe pedidos por WhatsApp y los manda directo a cocina sin que nadie tipee nada.",
    features: [
      { ...FEATURES_BASE.pedidos_whatsapp, impacto: "alto", valorRubro: "Recibe pedidos por WhatsApp en lenguaje natural ('quiero 2 smash con cheddar y papas grandes') → los convierte en comanda automática para cocina. Elimina errores de transcripción y ahorra 1 empleado.", ejemploOutput: "Cliente: 'mandame 2 cuartos con cheddar, una coca y papas grandes'. IA: {lineas: [{nombre: 'Cuarto con cheddar', cantidad: 2, precio: 5500}, {nombre: 'Coca-Cola 500ml', cantidad: 1, precio: 1200}, {nombre: 'Papas grandes', cantidad: 1, precio: 2800}], total: 15000}" },
      { ...FEATURES_BASE.menu_inteligente, impacto: "alto", valorRubro: "Todas las noches analiza ventas vs costos de receta. Detecta platos con margen <20% para remarcar y platos que no se venden hace 2 semanas para sacar de carta. Sugiere combos rentables.", ejemploOutput: "{platos_bajo_margen: ['Milanesa napolitana (margen 12%)'], sugerencia_combo: 'Smash + Papas + Bebida a $6500 (margen 45% vs 38% individual)', platos_eliminar: ['Pizza cuatro quesos (0 ventas en 14 días)']}" },
      { ...FEATURES_BASE.estimador_tiempo, impacto: "alto", valorRubro: "Cuando el cliente pide por web/WhatsApp, le dice '~25 minutos' basado en cuántas comandas hay en cola × tiempo promedio de tu cocina. Reduce reclamos por demora.", ejemploOutput: "{estimado_minutos: 25, comandas_en_cola: 8, carga_cocina: 'alta', mensaje_cliente: 'Tu pedido estará listo en aproximadamente 25 minutos'}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "alto", valorRubro: "A las 6AM te manda por WhatsApp: 'Ayer vendiste $480K, 15% más que el jueves anterior. Se te están terminando las tapas de empanadas (quedan 40, consumo diario ~120). El mozo Matías tuvo 35% más propinas que el resto.'", ejemploOutput: "{alertas: [{tipo: 'stock_critico', titulo: 'Tapas de empanadas para 3 horas', accion: 'Pedirle a proveedor 500 tapas'}]}" },
      { ...FEATURES_BASE.prediccion_compras, impacto: "medio", valorRubro: "Predice consumo de insumos basado en ventas históricas + evento especial (feriado, partido, etc).", ejemploOutput: "{reposiciones: [{nombre: 'Pan de burger', consumo_semanal: 800, stock: 200, urgencia: 'inmediata'}]}" },
      { ...FEATURES_BASE.deteccion_anomalias, impacto: "medio", valorRubro: "Detecta si un mozo está haciendo descuentos excesivos o si se anulan muchas comandas en un turno.", ejemploOutput: "{anomalias: [{tipo: 'anulacion_frecuente', descripcion: 'Mozo ID 5 anuló 12 comandas esta semana vs promedio 2'}]}" },
      { ...FEATURES_BASE.reportes_naturales, impacto: "medio", valorRubro: "Preguntás '¿cuál es mi plato más rentable?' y te responde con datos reales.", ejemploOutput: "{respuesta: 'Tu plato más rentable es la Smash Doble con $2.800 de margen por unidad y 45 ventas semanales. Genera $126K/semana.'}" },
    ],
  },

  // ── PELUQUERÍA / BARBERÍA ───────────────────────────────────────────
  salon_belleza: {
    rubro: "salon_belleza",
    nombreRubro: "Salón de Belleza / Barbería",
    modeloPrincipal: "Mistral 7B — recordatorios rápidos + Qwen 14B para análisis de agenda",
    top3: ["turnos_optimizados", "retencion_clientes", "comisiones_optimizadas"],
    horasAhorradasMes: 25,
    argumentoVentaIA: "La IA detecta huecos en tu agenda que podrías llenar, identifica clientes que están por irse a la competencia, y optimiza las comisiones para que tus profesionales ganen más sin que vos pierdas margen.",
    features: [
      { ...FEATURES_BASE.turnos_optimizados, impacto: "alto", valorRubro: "Analiza la agenda semanal y detecta huecos de 30-60min entre turnos que podrían llenarse con servicios rápidos (barba, cejas). Manda sugerencia al profesional.", ejemploOutput: "{huecos_detectados: 12, ocupacion_actual: '68%', sugerencia: 'Ofrecer corte express $2500 en huecos de 30min de Lucas (mar/jue 11-11:30, mie 15-15:30)', potencial_extra: '$30.000/semana'}" },
      { ...FEATURES_BASE.retencion_clientes, impacto: "alto", valorRubro: "Detecta clientas que venían cada 4 semanas y llevan 6 sin venir. Genera WhatsApp personalizado: 'Hola María! Hace tiempo no te vemos. Esta semana Lucía tiene un hueco el jueves a las 16hs, ¿te lo reservo?'", ejemploOutput: "{clientes_riesgo: 8, mensaje: 'Hola María! Hace tiempo no te vemos por el salón. Lucía tiene disponibilidad este jueves 16hs. ¿Te reservo? Tenemos 15% en coloración esta semana 💇‍♀️'}" },
      { ...FEATURES_BASE.comisiones_optimizadas, impacto: "medio", valorRubro: "Analiza qué esquema de comisión retiene mejor al equipo y genera más ingreso: ¿fijo + % por servicio? ¿escala por volumen? Simula escenarios.", ejemploOutput: "{propuesta: 'Pasar a Lucía de 40% fijo a 35% + 5% bonus >$800K/mes genera +$45K para ella y +$20K para el salón'}" },
      { ...FEATURES_BASE.recordatorio_inteligente, impacto: "alto", valorRubro: "Mensajes de recordatorio adaptados: incluye nombre del profesional, servicio, y consejo pre-servicio.", ejemploOutput: "{mensaje: 'Hola Ana! Mañana a las 10hs tenés turno con Lucía para coloración. Recordá venir con el pelo sin lavar para mejor fijación del color 💆‍♀️'}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "medio", valorRubro: "Stock de insumos profesionales bajo, profesional con cancelaciones frecuentes, día con baja ocupación.", ejemploOutput: "{alertas: [{titulo: 'Oxidante 30vol casi sin stock (queda para 3 servicios)', accion: 'Pedir 5 unidades a proveedor'}]}" },
      { ...FEATURES_BASE.reportes_naturales, impacto: "medio", valorRubro: "¿Quién vendió más esta semana? ¿Cuántas clientas nuevas tuve este mes?", ejemploOutput: "{respuesta: 'Esta semana Lucía fue la que más facturó: $380K (22 turnos). Tuviste 8 clientas nuevas, 6 por Instagram.'}" },
    ],
  },

  // ── VETERINARIA ─────────────────────────────────────────────────────
  veterinaria: {
    rubro: "veterinaria",
    nombreRubro: "Veterinaria",
    modeloPrincipal: "Qwen 2.5 14B — análisis de historias clínicas + sugerencias diagnósticas",
    top3: ["diagnostico_mascota", "recordatorio_inteligente", "alertas_inteligentes"],
    horasAhorradasMes: 30,
    argumentoVentaIA: "La IA te sugiere diagnósticos diferenciales mientras atendés, manda recordatorios de vacunas automáticos personalizados con el nombre de la mascota, y todas las mañanas te dice qué pacientes tienen control pendiente.",
    features: [
      { ...FEATURES_BASE.diagnostico_mascota, impacto: "alto", valorRubro: "El veterinario carga síntomas (vómitos + letargia + 8 años + labrador) y la IA sugiere diagnósticos diferenciales ordenados por probabilidad, con estudios recomendados.", ejemploOutput: "{diagnosticos: [{nombre: 'Pancreatitis aguda', probabilidad: 45, estudios: ['Ecografía abdominal', 'Lipasa sérica']}, {nombre: 'Insuficiencia renal', probabilidad: 30, estudios: ['Creatinina', 'Urea']}]}" },
      { ...FEATURES_BASE.recordatorio_inteligente, impacto: "alto", valorRubro: "WhatsApp automático con nombre de la mascota: 'Hola Juan! Rocky tiene pendiente la vacuna antirrabica (vence el 15/04). ¿Querés que te agendemos un turno?'", ejemploOutput: "{mensaje: 'Hola Juan! 🐕 Rocky tiene pendiente la vacuna antirrabica. Vence el 15/04. ¿Te agendamos turno esta semana? Respondé SI y te reservamos.'}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "alto", valorRubro: "Pacientes con control pendiente, medicamentos por vencer, turistas (clientes que vinieron 1 vez y no volvieron).", ejemploOutput: "{alertas: [{titulo: '12 mascotas con vacunas vencidas esta semana', accion: 'Enviar recordatorios masivos'}, {titulo: 'Amoxicilina lote 2024-A vence en 20 días', accion: 'Priorizar dispensación'}]}" },
      { ...FEATURES_BASE.prediccion_compras, impacto: "medio", valorRubro: "Predice consumo de vacunas y medicamentos según calendario y pacientes registrados.", ejemploOutput: "{reposiciones: [{nombre: 'Vacuna quíntuple', consumo_mensual: 45, stock: 12, urgencia: 'inmediata'}]}" },
      { ...FEATURES_BASE.turnos_optimizados, impacto: "medio", valorRubro: "Sugiere bloques para cirugías (mañana) y consultas (tarde) basado en patrones históricos.", ejemploOutput: "{sugerencia: 'Los martes por la mañana tenés 40% de ocupación. Ofrecer castración con 10% desc llevaría a 85%.'}" },
      { ...FEATURES_BASE.reportes_naturales, impacto: "bajo", valorRubro: "Estadísticas de prácticas, razas más atendidas, ingresos por servicio.", ejemploOutput: "{respuesta: 'Este mes atendiste 89 pacientes, 45% caninos y 35% felinos. La consulta general generó el 40% de tus ingresos.'}" },
    ],
  },

  // ── GIMNASIO / FITNESS ──────────────────────────────────────────────
  gimnasio: {
    rubro: "gimnasio",
    nombreRubro: "Gimnasio / Crossfit / Pilates",
    modeloPrincipal: "Qwen 2.5 14B — predicción de churn + optimización de precios de planes",
    top3: ["analisis_membresias", "retencion_clientes", "alertas_inteligentes"],
    horasAhorradasMes: 20,
    argumentoVentaIA: "La IA predice qué socios van a dejar de venir ANTES de que lo hagan. Te arma campañas de retención personalizadas y te dice cuánto cobrar para maximizar ingresos sin perder socios.",
    features: [
      { ...FEATURES_BASE.analisis_membresias, impacto: "alto", valorRubro: "Predice churn: 'De tus 200 socios activos, 15 tienen >70% probabilidad de no renovar. 8 bajaron asistencia 50% en las últimas 2 semanas.'", ejemploOutput: "{socios_riesgo: 15, razon_principal: 'baja_asistencia', accion: 'Llamar personalmente a los 5 de mayor ticket', ingresoEnRiesgo: '$180.000/mes'}" },
      { ...FEATURES_BASE.retencion_clientes, impacto: "alto", valorRubro: "Genera propuestas personalizadas: congelamiento, cambio de plan, clase de prueba gratuita.", ejemploOutput: "{mensaje: 'Hola Martín! Notamos que hace 2 semanas no venís. ¿Querés probar la clase de funcional los martes 19hs? Es nueva y tiene cupo. Te esperamos 💪'}" },
      { ...FEATURES_BASE.pricing_dinamico, impacto: "medio", valorRubro: "Simula escenarios de precio: '¿Si subo la mensual $2000, cuántos socios pierdo?'", ejemploOutput: "{simulacion: 'Subir de $15K a $17K perdería ~8 socios (4%). Ingreso neto: +$304K/mes. Recomendación: subir a $16.5K con clase extra incluida.'}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "alto", valorRubro: "Débitos fallidos, socios sin asistencia, cupo de clases agotándose.", ejemploOutput: "{alertas: [{titulo: '23 débitos fallidos este mes ($345K en riesgo)', accionSugerida: 'Enviar recordatorio de actualización de tarjeta'}]}" },
      { ...FEATURES_BASE.reportes_naturales, impacto: "medio", valorRubro: "¿Cuántos socios nuevos tuve? ¿Cuál fue mi tasa de retención?", ejemploOutput: "{respuesta: 'Este mes ganaste 18 socios y perdiste 12. Tasa de retención: 94%. El plan mensual tiene peor retención (88%) que el trimestral (97%).'}" },
    ],
  },

  // ── FERRETERÍA ──────────────────────────────────────────────────────
  ferreteria: {
    rubro: "ferreteria",
    nombreRubro: "Ferretería",
    modeloPrincipal: "Qwen 2.5 14B — clasificación de productos heterogéneos + predicción de compras",
    top3: ["clasificador_productos", "prediccion_compras", "presupuesto_voz"],
    horasAhorradasMes: 35,
    argumentoVentaIA: "La IA clasifica los 10.000+ productos que tenés sin que tipees categoría ni IVA. Predice cuándo te vas a quedar sin cemento basándose en tus ventas. Y el vendedor dicta el presupuesto en 10 segundos en vez de buscarlo producto por producto.",
    features: [
      { ...FEATURES_BASE.clasificador_productos, impacto: "alto", valorRubro: "Escribís 'aceite p/motor 20w50 1lt' → sugiere categoría Lubricantes, IVA 21%, código LUB-001, detecta si ya tenés 'Aceite motor 20W50 Castrol 1L'.", ejemploOutput: "{nombre_normalizado: 'Aceite motor 20W-50 1L', categoria: 'Lubricantes', iva: 21, duplicados: ['Aceite motor 20W50 Castrol 1L (ID: 234)']}" },
      { ...FEATURES_BASE.presupuesto_voz, impacto: "alto", valorRubro: "El vendedor dice 'presupuesto para González: 200 metros de cable 2.5, 50 llaves térmicas de 20A y 10 tableros 12 módulos' → el sistema arma las líneas con los productos reales, precios y stock.", ejemploOutput: "{lineas: [{nombre: 'Cable unipolar 2.5mm (m)', cantidad: 200, precio: 450}, {nombre: 'Llave térmica 20A', cantidad: 50, precio: 8500}], cliente: 'González', total: '$605.000'}" },
      { ...FEATURES_BASE.prediccion_compras, impacto: "alto", valorRubro: "Predice cementos, hierros y pinturas por estacionalidad + días de entrega del proveedor.", ejemploOutput: "{reposiciones: [{nombre: 'Cemento Portland x50kg', diasCobertura: 3, urgencia: 'inmediata', razon: 'La semana que viene es feriado largo, históricamente vendés 40% más'}]}" },
      { ...FEATURES_BASE.cobranza_inteligente, impacto: "alto", valorRubro: "Prioriza constructoras con deuda grande + genera mensaje cordial pero firme para cada una.", ejemploOutput: "{prioridad: [{cliente: 'Constructora Rossi', monto: 2800000, dias: 45, mensaje: 'Estimado Sr. Rossi, la factura A-0004-00234 por $2.8M venció hace 45 días...'}]}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "medio", valorRubro: "Stock crítico de bestsellers, precios de proveedor que subieron mucho, cliente importante que no compra hace tiempo.", ejemploOutput: "{alertas: [{titulo: 'Precio de cemento subió 18% en Distribuidora XYZ vs mes anterior', accion: 'Cotizar con proveedor alternativo'}]}" },
      { ...FEATURES_BASE.deteccion_anomalias, impacto: "medio", valorRubro: "Ventas a precio menor al costo, descuentos que no corresponden al cliente.", ejemploOutput: "{anomalias: [{tipo: 'precio_sospechoso', descripcion: 'Factura #456 vendió 100 caños a $800 c/u (costo $950)'}]}" },
    ],
  },

  // ── KIOSCO ──────────────────────────────────────────────────────────
  kiosco: {
    rubro: "kiosco",
    nombreRubro: "Kiosco / Maxikiosco",
    modeloPrincipal: "Mistral 7B — velocidad máxima para clasificación rápida en venta mostrador",
    top3: ["alertas_inteligentes", "prediccion_compras", "cobranza_inteligente"],
    horasAhorradasMes: 15,
    argumentoVentaIA: "Cada mañana te dice qué te falta reponer y qué clientes del barrio te deben. A fin de mes te cuenta cómo te fue sin que tengas que leer planillas.",
    features: [
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "alto", valorRubro: "Productos top 20 sin stock, clientes del barrio que no vienen, caja con diferencia.", ejemploOutput: "{alertas: [{titulo: 'Coca-Cola 500ml: quedan 6 unidades (vendes 25/día)', accion: 'Pedir 2 packs al distribuidor'}]}" },
      { ...FEATURES_BASE.prediccion_compras, impacto: "alto", valorRubro: "Predice reposición por día de la semana (viernes vendés más gaseosas, lunes más cigarrillos).", ejemploOutput: "{reposiciones: [{nombre: 'Cerveza lata 473ml', urgencia: 'inmediata', razon: 'Viernes vendés 3x más que entre semana, stock para 1 día'}]}" },
      { ...FEATURES_BASE.cobranza_inteligente, impacto: "medio", valorRubro: "Clientes del barrio que fían: quién debe más, hace cuánto, mensaje de WhatsApp.", ejemploOutput: "{prioridad: [{cliente: 'Carlos (vecino)', monto: 15000, dias: 20, mensaje: 'Hola Carlos! Tu cuenta está en $15.000. ¿Pasás esta semana a ponerte al día? 🙏'}]}" },
      { ...FEATURES_BASE.reportes_naturales, impacto: "bajo", valorRubro: "¿Cuánto gané esta semana? ¿Qué producto me da más margen?", ejemploOutput: "{respuesta: 'Esta semana facturaste $320K, tu mejor día fue el sábado con $85K. El mayor margen lo tienen los alfajores (42%).'}" },
    ],
  },

  // ── CLÍNICA / SALUD ─────────────────────────────────────────────────
  clinica: {
    rubro: "clinica",
    nombreRubro: "Clínica / Consultorio",
    modeloPrincipal: "Qwen 2.5 14B — análisis de agenda + generación de textos médicos",
    top3: ["turnos_optimizados", "recordatorio_inteligente", "vencimientos_fiscal"],
    horasAhorradasMes: 25,
    argumentoVentaIA: "La IA optimiza tu agenda para que no tengas huecos improductivos, manda recordatorios que bajan el ausentismo un 30%, y te avisa de vencimientos fiscales de obras sociales.",
    features: [
      { ...FEATURES_BASE.turnos_optimizados, impacto: "alto", valorRubro: "Detecta especialidades con baja ocupación y sugiere ofertar turnos de guardia o prácticas específicas.", ejemploOutput: "{ocupacion_semanal: '62%', huecos: 18, sugerencia: 'Ofrecer ecografías los miércoles 14-16hs (consultorio libre, ecógrafo disponible)'}" },
      { ...FEATURES_BASE.recordatorio_inteligente, impacto: "alto", valorRubro: "Adaptado por tipo de práctica: ayuno para análisis, no maquillaje para derma, traer estudios previos.", ejemploOutput: "{mensaje: 'Hola Ana! Mañana 9:30hs tenés turno de laboratorio con Dra. López. Recordá venir en ayuno de 8hs y traer la orden médica. 🏥'}" },
      { ...FEATURES_BASE.vencimientos_fiscal, impacto: "medio", valorRubro: "Lotes de obras sociales por vencer, nomenclador actualizado, autorizaciones pendientes.", ejemploOutput: "{vencimientos: [{tipo: 'lote_os', nombre: 'OSDE - Marzo 2026', vence: '2026-04-15', monto: 450000, accion: 'Presentar antes del 10/04'}]}" },
      { ...FEATURES_BASE.reportes_naturales, impacto: "medio", valorRubro: "Ingresos por obra social, prácticas más realizadas, tasa de ausentismo.", ejemploOutput: "{respuesta: 'Este mes facturaste $2.1M a obras sociales y $800K a particulares. La tasa de ausentismo bajó de 18% a 12% desde que implementamos recordatorios.'}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "medio", valorRubro: "Turnos sin confirmar, insumos médicos por vender, pacientes sin control.", ejemploOutput: "{alertas: [{titulo: '15 turnos de mañana sin confirmar (históricamente 30% no asiste si no confirma)'}]}" },
    ],
  },

  // ── FARMACIA ────────────────────────────────────────────────────────
  farmacia: {
    rubro: "farmacia",
    nombreRubro: "Farmacia",
    modeloPrincipal: "Qwen 2.5 14B — detección de interacciones + predicción de vencimientos masivos",
    top3: ["prediccion_compras", "alertas_inteligentes", "clasificador_productos"],
    horasAhorradasMes: 30,
    argumentoVentaIA: "La IA predice qué medicamentos vas a necesitar antes de que se acaben, detecta lotes próximos a vencer para priorizar la venta, y al cargar un producto nuevo le asigna categoría terapéutica automáticamente.",
    features: [
      { ...FEATURES_BASE.prediccion_compras, impacto: "alto", valorRubro: "Predice demanda por estacionalidad (antigripales en invierno, protectores solares en verano) + días de entrega de droguería.", ejemploOutput: "{reposiciones: [{nombre: 'Ibuprofeno 400mg', consumo_semanal: 120, stock: 45, urgencia: 'inmediata', razon: 'Ola de frío prevista semana que viene, históricamente sube 80%'}]}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "alto", valorRubro: "Lotes por vencer (priorizar dispensación FEFO), psicotrópicos con stock inconsistente, descuentos OS sin aplicar.", ejemploOutput: "{alertas: [{titulo: 'Lote AMX-2024-09 de Amoxicilina vence en 25 días (42 unidades)', accion: 'Priorizar dispensación sobre lote nuevo'}]}" },
      { ...FEATURES_BASE.clasificador_productos, impacto: "medio", valorRubro: "Clasifica por categoría terapéutica + detecta si es venta libre vs bajo receta.", ejemploOutput: "{categoria: 'Antiinflamatorios', tipo_venta: 'venta_libre', iva: 0, requiere_receta: false}" },
      { ...FEATURES_BASE.reportes_naturales, impacto: "medio", valorRubro: "Ventas por obra social, rotación de medicamentos, merma por vencimiento.", ejemploOutput: "{respuesta: 'Este mes la merma por vencimiento fue $45K (0.8% de ventas). PAMI representó 35% de facturación.'}" },
    ],
  },

  // ── DISTRIBUIDORA ───────────────────────────────────────────────────
  distribuidora: {
    rubro: "distribuidora",
    nombreRubro: "Distribuidora / Mayorista",
    modeloPrincipal: "Qwen 2.5 14B — pricing + predicción de demanda + optimización de rutas",
    top3: ["cobranza_inteligente", "rutas_cobranza", "prediccion_compras"],
    horasAhorradasMes: 45,
    argumentoVentaIA: "La IA optimiza la ruta del cobrador para que recorra menos y cobre más, prioriza clientes por riesgo de incobrabilidad, y predice la demanda por zona para que el depósito no se quede sin mercadería.",
    features: [
      { ...FEATURES_BASE.cobranza_inteligente, impacto: "alto", valorRubro: "Prioriza cartera masiva de cuentas por cobrar con predicción de quién va a pagar y quién no.", ejemploOutput: "{totalVencido: 8500000, estimadoRecuperable: 6200000, prioridad: [{cliente: 'Autoservicio 3 Hermanos', monto: 1200000, probabilidadCobro: 85}]}" },
      { ...FEATURES_BASE.rutas_cobranza, impacto: "alto", valorRubro: "Arma la ruta diaria del cobrador: orden de visitas por cercanía × prioridad de monto × probabilidad de cobro.", ejemploOutput: "{ruta: ['1° Autoservicio 3 Hermanos (Av. Rivadavia 4500, $1.2M)', '2° Almacén Don Pedro (a 800m, $450K)', '3° Kiosco 24hs (a 1.2km, $280K)'], cobro_estimado: '$1.93M'}" },
      { ...FEATURES_BASE.prediccion_compras, impacto: "alto", valorRubro: "Predice demanda por zona y canal, contrastando contra stock en depósito.", ejemploOutput: "{reposiciones: [{nombre: 'Gaseosa cola 2.25L', consumo_semanal_zona_sur: 800, stock: 200, urgencia: 'inmediata'}]}" },
      { ...FEATURES_BASE.pricing_dinamico, impacto: "medio", valorRubro: "Sugiere precios por cliente/zona basados en competencia + costo de flete + volumen.", ejemploOutput: "{ajustes: [{cliente: 'Cadena Norte', producto: 'Yerba 1kg', precio_actual: 2800, sugerido: 2650, razon: 'Competidor Dist. Sur ofrece a 2600'}]}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "medio", valorRubro: "Pedidos sin entregar hace 48hs, vendedor con baja productividad, cliente que dejó de comprar.", ejemploOutput: "{alertas: [{titulo: 'Vendedor Perez: 0 pedidos en 3 días (promedio 4/día)', accion: 'Llamar para chequear estado'}]}" },
    ],
  },

  // ── ROPA / INDUMENTARIA ─────────────────────────────────────────────
  ropa: {
    rubro: "ropa",
    nombreRubro: "Indumentaria / Moda",
    modeloPrincipal: "Qwen 2.5 14B — análisis de tendencias + predicción por talle/color",
    top3: ["alertas_inteligentes", "prediccion_compras", "reportes_naturales"],
    horasAhorradasMes: 20,
    argumentoVentaIA: "La IA te dice qué talles se agotan primero, cuándo liquidar y qué marcas rinden mejor. Antes de la temporada, predice cuánto comprar de cada talle basado en tus ventas.",
    features: [
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "alto", valorRubro: "Talles agotados de bestsellers, sobrestock de temporada anterior, cambios/devoluciones elevados.", ejemploOutput: "{alertas: [{titulo: 'Remera básica talle M agotada (es el 35% de las ventas de esa línea)', accion: 'Reponer 50 unidades urgente'}]}" },
      { ...FEATURES_BASE.prediccion_compras, impacto: "alto", valorRubro: "Distribución de talles por temporada: '42% de tus clientes son M, 28% L, 18% S'.", ejemploOutput: "{distribucion_talles: {XS: 5, S: 18, M: 42, L: 28, XL: 7}, sugerencia_compra: 'Para 100 unidades: 5 XS, 18 S, 42 M, 28 L, 7 XL'}" },
      { ...FEATURES_BASE.reportes_naturales, impacto: "medio", valorRubro: "Venta por marca, margen por línea, mejor día de ventas.", ejemploOutput: "{respuesta: 'La marca X vendió 60% más que el mes pasado. Tu mejor día fue el sábado con $450K. El jean elastizado es tu producto estrella con 38% de margen.'}" },
      { ...FEATURES_BASE.retencion_clientes, impacto: "medio", valorRubro: "Clientas VIP que no compran hace 2 meses + aviso de nueva colección.", ejemploOutput: "{mensaje: 'Hola Sofía! Llegó la nueva temporada otoño-invierno 🧥 Tenemos piezas que van con tu estilo. ¿Venís a verlas con 10% exclusivo?'}" },
    ],
  },

  // ── SUPERMERCADO ────────────────────────────────────────────────────
  supermercado: {
    rubro: "supermercado",
    nombreRubro: "Supermercado / Autoservicio",
    modeloPrincipal: "Qwen 2.5 14B — gestión masiva de SKUs + predicción de perecederos",
    top3: ["prediccion_compras", "alertas_inteligentes", "deteccion_anomalias"],
    horasAhorradasMes: 40,
    argumentoVentaIA: "La IA gestiona los miles de SKUs por vos: predice reposición de perecederos, detecta merma anormal, y optimiza la compra semanal al distribuidor.",
    features: [
      { ...FEATURES_BASE.prediccion_compras, impacto: "alto", valorRubro: "Reposición diaria de perecederos basada en día de semana + clima + eventos.", ejemploOutput: "{reposiciones: [{nombre: 'Leche sachet 1L', consumo_diario: 150, stock: 80, urgencia: 'mañana_temprano'}]}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "alto", valorRubro: "Perecederos por vencer, faltantes de góndola, cajas con diferencia.", ejemploOutput: "{alertas: [{titulo: '45 productos vencen en 3 días ($32K en costo)', accion: 'Poner en oferta del día'}]}" },
      { ...FEATURES_BASE.deteccion_anomalias, impacto: "medio", valorRubro: "Merma excesiva en categoría, anulaciones sospechosas, diferencias de inventario.", ejemploOutput: "{anomalias: [{tipo: 'merma_excesiva', descripcion: 'Fiambrería: merma 8% vs promedio 2%', recomendacion: 'Verificar cadena de frío y pesaje'}]}" },
      { ...FEATURES_BASE.pricing_dinamico, impacto: "medio", valorRubro: "Precios de oferta semanal optimizados para maximizar tráfico + margen.", ejemploOutput: "{ofertas: [{producto: 'Aceite girasol 1.5L', precio_actual: 2200, sugerido: 1899, razon: 'Gancho de tráfico: históricamente trae +22% de clientes'}]}" },
    ],
  },

  // ── LIBRERÍA ────────────────────────────────────────────────────────
  libreria: {
    rubro: "libreria",
    nombreRubro: "Librería / Papelería",
    modeloPrincipal: "Mistral 7B — clasificación rápida + Qwen 14B para temporada escolar",
    top3: ["prediccion_compras", "clasificador_productos", "alertas_inteligentes"],
    horasAhorradasMes: 15,
    argumentoVentaIA: "Antes de la temporada escolar, la IA predice cuánto comprar de cada útil basado en las listas de colegios de la zona. Durante el año, clasifica productos nuevos automáticamente con IVA correcto (10.5% para libros y útiles).",
    features: [
      { ...FEATURES_BASE.prediccion_compras, impacto: "alto", valorRubro: "Predicción de demanda escolar basada en historial + calendario lectivo.", ejemploOutput: "{reposiciones: [{nombre: 'Cuaderno universitario', consumo_feb_marzo: 2000, stock: 200, urgencia: 'comprar_ya', razon: 'Inicio de clases en 3 semanas'}]}" },
      { ...FEATURES_BASE.clasificador_productos, impacto: "medio", valorRubro: "IVA correcto automático: libros 10.5%, útiles escolares 10.5%, merchandising 21%.", ejemploOutput: "{nombre: 'Cuaderno universitario 100 hojas', iva: 10.5, razon: 'Útil escolar — Ley 24.674 art. 28', categoria: 'Útiles escolares'}" },
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "medio", valorRubro: "Sobrestock post-temporada, precios de editorial actualizados, productos sin rotación.", ejemploOutput: "{alertas: [{titulo: 'Sobrestock mochilas escolares: 80 unidades sin movimiento (temporada terminó hace 2 meses)', accion: 'Liquidar con 30% descuento'}]}" },
    ],
  },

  // ── GENÉRICO ────────────────────────────────────────────────────────
  otro: {
    rubro: "otro",
    nombreRubro: "Comercio General",
    modeloPrincipal: "Qwen 2.5 14B — polivalente para cualquier tipo de negocio",
    top3: ["alertas_inteligentes", "reportes_naturales", "clasificador_productos"],
    horasAhorradasMes: 15,
    argumentoVentaIA: "Cada mañana recibís un resumen inteligente de tu negocio. Le preguntás al sistema cómo te fue y te responde en español, con números concretos y recomendaciones.",
    features: [
      { ...FEATURES_BASE.alertas_inteligentes, impacto: "alto", valorRubro: "Resumen diario por WhatsApp con lo más importante: ventas, stock bajo, deudas.", ejemploOutput: "{resumenEjecutivo: 'Ayer vendiste $180K (+12% vs promedio). Stock bajo en 3 productos. 2 facturas vencidas por $45K.'}" },
      { ...FEATURES_BASE.reportes_naturales, impacto: "medio", valorRubro: "Preguntá lo que quieras sobre tu negocio en español.", ejemploOutput: "{respuesta: 'Este mes facturaste $4.2M, un 15% más que el anterior. Tu margen bruto es 36%.'}" },
      { ...FEATURES_BASE.clasificador_productos, impacto: "medio", valorRubro: "Al cargar productos, sugiere categoría e IVA automáticamente.", ejemploOutput: "{categoria: 'Insumos', iva: 21, codigo: 'INS-001'}" },
      { ...FEATURES_BASE.onboarding_conversacional, impacto: "alto", valorRubro: "Describí tu negocio y la IA lo configura todo.", ejemploOutput: "{rubro_detectado: 'ferreteria', modulos: ['pos', 'stock', 'compras', 'caja']}" },
    ],
  },
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Get IA config for a rubro, with fallback to "otro" */
export function getIAConfigRubro(rubro: string): IAConfigRubro {
  return IA_POR_RUBRO[rubro] ?? IA_POR_RUBRO.otro
}

/** Get all available IA features across all rubros (deduplicated) */
export function getAllIAFeatures(): Array<Omit<IAFeature, "valorRubro" | "ejemploOutput" | "impacto"> & { id: string }> {
  return Object.values(FEATURES_BASE)
}

/** Get IA features for a specific rubro, sorted by impact */
export function getIAFeaturesForRubro(rubro: string): IAFeature[] {
  const config = getIAConfigRubro(rubro)
  const order: Record<string, number> = { alto: 0, medio: 1, bajo: 2 }
  return [...config.features].sort((a, b) => (order[a.impacto] ?? 3) - (order[b.impacto] ?? 3))
}

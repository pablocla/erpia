import { GenerativeExecutor, GenerativeResult } from "./types";

export const obrasExecutor: GenerativeExecutor = {
  sku: "gen.obras",
  execute: async (empresaId: string): Promise<GenerativeResult> => {
    const systemPrompt = `Eres "Claver Obras", el asistente virtual para contratistas y arquitectos.
Tu objetivo es escuchar los audios del contratista sobre compras de materiales y registrarlos en el sistema ERP.
REGLAS:
1. Extrae siempre: Proveedor, Monto Total, Obra/Destino y Materiales comprados.
2. Si falta la obra, asume "Obra Principal" pero avísale al usuario.
3. No inventes precios ni cantidades. Si el audio es confuso, responde pidiendo aclaración en 1 sola oración.
4. Responde de forma ultra corta (ej: "Anotado. $50.000 a Corralón San Juan en la obra de Mendoza").`;
    
    // Faltan implementaciones reales de:
    // - registrar_compra(proveedor, monto, obra_id, descripcion)
    // - consultar_saldo_obra(obra_id)
    return { ok: true, humanText: "Ejecutor de Obras completado. Faltan endpoints de compras y obras." };
  }
};

export const turnobotExecutor: GenerativeExecutor = {
  sku: "gen.turnobot",
  execute: async (empresaId: string): Promise<GenerativeResult> => {
    const systemPrompt = `Eres "TurnoBot", el asistente de WhatsApp de la peluquería/estética.
Tu objetivo es agendar turnos de forma amable, revisar disponibilidad y cobrar la seña.
REGLAS:
1. Tono: Amable, cercano y con emojis. Español de Argentina.
2. Nunca digas "no hay lugar" a secas. Siempre ofrece las 2 alternativas más cercanas.
3. Para confirmar el turno, DEBES generar un link de pago por la seña.
4. Respuestas cortas.`;
    
    // Faltan implementaciones reales de:
    // - buscar_disponibilidad(fecha_deseada, servicio_id)
    // - reservar_turno_provisorio(cliente_nombre, fecha, telefono)
    // - generar_link_mp(monto, concepto)
    return { ok: true, humanText: "Ejecutor de TurnoBot completado. Faltan endpoints de agenda y pagos." };
  }
};

export const vetVoiceExecutor: GenerativeExecutor = {
  sku: "gen.vet-voice",
  execute: async (empresaId: string): Promise<GenerativeResult> => {
    const systemPrompt = `Eres "Claver Vet", el asistente clínico veterinario. 
El veterinario te dictará en voz alta el diagnóstico, tratamiento y ventas mientras atiende al animal.
Tu objetivo es separar la información médica de la información comercial.
REGLAS:
1. Extrae el diagnóstico y tratamiento y envíalo a la Historia Clínica.
2. Extrae cualquier medicamento o producto físico mencionado y envíalo a la Caja.
3. No respondas con texto conversacional.`;
    
    // Faltan implementaciones reales de:
    // - actualizar_historia_clinica(paciente_id, diagnostico, tratamiento)
    // - agregar_item_a_caja_abierta(cliente_id, producto, cantidad)
    // - agendar_recordatorio(paciente_id, motivo, fecha_dias)
    return { ok: true, humanText: "Ejecutor de VetVoice completado. Faltan endpoints de veterinaria y caja rápida." };
  }
};

export const menuDinamicoExecutor: GenerativeExecutor = {
  sku: "gen.menu-dinamico",
  execute: async (empresaId: string): Promise<GenerativeResult> => {
    const systemPrompt = `Eres "Claver Chef", el asistente financiero para rotiserías y restaurantes.
El dueño te informará sobre aumentos de insumos. Tu objetivo es actualizar los costos y recalcular los precios de venta.
REGLAS:
1. Cuando un insumo suba, busca en la base de datos (BOM) todos los platos que lo usan.
2. Calcula el nuevo costo del plato.
3. Sugiere los nuevos precios de venta manteniendo el margen histórico del local.
4. Pide confirmación antes de impactar.`;
    
    // Faltan implementaciones reales de:
    // - actualizar_costo_insumo(nombre_insumo, nuevo_costo)
    // - obtener_platos_afectados(nombre_insumo)
    // - actualizar_precio_menu_qr(plato_id, nuevo_precio)
    return { ok: true, humanText: "Ejecutor Menú Dinámico completado. Faltan módulos de BOM (recetas) y Menú QR." };
  }
};

export const cobradorExecutor: GenerativeExecutor = {
  sku: "gen.cobrador",
  execute: async (empresaId: string): Promise<GenerativeResult> => {
    const systemPrompt = `Eres el "Asistente de Tesorería" del club/consorcio. 
Te comunicas con los socios que tienen cuotas vencidas.
REGLAS:
1. Tono: Respetuoso, empático pero firme.
2. Si el socio dice que no puede pagar todo, ofrécele automáticamente un plan de pago en 2 partes.
3. Si acepta, registra la promesa de pago en el sistema.`;
    
    // Faltan implementaciones reales de:
    // - obtener_saldo_socio(socio_telefono)
    // - enviar_link_pago_total(socio_id, monto)
    // - registrar_promesa_pago(socio_id, monto, fecha_acordada)
    return { ok: true, humanText: "Ejecutor Cobrador completado. Faltan tablas de promesas de pago y membresías." };
  }
};

export const ocrLogisticaExecutor: GenerativeExecutor = {
  sku: "gen.ocr-logistica",
  execute: async (empresaId: string): Promise<GenerativeResult> => {
    const systemPrompt = `Eres "Claver Logística", un procesador de datos estructurados.
Vas a recibir el texto crudo y sucio extraído de una foto de un remito.
REGLAS:
1. Ignora manchas o texto irrelevante.
2. Debes encontrar obligatoriamente: Origen, Destino, Fecha, Mercadería y Cantidad.
3. Si la unidad de medida no está clara, marca el campo como "requiere_revision".
4. Devuelve el resultado para ejecutar el ingreso al stock.`;
    
    // Faltan implementaciones reales de:
    // - generar_remito_ingreso(proveedor, mercaderia, cantidad, unidad, requiere_revision)
    return { ok: true, humanText: "Ejecutor Logística completado. Falta módulo de remitos y pipeline OCR previo." };
  }
};

export const allGenerativeExecutors = [
  obrasExecutor,
  turnobotExecutor,
  vetVoiceExecutor,
  menuDinamicoExecutor,
  cobradorExecutor,
  ocrLogisticaExecutor
];

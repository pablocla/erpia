/**
 * Catálogo Canónico de las 8 Puertas de Escala Rápida
 * Principio: Cero AFIP día 1 · Dolor de 5 segundos · Reutilización de motores existentes
 */

export interface PuertaEscala {
  id: string
  nombre: string
  tagline: string
  dolor5Segundos: string
  aQuienResuelve: string
  icono: string
  badge: string
  motorReutilizado: string
  modeloMonetizacion: string
  landingPath: string
  whatsappDemoTexto: string
}

export const PUERTAS_ESCALA_RAPIDA: PuertaEscala[] = [
  {
    id: "sena_eventos",
    nombre: "Claver Seña Eventos",
    tagline: "Asegurá la fecha con seña por WhatsApp",
    dolor5Segundos: "Me reservan la fecha por WhatsApp y después no aparecen ni pagan",
    aQuienResuelve: "Salones, quinchos, peloteros, fotógrafos, catering, DJs",
    icono: "PartyPopper",
    badge: "Seña Inmediata",
    motorReutilizado: "Oficios + Agenda + Link Público",
    modeloMonetizacion: "Take-rate 2-3% sobre señas cobradas",
    landingPath: "/dashboard/oficios",
    whatsappDemoTexto: "Hola! Para confirmar la reserva del salón para el 15/10, aboná la seña de $45.000 acá: https://claver.app/p/demo-salon",
  },
  {
    id: "alquileres",
    nombre: "Claver Alquileres & Cocheras",
    tagline: "Cobranza automática de alquileres y expensas",
    dolor5Segundos: "El inquilino me debe el mes y me da vergüenza cobrarle",
    aQuienResuelve: "Dueños de 1 a 8 deptos, cocheras, locales, galpones",
    icono: "Home",
    badge: "Sin Inmobiliaria",
    motorReutilizado: "Cuotas / Membresías + Cobrá IA",
    modeloMonetizacion: "$8.000 - $15.000/mes o micro-fee por aviso",
    landingPath: "/dashboard/membresias",
    whatsappDemoTexto: "Hola Juan! Te recordamos el vencimiento del alquiler de la Cochera #4 ($25.000). Alias para transferir: alq.cochera.mp",
  },
  {
    id: "estetica",
    nombre: "Claver Estética & Belleza",
    tagline: "Turnera con seña obligatoria del 30%",
    dolor5Segundos: "La clienta no viene y me dejó el hueco de 2 horas sin laburar",
    aQuienResuelve: "Uñas, pestañas, depilación, barbería, cejas, masajes",
    icono: "Sparkles",
    badge: "Cero Plantones",
    motorReutilizado: "Peluquería / Agenda + Seña",
    modeloMonetizacion: "Seña 30% con Mercado Pago + Recordatorio 24h",
    landingPath: "/dashboard/peluqueria",
    whatsappDemoTexto: "Hola Sofi! Tu turno para Esculpidas quedó reservado para el Jueves 16:00 hs. Seña de $5.000 confirmada.",
  },
  {
    id: "academia",
    nombre: "Claver Academia & Clases",
    tagline: "Control de cuotas y semáforo de alumnos",
    dolor5Segundos: "Los padres no pagan la cuota a término y el chico sigue viniendo",
    aQuienResuelve: "Apoyo escolar, institutos de idiomas, música, profes particulares, colonias",
    icono: "GraduationCap",
    badge: "Cuota al Día",
    motorReutilizado: "Escuelas + Membresías (Semáforo)",
    modeloMonetizacion: "Cuota mensual + Aviso WhatsApp automático al padre",
    landingPath: "/dashboard/membresias",
    whatsappDemoTexto: "Estimada familia de Tomás: recordamos el vencimiento de la cuota de Inglés ($22.000). Link de pago disponible.",
  },
  {
    id: "gomeria",
    nombre: "Claver Gomería & Chapa Express",
    tagline: "Aviso de 'Auto Listo' en 1 clic por WhatsApp",
    dolor5Segundos: "El auto ya está listo ocupando lugar y el cliente no viene a buscarlo",
    aQuienResuelve: "Gomerías, chapa y pintura express, alineación y balanceo",
    icono: "Car",
    badge: "Rotación Diaria",
    motorReutilizado: "Taller Mecánico (Aviso Listo)",
    modeloMonetizacion: "Aviso gratis + Take-rate si abona el saldo online",
    landingPath: "/dashboard/taller",
    whatsappDemoTexto: "Hola Carlos! Tu auto Patente AA123BB ya está listo en la gomería. Total trabajo: $18.500. Podés pasar a retirarlo.",
  },
  {
    id: "lavadero",
    nombre: "Claver Lavadero & Detailing",
    tagline: "Abonos mensuales de lavado y aviso de retiro",
    dolor5Segundos: "Abonos de clientes que entran al box sin saber si tienen saldo",
    aQuienResuelve: "Lavaderos de autos, detailing, estética vehicular",
    icono: "Droplets",
    badge: "Abono Recurrente",
    motorReutilizado: "Tintorería (Listo) + Membresías",
    modeloMonetizacion: "Abono mensual recurrente + Ticket suelto",
    landingPath: "/dashboard/membresias",
    whatsappDemoTexto: "Lavadero Express: Tu camioneta Hilux está lista y encerada. Podés retirarla hasta las 19:00 hs.",
  },
  {
    id: "honorarios",
    nombre: "Claver Honorarios & Consultorios",
    tagline: "Reserva de consultas particulares con seña",
    dolor5Segundos: "Me cancelan el turno a último momento y perdí 40 minutos de honorarios",
    aQuienResuelve: "Kinesiólogos, nutricionistas, psicólogos, odontólogos particulares, abogados",
    icono: "Stethoscope",
    badge: "Cobro Particular",
    motorReutilizado: "Consultorio / Historia Clínica + Seña",
    modeloMonetizacion: "Seña por turno o Pack de 4/8 sesiones por adelantado",
    landingPath: "/dashboard/turnos",
    whatsappDemoTexto: "Lic. García: Consulta de Nutrición reservada para el Viernes 11:00 hs. Seña de honorarios recibida con éxito.",
  },
  {
    id: "mayorista_fiado",
    nombre: "Claver Mayorista & Reparto Fiado",
    tagline: "Libreta de cuentas corrientes para comercios",
    dolor5Segundos: "Le fío a 40 almacenes/talleres y no sé quién me debe ni cuánto",
    aQuienResuelve: "Distribuidoras chicas, pinturerías, dietéticas, corralones de 1 mostrador",
    icono: "Truck",
    badge: "B2B Liviano",
    motorReutilizado: "Fiado + Portal B2B",
    modeloMonetizacion: "Cobro por WhatsApp + Take-rate del link de pago",
    landingPath: "/dashboard/cuentas-cobrar",
    whatsappDemoTexto: "Distribuidora Norte: Resumen de cuenta semanal de Almacén San Cayetano. Saldo pendiente: $184.200. Link de pago: https://claver.app/p/dist-12",
  },
]

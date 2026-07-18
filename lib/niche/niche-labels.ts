/** Labels y workflows de dominio por appId de nicho */

export type NicheLabels = {
  socio: string
  socioPlural: string
  membresia: string
  cuota: string
  buscarPlaceholder: string
  emptyStep1: string
  emptyStep2: string
  emptyStep3: string
}

const DEFAULT: NicheLabels = {
  socio: "Socio",
  socioPlural: "Socios",
  membresia: "Membresía",
  cuota: "Cuota",
  buscarPlaceholder: "Buscar por nombre o teléfono…",
  emptyStep1: "Cargá o elegí un cliente",
  emptyStep2: "Registrá la cuota del mes",
  emptyStep3: "Cobrás o avisás por WhatsApp",
}

const BY_APP: Record<string, Partial<NicheLabels>> = {
  club: {
    socio: "Socio",
    socioPlural: "Socios",
    membresia: "Carnet",
    cuota: "Cuota del club",
    emptyStep1: "Alta de socio del club",
    emptyStep2: "Cuota del mes",
    emptyStep3: "Avisá morosos antes del partido",
  },
  escuela: {
    socio: "Alumno / familia",
    socioPlural: "Familias",
    membresia: "Matrícula",
    cuota: "Cuota escolar",
    emptyStep1: "Registrá la familia",
    emptyStep2: "Cuota del período",
    emptyStep3: "Cobrás o avisás a morosos",
  },
  gimnasio: {
    socio: "Miembro",
    socioPlural: "Miembros",
    membresia: "Pase",
    cuota: "Cuota gym",
    emptyStep1: "Alta de miembro",
    emptyStep2: "Cuota del mes",
    emptyStep3: "Cobrá o avisá vencidos",
  },
  mutuo: {
    socio: "Socio cooperativo",
    socioPlural: "Socios",
    membresia: "Aporte",
    cuota: "Aporte",
    emptyStep1: "Alta de socio",
    emptyStep2: "Registrar aporte",
    emptyStep3: "Estado de morosos",
  },
  colonia: {
    socio: "Familia",
    socioPlural: "Familias",
    membresia: "Inscripción",
    cuota: "Cuota colonia",
    emptyStep1: "Inscripción",
    emptyStep2: "Cuota del mes",
    emptyStep3: "Aviso a padres",
  },
  pena: {
    socio: "Socio de peña",
    socioPlural: "Socios",
    membresia: "Carnet",
    cuota: "Cuota peña",
    emptyStep1: "Alta socio",
    emptyStep2: "Cuota del mes",
    emptyStep3: "Morosos antes del show",
  },
  cancha: {
    socio: "Jugador",
    socioPlural: "Jugadores",
    membresia: "Reserva",
    cuota: "Seña / turno",
    emptyStep1: "Cliente o equipo",
    emptyStep2: "Seña del turno",
    emptyStep3: "Cobro del saldo",
  },
}

export function getNicheLabels(appId: string): NicheLabels {
  return { ...DEFAULT, ...BY_APP[appId] }
}

/** Estados de workflow por app de movimientos */
export function getWorkflowEstados(appId: string): string[] {
  const map: Record<string, string[]> = {
    plancha: ["pendiente", "proceso", "listo", "entregado", "pagado"],
    taller: ["pendiente", "presupuesto", "reparacion", "listo", "entregado", "pagado"],
    delivery: ["pendiente", "en_camino", "entregado", "pagado", "cerrado"],
    remis: ["pendiente", "viaje", "cerrado", "pagado"],
    feria: ["pendiente", "venta", "gasto", "cierre", "pagado"],
    obras: ["pendiente", "jornal", "adelanto", "liquidacion", "pagado"],
    acopio: ["pendiente", "entrega", "liquidacion", "pagado"],
    salon: ["pendiente", "seña", "evento", "saldo", "pagado"],
    garantia: ["pendiente", "contrato", "renovacion", "aviso", "pagado"],
  }
  return map[appId] ?? ["pendiente", "proceso", "listo", "pagado", "entregado"]
}

export function labelEstado(estado: string): string {
  const m: Record<string, string> = {
    pendiente: "Pendiente",
    proceso: "En proceso",
    listo: "Listo",
    entregado: "Entregado",
    pagado: "Pagado",
    cobrado: "Cobrado",
    cerrado: "Cerrado",
    en_camino: "En camino",
    presupuesto: "Presupuesto",
    reparacion: "Reparación",
    viaje: "Viaje",
    venta: "Venta",
    gasto: "Gasto",
    cierre: "Cierre",
    jornal: "Jornal",
    adelanto: "Adelanto",
    liquidacion: "Liquidación",
    entrega: "Entrega",
    seña: "Seña",
    evento: "Evento",
    saldo: "Saldo",
    contrato: "Contrato",
    renovacion: "Renovación",
    aviso: "Aviso",
    confirmado: "Confirmado",
  }
  return m[estado] ?? estado
}

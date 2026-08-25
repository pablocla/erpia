export interface SkinOficioCopy {
  nombre: string
  lema: string
  descripcion: string
  h1: string
  pains: string[]
  outcomes: string[]
  keywords: string[]
}

export const SKINS_OFICIOS: Record<string, SkinOficioCopy> = {
  electricista: {
    nombre: "Claver Electricistas",
    lema: "Presupuestos en 3 niveles, seña anticipada y cuadrilla.",
    descripcion: "Para electricistas e instaladores: cotizá en 30 segundos, cobrá la seña antes de comprar materiales y controlá los gastos de tu cuadrilla.",
    h1: "Dejá de perder plata en presupuestos eléctricos que no se cobran.",
    pains: [
      "Cotizaciones por audio que se pierden o regatean",
      "Poner plata propia para comprar térmicas y cables",
      "Adicionales de bocas no cobrados ni registrados",
      "Discusiones por jornales los viernes con los ayudantes",
    ],
    outcomes: [
      "Presupuestos en 3 opciones (Básico, Recomendado, Premium)",
      "Cobro de seña antes de comprar materiales",
      "Liquidación semanal de cuadrilla sin peleas",
      "Factura C en 1 click desde la obra",
    ],
    keywords: ["electricista", "presupuestos electricista", "instalador electrico"],
  },
  plomero: {
    nombre: "Claver Plomeros & Gasistas",
    lema: "Presupuestos de instalaciones y reparaciones con seña previa.",
    descripcion: "Para plomeros, gasistas y sanitaristas: presupuestá cañerías, destapes e instalaciones con seña asegurada.",
    h1: "Presupuestá instalaciones y arreglos sanitarios con seña previa garantizada.",
    pains: [
      "Comprar caños y griferías con plata de tu bolsillo",
      "Destapes y urgencias no valorizadas",
      "Presupuestos discutidos al finalizar el arreglo",
    ],
    outcomes: [
      "Presupuesto claro con seña obligatoria",
      "Registro fotográfico antes y después del arreglo",
      "Cobro directo por transferencia o Mercado Pago",
    ],
    keywords: ["plomero", "gasista", "sanitarista", "presupuesto plomeria"],
  },
  pintor: {
    nombre: "Claver Pintores de Obra",
    lema: "Mano de obra y materiales por m² con cobro por avance.",
    descripcion: "Para pintores y contratistas de pintura: calculá metros cuadrados, cobrá por etapas y administrá los baldes de pintura.",
    h1: "Calculá mano de obra y materiales por m² y cobrá por etapas de avance.",
    pains: [
      "Clientes que cambian de color o piden manos extra sin pagar",
      "Comprar baldes de látex sin seña del cliente",
      "Jornales de ayudantes desordenados",
    ],
    outcomes: [
      "Presupuesto por m² en 3 niveles de terminación",
      "Cobro escalonado por etapas de obra",
      "Control de compra de pintura y rodillos",
    ],
    keywords: ["pintor", "pintor obra", "presupuesto pintura m2"],
  },
  herrero: {
    nombre: "Claver Herrería & Estructuras",
    lema: "Presupuestos de rejas, portones y tinglados al día con la inflación.",
    descripcion: "Para talleres de herrería y carpintería metálica: presupuestá estructuras asegurando el costo del hierro.",
    h1: "Presupuestá rejas, portones y tinglados asegurando el costo del hierro.",
    pains: [
      "La suba del hierro te come la ganancia del trabajo",
      "Clientes que cancelan con el portón a medio armar",
      "Gastos de flete y colocación no contemplados",
    ],
    outcomes: [
      "Presupuestos con vigencia y seña para acopio de perfiles",
      "Opciones de hierro estándar vs reforzado",
      "Seguimiento de entrega y colocación en obra",
    ],
    keywords: ["herrero", "herreria", "portones", "estructuras metalicas"],
  },
  estudio: {
    nombre: "Claver Obras & Estudios Técnicos",
    lema: "Certificados de obra particular, hitos y cuadrilla.",
    descripcion: "Para arquitectos, ingenieros civiles y MMO: certificá avances de obra, cobrá por hitos y controlá a la cuadrilla.",
    h1: "Certificá avances de obra particular, cobrá por hitos y controlá a la cuadrilla.",
    pains: [
      "Adicionales de obra pedidos de boca y no cobrados",
      "Comitentes que demoran la certificación del hito",
      "Planillas de jornales desordenadas los viernes",
    ],
    outcomes: [
      "Certificación de avance de obra con firma/aprobación por link",
      "Cobro de hitos escalonados (40% / 30% / 30%)",
      "Auditoría clara de gastos de corralón y jornales",
    ],
    keywords: ["arquitecto", "ingeniero civil", "director de obra", "estudio arquitectura"],
  },
}

export function getSkinOficio(oficio?: string | null): SkinOficioCopy | null {
  if (!oficio) return null
  const key = oficio.toLowerCase().trim()
  return SKINS_OFICIOS[key] ?? null
}

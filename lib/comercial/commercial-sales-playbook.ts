/**
 * Playbook Comercial, Matriz de Objeciones y Calculadora de ROI — ClavERP 2026
 * Herramientas de venta B2B PyME para vendedores, partners y Claver Cloud.
 */

export interface SalesObjection {
  id: string
  categoria: "precio" | "afip" | "tecnologia" | "competencia" | "proceso"
  objecion: string
  respuestaVendedor: string
  pruebaSocial: string
  script60Segundos: string
  copyWhatsAppRapido: string
}

export interface SalesScriptStep {
  bloque: string
  minuto: string
  objetivo: string
  queDecir: string
  queMostrar: string
}

export interface RoiCalculatorInput {
  rubroId: string
  ventasMensualesARS: number
  estimacionFiadosARS: number
  horasSemanalesAFIP: number
}

export interface RoiCalculatorOutput {
  ahorroFiadoMensualARS: number
  ahorroInflacionMensualARS: number
  valorHorasAhorradasMensualARS: number
  beneficioTotalMensualARS: number
  roiPorcentaje: number
  paybackDias: number
}

export const COMMERCIAL_OBJECTIONS: SalesObjection[] = [
  {
    id: "obj-precio-caro",
    categoria: "precio",
    objecion: "Me parece caro el abono mensual / No quiero sumar un gasto fijo más.",
    respuestaVendedor:
      "Te entiendo perfectamente. La diferencia es que este sistema no es un gasto, es un empleado digital que trabaja cobrándote los fiados y evitando que pierdas plata con aumentos de precios. Con que recuperes un solo fiado moroso de $30.000 al mes, el sistema se paga 100% solo.",
    pruebaSocial: "El 92% de los almacenes recuperan el costo mensual en la primera semana de uso de la libreta WhatsApp.",
    script60Segundos:
      "Mirá, hagamos una cuenta rápida: ¿cuántos clientes tenés que te deben más de $15.000? Si mandamos hoy el mensaje automático con el botón de Mercado Pago desde el sistema, vas a cobrar mínimo 2 o 3 hoy mismo. Probemos el sistema gratis 14 días y si no recuperás el costo, no ponés un peso.",
    copyWhatsAppRapido:
      "¡Hola! Te entiendo con el tema costos. Justamente ClavERP está pensado para que se pague solo: con cobrar 1 o 2 fiados morosos al mes por WhatsApp ya cubrís el abono. Probá 14 días gratis sin tarjeta acá: https://claverp.com/demo",
  },
  {
    id: "obj-usado-excel",
    categoria: "proceso",
    objecion: "Yo me manejo con un cuaderno o con un Excel y me funciona bien.",
    respuestaVendedor:
      "El Excel es bárbaro para guardar datos, pero no le manda un WhatsApp a tu cliente avisándole que se le vence la factura ni te avisa cuando un producto subió de precio y estás vendiendo a pérdida. El cuaderno tampoco emite factura electrónica ante AFIP ni te hace el cierre de caja en 5 segundos.",
    pruebaSocial: "Comerciantes que pasaron de libreta a ClavERP ahorran en promedio 12 horas semanales de carga manual.",
    script60Segundos:
      "Tu cuaderno no te avisa si el proveedor de cigarrillos o lácteos aumentó un 15% hoy. Si vendés al precio viejo por no tener tiempo de actualizar el Excel, estás regalando tu margen. En ClavERP ponés '+15%' y se actualizan 2.000 productos en 1 segundo.",
    copyWhatsAppRapido:
      "El Excel guarda datos pero no vende ni cobra por vos. ClavERP le manda el recordatorio de pago a tus clientes por WhatsApp y te actualiza los precios por % en 1 click. Mirá la demo de 1 min: https://claverp.com/demo",
  },
  {
    id: "obj-miedo-afip",
    categoria: "afip",
    objecion: "No quiero que AFIP/ARCA me controle todo lo que vendo en el mostrador.",
    respuestaVendedor:
      "Tranquilo, ClavERP te da control total a vos. Podés elegir qué comprobantes facturás electrónicamente a AFIP y cuáles registrás como ticket de control interno o fiado de libreta. Vos tenés el mando de tu negocio sin que nadie te imponga nada.",
    pruebaSocial: "Más de 1.500 comercios en Argentina usan ClavERP operando con esquema mixto 100% seguro.",
    script60Segundos:
      "El sistema separa lo fiscal de lo operativo. Tu caja y tu stock se mantienen perfectos al centavo, y las facturas electrónicas A o B se emiten solo cuando vos querés o tu cliente te lo pide.",
    copyWhatsAppRapido:
      "En ClavERP tenés independencia total: elegís qué facturar a AFIP y qué mantener como control interno de mostrador. Cero complicaciones. Te mostramos cómo funciona en 5 min.",
  },
  {
    id: "obj-tecnologia-dificil",
    categoria: "tecnologia",
    objecion: "Mis empleados o yo no sabemos mucho de computadoras / Nos resulta complicado.",
    respuestaVendedor:
      "Si sabés usar WhatsApp y tocar una pantalla táctil, sabés usar ClavERP. Diseñamos el punto de venta pensando en cajeros de todas las edades: botones gigantes, buscador rápido y pantalla limpia. Además tenés soporte por WhatsApp ante cualquier duda.",
    pruebaSocial: "Cajeros y dueños de más de 60 años operan la caja de ClavERP sin haber usado un ERP antes.",
    script60Segundos:
      "Vengamos al mostrador 2 minutos: tocás el producto en pantalla o pasás el código de barras, ponés 'Efectivo' o 'Mercado Pago' y listo. La caja cierra sola a la noche. Es más fácil que mandar un audio de WhatsApp.",
    copyWhatsAppRapido:
      "¡Es súper intuitivo! Diseñado con botones grandes para mostrador. Si sabés usar WhatsApp, en 10 minutos tenés la caja funcionando. Probá la interfaz táctil acá: https://claverp.com/demo",
  },
  {
    id: "obj-software-viejo",
    categoria: "competencia",
    objecion: "Ya tengo un sistema viejo instalado que compré hace años.",
    respuestaVendedor:
      "Los sistemas viejos de escritorio se quedan obsoletos, no tienen conexión con WhatsApp, no te dejan ver las ventas desde tu celular cuando estás fuera del negocio y si se rompe la PC perdés toda la información. ClavERP es cloud: podés ver las ventas en tiempo real desde tu casa o celular.",
    pruebaSocial: "El 80% de las migraciones desde sistemas legacy completan el traspaso de stock y clientes en menos de 24 horas.",
    script60Segundos:
      "Con tu sistema actual, si te vas de viaje o estás en tu casa, ¿podés ver cuánta plata hay en caja ahora mismo? Con ClavERP abrís el celular y sabés las ventas del día, el stock y los fiados desde donde estés.",
    copyWhatsAppRapido:
      "Con ClavERP podés ver las ventas de tu local en vivo desde tu celular estés donde estés, con copia de seguridad automática en la nube. Importamos tus productos gratis. ¡Consultanos!",
  },
]

export const SALES_SCRIPT_15MIN: SalesScriptStep[] = [
  {
    bloque: "1. Empatía & Rompehielos",
    minuto: "00:00 - 03:00",
    objetivo: "Detectar el dolor principal (Fiado, Inflación, AFIP o Descontrol de Caja).",
    queDecir:
      "¡Hola! ¿Cómo viene el día? Estaba pasando por la zona conversando con comercios del rubro. ¿Cómo vienen manejando el tema de los aumentos de precios semanales y el cobro de fiados acá?",
    queMostrar: "Saludar cordialmente sin sacar folletos rígidos; escuchar con atención.",
  },
  {
    bloque: "2. Demostración Wow en Celular / Tablet",
    minuto: "03:00 - 08:00",
    objetivo: "Mostrar la solución en vivo en menos de 60 segundos.",
    queDecir:
      "Mirá, dejame mostrarte 30 segundos en mi cel cómo funciona: acá ponés el nombre del cliente, le das a 'Recordar Fiado por WhatsApp' y el cliente recibe este mensaje profesional con link de Mercado Pago. ¿Cuánto tardás hoy en cobrar deudas así?",
    queMostrar: "Abrir /demo?industryId=kiosco (o el rubro correspondiente) en el celular.",
  },
  {
    bloque: "3. Reexpresión de Precios x %",
    minuto: "08:00 - 11:00",
    objetivo: "Demostrar protección del margen comercial contra la inflación.",
    queDecir:
      "Y mirá esta maravilla: cuando tu proveedor te avisa que todo subió un 12%, hacés click en 'Reexpresar Precios', ponés 12% y todo tu catálogo de 3.000 productos se actualiza al instante.",
    queMostrar: "Pantalla de Reexpresión masiva de precios en la demo.",
  },
  {
    bloque: "4. Manejo de Objeciones & Cierre Trial",
    minuto: "11:00 - 15:00",
    objetivo: "Activar el Trial de 14 días sin costo.",
    queDecir:
      "No tenés que creerme a mí: te dejo la cuenta activa 14 días gratis. Cargamos 5 productos de los que más vendés ahora en 2 minutos y lo probás vos mismo en la caja hoy a la tarde.",
    queMostrar: "Pantalla de registro / activación inmediata de trial.",
  },
]

export function calculateMerchantROI(input: RoiCalculatorInput): RoiCalculatorOutput {
  const ventas = Math.max(0, input.ventasMensualesARS)
  const fiados = Math.max(0, input.estimacionFiadosARS)
  const horasAFIP = Math.max(0, input.horasSemanalesAFIP)

  // Estimación de cobro de fiados morosos (recupero del 35% mensual de deudas olvidadas)
  const ahorroFiadoMensualARS = Math.round(fiados * 0.35)

  // Estimación de protección de margen por descalce de inflación (2.5% de ventas protegidas)
  const ahorroInflacionMensualARS = Math.round(ventas * 0.025)

  // Valor hora de trabajo del comerciante (estimada a $4.500 ARS/hora)
  const valorHorasAhorradasMensualARS = Math.round(horasAFIP * 4 * 4_500)

  const beneficioTotalMensualARS =
    ahorroFiadoMensualARS + ahorroInflacionMensualARS + valorHorasAhorradasMensualARS

  // Costo promedio de abono mensual ClavERP ($39.900 ARS)
  const costoAbonoMensual = 39_900

  const roiPorcentaje = beneficioTotalMensualARS > 0
    ? Math.round((beneficioTotalMensualARS / costoAbonoMensual) * 100)
    : 0

  const paybackDias = beneficioTotalMensualARS > 0
    ? Math.max(1, Math.round((costoAbonoMensual / beneficioTotalMensualARS) * 30))
    : 30

  return {
    ahorroFiadoMensualARS,
    ahorroInflacionMensualARS,
    valorHorasAhorradasMensualARS,
    beneficioTotalMensualARS,
    roiPorcentaje,
    paybackDias,
  }
}

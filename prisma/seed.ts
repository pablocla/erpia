import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ═══════════════════════════════════════════════════════════════════════════════
// SEED SCRIPT — Catálogos paramétricos + datos de referencia Argentina
// ═══════════════════════════════════════════════════════════════════════════════

async function seedPaises() {
  const paises = [
    { codigo: "AR", codigo3: "ARG", nombre: "Argentina", codigoNum: "032", codigoTelefono: "+54" },
    { codigo: "UY", codigo3: "URY", nombre: "Uruguay", codigoNum: "858", codigoTelefono: "+598" },
    { codigo: "BR", codigo3: "BRA", nombre: "Brasil", codigoNum: "076", codigoTelefono: "+55" },
    { codigo: "CL", codigo3: "CHL", nombre: "Chile", codigoNum: "152", codigoTelefono: "+56" },
    { codigo: "PY", codigo3: "PRY", nombre: "Paraguay", codigoNum: "600", codigoTelefono: "+595" },
    { codigo: "BO", codigo3: "BOL", nombre: "Bolivia", codigoNum: "068", codigoTelefono: "+591" },
    { codigo: "PE", codigo3: "PER", nombre: "Perú", codigoNum: "604", codigoTelefono: "+51" },
    { codigo: "CO", codigo3: "COL", nombre: "Colombia", codigoNum: "170", codigoTelefono: "+57" },
    { codigo: "EC", codigo3: "ECU", nombre: "Ecuador", codigoNum: "218", codigoTelefono: "+593" },
    { codigo: "VE", codigo3: "VEN", nombre: "Venezuela", codigoNum: "862", codigoTelefono: "+58" },
    { codigo: "MX", codigo3: "MEX", nombre: "México", codigoNum: "484", codigoTelefono: "+52" },
    { codigo: "US", codigo3: "USA", nombre: "Estados Unidos", codigoNum: "840", codigoTelefono: "+1" },
    { codigo: "ES", codigo3: "ESP", nombre: "España", codigoNum: "724", codigoTelefono: "+34" },
    { codigo: "IT", codigo3: "ITA", nombre: "Italia", codigoNum: "380", codigoTelefono: "+39" },
    { codigo: "DE", codigo3: "DEU", nombre: "Alemania", codigoNum: "276", codigoTelefono: "+49" },
    { codigo: "FR", codigo3: "FRA", nombre: "Francia", codigoNum: "250", codigoTelefono: "+33" },
    { codigo: "GB", codigo3: "GBR", nombre: "Reino Unido", codigoNum: "826", codigoTelefono: "+44" },
    { codigo: "CN", codigo3: "CHN", nombre: "China", codigoNum: "156", codigoTelefono: "+86" },
    { codigo: "JP", codigo3: "JPN", nombre: "Japón", codigoNum: "392", codigoTelefono: "+81" },
    { codigo: "IN", codigo3: "IND", nombre: "India", codigoNum: "356", codigoTelefono: "+91" },
  ]
  for (const p of paises) {
    await prisma.pais.upsert({ where: { codigo: p.codigo }, update: p, create: p })
  }
  console.log(`✓ ${paises.length} países`)
}

async function seedProvincias() {
  const provincias = [
    { codigoAfip: "00", nombre: "Ciudad Autónoma de Buenos Aires", organismoIIBB: "AGIP", alicuotaIIBB: 3.0 },
    { codigoAfip: "01", nombre: "Buenos Aires", organismoIIBB: "ARBA", alicuotaIIBB: 3.5 },
    { codigoAfip: "02", nombre: "Catamarca", organismoIIBB: "DGR Catamarca", alicuotaIIBB: 3.0 },
    { codigoAfip: "03", nombre: "Córdoba", organismoIIBB: "DGR Córdoba", alicuotaIIBB: 4.0 },
    { codigoAfip: "04", nombre: "Corrientes", organismoIIBB: "DGR Corrientes", alicuotaIIBB: 3.5 },
    { codigoAfip: "05", nombre: "Entre Ríos", organismoIIBB: "ATER", alicuotaIIBB: 3.0 },
    { codigoAfip: "06", nombre: "Jujuy", organismoIIBB: "DGR Jujuy", alicuotaIIBB: 3.0 },
    { codigoAfip: "07", nombre: "Mendoza", organismoIIBB: "ATM", alicuotaIIBB: 3.0 },
    { codigoAfip: "08", nombre: "La Rioja", organismoIIBB: "DGIP La Rioja", alicuotaIIBB: 2.5 },
    { codigoAfip: "09", nombre: "Salta", organismoIIBB: "DGR Salta", alicuotaIIBB: 3.6 },
    { codigoAfip: "10", nombre: "San Juan", organismoIIBB: "DGR San Juan", alicuotaIIBB: 3.0 },
    { codigoAfip: "11", nombre: "San Luis", organismoIIBB: "DPIP San Luis", alicuotaIIBB: 2.5 },
    { codigoAfip: "12", nombre: "Santa Fe", organismoIIBB: "API Santa Fe", alicuotaIIBB: 3.6 },
    { codigoAfip: "13", nombre: "Santiago del Estero", organismoIIBB: "DGR Santiago", alicuotaIIBB: 3.5 },
    { codigoAfip: "14", nombre: "Tucumán", organismoIIBB: "DGR Tucumán", alicuotaIIBB: 3.0 },
    { codigoAfip: "16", nombre: "Chaco", organismoIIBB: "ATP Chaco", alicuotaIIBB: 3.5 },
    { codigoAfip: "17", nombre: "Chubut", organismoIIBB: "DGR Chubut", alicuotaIIBB: 3.0 },
    { codigoAfip: "18", nombre: "Formosa", organismoIIBB: "DGR Formosa", alicuotaIIBB: 3.0 },
    { codigoAfip: "19", nombre: "Misiones", organismoIIBB: "DGR Misiones", alicuotaIIBB: 3.5 },
    { codigoAfip: "20", nombre: "Neuquén", organismoIIBB: "DGR Neuquén", alicuotaIIBB: 3.0 },
    { codigoAfip: "21", nombre: "La Pampa", organismoIIBB: "DGR La Pampa", alicuotaIIBB: 2.5 },
    { codigoAfip: "22", nombre: "Río Negro", organismoIIBB: "ARBA Río Negro", alicuotaIIBB: 3.0 },
    { codigoAfip: "23", nombre: "Santa Cruz", organismoIIBB: "ASIP Santa Cruz", alicuotaIIBB: 2.0 },
    { codigoAfip: "24", nombre: "Tierra del Fuego", organismoIIBB: "AREF TDF", alicuotaIIBB: 0.0 },
  ]
  for (const p of provincias) {
    await prisma.provincia.upsert({ where: { codigoAfip: p.codigoAfip }, update: p, create: p })
  }
  console.log(`✓ ${provincias.length} provincias`)
}

async function seedMonedas() {
  const monedas = [
    { codigo: "ARS", descripcion: "Peso Argentino", simbolo: "$", esBase: true },
    { codigo: "USD", descripcion: "Dólar Estadounidense", simbolo: "US$", esBase: false },
    { codigo: "EUR", descripcion: "Euro", simbolo: "€", esBase: false },
    { codigo: "BRL", descripcion: "Real Brasileño", simbolo: "R$", esBase: false },
    { codigo: "UYU", descripcion: "Peso Uruguayo", simbolo: "$U", esBase: false },
    { codigo: "CLP", descripcion: "Peso Chileno", simbolo: "CL$", esBase: false },
    { codigo: "PYG", descripcion: "Guaraní Paraguayo", simbolo: "₲", esBase: false },
    { codigo: "GBP", descripcion: "Libra Esterlina", simbolo: "£", esBase: false },
    { codigo: "CNY", descripcion: "Yuan Renminbi", simbolo: "¥", esBase: false },
  ]
  for (const m of monedas) {
    await prisma.moneda.upsert({ where: { codigo: m.codigo }, update: m, create: m })
  }
  console.log(`✓ ${monedas.length} monedas`)
}

async function seedBancos() {
  const bancos = [
    { codigoBcra: "007", nombre: "Banco de la Nación Argentina" },
    { codigoBcra: "011", nombre: "Banco de la Provincia de Buenos Aires" },
    { codigoBcra: "014", nombre: "Banco de la Provincia de Córdoba" },
    { codigoBcra: "015", nombre: "Banco de la Ciudad de Buenos Aires" },
    { codigoBcra: "017", nombre: "Banco de la Provincia de Entre Ríos (BERSA)" },
    { codigoBcra: "020", nombre: "Banco de la Provincia de Corrientes" },
    { codigoBcra: "027", nombre: "Banco del Chubut" },
    { codigoBcra: "029", nombre: "Banco de la Provincia de Neuquén" },
    { codigoBcra: "034", nombre: "Banco Patagonia" },
    { codigoBcra: "044", nombre: "Banco Hipotecario" },
    { codigoBcra: "060", nombre: "Banco de Tucumán" },
    { codigoBcra: "065", nombre: "Banco Municipal de Rosario" },
    { codigoBcra: "072", nombre: "Banco Santander Argentina" },
    { codigoBcra: "083", nombre: "Banco del Sol" },
    { codigoBcra: "086", nombre: "Banco de Santa Cruz" },
    { codigoBcra: "093", nombre: "Banco de la Pampa" },
    { codigoBcra: "094", nombre: "Banco de San Juan" },
    { codigoBcra: "097", nombre: "Banco Meridian" },
    { codigoBcra: "150", nombre: "HSBC Bank Argentina" },
    { codigoBcra: "191", nombre: "Banco Credicoop" },
    { codigoBcra: "247", nombre: "Banco Roela" },
    { codigoBcra: "254", nombre: "Banco Mariva" },
    { codigoBcra: "259", nombre: "Banco Itaú Argentina" },
    { codigoBcra: "266", nombre: "Banco de Valores" },
    { codigoBcra: "268", nombre: "Banco de Comercio Interior" },
    { codigoBcra: "277", nombre: "Banco BBVA Argentina" },
    { codigoBcra: "285", nombre: "Banco Macro" },
    { codigoBcra: "299", nombre: "Banco Comafi" },
    { codigoBcra: "300", nombre: "Banco de Inversión y Comercio Exterior (BICE)" },
    { codigoBcra: "321", nombre: "Banco de Formosa" },
    { codigoBcra: "330", nombre: "Banco del Chaco" },
    { codigoBcra: "386", nombre: "Banco Supervielle" },
    { codigoBcra: "303", nombre: "Banco Galicia" },
  ]
  for (const b of bancos) {
    await prisma.banco.upsert({ where: { codigoBcra: b.codigoBcra }, update: b, create: b })
  }
  console.log(`✓ ${bancos.length} bancos`)
}

async function seedCondicionesIva() {
  const condiciones = [
    { codigoAfip: "1", nombre: "Responsable Inscripto", abreviatura: "RI", letraRecibe: "A" },
    { codigoAfip: "4", nombre: "IVA Sujeto Exento", abreviatura: "EX", letraRecibe: "B" },
    { codigoAfip: "5", nombre: "Consumidor Final", abreviatura: "CF", letraRecibe: "B" },
    { codigoAfip: "6", nombre: "Responsable Monotributo", abreviatura: "MT", letraRecibe: "B" },
    { codigoAfip: "8", nombre: "Proveedor del Exterior", abreviatura: "PE", letraRecibe: "E" },
    { codigoAfip: "9", nombre: "Cliente del Exterior", abreviatura: "CE", letraRecibe: "E" },
    { codigoAfip: "10", nombre: "IVA Liberado - Ley 19.640", abreviatura: "LI", letraRecibe: "B" },
    { codigoAfip: "13", nombre: "Monotributista Social", abreviatura: "MS", letraRecibe: "B" },
  ]
  for (const c of condiciones) {
    await prisma.condicionIva.upsert({ where: { codigoAfip: c.codigoAfip }, update: c, create: c })
  }
  console.log(`✓ ${condiciones.length} condiciones IVA`)
}

async function seedTiposDocumento() {
  const tipos = [
    { codigo: "CUIT", nombre: "Clave Única de Identificación Tributaria", patron: "^\\d{2}-\\d{8}-\\d$", longitud: 11, esAfip: true },
    { codigo: "CUIL", nombre: "Clave Única de Identificación Laboral", patron: "^\\d{2}-\\d{8}-\\d$", longitud: 11, esAfip: true },
    { codigo: "CDI", nombre: "Clave de Identificación", longitud: 11, esAfip: true },
    { codigo: "DNI", nombre: "Documento Nacional de Identidad", patron: "^\\d{7,8}$", longitud: 8, esAfip: true },
    { codigo: "PAS", nombre: "Pasaporte", esAfip: false },
    { codigo: "LE", nombre: "Libreta de Enrolamiento", longitud: 8, esAfip: true },
    { codigo: "LC", nombre: "Libreta Cívica", longitud: 8, esAfip: true },
    { codigo: "CI", nombre: "Cédula de Identidad", esAfip: false },
  ]
  for (const t of tipos) {
    await prisma.tipoDocumento.upsert({ where: { codigo: t.codigo }, update: t, create: t })
  }
  console.log(`✓ ${tipos.length} tipos de documento`)
}

async function seedUnidadesMedida() {
  const unidades = [
    { codigo: "u", descripcion: "Unidad", codigoAfip: "7" },
    { codigo: "kg", descripcion: "Kilogramo", codigoAfip: "1" },
    { codigo: "g", descripcion: "Gramo", codigoAfip: "20" },
    { codigo: "lts", descripcion: "Litro", codigoAfip: "5" },
    { codigo: "ml", descripcion: "Mililitro", codigoAfip: "66" },
    { codigo: "m", descripcion: "Metro", codigoAfip: "2" },
    { codigo: "cm", descripcion: "Centímetro", codigoAfip: "3" },
    { codigo: "m2", descripcion: "Metro cuadrado", codigoAfip: "8" },
    { codigo: "m3", descripcion: "Metro cúbico", codigoAfip: "10" },
    { codigo: "hs", descripcion: "Hora", codigoAfip: "98" },
    { codigo: "cja", descripcion: "Caja", codigoAfip: "96" },
    { codigo: "doc", descripcion: "Docena", codigoAfip: "18" },
    { codigo: "pack", descripcion: "Pack", codigoAfip: "96" },
    { codigo: "tn", descripcion: "Tonelada", codigoAfip: "11" },
    { codigo: "par", descripcion: "Par", codigoAfip: "26" },
  ]
  for (const u of unidades) {
    await prisma.unidadMedida.upsert({ where: { codigo: u.codigo }, update: u, create: u })
  }
  console.log(`✓ ${unidades.length} unidades de medida`)
}

async function seedCondicionesPago() {
  const condiciones = [
    { nombre: "Contado", descripcion: "Pago al momento de la operación", cuotas: 1, diasVencimiento: 0 },
    { nombre: "Net 15", descripcion: "Pago a 15 días", cuotas: 1, diasVencimiento: 15 },
    { nombre: "Net 30", descripcion: "Pago a 30 días", cuotas: 1, diasVencimiento: 30 },
    { nombre: "Net 60", descripcion: "Pago a 60 días", cuotas: 1, diasVencimiento: 60 },
    { nombre: "30/60/90", descripcion: "Tres cuotas a 30, 60 y 90 días", cuotas: 3, diasVencimiento: 30, diasAdicionales: [60, 90] },
    { nombre: "50% anticipo + 50% contra entrega", descripcion: "Anticipo y saldo contra entrega", cuotas: 2, diasVencimiento: 0, diasAdicionales: [0] },
  ]
  for (const c of condiciones) {
    await prisma.condicionPago.upsert({ where: { nombre: c.nombre }, update: c, create: c })
  }
  console.log(`✓ ${condiciones.length} condiciones de pago`)
}

async function seedIncoterms() {
  const incoterms = [
    { codigo: "EXW", nombre: "Ex Works", descripcion: "En fábrica" },
    { codigo: "FCA", nombre: "Free Carrier", descripcion: "Franco transportista" },
    { codigo: "CPT", nombre: "Carriage Paid To", descripcion: "Transporte pagado hasta" },
    { codigo: "CIP", nombre: "Carriage and Insurance Paid To", descripcion: "Transporte y seguro pagados hasta" },
    { codigo: "DAP", nombre: "Delivered at Place", descripcion: "Entregada en lugar" },
    { codigo: "DPU", nombre: "Delivered at Place Unloaded", descripcion: "Entregada en lugar descargada" },
    { codigo: "DDP", nombre: "Delivered Duty Paid", descripcion: "Entregada con derechos pagados" },
    { codigo: "FAS", nombre: "Free Alongside Ship", descripcion: "Franco al costado del buque" },
    { codigo: "FOB", nombre: "Free On Board", descripcion: "Franco a bordo" },
    { codigo: "CFR", nombre: "Cost and Freight", descripcion: "Costo y flete" },
    { codigo: "CIF", nombre: "Cost, Insurance and Freight", descripcion: "Costo, seguro y flete" },
  ]
  for (const i of incoterms) {
    await prisma.incoterm.upsert({ where: { codigo: i.codigo }, update: i, create: i })
  }
  console.log(`✓ ${incoterms.length} Incoterms`)
}

async function seedFormasPago() {
  const formas = [
    { codigo: "EFE", nombre: "Efectivo", tipo: "efectivo", comisionPct: 0, diasAcreditacion: 0 },
    { codigo: "TRF", nombre: "Transferencia Bancaria", tipo: "transferencia", comisionPct: 0, diasAcreditacion: 0 },
    { codigo: "TDB", nombre: "Tarjeta de Débito", tipo: "tarjeta_debito", comisionPct: 0.8, diasAcreditacion: 2 },
    { codigo: "TCR", nombre: "Tarjeta de Crédito", tipo: "tarjeta_credito", comisionPct: 3.0, diasAcreditacion: 18 },
    { codigo: "CHQ", nombre: "Cheque", tipo: "cheque", comisionPct: 0, diasAcreditacion: 2 },
    { codigo: "MP", nombre: "MercadoPago", tipo: "mercadopago", comisionPct: 4.0, diasAcreditacion: 1 },
    { codigo: "CCC", nombre: "Cuenta Corriente", tipo: "cuenta_corriente", comisionPct: 0, diasAcreditacion: 0 },
  ]
  for (const f of formas) {
    await prisma.formaPago.upsert({ where: { codigo: f.codigo }, update: f, create: f })
  }
  console.log(`✓ ${formas.length} formas de pago`)
}

async function seedMotivos() {
  const motivos = [
    { codigo: "NC_DEV", descripcion: "Devolución de mercadería", tipoOperacion: "nota_credito", requiereAprobacion: false },
    { codigo: "NC_DSCTO", descripcion: "Descuento comercial", tipoOperacion: "nota_credito", requiereAprobacion: false },
    { codigo: "NC_ERR", descripcion: "Error en facturación", tipoOperacion: "nota_credito", requiereAprobacion: true },
    { codigo: "NC_ANULA", descripcion: "Anulación de comprobante", tipoOperacion: "nota_credito", requiereAprobacion: true },
    { codigo: "AJ_INV", descripcion: "Ajuste de inventario", tipoOperacion: "ajuste_stock", requiereAprobacion: false },
    { codigo: "AJ_ROT", descripcion: "Rotura / daño", tipoOperacion: "ajuste_stock", requiereAprobacion: false },
    { codigo: "AJ_VTO", descripcion: "Vencimiento de producto", tipoOperacion: "ajuste_stock", requiereAprobacion: false },
    { codigo: "BAJA_OBS", descripcion: "Obsolescencia", tipoOperacion: "baja", requiereAprobacion: true },
    { codigo: "DEV_COMP", descripcion: "Devolución a proveedor", tipoOperacion: "devolucion", requiereAprobacion: false },
    { codigo: "ANULA_OP", descripcion: "Anulación de operación", tipoOperacion: "anulacion", requiereAprobacion: true },
  ]
  for (const m of motivos) {
    await prisma.motivo.upsert({ where: { codigo: m.codigo }, update: m, create: m })
  }
  console.log(`✓ ${motivos.length} motivos`)
}

async function seedActividadesEconomicas() {
  const actividades = [
    { codigo: "011111", descripcion: "Cultivo de trigo", alicuotaIIBB: 1.5 },
    { codigo: "014111", descripcion: "Cría de ganado bovino", alicuotaIIBB: 1.5 },
    { codigo: "101011", descripcion: "Matanza de ganado bovino", alicuotaIIBB: 2.0 },
    { codigo: "108000", descripcion: "Elaboración de alimentos n.c.p.", alicuotaIIBB: 2.0 },
    { codigo: "110212", descripcion: "Elaboración de vinos", alicuotaIIBB: 2.0 },
    { codigo: "141200", descripcion: "Confección de ropa de trabajo", alicuotaIIBB: 2.5 },
    { codigo: "162201", descripcion: "Fabricación de muebles de madera", alicuotaIIBB: 2.5 },
    { codigo: "201110", descripcion: "Fabricación de sustancias químicas", alicuotaIIBB: 2.5 },
    { codigo: "210010", descripcion: "Fabricación de productos farmacéuticos", alicuotaIIBB: 2.0 },
    { codigo: "251100", descripcion: "Fabricación de productos metálicos", alicuotaIIBB: 2.5 },
    { codigo: "261000", descripcion: "Fabricación de componentes electrónicos", alicuotaIIBB: 2.0 },
    { codigo: "291000", descripcion: "Fabricación de vehículos automotores", alicuotaIIBB: 2.0 },
    { codigo: "351110", descripcion: "Generación de energía eléctrica", alicuotaIIBB: 2.0 },
    { codigo: "410010", descripcion: "Construcción de edificios", alicuotaIIBB: 3.0 },
    { codigo: "461009", descripcion: "Venta al por mayor en comisión", alicuotaIIBB: 3.0 },
    { codigo: "471110", descripcion: "Venta al por menor en hipermercados", alicuotaIIBB: 3.0 },
    { codigo: "472111", descripcion: "Venta de alimentos al por menor", alicuotaIIBB: 3.0 },
    { codigo: "473000", descripcion: "Venta de combustibles", alicuotaIIBB: 1.5 },
    { codigo: "477190", descripcion: "Venta de ropa al por menor", alicuotaIIBB: 3.5 },
    { codigo: "491110", descripcion: "Transporte ferroviario de cargas", alicuotaIIBB: 2.0 },
    { codigo: "492110", descripcion: "Transporte de pasajeros", alicuotaIIBB: 1.5 },
    { codigo: "492150", descripcion: "Transporte de cargas por carretera", alicuotaIIBB: 2.0 },
    { codigo: "551021", descripcion: "Servicios de alojamiento", alicuotaIIBB: 4.0 },
    { codigo: "561011", descripcion: "Servicios de restaurante", alicuotaIIBB: 4.0 },
    { codigo: "620100", descripcion: "Desarrollo de software", alicuotaIIBB: 3.0 },
    { codigo: "620200", descripcion: "Consultoría informática", alicuotaIIBB: 3.5 },
    { codigo: "631100", descripcion: "Procesamiento de datos y hosting", alicuotaIIBB: 3.0 },
    { codigo: "641100", descripcion: "Servicios de banca central", alicuotaIIBB: 0.0 },
    { codigo: "641930", descripcion: "Servicios de crédito n.c.p.", alicuotaIIBB: 5.5 },
    { codigo: "651100", descripcion: "Seguros de vida", alicuotaIIBB: 4.0 },
    { codigo: "691001", descripcion: "Servicios jurídicos", alicuotaIIBB: 3.5 },
    { codigo: "692000", descripcion: "Servicios de contabilidad y auditoría", alicuotaIIBB: 3.5 },
    { codigo: "711001", descripcion: "Servicios de arquitectura e ingeniería", alicuotaIIBB: 3.5 },
    { codigo: "750000", descripcion: "Servicios veterinarios", alicuotaIIBB: 3.5 },
    { codigo: "861010", descripcion: "Servicios de internación", alicuotaIIBB: 3.0 },
    { codigo: "862000", descripcion: "Servicios médicos", alicuotaIIBB: 3.5 },
    { codigo: "869010", descripcion: "Servicios de laboratorio", alicuotaIIBB: 3.5 },
    { codigo: "871000", descripcion: "Servicios de hogares para ancianos", alicuotaIIBB: 3.0 },
    { codigo: "920009", descripcion: "Servicios de juegos de azar", alicuotaIIBB: 6.0 },
    { codigo: "960100", descripcion: "Lavado y limpieza de prendas", alicuotaIIBB: 3.0 },
  ]
  for (const a of actividades) {
    await prisma.actividadEconomica.upsert({ where: { codigo: a.codigo }, update: a, create: a })
  }
  console.log(`✓ ${actividades.length} actividades económicas`)
}

async function seedNacionalidades() {
  const nacionalidades = [
    "argentina", "uruguaya", "brasileña", "chilena", "paraguaya",
    "boliviana", "peruana", "colombiana", "venezolana", "ecuatoriana",
    "mexicana", "estadounidense", "española", "italiana", "alemana",
    "francesa", "británica", "china", "japonesa", "india",
  ]
  for (const n of nacionalidades) {
    await prisma.nacionalidad.upsert({ where: { nombre: n }, update: {}, create: { nombre: n } })
  }
  console.log(`✓ ${nacionalidades.length} nacionalidades`)
}

async function seedIdiomas() {
  const idiomas = [
    { codigo: "es-AR", nombre: "Español (Argentina)", iso639: "es" },
    { codigo: "es-ES", nombre: "Español (España)", iso639: "es" },
    { codigo: "pt-BR", nombre: "Portugués (Brasil)", iso639: "pt" },
    { codigo: "en-US", nombre: "Inglés (Estados Unidos)", iso639: "en" },
    { codigo: "en-GB", nombre: "Inglés (Reino Unido)", iso639: "en" },
    { codigo: "fr-FR", nombre: "Francés", iso639: "fr" },
    { codigo: "de-DE", nombre: "Alemán", iso639: "de" },
    { codigo: "it-IT", nombre: "Italiano", iso639: "it" },
    { codigo: "zh-CN", nombre: "Chino Mandarín", iso639: "zh" },
    { codigo: "ja-JP", nombre: "Japonés", iso639: "ja" },
  ]
  for (const i of idiomas) {
    await prisma.idioma.upsert({ where: { codigo: i.codigo }, update: i, create: i })
  }
  console.log(`✓ ${idiomas.length} idiomas`)
}

async function seedZonasGeograficas() {
  const zonas = [
    { codigo: "AMBA", nombre: "Área Metropolitana Buenos Aires", factorFlete: 1.0, factorPrecio: 1.0, diasEntrega: 1 },
    { codigo: "CENTRO", nombre: "Zona Centro (CBA/SF/ER)", factorFlete: 1.2, factorPrecio: 1.0, diasEntrega: 2 },
    { codigo: "CUYO", nombre: "Cuyo (MZA/SJ/SL)", factorFlete: 1.4, factorPrecio: 1.0, diasEntrega: 3 },
    { codigo: "NOA", nombre: "Noroeste Argentino", factorFlete: 1.5, factorPrecio: 1.0, diasEntrega: 4 },
    { codigo: "NEA", nombre: "Noreste Argentino", factorFlete: 1.5, factorPrecio: 1.0, diasEntrega: 4 },
    { codigo: "PATAG", nombre: "Patagonia", factorFlete: 1.8, factorPrecio: 1.0, diasEntrega: 5 },
    { codigo: "TDF", nombre: "Tierra del Fuego", factorFlete: 2.5, factorPrecio: 0.79, diasEntrega: 7 },
  ]
  for (const z of zonas) {
    await prisma.zonaGeografica.upsert({ where: { codigo: z.codigo }, update: z, create: z })
  }
  console.log(`✓ ${zonas.length} zonas geográficas`)
}

async function seedTiposCliente() {
  const tipos = [
    { codigo: "MAY", nombre: "Mayorista", descuentoPct: 10.0 },
    { codigo: "MIN", nombre: "Minorista", descuentoPct: 0.0 },
    { codigo: "DIST", nombre: "Distribuidor", descuentoPct: 15.0 },
    { codigo: "CF", nombre: "Consumidor Final", descuentoPct: 0.0 },
    { codigo: "GOB", nombre: "Gobierno / Estatal", descuentoPct: 5.0 },
  ]
  for (const t of tipos) {
    await prisma.tipoCliente.upsert({ where: { codigo: t.codigo }, update: t, create: t })
  }
  console.log(`✓ ${tipos.length} tipos de cliente`)
}

async function seedEstadosCliente() {
  const estados = [
    { codigo: "ACT", nombre: "Activo", permiteVenta: true },
    { codigo: "INA", nombre: "Inactivo", permiteVenta: false },
    { codigo: "SUS", nombre: "Suspendido", permiteVenta: false },
    { codigo: "BLO", nombre: "Bloqueado", permiteVenta: false },
    { codigo: "POT", nombre: "Potencial", permiteVenta: false },
  ]
  for (const e of estados) {
    await prisma.estadoCliente.upsert({ where: { codigo: e.codigo }, update: e, create: e })
  }
  console.log(`✓ ${estados.length} estados de cliente`)
}

async function seedRubros() {
  const rubros = [
    { codigo: "ALIM", nombre: "Alimentos y Bebidas" },
    { codigo: "TECH", nombre: "Tecnología e Informática" },
    { codigo: "CONS", nombre: "Construcción" },
    { codigo: "SERV", nombre: "Servicios Profesionales" },
    { codigo: "SALUD", nombre: "Salud y Farmacia" },
    { codigo: "AGRO", nombre: "Agropecuario" },
    { codigo: "IND", nombre: "Industria Manufacturera" },
    { codigo: "COM", nombre: "Comercio General" },
    { codigo: "TRANS", nombre: "Transporte y Logística" },
    { codigo: "EDUC", nombre: "Educación" },
    { codigo: "FIN", nombre: "Servicios Financieros" },
    { codigo: "TEXTO", nombre: "Textil e Indumentaria" },
  ]
  for (const r of rubros) {
    await prisma.rubro.upsert({ where: { codigo: r.codigo }, update: r, create: r })
  }
  console.log(`✓ ${rubros.length} rubros`)
}

async function seedCanalesVenta() {
  const canales = [
    { codigo: "PRES", nombre: "Presencial / Mostrador", markupPct: 0.0 },
    { codigo: "ONLINE", nombre: "E-Commerce", markupPct: 0.0 },
    { codigo: "MP", nombre: "Mercado Libre", markupPct: 12.0 },
    { codigo: "TELE", nombre: "Televenta", markupPct: 0.0 },
    { codigo: "DIST", nombre: "Canal Distribuidor", markupPct: -10.0 },
  ]
  for (const c of canales) {
    await prisma.canalVenta.upsert({ where: { codigo: c.codigo }, update: c, create: c })
  }
  console.log(`✓ ${canales.length} canales de venta`)
}

async function seedSegmentosCliente() {
  const segmentos = [
    { codigo: "VIP", nombre: "VIP", prioridad: 1 },
    { codigo: "PREM", nombre: "Premium", prioridad: 2 },
    { codigo: "REG", nombre: "Regular", prioridad: 3 },
    { codigo: "NUEVO", nombre: "Nuevo", prioridad: 4 },
    { codigo: "RIESGO", nombre: "Riesgo", prioridad: 5 },
  ]
  for (const s of segmentos) {
    await prisma.segmentoCliente.upsert({ where: { codigo: s.codigo }, update: s, create: s })
  }
  console.log(`✓ ${segmentos.length} segmentos de cliente`)
}

async function seedTiposEmpresa() {
  const tipos = [
    { codigo: "SA", nombre: "Sociedad Anónima" },
    { codigo: "SRL", nombre: "Sociedad de Responsabilidad Limitada" },
    { codigo: "SAS", nombre: "Sociedad por Acciones Simplificada" },
    { codigo: "COOP", nombre: "Cooperativa" },
    { codigo: "FUND", nombre: "Fundación" },
    { codigo: "UNIP", nombre: "Unipersonal" },
    { codigo: "SC", nombre: "Sociedad Civil" },
    { codigo: "ASOC", nombre: "Asociación Civil" },
  ]
  for (const t of tipos) {
    await prisma.tipoEmpresa.upsert({ where: { codigo: t.codigo }, update: t, create: t })
  }
  console.log(`✓ ${tipos.length} tipos de empresa`)
}

async function seedEstadosCiviles() {
  const estados = [
    { codigo: "SOL", nombre: "Soltero/a" },
    { codigo: "CAS", nombre: "Casado/a" },
    { codigo: "DIV", nombre: "Divorciado/a" },
    { codigo: "VIU", nombre: "Viudo/a" },
    { codigo: "UNH", nombre: "Unión de Hecho" },
    { codigo: "SEP", nombre: "Separado/a" },
  ]
  for (const e of estados) {
    await prisma.estadoCivil.upsert({ where: { codigo: e.codigo }, update: e, create: e })
  }
  console.log(`✓ ${estados.length} estados civiles`)
}

async function seedProfesiones() {
  const profesiones = [
    { codigo: "ING", nombre: "Ingeniero/a" },
    { codigo: "MED", nombre: "Médico/a" },
    { codigo: "ABG", nombre: "Abogado/a" },
    { codigo: "CPN", nombre: "Contador/a Público Nacional" },
    { codigo: "ARQ", nombre: "Arquitecto/a" },
    { codigo: "LIC", nombre: "Licenciado/a" },
    { codigo: "PROF", nombre: "Profesor/a" },
    { codigo: "TEC", nombre: "Técnico/a" },
    { codigo: "COM", nombre: "Comerciante" },
    { codigo: "AUT", nombre: "Autónomo/a" },
  ]
  for (const p of profesiones) {
    await prisma.profesion.upsert({ where: { codigo: p.codigo }, update: p, create: p })
  }
  console.log(`✓ ${profesiones.length} profesiones`)
}

async function seedTiposDireccion() {
  const tipos = [
    { codigo: "LEGAL", nombre: "Domicilio Legal", esPrincipal: true },
    { codigo: "FISCAL", nombre: "Domicilio Fiscal", esPrincipal: false },
    { codigo: "ENTREGA", nombre: "Dirección de Entrega", esPrincipal: false },
    { codigo: "FACTURA", nombre: "Dirección de Facturación", esPrincipal: false },
    { codigo: "SUC", nombre: "Sucursal", esPrincipal: false },
    { codigo: "DEPO", nombre: "Depósito", esPrincipal: false },
  ]
  for (const t of tipos) {
    await prisma.tipoDireccion.upsert({ where: { codigo: t.codigo }, update: t, create: t })
  }
  console.log(`✓ ${tipos.length} tipos de dirección`)
}

async function seedTiposContacto() {
  const tipos = [
    { codigo: "TEL", nombre: "Teléfono Fijo" },
    { codigo: "CEL", nombre: "Celular" },
    { codigo: "EMAIL", nombre: "Correo Electrónico", patron: "^[^@]+@[^@]+\\.[^@]+$" },
    { codigo: "WA", nombre: "WhatsApp" },
    { codigo: "TG", nombre: "Telegram" },
    { codigo: "WEB", nombre: "Sitio Web" },
    { codigo: "LI", nombre: "LinkedIn" },
  ]
  for (const t of tipos) {
    await prisma.tipoContacto.upsert({ where: { codigo: t.codigo }, update: t, create: t })
  }
  console.log(`✓ ${tipos.length} tipos de contacto`)
}

async function seedTaxConceptos() {
  const conceptos = [
    // ═══ IVA — todas las alícuotas AFIP ═══
    { pais: "AR", codigo: "IVA_21", nombre: "IVA 21%", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "5", alicuota: 21 },
    { pais: "AR", codigo: "IVA_10_5", nombre: "IVA 10.5%", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "4", alicuota: 10.5 },
    { pais: "AR", codigo: "IVA_27", nombre: "IVA 27%", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "6", alicuota: 27 },
    { pais: "AR", codigo: "IVA_5", nombre: "IVA 5%", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "8", alicuota: 5 },
    { pais: "AR", codigo: "IVA_2_5", nombre: "IVA 2.5%", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "9", alicuota: 2.5 },
    { pais: "AR", codigo: "IVA_0", nombre: "IVA 0% (Exento)", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "3", alicuota: 0 },
    // ═══ IIBB principales jurisdicciones ═══
    { pais: "AR", codigo: "IIBB_PBA_COMERCIO", nombre: "IIBB Buenos Aires - Comercio", tipo: "iibb", organismo: "ARBA", jurisdiccion: "PBA", alicuota: 3.5 },
    { pais: "AR", codigo: "IIBB_CABA_COMERCIO", nombre: "IIBB CABA - Comercio", tipo: "iibb", organismo: "AGIP", jurisdiccion: "CABA", alicuota: 3.0 },
    { pais: "AR", codigo: "IIBB_SF_COMERCIO", nombre: "IIBB Santa Fe - Comercio", tipo: "iibb", organismo: "DGR_SF", jurisdiccion: "SF", alicuota: 3.6 },
    { pais: "AR", codigo: "IIBB_CBA_COMERCIO", nombre: "IIBB Córdoba - Comercio", tipo: "iibb", organismo: "DGR_CBA", jurisdiccion: "CBA", alicuota: 4.0 },
    { pais: "AR", codigo: "IIBB_MZA_COMERCIO", nombre: "IIBB Mendoza - Comercio", tipo: "iibb", organismo: "ATM", jurisdiccion: "MZA", alicuota: 3.0 },
    { pais: "AR", codigo: "IIBB_PBA_SERVICIOS", nombre: "IIBB Buenos Aires - Servicios", tipo: "iibb", organismo: "ARBA", jurisdiccion: "PBA", alicuota: 4.0 },
    { pais: "AR", codigo: "IIBB_CABA_SERVICIOS", nombre: "IIBB CABA - Servicios", tipo: "iibb", organismo: "AGIP", jurisdiccion: "CABA", alicuota: 3.0 },
    { pais: "AR", codigo: "IIBB_TUC_COMERCIO", nombre: "IIBB Tucumán - Comercio", tipo: "iibb", organismo: "DGR_TUC", jurisdiccion: "TUC", alicuota: 3.5 },
    { pais: "AR", codigo: "IIBB_ER_COMERCIO", nombre: "IIBB Entre Ríos - Comercio", tipo: "iibb", organismo: "DGR_ER", jurisdiccion: "ER", alicuota: 3.5 },
    // ═══ Percepciones IVA ═══
    { pais: "AR", codigo: "PERC_IVA_RI", nombre: "Percepción IVA a RI (RG 2408)", tipo: "percepcion_iva", organismo: "AFIP", jurisdiccion: "federal", esPercepcion: true, codigoAfip: "1", alicuota: 3.0 },
    { pais: "AR", codigo: "PERC_IVA_NO_RI", nombre: "Percepción IVA a No RI (RG 2408)", tipo: "percepcion_iva", organismo: "AFIP", jurisdiccion: "federal", esPercepcion: true, codigoAfip: "1", alicuota: 10.5 },
    // ═══ Percepciones IIBB por jurisdicción ═══
    { pais: "AR", codigo: "PERC_IIBB_PBA", nombre: "Percepción IIBB Buenos Aires", tipo: "percepcion_iibb", organismo: "ARBA", jurisdiccion: "PBA", esPercepcion: true, codigoAfip: "2", alicuota: 3.0 },
    { pais: "AR", codigo: "PERC_IIBB_CABA", nombre: "Percepción IIBB CABA", tipo: "percepcion_iibb", organismo: "AGIP", jurisdiccion: "CABA", esPercepcion: true, codigoAfip: "2", alicuota: 2.0 },
    { pais: "AR", codigo: "PERC_IIBB_SF", nombre: "Percepción IIBB Santa Fe", tipo: "percepcion_iibb", organismo: "DGR_SF", jurisdiccion: "SF", esPercepcion: true, codigoAfip: "2", alicuota: 2.5 },
    { pais: "AR", codigo: "PERC_IIBB_CBA", nombre: "Percepción IIBB Córdoba", tipo: "percepcion_iibb", organismo: "DGR_CBA", jurisdiccion: "CBA", esPercepcion: true, codigoAfip: "2", alicuota: 3.0 },
    // ═══ Retenciones IIBB (sufridas en cobros) ═══
    { pais: "AR", codigo: "RET_IIBB_PBA", nombre: "Retención IIBB Buenos Aires", tipo: "retencion_iibb", organismo: "ARBA", jurisdiccion: "PBA", esRetencion: true, alicuota: 2.5 },
    { pais: "AR", codigo: "RET_IIBB_CABA", nombre: "Retención IIBB CABA", tipo: "retencion_iibb", organismo: "AGIP", jurisdiccion: "CABA", esRetencion: true, alicuota: 1.5 },
    // ═══ Retenciones SICORE ═══
    { pais: "AR", codigo: "RET_IVA_SICORE_767", nombre: "Ret. IVA SICORE — Servcios (cód 767)", tipo: "retencion_iva", organismo: "AFIP", jurisdiccion: "federal", esRetencion: true, codigoSicore: "767", alicuota: 10.5 },
    { pais: "AR", codigo: "RET_IVA_SICORE_217", nombre: "Ret. IVA SICORE — Bienes (cód 217)", tipo: "retencion_iva", organismo: "AFIP", jurisdiccion: "federal", esRetencion: true, codigoSicore: "217", alicuota: 10.5 },
    { pais: "AR", codigo: "RET_IVA_SICORE_219", nombre: "Ret. IVA SICORE — Locaciones (cód 219)", tipo: "retencion_iva", organismo: "AFIP", jurisdiccion: "federal", esRetencion: true, codigoSicore: "219", alicuota: 10.5 },
    { pais: "AR", codigo: "RET_GAN_SICORE_305", nombre: "Ret. Ganancias — Bienes (cód 305)", tipo: "retencion_ganancias", organismo: "AFIP", jurisdiccion: "federal", esRetencion: true, codigoSicore: "305", alicuota: 2.0 },
    { pais: "AR", codigo: "RET_GAN_SICORE_779", nombre: "Ret. Ganancias — Locaciones obra (cód 779)", tipo: "retencion_ganancias", organismo: "AFIP", jurisdiccion: "federal", esRetencion: true, codigoSicore: "779", alicuota: 6.0 },
    // ═══ Impuestos internos ═══
    { pais: "AR", codigo: "IMP_INT_TABACO", nombre: "Impuesto Interno - Tabacos", tipo: "interno", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "4", alicuota: 75 },
    { pais: "AR", codigo: "IMP_INT_ALCOHOL", nombre: "Impuesto Interno - Bebidas Alcohólicas", tipo: "interno", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "4", alicuota: 20 },
    { pais: "AR", codigo: "IMP_INT_ELECTRONICA", nombre: "Impuesto Interno - Electrónica", tipo: "interno", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "4", alicuota: 17 },
  ]
  for (const c of conceptos) {
    const { alicuota, ...conceptoData } = c
    const concepto = await prisma.taxConcepto.upsert({
      where: { pais_codigo: { pais: c.pais, codigo: c.codigo } },
      update: conceptoData,
      create: conceptoData,
    })
    // Create initial rate
    const existingRate = await prisma.taxTasa.findFirst({ where: { conceptoId: concepto.id } })
    if (!existingRate) {
      await prisma.taxTasa.create({
        data: {
          conceptoId: concepto.id,
          alicuota: alicuota,
          vigenciaDesde: new Date("2024-01-01"),
        },
      })
    }
  }
  console.log(`✓ ${conceptos.length} conceptos impositivos + tasas`)
}

async function seedConfiguracionFuncional() {
  const configs = [
    { handler: "stock_por_venta", nombre: "Decrementar stock al emitir factura", descripcion: "Al emitir una factura, descuenta stock del depósito principal", evento: "FACTURA_EMITIDA", modulo: "stock", activo: true },
    { handler: "stock_por_compra", nombre: "Incrementar stock al registrar compra", descripcion: "Al registrar una compra, suma stock al depósito principal", evento: "COMPRA_REGISTRADA", modulo: "stock", activo: true },
    { handler: "asiento_venta", nombre: "Generar asiento contable de venta", descripcion: "Crea asiento automático al emitir factura", evento: "FACTURA_EMITIDA", modulo: "contabilidad", activo: true },
    { handler: "asiento_compra", nombre: "Generar asiento contable de compra", descripcion: "Crea asiento automático al registrar compra", evento: "COMPRA_REGISTRADA", modulo: "contabilidad", activo: true },
    { handler: "cc_por_venta", nombre: "Generar cuenta a cobrar", descripcion: "Al emitir factura a crédito genera registro en CC", evento: "FACTURA_EMITIDA", modulo: "cc_cp", activo: true },
    { handler: "cp_por_compra", nombre: "Generar cuenta a pagar", descripcion: "Al registrar compra a crédito genera registro en CP", evento: "COMPRA_REGISTRADA", modulo: "cc_cp", activo: true },
    { handler: "stock_por_nc", nombre: "Reingreso de stock por NC", descripcion: "Al emitir NC por devolución reingresa stock", evento: "NC_EMITIDA", modulo: "stock", activo: true },
    { handler: "asiento_nc", nombre: "Generar asiento contable de NC", descripcion: "Crea asiento reverso al emitir NC", evento: "NC_EMITIDA", modulo: "contabilidad", activo: true },
    { handler: "alerta_stock_bajo", nombre: "Alertar stock bajo mínimo", descripcion: "Genera alerta cuando stock queda debajo del mínimo", evento: "STOCK_ACTUALIZADO", modulo: "stock", activo: true },
  ]
  for (const c of configs) {
    await prisma.configuracionFuncional.upsert({ where: { handler: c.handler }, update: c, create: c })
  }
  console.log(`✓ ${configs.length} configuraciones funcionales`)
}

async function seedEmpresaYAdmin() {
  const empresa = await prisma.empresa.upsert({
    where: { cuit: "20-00000000-0" },
    update: {},
    create: {
      nombre: "Empresa Demo",
      razonSocial: "Empresa Demostración SRL",
      cuit: "20-00000000-0",
      direccion: "Av. Corrientes 1234, CABA",
      telefono: "011-4567-8900",
      email: "admin@erp-argentina.com",
      puntoVenta: 1,
      entorno: "homologacion",
    },
  })

  const hashedPassword = await bcrypt.hash("admin1234", 10)
  await prisma.usuario.upsert({
    where: { email: "admin@erp-argentina.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@erp-argentina.com",
      password: hashedPassword,
      rol: "administrador",
      empresaId: empresa.id,
      activo: true,
    },
  })
  console.log("✓ Empresa demo + usuario admin")
  return empresa.id
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 1: MAESTROS CONTABLES PROFESIONALES
// ═══════════════════════════════════════════════════════════════════════════════

async function seedRubrosContables(empresaId: number) {
  const rubros = [
    // Balance General - Activo
    { codigo: "BG_A_DISP", nombre: "Disponibilidades", tipoEstadoFinanciero: "balance_general", orden: 1 },
    { codigo: "BG_A_INV_TR", nombre: "Inversiones Temporarias", tipoEstadoFinanciero: "balance_general", orden: 2 },
    { codigo: "BG_A_CRED_V", nombre: "Créditos por Ventas", tipoEstadoFinanciero: "balance_general", orden: 3 },
    { codigo: "BG_A_OTR_CR", nombre: "Otros Créditos", tipoEstadoFinanciero: "balance_general", orden: 4 },
    { codigo: "BG_A_BC", nombre: "Bienes de Cambio", tipoEstadoFinanciero: "balance_general", orden: 5 },
    { codigo: "BG_A_BU", nombre: "Bienes de Uso", tipoEstadoFinanciero: "balance_general", orden: 6 },
    { codigo: "BG_A_INTANG", nombre: "Activos Intangibles", tipoEstadoFinanciero: "balance_general", orden: 7 },
    { codigo: "BG_A_OTR_A", nombre: "Otros Activos", tipoEstadoFinanciero: "balance_general", orden: 8 },
    // Balance General - Pasivo
    { codigo: "BG_P_DEUD_C", nombre: "Deudas Comerciales", tipoEstadoFinanciero: "balance_general", orden: 10 },
    { codigo: "BG_P_DEUD_F", nombre: "Deudas Fiscales", tipoEstadoFinanciero: "balance_general", orden: 11 },
    { codigo: "BG_P_DEUD_S", nombre: "Deudas Sociales", tipoEstadoFinanciero: "balance_general", orden: 12 },
    { codigo: "BG_P_DEUD_B", nombre: "Deudas Bancarias y Financieras", tipoEstadoFinanciero: "balance_general", orden: 13 },
    { codigo: "BG_P_OTR_D", nombre: "Otras Deudas", tipoEstadoFinanciero: "balance_general", orden: 14 },
    { codigo: "BG_P_PREV", nombre: "Previsiones", tipoEstadoFinanciero: "balance_general", orden: 15 },
    // Balance General - Patrimonio Neto
    { codigo: "BG_PN_CAP", nombre: "Capital", tipoEstadoFinanciero: "balance_general", orden: 20 },
    { codigo: "BG_PN_RES", nombre: "Reservas", tipoEstadoFinanciero: "balance_general", orden: 21 },
    { codigo: "BG_PN_RNA", nombre: "Resultados No Asignados", tipoEstadoFinanciero: "balance_general", orden: 22 },
    { codigo: "BG_PN_REJ", nombre: "Resultado del Ejercicio", tipoEstadoFinanciero: "balance_general", orden: 23 },
    // Estado de Resultados
    { codigo: "ER_ING_OP", nombre: "Ingresos Operativos", tipoEstadoFinanciero: "estado_resultados", orden: 30 },
    { codigo: "ER_CMV", nombre: "Costo de Mercaderías Vendidas", tipoEstadoFinanciero: "estado_resultados", orden: 31 },
    { codigo: "ER_GTO_ADM", nombre: "Gastos de Administración", tipoEstadoFinanciero: "estado_resultados", orden: 32 },
    { codigo: "ER_GTO_COM", nombre: "Gastos de Comercialización", tipoEstadoFinanciero: "estado_resultados", orden: 33 },
    { codigo: "ER_RES_FIN", nombre: "Resultados Financieros", tipoEstadoFinanciero: "estado_resultados", orden: 34 },
    { codigo: "ER_OTR_ING", nombre: "Otros Ingresos", tipoEstadoFinanciero: "estado_resultados", orden: 35 },
    { codigo: "ER_OTR_EGR", nombre: "Otros Egresos", tipoEstadoFinanciero: "estado_resultados", orden: 36 },
    { codigo: "ER_IMPUESTO", nombre: "Impuesto a las Ganancias", tipoEstadoFinanciero: "estado_resultados", orden: 37 },
    // Flujo de Efectivo
    { codigo: "FE_OP", nombre: "Actividades Operativas", tipoEstadoFinanciero: "flujo_efectivo", orden: 40 },
    { codigo: "FE_INV", nombre: "Actividades de Inversión", tipoEstadoFinanciero: "flujo_efectivo", orden: 41 },
    { codigo: "FE_FIN", nombre: "Actividades de Financiación", tipoEstadoFinanciero: "flujo_efectivo", orden: 42 },
  ]
  for (const r of rubros) {
    await prisma.rubroContable.upsert({
      where: { empresaId_codigo: { empresaId, codigo: r.codigo } },
      update: r,
      create: { ...r, empresaId },
    })
  }
  console.log(`✓ ${rubros.length} rubros contables (Balance/EERR/Flujo)`)
}

async function seedTiposAsiento(empresaId: number) {
  const tipos = [
    { codigo: "APERTURA", nombre: "Asiento de Apertura", requiereAprobacion: true, afectaResultado: false, esAutomatico: false },
    { codigo: "DIARIO", nombre: "Asiento Diario", requiereAprobacion: false, afectaResultado: true, esAutomatico: false },
    { codigo: "VENTA", nombre: "Asiento por Venta", requiereAprobacion: false, afectaResultado: true, esAutomatico: true },
    { codigo: "COMPRA", nombre: "Asiento por Compra", requiereAprobacion: false, afectaResultado: true, esAutomatico: true },
    { codigo: "COBRO", nombre: "Asiento por Cobro", requiereAprobacion: false, afectaResultado: false, esAutomatico: true },
    { codigo: "PAGO", nombre: "Asiento por Pago", requiereAprobacion: false, afectaResultado: false, esAutomatico: true },
    { codigo: "NC", nombre: "Asiento por Nota de Crédito", requiereAprobacion: false, afectaResultado: true, esAutomatico: true },
    { codigo: "ND", nombre: "Asiento por Nota de Débito", requiereAprobacion: false, afectaResultado: true, esAutomatico: true },
    { codigo: "CIERRE", nombre: "Asiento de Cierre", requiereAprobacion: true, afectaResultado: true, esAutomatico: false },
    { codigo: "AJUSTE_INFLACION", nombre: "Ajuste por Inflación (RT 6)", requiereAprobacion: true, afectaResultado: true, esAutomatico: false },
    { codigo: "RECLASIFICACION", nombre: "Reclasificación de Cuentas", requiereAprobacion: true, afectaResultado: false, esAutomatico: false },
    { codigo: "REGULARIZACION", nombre: "Regularización Contable", requiereAprobacion: true, afectaResultado: true, esAutomatico: false },
    { codigo: "REFUNDICION", nombre: "Refundición de Resultados", requiereAprobacion: true, afectaResultado: true, esAutomatico: false },
    { codigo: "DEPRECIACION", nombre: "Depreciación / Amortización", requiereAprobacion: false, afectaResultado: true, esAutomatico: true },
    { codigo: "PROVISION", nombre: "Provisiones y Previsiones", requiereAprobacion: true, afectaResultado: true, esAutomatico: false },
  ]
  for (const t of tipos) {
    await prisma.tipoAsiento.upsert({
      where: { empresaId_codigo: { empresaId, codigo: t.codigo } },
      update: t,
      create: { ...t, empresaId },
    })
  }
  console.log(`✓ ${tipos.length} tipos de asiento`)
}

async function seedPlantillasAsiento(empresaId: number) {
  const plantillas = [
    {
      codigo: "AMORT_BU",
      nombre: "Amortización Bienes de Uso",
      periodicidad: "mensual",
      lineas: [
        { cuentaCodigo: "5.4.1", cuentaNombre: "Amortización Bienes de Uso", debeFormula: "PARAM_MONTO", haberFormula: null, orden: 1 },
        { cuentaCodigo: "1.6.9", cuentaNombre: "Amortización Acumulada BU", debeFormula: null, haberFormula: "PARAM_MONTO", orden: 2 },
      ],
    },
    {
      codigo: "SUELDOS_MENSUAL",
      nombre: "Liquidación de Sueldos",
      periodicidad: "mensual",
      lineas: [
        { cuentaCodigo: "5.2.1", cuentaNombre: "Sueldos y Jornales", debeFormula: "PARAM_BRUTO", haberFormula: null, orden: 1 },
        { cuentaCodigo: "5.2.2", cuentaNombre: "Cargas Sociales", debeFormula: "PARAM_CARGAS", haberFormula: null, orden: 2 },
        { cuentaCodigo: "2.3.1", cuentaNombre: "Sueldos a Pagar", debeFormula: null, haberFormula: "PARAM_NETO", orden: 3 },
        { cuentaCodigo: "2.3.2", cuentaNombre: "Aportes y Contribuciones a Depositar", debeFormula: null, haberFormula: "PARAM_APORTES", orden: 4 },
      ],
    },
    {
      codigo: "PROV_VACACIONES",
      nombre: "Provisión de Vacaciones",
      periodicidad: "mensual",
      lineas: [
        { cuentaCodigo: "5.2.4", cuentaNombre: "Provisión Vacaciones (Gasto)", debeFormula: "PARAM_MONTO", haberFormula: null, orden: 1 },
        { cuentaCodigo: "2.5.1", cuentaNombre: "Provisión Vacaciones a Pagar", debeFormula: null, haberFormula: "PARAM_MONTO", orden: 2 },
      ],
    },
    {
      codigo: "PROV_AGUINALDO",
      nombre: "Provisión de SAC / Aguinaldo",
      periodicidad: "mensual",
      lineas: [
        { cuentaCodigo: "5.2.5", cuentaNombre: "Provisión SAC (Gasto)", debeFormula: "PARAM_MONTO", haberFormula: null, orden: 1 },
        { cuentaCodigo: "2.5.2", cuentaNombre: "Provisión SAC a Pagar", debeFormula: null, haberFormula: "PARAM_MONTO", orden: 2 },
      ],
    },
    {
      codigo: "DIF_CAMBIO",
      nombre: "Diferencia de Cambio",
      periodicidad: null,
      lineas: [
        { cuentaCodigo: "5.5.2", cuentaNombre: "Diferencia de Cambio (Pérdida)", debeFormula: "PARAM_MONTO_PERDIDA", haberFormula: null, orden: 1 },
        { cuentaCodigo: "4.2.2", cuentaNombre: "Diferencia de Cambio (Ganancia)", debeFormula: null, haberFormula: "PARAM_MONTO_GANANCIA", orden: 2 },
      ],
    },
  ]
  for (const p of plantillas) {
    const { lineas, ...plantillaData } = p
    const plantilla = await prisma.plantillaAsiento.upsert({
      where: { empresaId_codigo: { empresaId, codigo: p.codigo } },
      update: plantillaData,
      create: { ...plantillaData, empresaId },
    })
    // Delete existing lines and recreate
    await prisma.lineaPlantillaAsiento.deleteMany({ where: { plantillaId: plantilla.id } })
    for (const l of lineas) {
      await prisma.lineaPlantillaAsiento.create({ data: { ...l, plantillaId: plantilla.id } })
    }
  }
  console.log(`✓ ${plantillas.length} plantillas de asiento con líneas`)
}

async function seedTiposComprobante(empresaId: number) {
  const tipos = [
    // Facturas
    { codigoAfip: 1, letra: "A", nombre: "Factura A", abreviatura: "FA", esFactura: true },
    { codigoAfip: 6, letra: "B", nombre: "Factura B", abreviatura: "FB", esFactura: true },
    { codigoAfip: 11, letra: "C", nombre: "Factura C", abreviatura: "FC", esFactura: true },
    { codigoAfip: 19, letra: "E", nombre: "Factura de Exportación E", abreviatura: "FE", esFactura: true },
    { codigoAfip: 51, letra: "M", nombre: "Factura M", abreviatura: "FM", esFactura: true },
    // Notas de Crédito
    { codigoAfip: 3, letra: "A", nombre: "Nota de Crédito A", abreviatura: "NCA", esNotaCredito: true },
    { codigoAfip: 8, letra: "B", nombre: "Nota de Crédito B", abreviatura: "NCB", esNotaCredito: true },
    { codigoAfip: 13, letra: "C", nombre: "Nota de Crédito C", abreviatura: "NCC", esNotaCredito: true },
    { codigoAfip: 21, letra: "E", nombre: "Nota de Crédito E", abreviatura: "NCE", esNotaCredito: true },
    { codigoAfip: 53, letra: "M", nombre: "Nota de Crédito M", abreviatura: "NCM", esNotaCredito: true },
    // Notas de Débito
    { codigoAfip: 2, letra: "A", nombre: "Nota de Débito A", abreviatura: "NDA", esNotaDebito: true },
    { codigoAfip: 7, letra: "B", nombre: "Nota de Débito B", abreviatura: "NDB", esNotaDebito: true },
    { codigoAfip: 12, letra: "C", nombre: "Nota de Débito C", abreviatura: "NDC", esNotaDebito: true },
    { codigoAfip: 20, letra: "E", nombre: "Nota de Débito E", abreviatura: "NDE", esNotaDebito: true },
    { codigoAfip: 52, letra: "M", nombre: "Nota de Débito M", abreviatura: "NDM", esNotaDebito: true },
    // Recibos
    { codigoAfip: 4, letra: "A", nombre: "Recibo A", abreviatura: "RA", esRecibo: true },
    { codigoAfip: 9, letra: "B", nombre: "Recibo B", abreviatura: "RB", esRecibo: true },
    { codigoAfip: 15, letra: "C", nombre: "Recibo C", abreviatura: "RC", esRecibo: true },
    // FCE MiPyME
    { codigoAfip: 201, letra: "A", nombre: "Factura Crédito Electrónica MiPyME A", abreviatura: "FCEA", esFactura: true, esFCE: true },
    { codigoAfip: 206, letra: "B", nombre: "Factura Crédito Electrónica MiPyME B", abreviatura: "FCEB", esFactura: true, esFCE: true },
    { codigoAfip: 211, letra: "C", nombre: "Factura Crédito Electrónica MiPyME C", abreviatura: "FCEC", esFactura: true, esFCE: true },
    { codigoAfip: 203, letra: "A", nombre: "NC Crédito Electrónica MiPyME A", abreviatura: "NCFCEA", esNotaCredito: true, esFCE: true },
    { codigoAfip: 208, letra: "B", nombre: "NC Crédito Electrónica MiPyME B", abreviatura: "NCFCEB", esNotaCredito: true, esFCE: true },
    { codigoAfip: 213, letra: "C", nombre: "NC Crédito Electrónica MiPyME C", abreviatura: "NCFCEC", esNotaCredito: true, esFCE: true },
  ]
  for (const t of tipos) {
    await prisma.tipoComprobanteMaestro.upsert({
      where: { empresaId_codigoAfip: { empresaId, codigoAfip: t.codigoAfip } },
      update: t,
      create: { ...t, empresaId },
    })
  }
  console.log(`✓ ${tipos.length} tipos de comprobante AFIP`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 2: MAESTROS FINANCIEROS
// ═══════════════════════════════════════════════════════════════════════════════

async function seedTiposRetencion(empresaId: number) {
  const tipos = [
    { codigo: "RET_IVA", nombre: "Retención de IVA", normaLegal: "RG 2854", impuesto: "iva" },
    { codigo: "RET_GAN", nombre: "Retención de Ganancias", normaLegal: "RG 830", impuesto: "ganancias" },
    { codigo: "RET_IIBB_PBA", nombre: "Retención IIBB Buenos Aires", normaLegal: "RN 18/2020 (ARBA)", impuesto: "iibb" },
    { codigo: "RET_IIBB_CABA", nombre: "Retención IIBB CABA", normaLegal: "RG 939/2013 (AGIP)", impuesto: "iibb" },
    { codigo: "RET_IIBB_CBA", nombre: "Retención IIBB Córdoba", normaLegal: "RN 1/2021 (DGR CBA)", impuesto: "iibb" },
    { codigo: "RET_IIBB_SF", nombre: "Retención IIBB Santa Fe", normaLegal: "RG 15/2018 (API SF)", impuesto: "iibb" },
    { codigo: "RET_SUSS", nombre: "Retención SUSS", normaLegal: "RG 1784", impuesto: "suss" },
  ]
  for (const t of tipos) {
    await prisma.tipoRetencion.upsert({
      where: { empresaId_codigo: { empresaId, codigo: t.codigo } },
      update: t,
      create: { ...t, empresaId },
    })
  }
  console.log(`✓ ${tipos.length} tipos de retención`)
}

async function seedRegimenesRetencion(empresaId: number) {
  const regimenes = [
    { codigoSicore: "217", concepto: "Intereses por operaciones financieras", alicuotaInscripto: 10.5, alicuotaNoInscripto: 21, minimoNoSujeto: 0, baseCalculo: "neto", tipoRetencionCodigo: "RET_IVA" },
    { codigoSicore: "219", concepto: "Locaciones de obra y/o servicios", alicuotaInscripto: 10.5, alicuotaNoInscripto: 21, minimoNoSujeto: 0, baseCalculo: "neto", tipoRetencionCodigo: "RET_IVA" },
    { codigoSicore: "767", concepto: "Comercialización bienes muebles (inscriptos)", alicuotaInscripto: 10.5, alicuotaNoInscripto: 21, minimoNoSujeto: 200000, baseCalculo: "neto", tipoRetencionCodigo: "RET_IVA" },
    { codigoSicore: "779", concepto: "Prestaciones de servicios", alicuotaInscripto: 10.5, alicuotaNoInscripto: 21, minimoNoSujeto: 200000, baseCalculo: "neto", tipoRetencionCodigo: "RET_IVA" },
    { codigoSicore: "305", concepto: "Bienes muebles - Pago a RI", alicuotaInscripto: 2, alicuotaNoInscripto: 10, minimoNoSujeto: 318800, baseCalculo: "neto", tipoRetencionCodigo: "RET_GAN" },
    { codigoSicore: "306", concepto: "Locaciones de obra", alicuotaInscripto: 2, alicuotaNoInscripto: 10, minimoNoSujeto: 318800, baseCalculo: "neto", tipoRetencionCodigo: "RET_GAN" },
    { codigoSicore: "312", concepto: "Locaciones de servicios", alicuotaInscripto: 2, alicuotaNoInscripto: 28, minimoNoSujeto: 63770, baseCalculo: "neto", tipoRetencionCodigo: "RET_GAN" },
    { codigoSicore: "314", concepto: "Honorarios profesionales", alicuotaInscripto: 2, alicuotaNoInscripto: 10, minimoNoSujeto: 63770, baseCalculo: "neto", tipoRetencionCodigo: "RET_GAN" },
    { codigoSicore: "315", concepto: "Transporte de cargas", alicuotaInscripto: 2, alicuotaNoInscripto: 10, minimoNoSujeto: 318800, baseCalculo: "neto", tipoRetencionCodigo: "RET_GAN" },
    { codigoSicore: "389", concepto: "Alquileres de inmuebles urbanos", alicuotaInscripto: 6, alicuotaNoInscripto: 28, minimoNoSujeto: 318800, baseCalculo: "neto", tipoRetencionCodigo: "RET_GAN" },
  ]
  for (const r of regimenes) {
    const { tipoRetencionCodigo, ...regimenData } = r
    const tipoRetencion = await prisma.tipoRetencion.findFirst({ where: { empresaId, codigo: tipoRetencionCodigo } })
    if (tipoRetencion) {
      await prisma.regimenRetencion.upsert({
        where: { empresaId_codigoSicore: { empresaId, codigoSicore: r.codigoSicore } },
        update: regimenData,
        create: { ...regimenData, tipoRetencionId: tipoRetencion.id, empresaId, vigenciaDesde: new Date("2024-01-01") },
      })
    }
  }
  console.log(`✓ ${regimenes.length} regímenes de retención SICORE`)
}

async function seedTiposMovimientoBancario(empresaId: number) {
  const tipos = [
    { codigo: "DEPOSITO", nombre: "Depósito", signo: 1, afectaSaldo: true, requiereConciliacion: true },
    { codigo: "EXTRACCION", nombre: "Extracción", signo: -1, afectaSaldo: true, requiereConciliacion: true },
    { codigo: "TRANSF_EMITIDA", nombre: "Transferencia Emitida", signo: -1, afectaSaldo: true, requiereConciliacion: true },
    { codigo: "TRANSF_RECIBIDA", nombre: "Transferencia Recibida", signo: 1, afectaSaldo: true, requiereConciliacion: true },
    { codigo: "CHQ_DEPOSITADO", nombre: "Cheque Depositado", signo: 1, afectaSaldo: true, requiereConciliacion: true },
    { codigo: "CHQ_RECHAZADO", nombre: "Cheque Rechazado", signo: -1, afectaSaldo: true, requiereConciliacion: true },
    { codigo: "DEBITO_AUTO", nombre: "Débito Automático", signo: -1, afectaSaldo: true, requiereConciliacion: true },
    { codigo: "COMISION_BANCARIA", nombre: "Comisión Bancaria", signo: -1, afectaSaldo: true, requiereConciliacion: false },
    { codigo: "INTERES_GANADO", nombre: "Interés Ganado", signo: 1, afectaSaldo: true, requiereConciliacion: true },
    { codigo: "INTERES_PAGADO", nombre: "Interés Pagado (Descubierto)", signo: -1, afectaSaldo: true, requiereConciliacion: true },
    { codigo: "IMP_DEB_CRED", nombre: "Impuesto Débitos/Créditos (Ley 25.413)", signo: -1, afectaSaldo: true, requiereConciliacion: false },
    { codigo: "RETENCION_BANCARIA", nombre: "Retención Bancaria", signo: -1, afectaSaldo: true, requiereConciliacion: false },
  ]
  for (const t of tipos) {
    await prisma.tipoMovimientoBancario.upsert({
      where: { empresaId_codigo: { empresaId, codigo: t.codigo } },
      update: t,
      create: { ...t, empresaId },
    })
  }
  console.log(`✓ ${tipos.length} tipos de movimiento bancario`)
}

async function seedConceptosCobroPago(empresaId: number) {
  const conceptos = [
    { codigo: "SALDO_FACTURA", nombre: "Saldo de Factura", tipo: "ambos", afectaCuentaCorriente: true, esAnticipo: false, requiereFactura: true },
    { codigo: "ANTICIPO", nombre: "Anticipo / Pago a Cuenta", tipo: "ambos", afectaCuentaCorriente: true, esAnticipo: true, requiereFactura: false },
    { codigo: "SENA", nombre: "Seña / Reserva", tipo: "cobro", afectaCuentaCorriente: true, esAnticipo: true, requiereFactura: false },
    { codigo: "RET_IVA", nombre: "Retención IVA Sufrida", tipo: "cobro", afectaCuentaCorriente: false, esAnticipo: false, requiereFactura: false, cuentaContableCodigo: "1.5.1" },
    { codigo: "RET_GAN", nombre: "Retención Ganancias Sufrida", tipo: "cobro", afectaCuentaCorriente: false, esAnticipo: false, requiereFactura: false, cuentaContableCodigo: "1.5.2" },
    { codigo: "RET_IIBB", nombre: "Retención IIBB Sufrida", tipo: "cobro", afectaCuentaCorriente: false, esAnticipo: false, requiereFactura: false, cuentaContableCodigo: "1.5.3" },
    { codigo: "RET_IVA_APLICADA", nombre: "Retención IVA Aplicada", tipo: "pago", afectaCuentaCorriente: false, esAnticipo: false, requiereFactura: false, cuentaContableCodigo: "2.4.1" },
    { codigo: "RET_GAN_APLICADA", nombre: "Retención Ganancias Aplicada", tipo: "pago", afectaCuentaCorriente: false, esAnticipo: false, requiereFactura: false, cuentaContableCodigo: "2.4.2" },
    { codigo: "RET_IIBB_APLICADA", nombre: "Retención IIBB Aplicada", tipo: "pago", afectaCuentaCorriente: false, esAnticipo: false, requiereFactura: false, cuentaContableCodigo: "2.4.3" },
    { codigo: "COMPENSACION", nombre: "Compensación de Saldos", tipo: "ambos", afectaCuentaCorriente: true, esAnticipo: false, requiereFactura: false },
    { codigo: "DIF_CAMBIO", nombre: "Diferencia de Cambio", tipo: "ambos", afectaCuentaCorriente: false, esAnticipo: false, requiereFactura: false },
    { codigo: "DSCTO_PP", nombre: "Descuento por Pronto Pago", tipo: "ambos", afectaCuentaCorriente: true, esAnticipo: false, requiereFactura: true },
    { codigo: "INTERES_MORA", nombre: "Interés por Mora", tipo: "cobro", afectaCuentaCorriente: true, esAnticipo: false, requiereFactura: false },
  ]
  for (const c of conceptos) {
    await prisma.conceptoCobroPago.upsert({
      where: { empresaId_codigo: { empresaId, codigo: c.codigo } },
      update: c,
      create: { ...c, empresaId },
    })
  }
  console.log(`✓ ${conceptos.length} conceptos de cobro/pago`)
}

async function seedEntidadesFinancieras(empresaId: number) {
  const entidades = [
    { codigo: "MP", nombre: "MercadoPago", tipo: "fintech", cuit: "30-71545266-4", comisionPct: 4.0 },
    { codigo: "UALA", nombre: "Ualá", tipo: "fintech", cuit: "30-71619623-8", comisionPct: 3.0 },
    { codigo: "NX", nombre: "Naranja X", tipo: "fintech", cuit: "30-70704389-9", comisionPct: 3.5 },
    { codigo: "MODO", nombre: "MODO", tipo: "billetera_virtual", comisionPct: 2.5 },
    { codigo: "RP", nombre: "Rapipago", tipo: "cobrador_externo", cuit: "30-68599844-9", comisionPct: 2.0 },
    { codigo: "PF", nombre: "Pago Fácil", tipo: "cobrador_externo", cuit: "30-59036076-3", comisionPct: 2.5 },
    { codigo: "VISA", nombre: "Visa Argentina", tipo: "procesador_tarjeta", cuit: "30-50003036-4", comisionPct: 3.0 },
    { codigo: "MASTERCARD", nombre: "Mastercard", tipo: "procesador_tarjeta", comisionPct: 3.0 },
    { codigo: "AMEX", nombre: "American Express", tipo: "procesador_tarjeta", comisionPct: 3.5 },
    { codigo: "CABAL", nombre: "Cabal", tipo: "procesador_tarjeta", comisionPct: 2.5 },
    { codigo: "PRISMA", nombre: "Prisma Medios de Pago", tipo: "procesador_tarjeta", cuit: "30-71652538-3", comisionPct: 0 },
  ]
  for (const e of entidades) {
    await prisma.entidadFinanciera.upsert({
      where: { empresaId_codigo: { empresaId, codigo: e.codigo } },
      update: e,
      create: { ...e, empresaId },
    })
  }
  console.log(`✓ ${entidades.length} entidades financieras (fintech/procesadores)`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 3: MAESTROS OPERACIONALES
// ═══════════════════════════════════════════════════════════════════════════════

async function seedSucursales(empresaId: number) {
  const sucursales = [
    { codigo: "CASA_CENTRAL", nombre: "Casa Central", esMatriz: true },
  ]
  for (const s of sucursales) {
    await prisma.sucursal.upsert({
      where: { empresaId_codigo: { empresaId, codigo: s.codigo } },
      update: s,
      create: { ...s, empresaId },
    })
  }
  console.log(`✓ ${sucursales.length} sucursales`)
}

async function seedTiposOperacionComercial(empresaId: number) {
  const tipos = [
    { codigo: "VENTA_MOSTRADOR", nombre: "Venta de Mostrador", tipo: "venta", afectaStock: true, afectaCuentaCorriente: false, requiereAprobacion: false },
    { codigo: "VENTA_MAYORISTA", nombre: "Venta Mayorista", tipo: "venta", afectaStock: true, afectaCuentaCorriente: true, requiereAprobacion: false },
    { codigo: "VENTA_CC", nombre: "Venta en Cuenta Corriente", tipo: "venta", afectaStock: true, afectaCuentaCorriente: true, requiereAprobacion: false },
    { codigo: "DEVOLUCION", nombre: "Devolución de Mercadería", tipo: "devolucion", afectaStock: true, afectaCuentaCorriente: true, requiereAprobacion: false },
    { codigo: "BONIFICACION", nombre: "Bonificación / Muestra", tipo: "bonificacion", afectaStock: true, afectaCuentaCorriente: false, requiereAprobacion: true },
    { codigo: "CONSIGNACION", nombre: "Entrega en Consignación", tipo: "consignacion", afectaStock: true, afectaCuentaCorriente: false, requiereAprobacion: true },
    { codigo: "MUESTRA_SC", nombre: "Muestra Sin Cargo", tipo: "muestra", afectaStock: true, afectaCuentaCorriente: false, requiereAprobacion: true },
    { codigo: "COMPRA_CONTADO", nombre: "Compra Contado", tipo: "compra", afectaStock: true, afectaCuentaCorriente: false, requiereAprobacion: false },
    { codigo: "COMPRA_CC", nombre: "Compra en Cuenta Corriente", tipo: "compra", afectaStock: true, afectaCuentaCorriente: true, requiereAprobacion: false },
  ]
  for (const t of tipos) {
    await prisma.tipoOperacionComercial.upsert({
      where: { empresaId_codigo: { empresaId, codigo: t.codigo } },
      update: t,
      create: { ...t, empresaId },
    })
  }
  console.log(`✓ ${tipos.length} tipos de operación comercial`)
}

async function seedCajasTipo(empresaId: number) {
  const cajas = [
    { codigo: "PRINCIPAL", nombre: "Caja Principal", tipo: "principal", montoMaximo: 0, requiereArqueo: true },
    { codigo: "CHICA", nombre: "Caja Chica", tipo: "chica", montoMaximo: 500000, requiereArqueo: true },
    { codigo: "FONDO_FIJO", nombre: "Fondo Fijo", tipo: "fondo_fijo", montoMaximo: 200000, requiereArqueo: false },
  ]
  for (const c of cajas) {
    await prisma.cajaTipo.upsert({
      where: { empresaId_codigo: { empresaId, codigo: c.codigo } },
      update: c,
      create: { ...c, empresaId },
    })
  }
  console.log(`✓ ${cajas.length} tipos de caja`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN DE CUENTAS PROFESIONAL PyME RI ARGENTINA
// ═══════════════════════════════════════════════════════════════════════════════

async function seedPlanCuentasPyME(empresaId: number) {
  const cuentas = [
    // ── ACTIVO (1) ──────────────────────────────────────────────────────
    { codigo: "1", nombre: "ACTIVO", tipo: "activo", categoria: "Activo", nivel: 1, imputable: false, naturaleza: "deudora" },
    // Disponibilidades
    { codigo: "1.1", nombre: "DISPONIBILIDADES", tipo: "activo", categoria: "Disponibilidades", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "1.1.1", nombre: "Caja Moneda Nacional", tipo: "activo", categoria: "Disponibilidades", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.1.2", nombre: "Caja Moneda Extranjera", tipo: "activo", categoria: "Disponibilidades", nivel: 3, imputable: true, naturaleza: "deudora", ajustaInflacion: false, monedaFuncional: "USD" },
    { codigo: "1.1.3", nombre: "Banco Cuenta Corriente", tipo: "activo", categoria: "Disponibilidades", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.1.4", nombre: "Banco Caja de Ahorro", tipo: "activo", categoria: "Disponibilidades", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.1.5", nombre: "Valores a Depositar (Cheques en Cartera)", tipo: "activo", categoria: "Disponibilidades", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.1.6", nombre: "Fondos en Tránsito", tipo: "activo", categoria: "Disponibilidades", nivel: 3, imputable: true, naturaleza: "deudora" },
    // Inversiones
    { codigo: "1.2", nombre: "INVERSIONES TEMPORARIAS", tipo: "activo", categoria: "Inversiones", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "1.2.1", nombre: "Plazo Fijo", tipo: "activo", categoria: "Inversiones", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.2.2", nombre: "Títulos Públicos / FCI", tipo: "activo", categoria: "Inversiones", nivel: 3, imputable: true, naturaleza: "deudora" },
    // Créditos por Ventas
    { codigo: "1.3", nombre: "CRÉDITOS POR VENTAS", tipo: "activo", categoria: "Créditos por Ventas", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "1.3.1", nombre: "Deudores por Ventas", tipo: "activo", categoria: "Créditos por Ventas", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.3.2", nombre: "Deudores Morosos", tipo: "activo", categoria: "Créditos por Ventas", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.3.3", nombre: "Deudores en Gestión Judicial", tipo: "activo", categoria: "Créditos por Ventas", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.3.4", nombre: "Documentos a Cobrar", tipo: "activo", categoria: "Créditos por Ventas", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.3.5", nombre: "Previsión Deudores Incobrables", tipo: "activo", categoria: "Créditos por Ventas", nivel: 3, imputable: true, naturaleza: "acreedora" },
    // Otros Créditos
    { codigo: "1.4", nombre: "OTROS CRÉDITOS", tipo: "activo", categoria: "Otros Créditos", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "1.4.1", nombre: "Anticipos de Impuestos", tipo: "activo", categoria: "Otros Créditos", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.4.2", nombre: "Anticipos a Proveedores", tipo: "activo", categoria: "Otros Créditos", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.4.3", nombre: "Gastos Pagados por Adelantado", tipo: "activo", categoria: "Otros Créditos", nivel: 3, imputable: true, naturaleza: "deudora" },
    // Créditos Fiscales
    { codigo: "1.5", nombre: "CRÉDITOS FISCALES", tipo: "activo", categoria: "Créditos Fiscales", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "1.5.1", nombre: "IVA Crédito Fiscal", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true, naturaleza: "deudora", codigoAfip: "IVA_CF" },
    { codigo: "1.5.2", nombre: "Retenciones de IVA Sufridas", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.5.3", nombre: "Retenciones de Ganancias Sufridas", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.5.4", nombre: "Retenciones de IIBB Sufridas", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.5.5", nombre: "Percepciones de IVA Sufridas", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.5.6", nombre: "Percepciones de IIBB Sufridas", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.5.7", nombre: "IVA Saldo a Favor", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true, naturaleza: "deudora" },
    // Bienes de Cambio
    { codigo: "1.6", nombre: "BIENES DE CAMBIO", tipo: "activo", categoria: "Bienes de Cambio", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "1.6.1", nombre: "Mercaderías", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true, naturaleza: "deudora", ajustaInflacion: true },
    { codigo: "1.6.2", nombre: "Materias Primas", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true, naturaleza: "deudora", ajustaInflacion: true },
    { codigo: "1.6.3", nombre: "Productos en Proceso", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.6.4", nombre: "Productos Terminados", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.6.5", nombre: "Envases", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true, naturaleza: "deudora" },
    // Bienes de Uso
    { codigo: "1.7", nombre: "BIENES DE USO", tipo: "activo", categoria: "Bienes de Uso", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "1.7.1", nombre: "Inmuebles", tipo: "activo", categoria: "Bienes de Uso", nivel: 3, imputable: true, naturaleza: "deudora", ajustaInflacion: true },
    { codigo: "1.7.2", nombre: "Muebles y Útiles", tipo: "activo", categoria: "Bienes de Uso", nivel: 3, imputable: true, naturaleza: "deudora", ajustaInflacion: true },
    { codigo: "1.7.3", nombre: "Maquinarias y Equipos", tipo: "activo", categoria: "Bienes de Uso", nivel: 3, imputable: true, naturaleza: "deudora", ajustaInflacion: true },
    { codigo: "1.7.4", nombre: "Rodados", tipo: "activo", categoria: "Bienes de Uso", nivel: 3, imputable: true, naturaleza: "deudora", ajustaInflacion: true },
    { codigo: "1.7.5", nombre: "Equipos de Computación", tipo: "activo", categoria: "Bienes de Uso", nivel: 3, imputable: true, naturaleza: "deudora", ajustaInflacion: true },
    { codigo: "1.7.9", nombre: "Amortización Acumulada Bienes de Uso", tipo: "activo", categoria: "Bienes de Uso", nivel: 3, imputable: true, naturaleza: "acreedora" },
    // Activos Intangibles
    { codigo: "1.8", nombre: "ACTIVOS INTANGIBLES", tipo: "activo", categoria: "Intangibles", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "1.8.1", nombre: "Marcas y Patentes", tipo: "activo", categoria: "Intangibles", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.8.2", nombre: "Llave de Negocio", tipo: "activo", categoria: "Intangibles", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "1.8.9", nombre: "Amortización Acumulada Intangibles", tipo: "activo", categoria: "Intangibles", nivel: 3, imputable: true, naturaleza: "acreedora" },

    // ── PASIVO (2) ──────────────────────────────────────────────────────
    { codigo: "2", nombre: "PASIVO", tipo: "pasivo", categoria: "Pasivo", nivel: 1, imputable: false, naturaleza: "acreedora" },
    // Deudas Comerciales
    { codigo: "2.1", nombre: "DEUDAS COMERCIALES", tipo: "pasivo", categoria: "Deudas Comerciales", nivel: 2, imputable: false, naturaleza: "acreedora" },
    { codigo: "2.1.1", nombre: "Proveedores", tipo: "pasivo", categoria: "Deudas Comerciales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.1.2", nombre: "Documentos a Pagar", tipo: "pasivo", categoria: "Deudas Comerciales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.1.3", nombre: "Anticipos de Clientes", tipo: "pasivo", categoria: "Deudas Comerciales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    // Deudas Fiscales
    { codigo: "2.2", nombre: "DEUDAS FISCALES", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 2, imputable: false, naturaleza: "acreedora" },
    { codigo: "2.2.1", nombre: "IVA Débito Fiscal", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 3, imputable: true, naturaleza: "acreedora", codigoAfip: "IVA_DF" },
    { codigo: "2.2.2", nombre: "IVA a Pagar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.2.3", nombre: "IIBB a Pagar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.2.4", nombre: "Impuesto a las Ganancias a Pagar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.2.5", nombre: "Impuesto Débitos/Créditos a Pagar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    // Deudas Sociales
    { codigo: "2.3", nombre: "DEUDAS SOCIALES", tipo: "pasivo", categoria: "Deudas Sociales", nivel: 2, imputable: false, naturaleza: "acreedora" },
    { codigo: "2.3.1", nombre: "Sueldos a Pagar", tipo: "pasivo", categoria: "Deudas Sociales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.3.2", nombre: "Aportes y Contribuciones a Depositar", tipo: "pasivo", categoria: "Deudas Sociales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.3.3", nombre: "Sindicato a Pagar", tipo: "pasivo", categoria: "Deudas Sociales", nivel: 3, imputable: true, naturaleza: "acreedora" },
    // Retenciones a Depositar
    { codigo: "2.4", nombre: "RETENCIONES A DEPOSITAR", tipo: "pasivo", categoria: "Retenciones", nivel: 2, imputable: false, naturaleza: "acreedora" },
    { codigo: "2.4.1", nombre: "Retenciones IVA a Depositar", tipo: "pasivo", categoria: "Retenciones", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.4.2", nombre: "Retenciones Ganancias a Depositar", tipo: "pasivo", categoria: "Retenciones", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.4.3", nombre: "Retenciones IIBB a Depositar", tipo: "pasivo", categoria: "Retenciones", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.4.4", nombre: "Percepciones IVA a Depositar", tipo: "pasivo", categoria: "Retenciones", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.4.5", nombre: "Percepciones IIBB a Depositar", tipo: "pasivo", categoria: "Retenciones", nivel: 3, imputable: true, naturaleza: "acreedora" },
    // Deudas Bancarias
    { codigo: "2.5", nombre: "DEUDAS BANCARIAS Y FINANCIERAS", tipo: "pasivo", categoria: "Deudas Bancarias", nivel: 2, imputable: false, naturaleza: "acreedora" },
    { codigo: "2.5.1", nombre: "Préstamos Bancarios", tipo: "pasivo", categoria: "Deudas Bancarias", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.5.2", nombre: "Adelantos en Cuenta Corriente", tipo: "pasivo", categoria: "Deudas Bancarias", nivel: 3, imputable: true, naturaleza: "acreedora" },
    // Previsiones
    { codigo: "2.6", nombre: "PREVISIONES", tipo: "pasivo", categoria: "Previsiones", nivel: 2, imputable: false, naturaleza: "acreedora" },
    { codigo: "2.6.1", nombre: "Provisión Vacaciones a Pagar", tipo: "pasivo", categoria: "Previsiones", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.6.2", nombre: "Provisión SAC a Pagar", tipo: "pasivo", categoria: "Previsiones", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "2.6.3", nombre: "Provisión Contingencias Legales", tipo: "pasivo", categoria: "Previsiones", nivel: 3, imputable: true, naturaleza: "acreedora" },

    // ── PATRIMONIO NETO (3) ─────────────────────────────────────────────
    { codigo: "3", nombre: "PATRIMONIO NETO", tipo: "patrimonio", categoria: "Patrimonio", nivel: 1, imputable: false, naturaleza: "acreedora" },
    { codigo: "3.1", nombre: "Capital Social", tipo: "patrimonio", categoria: "Capital", nivel: 2, imputable: true, naturaleza: "acreedora", ajustaInflacion: true },
    { codigo: "3.2", nombre: "Ajuste de Capital", tipo: "patrimonio", categoria: "Capital", nivel: 2, imputable: true, naturaleza: "acreedora" },
    { codigo: "3.3", nombre: "Reserva Legal", tipo: "patrimonio", categoria: "Reservas", nivel: 2, imputable: true, naturaleza: "acreedora" },
    { codigo: "3.4", nombre: "Reserva Estatutaria", tipo: "patrimonio", categoria: "Reservas", nivel: 2, imputable: true, naturaleza: "acreedora" },
    { codigo: "3.5", nombre: "Resultados No Asignados", tipo: "patrimonio", categoria: "Resultados", nivel: 2, imputable: true, naturaleza: "acreedora" },
    { codigo: "3.6", nombre: "Resultado del Ejercicio", tipo: "patrimonio", categoria: "Resultados", nivel: 2, imputable: true, naturaleza: "acreedora" },

    // ── INGRESOS (4) ────────────────────────────────────────────────────
    { codigo: "4", nombre: "INGRESOS", tipo: "ingreso", categoria: "Ingresos", nivel: 1, imputable: false, naturaleza: "acreedora" },
    { codigo: "4.1", nombre: "INGRESOS POR VENTAS", tipo: "ingreso", categoria: "Ventas", nivel: 2, imputable: false, naturaleza: "acreedora" },
    { codigo: "4.1.1", nombre: "Ventas de Mercaderías", tipo: "ingreso", categoria: "Ventas", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "4.1.2", nombre: "Ventas de Servicios", tipo: "ingreso", categoria: "Ventas", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "4.1.3", nombre: "Ventas de Producción", tipo: "ingreso", categoria: "Ventas", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "4.1.9", nombre: "Devoluciones de Ventas", tipo: "ingreso", categoria: "Ventas", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "4.2", nombre: "OTROS INGRESOS", tipo: "ingreso", categoria: "Otros Ingresos", nivel: 2, imputable: false, naturaleza: "acreedora" },
    { codigo: "4.2.1", nombre: "Intereses Ganados", tipo: "ingreso", categoria: "Otros Ingresos", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "4.2.2", nombre: "Diferencia de Cambio (Ganancia)", tipo: "ingreso", categoria: "Otros Ingresos", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "4.2.3", nombre: "Resultado Venta Bienes de Uso", tipo: "ingreso", categoria: "Otros Ingresos", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "4.2.4", nombre: "Descuentos Obtenidos", tipo: "ingreso", categoria: "Otros Ingresos", nivel: 3, imputable: true, naturaleza: "acreedora" },
    { codigo: "4.2.5", nombre: "Recupero de Deudores Incobrables", tipo: "ingreso", categoria: "Otros Ingresos", nivel: 3, imputable: true, naturaleza: "acreedora" },

    // ── EGRESOS (5) ─────────────────────────────────────────────────────
    { codigo: "5", nombre: "EGRESOS", tipo: "egreso", categoria: "Egresos", nivel: 1, imputable: false, naturaleza: "deudora" },
    { codigo: "5.1", nombre: "COSTO DE MERCADERÍAS VENDIDAS", tipo: "egreso", categoria: "CMV", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "5.1.1", nombre: "CMV Mercaderías", tipo: "egreso", categoria: "CMV", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.1.2", nombre: "CMV Servicios", tipo: "egreso", categoria: "CMV", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.1.3", nombre: "CMV Producción", tipo: "egreso", categoria: "CMV", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.2", nombre: "GASTOS DE ADMINISTRACIÓN", tipo: "egreso", categoria: "Gastos Administración", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "5.2.1", nombre: "Sueldos y Jornales", tipo: "egreso", categoria: "Gastos Administración", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.2.2", nombre: "Cargas Sociales", tipo: "egreso", categoria: "Gastos Administración", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.2.3", nombre: "Honorarios Profesionales", tipo: "egreso", categoria: "Gastos Administración", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.2.4", nombre: "Alquileres Pagados", tipo: "egreso", categoria: "Gastos Administración", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.2.5", nombre: "Servicios (Luz, Gas, Teléfono, Internet)", tipo: "egreso", categoria: "Gastos Administración", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.2.6", nombre: "Seguros", tipo: "egreso", categoria: "Gastos Administración", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.2.7", nombre: "Impuestos, Tasas y Contribuciones", tipo: "egreso", categoria: "Gastos Administración", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.2.8", nombre: "Papelería y Útiles de Oficina", tipo: "egreso", categoria: "Gastos Administración", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.2.9", nombre: "Gastos Varios de Administración", tipo: "egreso", categoria: "Gastos Administración", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.3", nombre: "GASTOS DE COMERCIALIZACIÓN", tipo: "egreso", categoria: "Gastos Comercialización", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "5.3.1", nombre: "Comisiones sobre Ventas", tipo: "egreso", categoria: "Gastos Comercialización", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.3.2", nombre: "Publicidad y Propaganda", tipo: "egreso", categoria: "Gastos Comercialización", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.3.3", nombre: "Fletes y Acarreos", tipo: "egreso", categoria: "Gastos Comercialización", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.3.4", nombre: "Embalajes y Empaques", tipo: "egreso", categoria: "Gastos Comercialización", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.3.5", nombre: "Descuentos Otorgados", tipo: "egreso", categoria: "Gastos Comercialización", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.3.6", nombre: "Deudores Incobrables", tipo: "egreso", categoria: "Gastos Comercialización", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.4", nombre: "AMORTIZACIONES Y DEPRECIACIONES", tipo: "egreso", categoria: "Amortizaciones", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "5.4.1", nombre: "Amortización Bienes de Uso", tipo: "egreso", categoria: "Amortizaciones", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.4.2", nombre: "Amortización Intangibles", tipo: "egreso", categoria: "Amortizaciones", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.5", nombre: "RESULTADOS FINANCIEROS (Pérdida)", tipo: "egreso", categoria: "Resultados Financieros", nivel: 2, imputable: false, naturaleza: "deudora" },
    { codigo: "5.5.1", nombre: "Intereses Pagados", tipo: "egreso", categoria: "Resultados Financieros", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.5.2", nombre: "Diferencia de Cambio (Pérdida)", tipo: "egreso", categoria: "Resultados Financieros", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.5.3", nombre: "Comisiones Bancarias", tipo: "egreso", categoria: "Resultados Financieros", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.5.4", nombre: "Impuesto Débitos/Créditos Bancarios", tipo: "egreso", categoria: "Resultados Financieros", nivel: 3, imputable: true, naturaleza: "deudora" },
    { codigo: "5.6", nombre: "IMPUESTO A LAS GANANCIAS", tipo: "egreso", categoria: "Impuesto Ganancias", nivel: 2, imputable: true, naturaleza: "deudora" },
  ]
  for (const c of cuentas) {
    await prisma.cuentaContable.upsert({
      where: { empresaId_codigo: { empresaId, codigo: c.codigo } },
      update: { nombre: c.nombre, tipo: c.tipo, categoria: c.categoria, nivel: c.nivel, imputable: c.imputable, naturaleza: c.naturaleza },
      create: { ...c, empresaId },
    })
  }
  console.log(`✓ ${cuentas.length} cuentas contables (Plan PyME RI Argentina profesional)`)
}

// ═══ SEED: CLASIFICACIONES FISCALES ═══════════════════════════════════════════
// Vinculan Producto → IVA diferenciado, exenciones, código NCM.

async function seedClasificacionesFiscales() {
  const clasificaciones = [
    { codigo: "GRAV_21", nombre: "Gravado 21%", alicuotaIva: 21, exentoIva: false, noGravado: false },
    { codigo: "GRAV_10_5", nombre: "Gravado 10.5%", alicuotaIva: 10.5, exentoIva: false, noGravado: false },
    { codigo: "GRAV_27", nombre: "Gravado 27%", alicuotaIva: 27, exentoIva: false, noGravado: false },
    { codigo: "GRAV_5", nombre: "Gravado 5%", alicuotaIva: 5, exentoIva: false, noGravado: false },
    { codigo: "GRAV_2_5", nombre: "Gravado 2.5%", alicuotaIva: 2.5, exentoIva: false, noGravado: false },
    { codigo: "EXENTO", nombre: "Exento de IVA", alicuotaIva: 0, exentoIva: true, noGravado: false },
    { codigo: "NO_GRAVADO", nombre: "No Gravado", alicuotaIva: 0, exentoIva: false, noGravado: true },
  ]
  for (const c of clasificaciones) {
    await prisma.clasificacionFiscal.upsert({
      where: { codigo: c.codigo },
      update: { nombre: c.nombre, alicuotaIva: c.alicuotaIva, exentoIva: c.exentoIva, noGravado: c.noGravado },
      create: c,
    })
  }
  console.log(`✓ ${clasificaciones.length} clasificaciones fiscales`)
}

// ═══ SEED: REGÍMENES DE PERCEPCIÓN ═══════════════════════════════════════════
// Maestero de regímenes de percepción (IVA RG 2408, IIBB ARBA/AGIP/DGR/etc.)

async function seedRegimenesPercepcion(empresaId: number) {
  const regimenes = [
    // Percepciones IVA nacionales
    { codigo: "PERC_IVA_2408_RI", nombre: "Percepción IVA RG 2408 — Inscriptos", tipo: "percepcion_iva", impuesto: "IVA", organismo: "AFIP", alicuotaInscripto: 3.0, alicuotaNoInscripto: 0, minimoNoSujeto: 0, normaLegal: "RG 2408/2008", baseCalculo: "neto" },
    { codigo: "PERC_IVA_2408_NRI", nombre: "Percepción IVA RG 2408 — No Inscriptos", tipo: "percepcion_iva", impuesto: "IVA", organismo: "AFIP", alicuotaInscripto: 0, alicuotaNoInscripto: 10.5, minimoNoSujeto: 0, normaLegal: "RG 2408/2008", baseCalculo: "neto" },
    // Percepciones IIBB por jurisdicción
    { codigo: "PERC_IIBB_PBA", nombre: "Percepción IIBB Buenos Aires (ARBA)", tipo: "percepcion_iibb", impuesto: "IIBB", organismo: "ARBA", jurisdiccion: "PBA", alicuotaInscripto: 3.0, alicuotaNoInscripto: 5.0, minimoNoSujeto: 0, normaLegal: "DN B 1/2004", baseCalculo: "neto" },
    { codigo: "PERC_IIBB_CABA", nombre: "Percepción IIBB CABA (AGIP)", tipo: "percepcion_iibb", impuesto: "IIBB", organismo: "AGIP", jurisdiccion: "CABA", alicuotaInscripto: 2.0, alicuotaNoInscripto: 3.5, minimoNoSujeto: 0, normaLegal: "RG AGIP 939", baseCalculo: "neto" },
    { codigo: "PERC_IIBB_SF", nombre: "Percepción IIBB Santa Fe", tipo: "percepcion_iibb", impuesto: "IIBB", organismo: "DGR_SF", jurisdiccion: "SF", alicuotaInscripto: 2.5, alicuotaNoInscripto: 4.0, minimoNoSujeto: 0, normaLegal: "RG API 15/2002", baseCalculo: "neto" },
    { codigo: "PERC_IIBB_CBA", nombre: "Percepción IIBB Córdoba", tipo: "percepcion_iibb", impuesto: "IIBB", organismo: "DGR_CBA", jurisdiccion: "CBA", alicuotaInscripto: 3.0, alicuotaNoInscripto: 5.0, minimoNoSujeto: 0, normaLegal: "RN 1/2018", baseCalculo: "neto" },
    { codigo: "PERC_IIBB_MZA", nombre: "Percepción IIBB Mendoza", tipo: "percepcion_iibb", impuesto: "IIBB", organismo: "ATM", jurisdiccion: "MZA", alicuotaInscripto: 3.0, alicuotaNoInscripto: 5.0, minimoNoSujeto: 0, normaLegal: "RG ATM 51/2004", baseCalculo: "neto" },
    { codigo: "PERC_IIBB_TUC", nombre: "Percepción IIBB Tucumán", tipo: "percepcion_iibb", impuesto: "IIBB", organismo: "DGR_TUC", jurisdiccion: "TUC", alicuotaInscripto: 2.5, alicuotaNoInscripto: 4.0, minimoNoSujeto: 0, normaLegal: "RG DGR 87/2000", baseCalculo: "neto" },
    { codigo: "PERC_IIBB_ER", nombre: "Percepción IIBB Entre Ríos", tipo: "percepcion_iibb", impuesto: "IIBB", organismo: "DGR_ER", jurisdiccion: "ER", alicuotaInscripto: 2.5, alicuotaNoInscripto: 4.5, minimoNoSujeto: 0, normaLegal: "RG ATER 109/2020", baseCalculo: "neto" },
  ]
  for (const r of regimenes) {
    await prisma.regimenPercepcion.upsert({
      where: { empresaId_codigo: { empresaId, codigo: r.codigo } },
      update: { nombre: r.nombre, alicuotaInscripto: r.alicuotaInscripto, alicuotaNoInscripto: r.alicuotaNoInscripto },
      create: { ...r, empresaId, vigenciaDesde: new Date("2024-01-01") },
    })
  }
  console.log(`✓ ${regimenes.length} regímenes de percepción`)
}

// ═══ SEED: CONFIG FISCAL EMPRESA ═════════════════════════════════════════════

async function seedConfigFiscalEmpresa(empresaId: number) {
  await prisma.configFiscalEmpresa.upsert({
    where: { empresaId },
    update: {},
    create: {
      empresaId,
      esAgentePercepcionIVA: false,
      esAgenteRetencionIVA: false,
      esAgentePercepcionIIBB: false,
      esAgenteRetencionIIBB: false,
      esAgenteRetencionGanancias: false,
      jurisdiccionesIIBB: ["PBA"],
    },
  })
  console.log("✓ ConfigFiscalEmpresa default")
}

// ─── FERIADOS NACIONALES ARGENTINA 2026 ──────────────────────────────────────────

async function seedFeriados() {
  const feriados = [
    { fecha: "2026-01-01", descripcion: "Año Nuevo", tipo: "nacional" },
    { fecha: "2026-02-16", descripcion: "Carnaval", tipo: "nacional" },
    { fecha: "2026-02-17", descripcion: "Carnaval", tipo: "nacional" },
    { fecha: "2026-03-24", descripcion: "Día Nacional de la Memoria por la Verdad y la Justicia", tipo: "nacional" },
    { fecha: "2026-04-02", descripcion: "Día del Veterano y de los Caídos en la Guerra de Malvinas", tipo: "nacional" },
    { fecha: "2026-04-03", descripcion: "Viernes Santo", tipo: "nacional" },
    { fecha: "2026-05-01", descripcion: "Día del Trabajador", tipo: "nacional" },
    { fecha: "2026-05-25", descripcion: "Día de la Revolución de Mayo", tipo: "nacional" },
    { fecha: "2026-06-15", descripcion: "Paso a la Inmortalidad del Gral. Martín Miguel de Güemes", tipo: "nacional" },
    { fecha: "2026-06-20", descripcion: "Paso a la Inmortalidad del Gral. Manuel Belgrano", tipo: "nacional" },
    { fecha: "2026-07-09", descripcion: "Día de la Independencia", tipo: "nacional" },
    { fecha: "2026-08-17", descripcion: "Paso a la Inmortalidad del Gral. José de San Martín", tipo: "nacional" },
    { fecha: "2026-10-12", descripcion: "Día del Respeto a la Diversidad Cultural", tipo: "nacional" },
    { fecha: "2026-11-20", descripcion: "Día de la Soberanía Nacional", tipo: "nacional" },
    { fecha: "2026-12-08", descripcion: "Inmaculada Concepción de María", tipo: "nacional" },
    { fecha: "2026-12-25", descripcion: "Navidad", tipo: "nacional" },
  ]
  for (const f of feriados) {
    await prisma.feriado.upsert({
      where: { fecha_provinciaId: { fecha: new Date(f.fecha), provinciaId: null as any } },
      update: { descripcion: f.descripcion, tipo: f.tipo },
      create: { fecha: new Date(f.fecha), descripcion: f.descripcion, tipo: f.tipo },
    })
  }
  console.log(`✓ ${feriados.length} feriados nacionales 2026`)
}

// ─── MAIN ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════")
  console.log(" SEED: Cargando catálogos paramétricos...")
  console.log("═══════════════════════════════════════════\n")

  await seedPaises()
  await seedProvincias()
  await seedMonedas()
  await seedBancos()
  await seedCondicionesIva()
  await seedTiposDocumento()
  await seedUnidadesMedida()
  await seedCondicionesPago()
  await seedIncoterms()
  await seedFormasPago()
  await seedMotivos()
  await seedActividadesEconomicas()
  await seedNacionalidades()
  await seedIdiomas()
  await seedZonasGeograficas()
  await seedTiposCliente()
  await seedEstadosCliente()
  await seedRubros()
  await seedCanalesVenta()
  await seedSegmentosCliente()
  await seedTiposEmpresa()
  await seedEstadosCiviles()
  await seedProfesiones()
  await seedTiposDireccion()
  await seedTiposContacto()
  await seedTaxConceptos()
  await seedClasificacionesFiscales()
  await seedFeriados()
  await seedConfiguracionFuncional()

  // Empresa demo primero (devuelve empresaId para maestros empresa-scoped)
  const empresaId = await seedEmpresaYAdmin()

  // ═══ MAESTROS CONTABLES PROFESIONALES ═══
  await seedRubrosContables(empresaId)
  await seedTiposAsiento(empresaId)
  await seedPlantillasAsiento(empresaId)
  await seedTiposComprobante(empresaId)
  await seedPlanCuentasPyME(empresaId)

  // ═══ MAESTROS FINANCIEROS ═══
  await seedTiposRetencion(empresaId)
  await seedRegimenesRetencion(empresaId)
  await seedTiposMovimientoBancario(empresaId)
  await seedConceptosCobroPago(empresaId)
  await seedEntidadesFinancieras(empresaId)

  // ═══ MAESTROS OPERACIONALES ═══
  await seedSucursales(empresaId)
  await seedTiposOperacionComercial(empresaId)
  await seedCajasTipo(empresaId)

  // ═══ MAESTROS IMPOSITIVOS ═══
  await seedRegimenesPercepcion(empresaId)
  await seedConfigFiscalEmpresa(empresaId)

  console.log("\n═══════════════════════════════════════════")
  console.log(" SEED COMPLETO ✓")
  console.log("═══════════════════════════════════════════")
}

main()
  .catch((e) => {
    console.error("Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

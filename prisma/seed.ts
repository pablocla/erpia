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
    // IVA
    { pais: "AR", codigo: "IVA_21", nombre: "IVA 21%", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "5", alicuota: 21 },
    { pais: "AR", codigo: "IVA_10_5", nombre: "IVA 10.5%", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "4", alicuota: 10.5 },
    { pais: "AR", codigo: "IVA_27", nombre: "IVA 27%", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "6", alicuota: 27 },
    { pais: "AR", codigo: "IVA_0", nombre: "IVA 0% (Exento)", tipo: "iva", organismo: "AFIP", jurisdiccion: "federal", codigoAfip: "3", alicuota: 0 },
    // IIBB principales
    { pais: "AR", codigo: "IIBB_PBA_COMERCIO", nombre: "IIBB Buenos Aires - Comercio", tipo: "iibb", organismo: "ARBA", jurisdiccion: "PBA", alicuota: 3.5 },
    { pais: "AR", codigo: "IIBB_CABA_COMERCIO", nombre: "IIBB CABA - Comercio", tipo: "iibb", organismo: "AGIP", jurisdiccion: "CABA", alicuota: 3.0 },
    { pais: "AR", codigo: "IIBB_SF_COMERCIO", nombre: "IIBB Santa Fe - Comercio", tipo: "iibb", organismo: "DGR_SF", jurisdiccion: "SF", alicuota: 3.6 },
    { pais: "AR", codigo: "IIBB_CBA_COMERCIO", nombre: "IIBB Córdoba - Comercio", tipo: "iibb", organismo: "DGR_CBA", jurisdiccion: "CBA", alicuota: 4.0 },
    { pais: "AR", codigo: "IIBB_MZA_COMERCIO", nombre: "IIBB Mendoza - Comercio", tipo: "iibb", organismo: "ATM", jurisdiccion: "MZA", alicuota: 3.0 },
    // Percepciones
    { pais: "AR", codigo: "PERC_IVA_RI", nombre: "Percepción IVA (RI)", tipo: "percepcion_iva", organismo: "AFIP", jurisdiccion: "federal", esPercepcion: true, alicuota: 3.0 },
    { pais: "AR", codigo: "PERC_IIBB_PBA", nombre: "Percepción IIBB Buenos Aires", tipo: "percepcion_iibb", organismo: "ARBA", jurisdiccion: "PBA", esPercepcion: true, alicuota: 3.0 },
    { pais: "AR", codigo: "PERC_IIBB_CABA", nombre: "Percepción IIBB CABA", tipo: "percepcion_iibb", organismo: "AGIP", jurisdiccion: "CABA", esPercepcion: true, alicuota: 2.0 },
    // Retenciones SICORE
    { pais: "AR", codigo: "RET_IVA_SICORE", nombre: "Retención IVA SICORE", tipo: "retencion_iva", organismo: "AFIP", jurisdiccion: "federal", esRetencion: true, codigoSicore: "767", alicuota: 10.5 },
    { pais: "AR", codigo: "RET_GAN_SICORE", nombre: "Retención Ganancias SICORE", tipo: "retencion_ganancias", organismo: "AFIP", jurisdiccion: "federal", esRetencion: true, codigoSicore: "217", alicuota: 2.0 },
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
  await seedConfiguracionFuncional()
  await seedEmpresaYAdmin()

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

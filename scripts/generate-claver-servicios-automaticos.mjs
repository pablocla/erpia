import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  TableOfContents,
  PageBreak,
} from "docx"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, "..", "docs", "CLAVER_KNOWLEDGE_HOUSE_SERVICIOS_AUTOMATICOS.docx")

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
const borders = { top: border, bottom: border, left: border, right: border }
const TABLE_W = 9360

function h1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] })
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] })
}
function h3(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] })
}
function p(t, o = {}) {
  return new Paragraph({ children: [new TextRun({ text: t, ...o })] })
}
function bullet(t) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun(t)] })
}
function spacer() {
  return new Paragraph({ children: [] })
}

function table(headers, rows, colWidths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: "0F172A", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF" }) ] })],
      })
    ),
  })
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell, i) =>
            new TableCell({
              borders,
              width: { size: colWidths[i], type: WidthType.DXA },
              shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun(String(cell))] })],
            })
        ),
      })
  )
  return new Table({ width: { size: TABLE_W, type: WidthType.DXA }, columnWidths: colWidths, rows: [headerRow, ...dataRows] })
}

/** @type {{ id: number, name: string, category: string, auto: string, segment: string, ads: string, stack: string, price: string, claver: string }[]} */
const SERVICES = [
  {
    id: 1,
    name: "VPN corporativa zero-touch",
    category: "Seguridad & Red",
    auto: "Alta de usuario → generación de perfil WireGuard/OpenVPN → QR de instalación → rotación de claves programada.",
    segment: "PyMEs con vendedores en ruta, estudios contables remotos, sucursales sin IT.",
    ads: "Meta/Google: «VPN para tu equipo sin técnico», lookalike dueños PyME 25-55, intereses logística y contabilidad.",
    stack: "Headscale/Tailscale self-hosted o WireGuard + panel Claver Cloud.",
    price: "ARS 2.900–4.900/usuario/mes",
    claver: "Add-on Claver Cloud; integra con app vendedor y acceso ERP remoto seguro.",
  },
  {
    id: 2,
    name: "DNS filtering empresarial",
    category: "Seguridad & Red",
    auto: "Activación por dominio CUIT; políticas predefinidas (malware, phishing, redes sociales en horario laboral).",
    segment: "Comercios, call centers chicos, colegios privados, clínicas.",
    ads: "YouTube pre-roll + Search: «bloquear páginas en la empresa», segmento administradores Windows.",
    stack: "NextDNS API, Cloudflare Gateway o Pi-hole gestionado multi-tenant.",
    price: "ARS 1.990/empresa/mes hasta 25 dispositivos",
    claver: "Bundle seguridad con VPN; reporte en dashboard Claver ops.",
  },
  {
    id: 3,
    name: "Certificados SSL/TLS automáticos",
    category: "Seguridad & Red",
    auto: "Let's Encrypt vía Caddy/Traefik al crear subdominio tenant o tienda.",
    segment: "Ecommerce, portales B2B, landing por rubro.",
    ads: "Google Search: «certificado SSL tienda online Argentina»; remarketing visitantes /claver/claverp/ecommerce.",
    stack: "Traefik + ACME en Claver Cloud edge.",
    price: "Incluido en plan Pro+ o ARS 990/dominio/mes gestionado",
    claver: "Nativo al provisionar /tienda y /portal por empresa.",
  },
  {
    id: 4,
    name: "2FA / MFA como servicio",
    category: "Seguridad & Red",
    auto: "Enrollment TOTP/WebAuthn al primer login; política obligatoria por rol (contador, admin).",
    segment: "Empresas con datos fiscales, salud, legal.",
    ads: "LinkedIn: contadores y gerentes administrativos; mensaje cumplimiento y AFIP.",
    stack: "TOTP nativo + passkeys; SMS backup vía Twilio.",
    price: "ARS 790/usuario/mes o incluido Enterprise",
    claver: "Módulo auth ERP; upsell post onboarding.",
  },
  {
    id: 5,
    name: "Backup cloud cifrado (endpoint + DB)",
    category: "Seguridad & Red",
    auto: "Job nocturno por tenant: snapshot DB + archivos adjuntos ERP → S3 compatible con retención 30/90 días.",
    segment: "Todo cliente Clavis; especialmente industria y distribución.",
    ads: "Email automation día 7 trial: «¿Tenés backup de tu facturación?»",
    stack: "Supabase backup + R2/B2; restore self-service en Claver Cloud.",
    price: "ARS 4.900/mes (50 GB) escalable",
    claver: "SKU en provisioning CCA-030 automático.",
  },
  {
    id: 6,
    name: "EDR / antivirus gestionado ligero",
    category: "Seguridad & Red",
    auto: "Agente silencioso + políticas por grupo; alertas a ClavAI.",
    segment: "Oficinas con 5–30 PCs, estudios profesionales.",
    ads: "Meta: dueños preocupados por ransomware; creativos «tu contador perdió facturas».",
    stack: "Wazuh/OSQuery o integración Bitdefender MSP API.",
    price: "ARS 1.490/dispositivo/mes",
    claver: "Marketplace Claver Apps; no toca core ERP.",
  },
  {
    id: 7,
    name: "Gestor de contraseñas empresarial",
    category: "Seguridad & Red",
    auto: "Vault por empresa, SSO opcional, onboarding invitación masiva por CSV.",
    segment: "Equipos que comparten logins de ML, bancos, AFIP.",
    ads: "Instagram Stories B2B: «dejá de pasar la clave de AFIP por WhatsApp».",
    stack: "Bitwarden Organizations API white-label.",
    price: "ARS 990/usuario/mes",
    claver: "Complemento Clav Consult implementación.",
  },
  {
    id: 8,
    name: "Túnel seguro POS ↔ depósito",
    category: "Seguridad & Red",
    auto: "Site-to-site VPN preconfigurada entre sucursales y HQ al marcar multi-sucursal.",
    segment: "Cadenas retail, farmacias, ferreterías multi-PV.",
    ads: "Google: «conectar sucursales stock en tiempo real».",
    stack: "WireGuard mesh por empresaId.",
    price: "ARS 9.900/sucursal/mes",
    claver: "Upsell Enterprise; sincroniza stock Clavis.",
  },
  {
    id: 9,
    name: "Monitoreo uptime + status page",
    category: "Infraestructura",
    auto: "Checks HTTP/TCP cada 60s; página pública de estado por subdominio.",
    segment: "Ecommerce, SaaS partners, portales B2B.",
    ads: "Retargeting usuarios tienda demo caída simulada en trial.",
    stack: "Uptime Kuma / Better Stack API.",
    price: "ARS 2.490/mes (10 endpoints)",
    claver: "Incluido en Claver Cloud ops; visible para analistas.",
  },
  {
    id: 10,
    name: "Email corporativo (Google/Microsoft reseller)",
    category: "Infraestructura",
    auto: "Alta dominio → MX automático → buzón por usuario desde panel.",
    segment: "PyMEs nuevas sin @gmail en facturas.",
    ads: "Search: «email empresa tuempresa.com.ar»; lookalike registraciones SAAS.",
    stack: "Google Workspace / M365 CSP + Cloudflare DNS.",
    price: "ARS 3.500/buzón/mes (margen reseller)",
    claver: "Paso 1 del pack ONBOARD; mejora deliverability facturas Resend.",
  },
  {
    id: 11,
    name: "Dominio + DNS gestionado",
    category: "Infraestructura",
    auto: "Registro .com.ar vía API NIC o reseller; templates DNS para ERP, tienda, mail.",
    segment: "Emprendedores digitales, rubros belleza y gastronomía.",
    ads: "TikTok/IG: «tu negocio con dominio pro en 10 minutos».",
    stack: "Cloudflare Registrar API + Terraform.",
    price: "ARS 8.900/año dominio + DNS",
    claver: "Checkout en /claver/apps marketplace.",
  },
  {
    id: 12,
    name: "Hosting web estático / landing por rubro",
    category: "Infraestructura",
    auto: "Generación de landing desde onboarding IA + deploy a CDN.",
    segment: "14 rubros Clavis sin sitio web.",
    ads: "Dynamic ads por rubro (peluquería, restaurant, ferretería) con creativos IA.",
    stack: "Vercel/Cloudflare Pages; contenido desde rubro-config.",
    price: "ARS 4.900/mes",
    claver: "Extensión onboarding IA; CTA a trial Clavis.",
  },
  {
    id: 13,
    name: "CDN y aceleración de tienda",
    category: "Infraestructura",
    auto: "Toggle en panel ecommerce → edge cache imágenes catálogo.",
    segment: "Tiendas con catálogo fotográfico pesado.",
    ads: "Remarketing carritos abandonados + mensaje velocidad.",
    stack: "Cloudflare CDN delante de /tienda.",
    price: "ARS 3.900/mes",
    claver: "Add-on módulo Ecommerce.",
  },
  {
    id: 14,
    name: "Object storage archivos ERP",
    category: "Infraestructura",
    auto: "Bucket por empresaId; límites por plan; URLs firmadas.",
    segment: "Industria, agro (PDF contratos, fotos calidad, remitos).",
    ads: "LinkedIn industria alimenticia; lead magnet «almacenamiento seguro documentos».",
    stack: "S3/R2 con policy por tenant.",
    price: "ARS 1.900/10 GB/mes",
    claver: "Nativo adjuntos facturas, POD, historia clínica.",
  },
  {
    id: 15,
    name: "Escritorio remoto soporte (RustDesk white-label)",
    category: "Infraestructura",
    auto: "Cliente descarga binario branded; sesión bajo ticket soporte.",
    segment: "Clientes Clav Consult sin IT interno.",
    ads: "No paid — incluido en soporte; upsell soporte premium.",
    stack: "RustDesk OSS relay en Claver Cloud.",
    price: "Incluido Pro+ / ARS 19.900/mes soporte ilimitado",
    claver: "Torre implementaciones CCA.",
  },
  {
    id: 16,
    name: "MDM móviles (vendedores y operarios)",
    category: "Infraestructura",
    auto: "Enrollment QR; política app allowlist (app ruta, picking).",
    segment: "Distribuidoras, logística, agro campo.",
    ads: "Meta: «controlá el celular del vendedor sin ser pesado».",
    stack: "Fleet/Headwind MDM o Miradore API.",
    price: "ARS 1.290/dispositivo/mes",
    claver: "Bundle ClavLog + app vendedor.",
  },
  {
    id: 17,
    name: "WhatsApp Business API onboarding",
    category: "Comunicaciones",
    auto: "Embedded signup Meta → número verificado → plantillas aprobadas pre-rubro.",
    segment: "Ecommerce, restaurantes, salones, clínicas.",
    ads: "Click-to-WhatsApp ads con CTA «confirmación pedido automática».",
    stack: "Twilio/Meta Cloud API + webhooks ERP.",
    price: "ARS 7.900/mes + consumo",
    claver: "Add-on existente; flujos n8n prearmados.",
  },
  {
    id: 18,
    name: "SMS transaccional",
    category: "Comunicaciones",
    auto: "API key por tenant; plantillas OTP, envío despachado, turno recordatorio.",
    segment: "Gimnasios, salud, logística última milla.",
    ads: "Google: «SMS turnos automáticos»; geo Buenos Aires CABA GBA.",
    stack: "Twilio / SMSMasivos API.",
    price: "ARS 0,80–1,50/SMS + fee plataforma",
    claver: "Triggers desde agenda y logística.",
  },
  {
    id: 19,
    name: "Email transaccional dedicado",
    category: "Comunicaciones",
    auto: "Subdominio mail.empresa.com + DKIM/SPF/DMARC automático.",
    segment: "Alto volumen facturas PDF, estados de cuenta B2B.",
    ads: "Remarketing usuarios que rebotan mail en trial.",
    stack: "Resend dominios dedicados.",
    price: "ARS 2.900/mes (10k mails)",
    claver: "Post venta factura AFIP.",
  },
  {
    id: 20,
    name: "Números virtuales e IVR simple",
    category: "Comunicaciones",
    auto: "Número local → menú 1 ventas 2 soporte → cola o webhook.",
    segment: "Comercios con alto volumen llamadas, estaciones servicio.",
    ads: "Search: «número 0800 PyME Argentina» (si aplica 011 local).",
    stack: "Twilio Voice + TTS español AR.",
    price: "ARS 5.900/mes + minutos",
    claver: "Integración CRM pipeline.",
  },
  {
    id: 21,
    name: "Chat widget embebido (web + portal)",
    category: "Comunicaciones",
    auto: "Script copy-paste; bot ClavAI primera línea; handoff humano.",
    segment: "Tienda B2C, portal mayoristas.",
    ads: "Display en sitios competencia ERP (si permitido); mensaje «chat con stock real».",
    stack: "Widget propio + ClavAI realtime.",
    price: "ARS 3.490/mes",
    claver: "Nativo /tienda y /portal.",
  },
  {
    id: 22,
    name: "Videoconferencia branded",
    category: "Comunicaciones",
    auto: "Sala permanente por empresa; link en agenda turnos.",
    segment: "Salud teleconsulta, consultoría, capacitación Clav Consult.",
    ads: "LinkedIn salud privada; «turno online con link fijo».",
    stack: "Jitsi self-hosted o Daily.co API.",
    price: "ARS 4.900/mes ilimitado interno",
    claver: "Módulo agenda + historia clínica.",
  },
  {
    id: 23,
    name: "Firma electrónica de documentos",
    category: "Fiscal & Legal",
    auto: "Plantilla contrato → firma pad → PDF sellado timestamp.",
    segment: "RRHH, alquileres equipos, contratos B2B distribución.",
    ads: "Meta pymes: «firmá contratos sin imprimir».",
    stack: "DocuSeal self-hosted / Signaturit API.",
    price: "ARS 990/firma o ARS 6.900/mes 50 firmas",
    claver: "Clav Consult + módulo compras/RRHH.",
  },
  {
    id: 24,
    name: "Certificado digital AFIP (gestión)",
    category: "Fiscal & Legal",
    auto: "Wizard CUIT → CSR → guía AC → instalación en ERP.",
    segment: "Nuevos monotributistas y SA que migran a Clavis.",
    ads: "Search: «certificado digital AFIP factura electrónica»; máxima intención.",
    stack: "Flujo documentado + storage cifrado cert/key.",
    price: "ARS 14.900 one-shot o incluido implementación",
    claver: "Core onboarding CCA-040.",
  },
  {
    id: 25,
    name: "OCR facturas de compra",
    category: "Fiscal & Legal",
    auto: "Foto/PDF → extracción CUIT, ítems, IVA → borrador factura proveedor.",
    segment: "Retail, gastronomía con muchas compras chicas.",
    ads: "YouTube: «dejá de cargar facturas a mano»; rubro restaurantes.",
    stack: "Gemini Vision / Document AI + validación AFIP padrón.",
    price: "ARS 9.900/mes (500 docs)",
    claver: "ClavAI + módulo compras.",
  },
  {
    id: 26,
    name: "Conciliación bancaria automática",
    category: "Fiscal & Legal",
    auto: "Import CSV homebanking o API Open Finance (cuando aplique) → match movimientos.",
    segment: "PyMEs con 1–3 cuentas, estudios contables.",
    ads: "Lookalike usuarios módulo banco Clavis.",
    stack: "Reglas + ML fuzzy match; ClavAI explica diferencias.",
    price: "ARS 6.900/mes",
    claver: "Módulo banco/tesorería.",
  },
  {
    id: 27,
    name: "Links de cobro standalone (ClavPay)",
    category: "Fiscal & Legal",
    auto: "Generar link/QR sin factura previa; webhook marca cobrado.",
    segment: "Servicios, profesionales, cobranzas campo.",
    ads: "IG: «cobrá con QR sin POS»; segmento monotributistas servicios.",
    stack: "Mercado Pago API (existente).",
    price: "ARS 9.900/mes + comisión MP",
    claver: "Línea ClavPay beta → producto.",
  },
  {
    id: 28,
    name: "Recordatorios fiscales automáticos",
    category: "Fiscal & Legal",
    auto: "Calendario IVA, IIBB, F931 → push mail/WhatsApp N días antes.",
    segment: "Monotributo, SA chicas, contadores partners.",
    ads: "Google: «vencimiento IVA este mes»; seasonal spikes.",
    stack: "Cron + plantillas; datos de módulo impuestos.",
    price: "ARS 1.490/mes",
    claver: "Retención partners contadores.",
  },
  {
    id: 29,
    name: "Scoring crediticio cliente",
    category: "Fiscal & Legal",
    auto: "Consulta bureau/API al superar umbral CC; semáforo en pedido.",
    segment: "Distribuidoras, mayoristas.",
    ads: "LinkedIn «evitá morosos antes del despacho».",
    stack: "Integración Nosis/Veraz API o reglas internas.",
    price: "ARS 0,50–2/consulta + plan base",
    claver: "Módulo clientes + distribución.",
  },
  {
    id: 30,
    name: "GPS flota y telemetría",
    category: "Operaciones & IoT",
    auto: "Alta vehículo → dispositivo OBD/app chofer → mapa en tiempo real.",
    segment: "Distribuidoras, fletes, agro logística.",
    ads: "Meta intereses camioneros, distribución bebidas.",
    stack: "Traccar o proveedor local API.",
    price: "ARS 3.900/vehículo/mes",
    claver: "ClavLog + hoja de ruta.",
  },
  {
    id: 31,
    name: "Sensores IoT plug-and-play",
    category: "Operaciones & IoT",
    auto: "Kit sensor → QR provisioning → dashboard umbrales.",
    segment: "Acopio (humedad silo), restaurant (cadena frío), industria.",
    ads: "YouTube B2B agro; «alerta humedad granos celular».",
    stack: "MQTT ingest existente módulo IoT.",
    price: "ARS 12.900/kit + ARS 2.900/mes",
    claver: "Módulo agro/industria IoT.",
  },
  {
    id: 32,
    name: "Etiquetas QR trazabilidad",
    category: "Operaciones & IoT",
    auto: "Lote producción → impresión QR → scan en cada movimiento stock.",
    segment: "Industria alimentos, farmacia, carnicería.",
    ads: "Search ANMAT trazabilidad; segmento farmacia.",
    stack: "Generador PDF + escáner PWA picking.",
    price: "ARS 4.900/mes",
    claver: "Stock + industria.",
  },
  {
    id: 33,
    name: "Conector balanza / impresora fiscal",
    category: "Operaciones & IoT",
    auto: "Agente local detecta COM/USB → pairing cloud → ERP recibe peso/ticket.",
    segment: "Carnicerías, acopio, retail pesable.",
    ads: "Remarketing rubro carnicería onboarding.",
    stack: "Agente Electron + WebSocket.",
    price: "ARS 7.900/mes por dispositivo",
    claver: "POS + agro balanza existente.",
  },
  {
    id: 34,
    name: "Menú QR digital (restaurants)",
    category: "Operaciones & IoT",
    auto: "Carta desde catálogo platos ERP → QR mesa → actualización instantánea.",
    segment: "Bares, restaurants sin carta impresa.",
    ads: "IG gastronomía CABA; video carta que se actualiza sola.",
    stack: "PWA /menu público por mesaId.",
    price: "ARS 2.900/mes",
    claver: "Módulo hospitalidad.",
  },
  {
    id: 35,
    name: "Agenda online pública",
    category: "Operaciones & IoT",
    auto: "Slug empresa → turnos por profesional → confirmación WhatsApp.",
    segment: "Salud, belleza, veterinaria, gimnasios.",
    ads: "Meta segmentación mujeres 25-45 CABA «reservá turno online».",
    stack: "Ruta /agenda-online/[empresaId] existente.",
    price: "ARS 3.900/mes",
    claver: "Módulo agenda.",
  },
  {
    id: 36,
    name: "Dashboards BI ejecutivos hosted",
    category: "Datos & IA",
    auto: "Conectar ERP → templates KPI por rubro → refresh horario.",
    segment: "Dueños que no abren el ERP; gerentes.",
    ads: "LinkedIn «KPIs en el celular sin Excel».",
    stack: "Clav Analytics + Metabase embedded.",
    price: "ARS 14.900/mes",
    claver: "Línea Clav Analytics.",
  },
  {
    id: 37,
    name: "Reportes programados por email/WhatsApp",
    category: "Datos & IA",
    auto: "Cron selecciona reporte → PDF/Excel → envío 7:00 AM.",
    segment: "Distribución (ventas ayer), cajas (cierre Z).",
    ads: "Email nurture trial día 14.",
    stack: "Jobs ops + Resend/Twilio.",
    price: "ARS 2.490/reporte/mes",
    claver: "Morning Commander ClavAI.",
  },
  {
    id: 38,
    name: "Encuestas NPS post-venta automáticas",
    category: "Datos & IA",
    auto: "Trigger factura cerrada → link 1-10 → dashboard reputación.",
    segment: "Retail, salud, gastronomía.",
    ads: "Google reputación negocio; «subí tu NPS en 30 días».",
    stack: "Microservicio survey + webhook ventas.",
    price: "ARS 3.490/mes",
    claver: "CRM comercial.",
  },
  {
    id: 39,
    name: "Helpdesk IA primera línea",
    category: "Datos & IA",
    auto: "Ticket → ClavAI responde con docs embebidas → escala humano si confianza baja.",
    segment: "Todos los planes; reduce carga soporte Claver.",
    ads: "No ad directo — reduce CAC soporte interno.",
    stack: "ClavAI + módulo soporte existente.",
    price: "Incluido Pro+ / ARS 19.900 soporte IA ilimitado",
    claver: "Escala sin headcount.",
  },
  {
    id: 40,
    name: "Capacitación micro-LMS por rubro",
    category: "Datos & IA",
    auto: "Alta usuario → curso rubro asignado → certificado PDF al 100%.",
    segment: "Onboarding clientes con rotación personal (cajeros, vendedores).",
    ads: "YouTube pre-roll «capacitá cajeros en 1 hora».",
    stack: "Módulo capacitación + video hosted.",
    price: "ARS 1.990/usuario/mes",
    claver: "Clav Consult digitalizado.",
  },
  {
    id: 41,
    name: "Google Business Profile sync",
    category: "Marketing digital",
    auto: "OAuth Google → horarios, fotos catálogo, posts ofertas desde ERP.",
    segment: "Comercios locales SEO «cerca mío».",
    ads: "Google Local Services + Performance Max locales.",
    stack: "Google Business Profile API.",
    price: "ARS 4.900/mes",
    claver: "Ecommerce + promociones motor precios.",
  },
  {
    id: 42,
    name: "Catálogo PDF auto-generado",
    category: "Marketing digital",
    auto: "Lista precios cambia → PDF branding cliente → link descarga B2B.",
    segment: "Mayoristas, distribuidoras.",
    ads: "LinkedIn mayoristas; lead magnet catálogo actualizado.",
    stack: "Puppeteer/Playwright render + R2.",
    price: "ARS 2.900/mes",
    claver: "Portal B2B.",
  },
  {
    id: 43,
    name: "Pixel remarketing setup asistido",
    category: "Marketing digital",
    auto: "Wizard Meta Pixel + GA4 en tienda Clavis en 3 clics.",
    segment: "Ecommerce Pro sin agencia.",
    ads: "Ironía meta: ads para configurar ads; lookalike tienda users.",
    stack: "Inyección script Next.js tienda.",
    price: "ARS 1.990/mes",
    claver: "Módulo ecommerce.",
  },
  {
    id: 44,
    name: "Gift cards y vouchers digitales",
    category: "Marketing digital",
    auto: "Emisión código único → canje POS → asiento contable automático.",
    segment: "Indumentaria, gastronomía, gimnasios.",
    ads: "Seasonal (Día madre, Navidad) Meta conversiones.",
    stack: "Tabla vouchers + API POS.",
    price: "ARS 5.900/mes + % transacción",
    claver: "Membresías + POS.",
  },
  {
    id: 45,
    name: "Programa referidos white-label",
    category: "Marketing digital",
    auto: "Código referido por cliente → tracking → crédito cuenta.",
    segment: "SaaS viral PyME; partners contadores.",
    ads: "«Invitá un colega y ganá 20%» email in-app.",
    stack: "Referral engine + wallet ARS.",
    price: "Revenue share — costo marginal bajo",
    claver: "Programa contadores 20% existente.",
  },
]

const CATEGORIES = [...new Set(SERVICES.map((s) => s.category))]

function serviceSection(s) {
  return [
    h2(`Sección ${s.id} — ${s.name}`),
    table(
      ["Campo", "Detalle"],
      [
        ["Categoría", s.category],
        ["Aprovisionamiento automático", s.auto],
        ["Segmento objetivo", s.segment],
        ["Publicidad digital", s.ads],
        ["Stack sugerido", s.stack],
        ["Modelo de precio", s.price],
        ["Sinergia Claver", s.claver],
      ],
      [2200, 7160]
    ),
    spacer(),
  ]
}

const children = [
  new Paragraph({ spacing: { before: 2200 }, children: [new TextRun({ text: "GRUPO CLAVER", bold: true, size: 52, color: "0F172A" })] }),
  new Paragraph({ children: [new TextRun({ text: "Knowledge House — Servicios Auto-Provisionables", size: 34, color: "1D4ED8" })] }),
  spacer(),
  p("Más allá del ERP: catálogo de servicios escalables con alta automatización (modelo VPN), listos para monetización SaaS y campañas digitales segmentadas.", { italics: true }),
  p("Versión 1.0 — Junio 2026 | 45 secciones", { color: "64748B" }),
  new Paragraph({ children: [new PageBreak()] }),

  new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-3" }),
  new Paragraph({ children: [new PageBreak()] }),

  h1("0. Marco conceptual"),
  p("Un servicio «tipo VPN» en el contexto Claver cumple cinco criterios:"),
  bullet("Alta automática sin ticket humano (API + workflow CCA)"),
  bullet("Entrega en minutos, no semanas"),
  bullet("Facturación recurrente predecible (MRR)"),
  bullet("Aislamiento multi-tenant por empresaId"),
  bullet("Campaña de ads apuntable a un segmento vertical claro"),
  spacer(),
  table(
    ["Criterio", "VPN (referencia)", "ERP tradicional", "Servicios de este documento"],
    [
      ["Tiempo de activación", "Minutos", "Semanas", "Minutos–horas"],
      ["Intervención humana", "Mínima", "Alta (consultor)", "Baja–media"],
      ["Escalabilidad", "Alta", "Media", "Alta"],
      ["Ads segmentables", "Sí (remoto, seguridad)", "Difuso", "Sí (por rubro/dolor)"],
      ["Margen gross", "70–90%", "50–70%", "60–85%"],
    ],
    [2200, 2380, 2380, 2400]
  ),
  spacer(),
  p("Claver puede comercializar estos servicios vía Claver Apps Marketplace (/claver/apps), como SKUs en provisioning Claver Cloud, o como add-ons de Clavis — sin mezclar el core ERP.", { bold: true }),

  h1("1. Mapa por categoría"),
  ...CATEGORIES.map((cat) => {
    const items = SERVICES.filter((s) => s.category === cat).map((s) => `${s.id}. ${s.name}`).join(" · ")
    return [h3(cat), p(items), spacer()]
  }).flat(),

  new Paragraph({ children: [new PageBreak()] }),

  h1("2. Catálogo detallado (45 secciones)"),
  p("Cada sección sigue el mismo esquema Knowledge House para facilitar playbook comercial, técnico y de growth."),
  spacer(),
  ...SERVICES.flatMap(serviceSection),

  h1("3. Matriz de priorización go-to-market"),
  table(
    ["Prioridad", "Servicio", "Razón", "Canal ads principal"],
    [
      ["P0", "VPN corporativa", "Alto margen, dolor claro post-pandemia remoto", "Google Search + LinkedIn"],
      ["P0", "WhatsApp Business API", "Ya en stack; demanda Argentina altísima", "Click-to-WhatsApp Meta"],
      ["P0", "Certificado AFIP gestión", "Intención máxima; puerta de entrada ERP", "Google Search"],
      ["P1", "Backup cloud", "Retención y miedo pérdida datos", "Email nurture trial"],
      ["P1", "OCR facturas", "Dolor diario restaurantes/retail", "YouTube rubro"],
      ["P1", "Agenda online", "14 rubros; viral en IG", "Meta segmentación local"],
      ["P1", "Links cobro ClavPay", "Monotributo servicios", "IG/TikTok"],
      ["P2", "GPS flota", "Ticket alto distribuidoras", "LinkedIn + ferias"],
      ["P2", "BI dashboards", "Upsell Enterprise", "LinkedIn dueños"],
      ["P2", "MDM vendedores", "Bundle ClavLog", "Meta B2B"],
    ],
    [1200, 2800, 3360, 2000]
  ),

  h1("4. Arquitectura de aprovisionamiento automático"),
  p("Flujo unificado Claver Cloud para cualquier SKU de este catálogo:"),
  bullet("1. Cliente compra en marketplace o activa trial desde ads landing"),
  bullet("2. Webhook → provisioning-service crea SuscripcionModulo + job ops"),
  bullet("3. Worker ejecuta playbook (Terraform/API proveedor) idempotente por empresaId"),
  bullet("4. Pack ONBOARD incluye credenciales/QR/link de activación"),
  bullet("5. Healthcheck confirma OK → facturación recurrente ARS"),
  bullet("6. ClavAI monitorea uso; alerta churn si no hay actividad 14 días"),
  spacer(),
  p("Regla: ningún servicio de este catálogo requiere analista para el happy path. Clav Consult interviene solo en excepciones (migración, legados, multi-sucursal compleja).", { italics: true }),

  h1("5. Kits de segmentación para campañas"),
  table(
    ["Segmento ads", "Servicios a empujar", "Creative angle", "Landing"],
    [
      ["Distribuidora GBA", "VPN, GPS, MDM, OCR, scoring", "Tu vendedor en la calle, todo conectado", "/claver/claverp/distribuidoras"],
      ["Restaurante CABA", "Menú QR, WhatsApp, KDS, OCR compras", "Carta y cocina sincronizadas", "/claver/claverp/restaurantes"],
      ["Contador partner", "Backup, recordatorios fiscales, cert AFIP", "Tus clientes ordenados, vos cobrás comisión", "/claver/claverp/contadores"],
      ["Salud/Belleza", "Agenda, SMS, videoconsulta, NPS", "Turnos que se confirman solos", "/claver/claverp/modulos"],
      ["Agro/acopio", "IoT sensores, balanza cloud, backup", "El silo te avisa al celular", "/claver/claverp/agro"],
      ["Ecommerce", "CDN, pixel ads, chat IA, ClavPay", "Vendé 24/7 sin doble carga", "/claver/claverp/ecommerce"],
    ],
    [1800, 2600, 2600, 2360]
  ),

  spacer(),
  p("— Fin del documento — Grupo Claver Knowledge House: Servicios Auto-Provisionables", { italics: true, color: "64748B" }),
]

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, font: "Arial", color: "0F172A" }, paragraph: { spacing: { before: 260, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial", color: "1D4ED8" }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial", color: "334155" }, paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Claver — Servicios Auto-Provisionables", italics: true, size: 18, color: "64748B" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Knowledge House | Pág. ", size: 18, color: "64748B" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "64748B" })] })] }) },
    children,
  }],
})

const buffer = await Packer.toBuffer(doc)
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, buffer)
console.log(`Generado: ${OUT} (${SERVICES.length} secciones)`)
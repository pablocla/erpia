import { FileText, Code, CheckCircle, Wallet } from "lucide-react"

export const metadata = {
  title: "Documentación | Clavernet",
  description: "Aprende cómo funciona el ecosistema de partners Clavernet.",
}

export default function ClavernetDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Documentación Oficial de Clavernet</h1>
        <p className="text-xl text-slate-600">
          Todo lo que necesitas saber para empezar a desarrollar, vender y ganar comisiones con Claver ERP.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
          <Code className="h-8 w-8 text-blue-600 mb-4" />
          <h3 className="text-lg font-bold mb-2">Para Desarrolladores</h3>
          <p className="text-slate-600 text-sm mb-4">
            Aprende a crear microservicios y módulos (Apps) que se conecten con la API de Claver.
          </p>
          <ul className="text-sm space-y-2 text-slate-700 font-medium">
            <li>• Introducción a la API de Claver</li>
            <li>• Cómo empaquetar y publicar tu App</li>
            <li>• Configuración de Split de Pagos (MRR)</li>
          </ul>
        </div>
        
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
          <Wallet className="h-8 w-8 text-emerald-600 mb-4" />
          <h3 className="text-lg font-bold mb-2">Para Vendedores (Sellers)</h3>
          <p className="text-slate-600 text-sm mb-4">
            Guía para conseguir clientes B2B, usar tu enlace de afiliado y cobrar tus comisiones.
          </p>
          <ul className="text-sm space-y-2 text-slate-700 font-medium">
            <li>• Cómo generar y usar tu Link de Referido</li>
            <li>• Material de Marketing B2B</li>
            <li>• Ciclo de facturación y cobro de comisiones</li>
          </ul>
        </div>
      </div>

      <div className="prose prose-slate max-w-none">
        <h2>Introducción al Ecosistema Multi-Tenant</h2>
        <p>
          Claver ERP opera en una arquitectura multi-tenant robusta. Esto significa que como Developer, tu aplicación no necesita preocuparse por bases de datos ni infraestructura. Al registrar tu App, recibís credenciales de API (OAuth 2.0) para interactuar de forma segura con el <code>empresaId</code> del cliente que te instaló, y nada más.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 my-8">
          <h3 className="text-blue-900 mt-0 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Reglas de Split Billing
          </h3>
          <p className="text-blue-800 text-sm mb-0">
            Nuestra promesa es la transparencia. El cliente abona una única factura a Claver Cloud. El motor de facturación (MercadoPago Split / Stripe Connect) realiza la separación automática de fondos antes de que el dinero toque nuestras cuentas operativas. Vos ves tus ganancias en el Dashboard en tiempo real.
          </p>
        </div>

        <h2>Modelo Económico</h2>
        <p>Las comisiones están diseñadas para garantizar un ingreso predecible a largo plazo:</p>
        <ul>
          <li><strong>Sellers:</strong> Cobran una comisión recurrente (MRR) del 15% al 30% garantizada por 36 meses sobre el valor de la licencia base y los add-ons vendidos.</li>
          <li><strong>Developers:</strong> Cobran el 70% del valor de su App mes a mes de forma <strong>vitalicia</strong>, mientras la App siga instalada.</li>
          <li><strong>Teachers:</strong> Fijan su propia tarifa de setup (ej. $150.000 ARS) cobrando el 100% de la implementación, o pueden pactar un retainer mensual por soporte de Nivel 1.</li>
        </ul>

        <h2>Gobernanza y SLAs</h2>
        <p>
          Para mantener la calidad de la red:
        </p>
        <ul>
          <li><strong>Chargebacks:</strong> Si un cliente desconoce el pago, el porcentaje correspondiente será descontado del próximo ciclo de facturación del Seller.</li>
          <li><strong>Review de Apps:</strong> Las aplicaciones enviadas por Developers externos pasan por un proceso de QA y seguridad en un plazo máximo de 5 días hábiles antes de ser listadas en el Marketplace.</li>
        </ul>

        <h2>Próximos Pasos</h2>
        <p>
          Si estás listo para empezar a generar ingresos B2B, dirigite al <strong>Portal de Afiliados</strong> en el menú superior para registrarte, o visitá el <strong>Marketplace Interno</strong> para ver el catálogo de comisiones.
        </p>
      </div>
    </div>
  )
}

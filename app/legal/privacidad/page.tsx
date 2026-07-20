import Link from "next/link"
import { PRIVACY_VERSION } from "@/lib/ops/commercial-go-live-checklist"

export const metadata = {
  title: "Política de privacidad | Claver",
  description: "Política de privacidad y tratamiento de datos — Grupo Claver",
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
        <p className="text-sm text-muted-foreground">
          <Link href="/login/register">← Volver al registro</Link>
        </p>
        <h1>Política de privacidad</h1>
        <p className="text-sm text-muted-foreground">Versión {PRIVACY_VERSION}</p>
        <p>
          Grupo Claver trata datos personales y de empresa para prestar el software de
          gestión, facturación, cobranzas y módulos verticales.
        </p>
        <h2>1. Datos que tratamos</h2>
        <ul>
          <li>Datos de cuenta: nombre, email, rol, empresa</li>
          <li>Datos de negocio: clientes, productos, ventas, cobranzas</li>
          <li>Datos técnicos: logs de acceso, IP, diagnóstico de errores</li>
          <li>Datos de salud solo si usás módulos de historia clínica (vet/clínica)</li>
        </ul>
        <h2>2. Finalidades</h2>
        <ul>
          <li>Prestar y mejorar el servicio SaaS</li>
          <li>Soporte técnico y onboarding</li>
          <li>Facturación y cobro de la suscripción</li>
          <li>Seguridad, prevención de fraude y multi-tenant isolation</li>
        </ul>
        <h2>3. Encargados y terceros</h2>
        <p>
          Podemos usar proveedores de infraestructura (hosting, base de datos), pagos
          (Mercado Pago), email (p. ej. Resend) y mensajería (p. ej. Twilio) cuando estén
          configurados. Cada uno trata datos según su función.
        </p>
        <h2>4. Conservación y derechos</h2>
        <p>
          Conservamos los datos mientras la cuenta esté activa y los plazos legales
          aplicables. Podés solicitar acceso, corrección o baja escribiendo a los canales
          de soporte o contacto de Claver.
        </p>
        <h2>5. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas razonables (cifrado en tránsito,
          aislamiento por empresa, control de acceso). Ningún sistema es 100% invulnerable.
        </p>
        <p className="text-sm text-muted-foreground">
          Versión registrada al aceptar en el alta: {PRIVACY_VERSION}.
        </p>
      </div>
    </div>
  )
}

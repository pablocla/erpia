import Link from "next/link"
import { TOS_VERSION } from "@/lib/ops/commercial-go-live-checklist"

export const metadata = {
  title: "Términos y condiciones | Claver",
  description: "Términos de uso del software Claver / Grupo Claver",
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
        <p className="text-sm text-muted-foreground">
          <Link href="/login/register">← Volver al registro</Link>
        </p>
        <h1>Términos y condiciones del servicio</h1>
        <p className="text-sm text-muted-foreground">Versión {TOS_VERSION}</p>
        <p>
          Estos términos regulan el uso del software de gestión comercial y operativa
          provisto por Grupo Claver (&quot;Claver&quot;, &quot;nosotros&quot;). Al crear una
          cuenta o usar el servicio, la empresa cliente (&quot;vos&quot;) acepta estas
          condiciones.
        </p>
        <h2>1. Servicio</h2>
        <p>
          Claver es un software multi-tenant en la nube (SaaS) para gestión de puntos de
          venta, stock, cobranzas, módulos verticales y servicios asociados. El alcance
          exacto depende del plan, packs y módulos contratados.
        </p>
        <h2>2. Cuentas y acceso</h2>
        <p>
          Sos responsable de la confidencialidad de las credenciales de tus usuarios y del
          uso que hagan del sistema. Debés proporcionar datos de empresa veraces (incluida la
          información fiscal cuando corresponda).
        </p>
        <h2>3. Planes, trial y pagos</h2>
        <p>
          Algunos módulos se ofrecen en trial o como ancla gratuita (por ejemplo libreta de
          fiado según campaña vigente). Los módulos de pago se activan tras la confirmación
          del medio de pago (p. ej. Mercado Pago). Los precios se expresan en pesos
          argentinos salvo indicación contraria y pueden incluir o no IVA según se informe
          en la oferta.
        </p>
        <h2>4. Datos del cliente</h2>
        <p>
          Los datos operativos de tu negocio (productos, ventas, clientes) te pertenecen. Nos
          autorizás a procesarlos para prestar el servicio, soporte y mejora del producto,
          conforme a la Política de privacidad.
        </p>
        <h2>5. Disponibilidad y soporte</h2>
        <p>
          Nos esforzamos por mantener el servicio disponible. Salvo acuerdo de SLA
          específico por plan, el servicio se presta &quot;tal cual&quot;. El soporte se
          brinda por los canales publicados (tickets in-app / email).
        </p>
        <h2>6. Limitación de responsabilidad</h2>
        <p>
          Claver no reemplaza asesoramiento contable, impositivo o legal. La emisión de
          comprobantes fiscales depende de la configuración AFIP del cliente y de la
          disponibilidad de los servicios de AFIP.
        </p>
        <h2>7. Rescisión</h2>
        <p>
          Podés dejar de usar el servicio y solicitar la baja de la cuenta. Podemos
          suspender el acceso por falta de pago, uso indebido o incumplimiento de estos
          términos.
        </p>
        <h2>8. Contacto</h2>
        <p>
          Consultas: a través de{" "}
          <Link href="/claver/contacto">contacto comercial</Link> o el canal de soporte de
          tu cuenta.
        </p>
        <p className="text-sm text-muted-foreground">
          Este texto es la versión operativa de la plataforma. Puede actualizarse; la
          versión aceptada al registrarte queda registrada en tu empresa.
        </p>
      </div>
    </div>
  )
}

import { emailLayout } from "./email-templates"

export function emailSubSaasWelcome(appName: string, userNombre: string, loginUrl: string): string {
  return emailLayout(
    `
    <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">¡Bienvenido a ${appName}!</h2>
    <p style="margin:0 0 12px;">Hola <strong>${userNombre}</strong>,</p>
    <p style="margin:0 0 16px;">Gracias por registrarte. Ya podés empezar a usar tu cuenta y sacar el máximo provecho de nuestras herramientas.</p>
    <p style="margin:0 0 24px;">Empezá en 3 simples pasos desde tu panel de control:</p>
    
    <div style="margin-bottom:24px;">
      <a href="${loginUrl}" style="display:inline-block;background:#1D4ED8;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:15px;">Ir a mi panel</a>
    </div>
    
    <p style="margin:0;font-size:14px;color:#64748b;">Si tenés alguna duda, simplemente respondé a este correo.</p>
    `,
    { preheader: `Bienvenido a ${appName} - Empezá en 3 pasos` }
  )
}

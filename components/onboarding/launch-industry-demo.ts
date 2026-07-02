import { resolvePostLoginPathAsync } from "@/lib/auth/home-redirect"
import { appendPresentQuery } from "@/lib/comercial/demo-presentation"

type DemoUsuario = {
  id: number
  nombre: string
  email: string
  rol: string
  empresaId: number
}

export async function launchIndustryDemo(
  industryId: string,
  loginConToken: (token: string, usuario: DemoUsuario) => void,
  options?: { present?: boolean },
): Promise<string> {
  const res = await fetch("/api/onboarding/industry-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ industryId }),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? "No se pudo armar la demo")
  }

  loginConToken(data.token, data.usuario)
  const dest = await resolvePostLoginPathAsync(
    data.token,
    data.usuario.rol,
    data.goldenPath,
    data.usuario.email,
  )
  return appendPresentQuery(dest, options?.present)
}
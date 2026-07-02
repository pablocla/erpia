import { cookies } from "next/headers";
import { i18nConfig, AppLocale } from "../config";
import { AuthService } from "@/lib/auth/auth-service";
import { prisma } from "@/lib/prisma";

export async function getEffectiveLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  if (localeCookie && i18nConfig.supportedLocales.includes(localeCookie as AppLocale)) {
    return localeCookie as AppLocale;
  }

  // Si no hay cookie de override, buscar en DB por empresa
  const token = cookieStore.get("claver_token")?.value;
  if (token) {
    try {
      const authService = new AuthService();
      const payload = await authService.verificarToken(token);
      if (payload?.empresaId) {
        const empresa = await prisma.empresa.findUnique({
          where: { id: payload.empresaId },
          select: { temaConfig: true, paisFiscal: true }
        });
        
        if (empresa) {
          // 1. Empresa.temaConfig.locale
          if (empresa.temaConfig && typeof empresa.temaConfig === 'object') {
            const config = empresa.temaConfig as any;
            if (config.locale && i18nConfig.supportedLocales.includes(config.locale)) {
              return config.locale as AppLocale;
            }
          }
          
          // 2. Inferido de Empresa.paisFiscal
          if (empresa.paisFiscal) {
            const paisLocaleMap: Record<string, AppLocale> = {
              "AR": "es-AR",
              "MX": "es-MX",
              "BR": "pt-BR",
              "US": "en-US",
            };
            const mapped = paisLocaleMap[empresa.paisFiscal];
            if (mapped && i18nConfig.supportedLocales.includes(mapped)) {
              return mapped;
            }
          }
        }
      }
    } catch (err) {
      console.error("Error resolviendo locale desde BD", err);
    }
  }

  return i18nConfig.defaultLocale;
}

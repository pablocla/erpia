import { AppLocale, I18nConfig } from "./types";

export const i18nConfig: I18nConfig = {
  defaultLocale: "es-AR",
  supportedLocales: ["es-AR", "es-MX", "pt-BR", "en-US"],
};

export function localeFromPaisFiscal(paisFiscal: string | null | undefined): AppLocale {
  if (!paisFiscal) return i18nConfig.defaultLocale;
  
  switch (paisFiscal.toUpperCase()) {
    case "US":
      return "en-US";
    case "MX":
      return "es-MX";
    case "BR":
      return "pt-BR";
    case "AR":
    case "CL":
    default:
      return "es-AR";
  }
}

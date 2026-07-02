export type AppLocale = "es-AR" | "es-MX" | "pt-BR" | "en-US";

export interface I18nConfig {
  defaultLocale: AppLocale;
  supportedLocales: AppLocale[];
}

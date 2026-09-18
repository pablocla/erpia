/** Locales con JSON en /messages. Geo (pt-BR) cae a es-AR. */
export const MESSAGE_FILE: Record<string, string> = {
  es: "es",
  "es-AR": "es-AR",
  "es-MX": "es-MX",
  en: "en",
  "en-US": "en-US",
  "pt-BR": "es-AR",
}

export function resolveMessageFile(locale: string | undefined | null): string {
  if (!locale) return "es-AR"
  return MESSAGE_FILE[locale] ?? "es-AR"
}

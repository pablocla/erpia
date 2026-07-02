import { AppLocale } from "./types";
import { i18nConfig } from "./config";

export function formatDate(date: Date | number | string, locale: AppLocale = i18nConfig.defaultLocale): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(date));
}

export function formatDateTime(date: Date | number | string, locale: AppLocale = i18nConfig.defaultLocale): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

export function formatCurrency(amount: number, locale: AppLocale = i18nConfig.defaultLocale, currency?: string): string {
  const effectiveCurrency = currency || (locale === "en-US" ? "USD" : locale === "es-MX" ? "MXN" : locale === "pt-BR" ? "BRL" : "ARS");
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: effectiveCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(value: number, locale: AppLocale = i18nConfig.defaultLocale): string {
  return new Intl.NumberFormat(locale).format(value);
}

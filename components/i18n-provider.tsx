"use client";
import { NextIntlClientProvider } from 'next-intl';
import { useEffect } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';

interface I18nProviderProps {
  children: React.ReactNode;
  messages: any;
  locale: string;
}

export function I18nProvider({ children, messages, locale }: I18nProviderProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.setAttribute('data-locale', locale);
  }, [locale]);

  const timeZone = locale === "es-MX" ? "America/Mexico_City" : "America/Argentina/Buenos_Aires";

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}

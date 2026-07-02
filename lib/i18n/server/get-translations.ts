import { getTranslations as getNextIntlTranslations } from "next-intl/server";
import { getEffectiveLocale } from "../request-locale";

export async function getTranslations(namespace?: string) {
  const locale = await getEffectiveLocale();
  return getNextIntlTranslations({ locale, namespace });
}

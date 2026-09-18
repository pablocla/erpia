import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { MESSAGE_FILE, resolveMessageFile } from "@/lib/i18n/message-files"

async function loadMessages(locale: string) {
  const file = resolveMessageFile(locale)
  try {
    return (await import(`../../messages/${file}.json`)).default
  } catch {
    return (await import(`../../messages/es-AR.json`)).default
  }
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get("NEXT_LOCALE")?.value || "es-AR"
  const locale = MESSAGE_FILE[raw] ? raw : "es-AR"

  return {
    locale,
    messages: await loadMessages(locale),
  }
})


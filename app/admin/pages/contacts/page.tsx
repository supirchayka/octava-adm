import { backendURL } from "@/lib/utils"
import { PageForm, type PageField } from "../ui-page-form"

const fields: PageField[] = [
  { key: "phoneMain", label: "Основной телефон" },
  { key: "email", label: "Email", type: "text" },
  { key: "telegramUrl", label: "Telegram URL", type: "url" },
  { key: "whatsappUrl", label: "WhatsApp URL", type: "url" },
  { key: "addressText", label: "Адрес", type: "textarea" },
  { key: "yandexMapUrl", label: "Ссылка на карту", type: "url" },
]

async function fetchPage() {
  try {
    const res = await fetch(`${backendURL()}/pages/contacts`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function ContactsAdminPage() {
  const data = await fetchPage()
  return (
    <PageForm
      page="contacts"
      title="Контакты"
      description="Телефоны, мессенджеры, карта"
      fields={fields}
      initialData={data}
    />
  )
}

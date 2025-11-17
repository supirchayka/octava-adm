import { backendURL } from "@/lib/utils"
import { PageForm, type PageField } from "../ui-page-form"

const fields: PageField[] = [
  { key: "title", label: "Заголовок" },
  { key: "body", label: "Текст документа", type: "textarea" },
]

async function fetchPage() {
  try {
    const res = await fetch(`${backendURL()}/pages/privacy-policy`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function PrivacyPolicyAdmin() {
  const data = await fetchPage()
  return (
    <PageForm
      page="privacy-policy"
      title="Политика конфиденциальности"
      description="Управление текстом и SEO"
      fields={fields}
      initialData={data}
    />
  )
}

import { serverApi } from "@/lib/server-fetch"
import { PageForm, type PageField } from "../ui-page-form"

const fields: PageField[] = [
  { key: "title", label: "Заголовок" },
  { key: "body", label: "Текст документа", type: "textarea" },
]

async function fetchPage() {
  try {
    const res = await serverApi(`/admin/pages/personal-data-policy`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function PersonalDataPolicyAdmin() {
  const data = await fetchPage()
  return (
    <PageForm
      page="personal-data-policy"
      title="Политика обработки ПДн"
      description="Текстовая страница и SEO"
      fields={fields}
      initialData={data}
    />
  )
}

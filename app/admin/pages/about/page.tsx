import { serverApi } from "@/lib/server-fetch"
import { PageForm, type PageField } from "../ui-page-form"

const fields: PageField[] = [
  { key: "heroTitle", label: "Hero title" },
  { key: "heroDescription", label: "Hero описание", type: "textarea" },
  { key: "howWeAchieveText", label: "Как достигаем результат", type: "textarea" },
  { key: "heroCtaTitle", label: "CTA заголовок" },
  { key: "heroCtaSubtitle", label: "CTA подзаголовок", type: "textarea" },
]

async function fetchPage() {
  try {
    const res = await serverApi(`/admin/pages/about`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function AboutAdminPage() {
  const data = await fetchPage()
  return (
    <PageForm
      page="about"
      title="Страница 'О клинике'"
      description="Hero, CTA и SEO"
      fields={fields}
      initialData={data}
    />
  )
}

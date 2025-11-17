import { serverApi } from "@/lib/server-fetch"
import { PageForm, type PageField } from "../ui-page-form"

const fields: PageField[] = [
  { key: "heroTitle", label: "Hero title" },
  { key: "heroSubtitle", label: "Hero subtitle", type: "textarea" },
  { key: "heroCtaText", label: "CTA текст" },
  { key: "heroCtaUrl", label: "CTA URL", type: "url" },
  { key: "subheroTitle", label: "Subhero заголовок" },
  { key: "subheroSubtitle", label: "Subhero текст", type: "textarea" },
  { key: "interiorText", label: "Текст о клинике", type: "textarea" },
]

async function fetchPage() {
  try {
    const res = await serverApi(`/admin/pages/home`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function HomeAdminPage() {
  const data = await fetchPage()
  return (
    <PageForm
      page="home"
      title="Главная"
      description="Hero, подзаголовки и интерьерный блок"
      fields={fields}
      initialData={data}
    />
  )
}

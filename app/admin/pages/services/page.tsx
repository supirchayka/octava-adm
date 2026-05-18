import { serverApi } from "@/lib/server-fetch"
import { PageForm, type PageField } from "../ui-page-form"

const fields: PageField[] = [
  { key: "landingTitle", label: "Заголовок страницы /services" },
  {
    key: "landingDescription",
    label: "Описание страницы /services",
    type: "textarea",
  },
  { key: "femaleCardTitle", label: "Заголовок карточки Женщины" },
  {
    key: "femaleCardDescription",
    label: "Описание карточки Женщины",
    type: "textarea",
  },
  { key: "maleCardTitle", label: "Заголовок карточки Мужчины" },
  {
    key: "maleCardDescription",
    label: "Описание карточки Мужчины",
    type: "textarea",
  },
  { key: "femaleTitle", label: "Заголовок /services/female" },
  {
    key: "femaleDescription",
    label: "Описание /services/female",
    type: "textarea",
  },
  { key: "maleTitle", label: "Заголовок /services/male" },
  {
    key: "maleDescription",
    label: "Описание /services/male",
    type: "textarea",
  },
]

async function fetchPage() {
  try {
    const res = await serverApi(`/admin/pages/services`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function ServicesAdminPage() {
  const data = await fetchPage()
  return (
    <PageForm
      page="services"
      title="Услуги"
      description="Тексты страницы выбора направления и верхних блоков женского/мужского разделов."
      fields={fields}
      initialData={data}
    />
  )
}

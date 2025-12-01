import { serverApi } from "@/lib/server-fetch"
import { unwrapData } from "@/lib/utils"
import { HomeForm } from "./home-form"

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
  const [data, categories] = await Promise.all([fetchPage(), fetchCategories()])
  return <HomeForm initialData={data} categories={categories} />
}

async function fetchCategories() {
  try {
    const res = await serverApi(`/admin/catalog/categories`)
    if (!res.ok) return []
    const payload = unwrapData(await res.json())
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as any)?.items)
        ? (payload as any).items
        : Array.isArray((payload as any)?.categories)
          ? (payload as any).categories
          : []
    return list
      .filter((item: any) => typeof item?.id === "number" && typeof item?.name === "string")
      .map((item: any) => ({ id: item.id, name: item.name }))
  } catch {
    return []
  }
}

import { serverApi } from "@/lib/server-fetch"
import { unwrapData } from "@/lib/utils"
import { HomeForm } from "./home-form"

type Category = { id: number; name: string; slug?: string }

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
    const raw = await res.json()
    const payload = Array.isArray(raw) ? raw : unwrapData(raw)
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { items?: unknown[]; categories?: unknown[] })?.items)
        ? (payload as { items: unknown[] }).items
        : Array.isArray((payload as { items?: unknown[]; categories?: unknown[] })?.categories)
          ? (payload as { categories: unknown[] }).categories
          : []
    return list
      .filter((item): item is Category => typeof (item as Category)?.id === "number" && typeof (item as Category)?.name === "string")
      .map((item) => ({
        id: item.id,
        name: item.name,
        slug: typeof item.slug === "string" ? item.slug : undefined,
      }))
  } catch {
    return []
  }
}

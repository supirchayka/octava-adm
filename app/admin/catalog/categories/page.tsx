import Link from "next/link"
import { serverApi } from "@/lib/server-fetch"
import CreateCategoryForm from "./ui-create"
import { EditCategoryDialog } from "./ui-edit"

async function fetchCategories() {
  const res = await serverApi(`/admin/catalog/categories`)
  if (!res.ok) throw new Error("Не удалось получить категории")
  const data = await res.json()
  return (Array.isArray(data) ? data : data.items || []) as Array<{ id:number; slug:string; name:string; description:string | null; servicesCount:number }>
}

export default async function CategoriesPage() {
  const categories = await fetchCategories()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Категории</h1>
        <CreateCategoryForm />
      </div>
      <div className="grid gap-3">
        {categories.map((c) => (
          <div key={c.id} className="border rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-500">{c.description || "—"}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">услуг: {c.servicesCount}</div>
              <Link className="text-sm underline" href={`/admin/catalog/services?categoryId=${c.id}`}>Открыть услуги</Link>
              <EditCategoryDialog categoryId={c.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

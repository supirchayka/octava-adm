import { backendURL } from "@/lib/utils"
import Link from "next/link"
import CreateCategoryForm from "./ui-create"
import Image from "next/image"

async function fetchCategories() {
  const res = await fetch(`${backendURL()}/service-categories`, { cache: "no-store" })
  if (!res.ok) throw new Error("Не удалось получить категории")
  return res.json() as Promise<Array<{ id:number; slug:string; name:string; description:string | null; servicesCount:number }>> 
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
              <Link className="text-sm underline" href={`/admin/catalog/services?category=${c.slug}`}>Открыть услуги</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

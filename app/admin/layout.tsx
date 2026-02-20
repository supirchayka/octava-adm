import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[250px_1fr]">
      <aside className="border-r p-4 space-y-2">
        <h2 className="text-lg font-semibold mb-4">Octava Admin</h2>
        <nav className="grid gap-1 text-sm">
          <Link className="hover:underline" href="/admin">Дэшборд</Link>
          <Link className="hover:underline" href="/admin/catalog/categories">Категории</Link>
          <Link className="hover:underline" href="/admin/catalog/services">Услуги</Link>
          <Link className="hover:underline" href="/admin/catalog/devices">Аппараты</Link>
          <Link className="hover:underline" href="/admin/catalog/specialists">Специалисты</Link>
          <Link className="hover:underline" href="/admin/pages">Страницы</Link>
          <Link className="hover:underline" href="/admin/org">Организация</Link>
          <Link className="hover:underline" href="/admin/leads">Лиды</Link>
          <form action="/api/auth/logout" method="post">
            <button className="mt-4 text-red-600 hover:underline">Выйти</button>
          </form>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  )
}

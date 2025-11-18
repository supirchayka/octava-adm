import Link from "next/link"

const pages = [
  { slug: "home", title: "Главная", description: "Hero, subhero и SEO" },
  { slug: "about", title: "О клинике", description: "Hero + CTA" },
  { slug: "contacts", title: "Контакты", description: "Телефоны, адрес, карта" },
  { slug: "personal-data-policy", title: "Политика ПДн", description: "Заголовок и тело" },
  { slug: "privacy-policy", title: "Политика конфиденциальности", description: "Текстовый документ" },
]

export default function PagesHub() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Страницы</h1>
        <p className="text-sm text-muted-foreground">Редактируйте контент и SEO блоков /pages/*</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {pages.map((page) => (
          <Link key={page.slug} href={`/admin/pages/${page.slug}`} className="rounded-2xl border p-4 hover:border-primary transition">
            <div className="font-semibold">{page.title}</div>
            <div className="text-sm text-muted-foreground">{page.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

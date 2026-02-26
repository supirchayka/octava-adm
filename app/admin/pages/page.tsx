import Link from "next/link"

const pages = [
  { slug: "home", title: "Главная", description: "Hero видео, интерьер и SEO" },
  { slug: "about", title: "О клинике", description: "Hero + CTA" },
  { slug: "contacts", title: "Контакты", description: "Телефоны, адрес, карта" },
  { slug: "prices", title: "Цены (PDF)", description: "Загрузка актуального прайса" },
  { slug: "personal-data-policy", title: "Политика ПДН", description: "Заголовок и тело" },
  { slug: "privacy-policy", title: "Политика конфиденциальности", description: "Текстовый документ" },
]

export default function PagesHub() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Страницы</h1>
        <p className="text-sm text-muted-foreground">
          Выберите нужную страницу и обновите тексты, медиа и SEO.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {pages.map((page) => (
          <Link
            key={page.slug}
            href={`/admin/pages/${page.slug}`}
            className="rounded-2xl border p-4 transition hover:border-primary"
          >
            <div className="font-semibold">{page.title}</div>
            <div className="text-sm text-muted-foreground">{page.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

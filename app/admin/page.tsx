export default function AdminHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Привет!</h1>
      <p className="text-muted-foreground">Это дэшборд админ-панели Octava.</p>
      <ul className="list-disc list-inside">
        <li>Категории / Услуги / Аппараты — CRUD по каталогу</li>
        <li>Страницы — редактирование контента и SEO</li>
        <li>Организация — реквизиты</li>
        <li>Лиды — таблица с фильтрами и сменой статуса</li>
      </ul>
    </div>
  )
}

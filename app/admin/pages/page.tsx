export default function PagesHub() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold mb-2">Страницы</h1>
      <p>Реализуйте формы для:</p>
      <ul className="list-disc list-inside">
        <li>/admin/pages/home</li>
        <li>/admin/pages/about</li>
        <li>/admin/pages/contacts</li>
        <li>/admin/pages/personal-data-policy</li>
        <li>/admin/pages/privacy-policy</li>
      </ul>
      <p className="text-sm text-gray-500">См. ADMIN.md §5 для полей. Отправляйте только изменённые поля, ответ 204.</p>
    </div>
  )
}

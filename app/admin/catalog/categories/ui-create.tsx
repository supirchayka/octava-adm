"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload } from "@/components/seo-fields"

export default function CreateCategoryForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sortOrder, setSortOrder] = useState("")
  const [heroFileId, setHeroFileId] = useState<number | null>(null)
  const [seo, setSeo] = useState(defaultSeoState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSaving(true); setError(null)
    try {
      const res = await fetch("/api/admin/catalog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          sortOrder: sortOrder ? Number(sortOrder) : undefined,
          heroImageFileId: heroFileId ?? undefined,
          seo: prepareSeoPayload(seo)
        })
      })
      if (!res.ok) throw new Error(await res.text())
      // reload page data
      location.reload()
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="">
      <Button onClick={() => setOpen((v)=>!v)}>{open ? "Скрыть" : "Создать категорию"}</Button>
      {open && (
        <div className="mt-4 rounded-2xl border p-4 space-y-3">
          <div>
            <label className="text-sm">Название*</label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Инъекции" />
          </div>
          <div>
            <label className="text-sm">Описание</label>
            <Textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Краткое описание" />
          </div>
          <div>
            <label className="text-sm">Порядок сортировки</label>
            <Input type="number" value={sortOrder} onChange={e=>setSortOrder(e.target.value)} placeholder="Например, 10" />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">HERO-изображение (опционально)</div>
            <FileUploader onUploaded={(f)=> setHeroFileId(f.id)} />
            {heroFileId && <div className="text-xs text-gray-500 mt-1">Выбран файл id={heroFileId}</div>}
          </div>
          <SeoFields value={seo} onChange={setSeo} />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={!name || saving}>{saving ? "Сохраняю..." : "Создать"}</Button>
            <Button variant="ghost" onClick={()=>setOpen(false)}>Отмена</Button>
          </div>
        </div>
      )}
    </div>
  )
}

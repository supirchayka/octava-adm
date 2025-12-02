"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SeoFields, defaultSeoState, prepareSeoPayload } from "@/components/seo-fields"
import { ImageField, type SimpleImageValue } from "@/components/image-field"

export default function CreateCategoryForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sortOrder, setSortOrder] = useState("")
  const [heroImage, setHeroImage] = useState<SimpleImageValue>({ id: null, fileId: null, previewUrl: null })
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
          heroImageFileId: heroImage.fileId ?? undefined,
          seo: prepareSeoPayload(seo)
        })
      })
      if (!res.ok) throw new Error(await res.text())
      // reload page data
      location.reload()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Ошибка сохранения"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Button type="button" onClick={() => setOpen((v) => !v)}>
        {open ? "Скрыть" : "Создать категорию"}
      </Button>
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
          <ImageField
            label="Обложка категории"
            description="Покажите атмосферу направления — это изображение увидят на карточке категории."
            value={heroImage}
            onChange={setHeroImage}
          />
          <SeoFields value={seo} onChange={setSeo} />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex gap-2">
            <Button type="button" onClick={submit} disabled={!name || saving}>
              {saving ? "Сохраняю..." : "Создать"}
            </Button>
            <Button type="button" variant="ghost" onClick={()=>setOpen(false)}>Отмена</Button>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SeoFields, defaultSeoState, prepareSeoPayload } from "@/components/seo-fields"
import { ImageField, type SimpleImageValue } from "@/components/image-field"

type CategoryGender = "FEMALE" | "MALE"

const genderOptions: Array<{ value: CategoryGender; label: string }> = [
  { value: "FEMALE", label: "Женский" },
  { value: "MALE", label: "Мужской" },
]

export default function CreateCategoryForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [gender, setGender] = useState<CategoryGender>("FEMALE")
  const [sortOrder, setSortOrder] = useState("")
  const [heroImage, setHeroImage] = useState<SimpleImageValue>({ id: null, fileId: null, previewUrl: null })
  const [seo, setSeo] = useState(defaultSeoState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetState() {
    setName("")
    setDescription("")
    setGender("FEMALE")
    setSortOrder("")
    setHeroImage({ id: null, fileId: null, previewUrl: null })
    setSeo(defaultSeoState)
    setSaving(false)
    setError(null)
  }

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/catalog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          gender,
          sortOrder: sortOrder ? Number(sortOrder) : undefined,
          heroImageFileId: heroImage.fileId ?? undefined,
          seo: prepareSeoPayload(seo),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      window.location.reload()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Ошибка сохранения"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetState()
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">Создать категорию</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новая категория</DialogTitle>
          <DialogDescription>Заполните карточку категории для фронтенда и SEO.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm">Название*</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Инъекции" />
          </div>
          <div>
            <label className="text-sm">Описание</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Краткое описание" />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm">Пол категории*</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {genderOptions.map((option) => {
                const checked = gender === option.value
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      checked ? "border-slate-900 bg-slate-50" : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category-gender-create"
                      value={option.value}
                      checked={checked}
                      onChange={() => setGender(option.value)}
                      className="h-4 w-4"
                    />
                    <span>{option.label}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
          <div>
            <label className="text-sm">Порядок сортировки</label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="Например, 10" />
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
            <Button type="button" onClick={submit} disabled={!name.trim() || saving}>
              {saving ? "Сохраняю..." : "Создать"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

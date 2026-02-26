"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
          <div>
            <label className="text-sm">Пол категории*</label>
            <Select value={gender} onValueChange={(value) => setGender(value as CategoryGender)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите пол" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

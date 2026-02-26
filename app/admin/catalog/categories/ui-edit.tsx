"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { ImageField, type SimpleImageValue } from "@/components/image-field"
import { resolveMediaFileId, resolveMediaPreviewUrl } from "@/lib/media"
import { unwrapData } from "@/lib/utils"

type CategoryGender = "FEMALE" | "MALE"

const genderOptions: Array<{ value: CategoryGender; label: string }> = [
  { value: "FEMALE", label: "Женский" },
  { value: "MALE", label: "Мужской" },
]

interface CategoryDetail {
  id: number
  name: string
  description: string | null
  gender: CategoryGender
  sortOrder?: number | null
  heroImageFileId?: number | null
  heroImage?: {
    id?: number | null
    fileId?: number | null
    path?: string | null
    url?: string | null
    file?: { id?: number | null; path?: string | null; url?: string | null } | null
  } | null
  images?: Array<{
    id?: number | null
    fileId?: number | null
    purpose: "HERO" | "GALLERY"
    path?: string | null
    url?: string | null
    file?: { id?: number | null; path?: string | null; url?: string | null } | null
  }>
  seo?: SeoState
}

export function EditCategoryDialog({
  categoryId,
  triggerLabel,
}: {
  categoryId: number
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [gender, setGender] = useState<CategoryGender>("FEMALE")
  const [sortOrder, setSortOrder] = useState("")
  const [heroImage, setHeroImage] = useState<SimpleImageValue>({ id: null, fileId: null, previewUrl: null })
  const [seo, setSeo] = useState<SeoState>(defaultSeoState)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/admin/catalog/categories/${categoryId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((payload: CategoryDetail) => {
        const json = unwrapData<CategoryDetail>(payload)
        const heroFromImages = json.images?.find((img) => img.purpose === "HERO")
        const heroFileId =
          json.heroImageFileId ??
          resolveMediaFileId(json.heroImage) ??
          resolveMediaFileId(heroFromImages) ??
          null
        setName(json.name)
        setDescription(json.description ?? "")
        setGender(json.gender ?? "FEMALE")
        setSortOrder(json.sortOrder?.toString() ?? "")
        setHeroImage({
          id: resolveMediaFileId(heroFromImages) ?? resolveMediaFileId(json.heroImage),
          fileId: heroFileId ?? null,
          previewUrl: resolveMediaPreviewUrl(heroFromImages) ?? resolveMediaPreviewUrl(json.heroImage),
        })
        setSeo(json.seo ?? defaultSeoState)
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : "Не удалось загрузить"
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [open, categoryId])

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          gender,
          sortOrder: sortOrder ? Number(sortOrder) : null,
          heroImageFileId: heroImage.fileId,
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

  function resetState() {
    setName("")
    setDescription("")
    setGender("FEMALE")
    setSortOrder("")
    setHeroImage({ id: null, fileId: null, previewUrl: null })
    setSeo(defaultSeoState)
    setError(null)
    setLoading(false)
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next)
      if (!next) resetState()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerLabel || "Редактировать"}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Категория #{categoryId}</DialogTitle>
          <DialogDescription>Обновите описание и визуал категории</DialogDescription>
        </DialogHeader>
        {loading && <div className="text-sm text-muted-foreground">Загрузка...</div>}
        {!loading && (
          <div className="space-y-4">
            <div>
              <label className="text-sm">Название</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Описание</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm">Пол категории</legend>
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
                        name={`category-gender-edit-${categoryId}`}
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
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <ImageField
              label="Обложка"
              description="Это фото увидят на карточке категории и во всех списках."
              value={heroImage}
              onChange={setHeroImage}
            />
            <SeoFields value={seo} onChange={setSeo} />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex gap-2">
              <Button type="button" onClick={submit} disabled={saving}>{saving ? "Сохраняю..." : "Сохранить"}</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Закрыть</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

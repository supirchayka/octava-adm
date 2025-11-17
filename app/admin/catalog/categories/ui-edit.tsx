"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"

interface CategoryDetail {
  id: number
  name: string
  description: string | null
  sortOrder?: number | null
  heroImageFileId?: number | null
  heroImage?: { fileId: number | null } | null
  images?: Array<{ purpose: "HERO" | "GALLERY"; file?: { id: number } }>
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
  const [sortOrder, setSortOrder] = useState("")
  const [heroId, setHeroId] = useState<number | null>(null)
  const [seo, setSeo] = useState<SeoState>(defaultSeoState)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/admin/catalog/categories/${categoryId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((json: CategoryDetail) => {
        const heroFromImages = json.images?.find((img) => img.purpose === "HERO")?.file?.id
        setName(json.name)
        setDescription(json.description ?? "")
        setSortOrder(json.sortOrder?.toString() ?? "")
        setHeroId(json.heroImageFileId ?? json.heroImage?.fileId ?? heroFromImages ?? null)
        setSeo(json.seo ?? defaultSeoState)
      })
      .catch((e: any) => setError(e.message || "Не удалось загрузить"))
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
          sortOrder: sortOrder ? Number(sortOrder) : null,
          heroImageFileId: heroId,
          seo: prepareSeoPayload(seo),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      window.location.reload()
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  function resetState() {
    setName("")
    setDescription("")
    setSortOrder("")
    setHeroId(null)
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
          <DialogDescription>Редактируйте поля и сохраните изменения</DialogDescription>
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
            <div>
              <label className="text-sm">Порядок сортировки</label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">HERO-изображение</div>
              <div className="flex items-center gap-2">
                <Input type="number" value={heroId ?? ""} onChange={(e) => setHeroId(e.target.value ? Number(e.target.value) : null)} placeholder="ID файла" />
                <Button type="button" variant="outline" onClick={() => setHeroId(null)}>Очистить</Button>
              </div>
              <FileUploader onUploaded={(file) => setHeroId(file.id)} />
              {heroId && <div className="text-xs text-muted-foreground">Текущее HERO id={heroId}</div>}
            </div>
            <SeoFields value={seo} onChange={setSeo} />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex gap-2">
              <Button onClick={submit} disabled={saving}>{saving ? "Сохраняю..." : "Сохранить"}</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Закрыть</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

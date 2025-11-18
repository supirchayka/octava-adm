"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { ImageField, type SimpleImageValue } from "@/components/image-field"
import { ImageListField } from "@/components/image-list-field"
import { absoluteUploadUrl, unwrapData } from "@/lib/utils"

type DeviceDetail = {
  id: number
  brand: string
  model: string
  positioning: string
  principle: string
  safetyNotes?: string | null
  heroImageFileId?: number | null
  heroImage?: { fileId?: number | null; file?: { path?: string | null } } | null
  images?: Array<{ purpose: "HERO" | "GALLERY"; order?: number | null; file?: { id: number; path?: string | null } }>
  galleryImageFileIds?: number[]
  seo?: SeoState
}

type DeviceDetailResponse = DeviceDetail & { slug?: string }

interface Props {
  deviceId?: number
  triggerLabel: string
  onCompleted: () => void
}

export function DeviceFormDialog({ deviceId, triggerLabel, onCompleted }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    brand: "",
    model: "",
    positioning: "",
    principle: "",
    safetyNotes: "",
  })
  const [heroImage, setHeroImage] = useState<SimpleImageValue>({ id: null, fileId: null, previewUrl: null })
  const [galleryImages, setGalleryImages] = useState<SimpleImageValue[]>([])
  const [seo, setSeo] = useState<SeoState>(defaultSeoState)

  useEffect(() => {
    if (!open) return
    if (!deviceId) return
    setLoading(true)
    fetch(`/api/admin/catalog/devices/${deviceId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((payload: DeviceDetailResponse) => {
        const data = unwrapData<DeviceDetailResponse>(payload)
        const heroFromImages = data.images?.find((img) => img.purpose === "HERO")
        const heroPath = heroFromImages?.file?.path ?? (data.heroImage as any)?.file?.path ?? (data.heroImage as any)?.path ?? null
        const heroFileId = data.heroImageFileId ?? data.heroImage?.fileId ?? heroFromImages?.file?.id ?? null
        const galleryFromImages = (data.images ?? [])
          .filter((img) => img.purpose === "GALLERY")
          .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
        const galleryFromField = data.galleryImageFileIds ?? []
        setForm({
          brand: data.brand ?? "",
          model: data.model ?? "",
          positioning: data.positioning ?? "",
          principle: data.principle ?? "",
          safetyNotes: data.safetyNotes ?? "",
        })
        setHeroImage({
          id: heroFromImages?.file?.id ?? data.heroImage?.fileId ?? null,
          fileId: heroFileId ?? null,
          previewUrl: heroPath ? absoluteUploadUrl(heroPath) : null,
        })
        if (galleryFromImages.length) {
          setGalleryImages(
            galleryFromImages.map((img) => ({
              id: img.file?.id ?? null,
              fileId: img.file?.id ?? null,
              previewUrl: img.file?.path ? absoluteUploadUrl(img.file.path) : null,
            }))
          )
        } else {
          setGalleryImages(
            (galleryFromField || []).map((fileId) => ({ id: null, fileId: fileId ?? null, previewUrl: null }))
          )
        }
        setSeo(data.seo ?? defaultSeoState)
      })
      .catch((e: any) => setError(e.message || "Не удалось загрузить данные"))
      .finally(() => setLoading(false))
  }, [open, deviceId])

  function resetState() {
    setForm({ brand: "", model: "", positioning: "", principle: "", safetyNotes: "" })
    setHeroImage({ id: null, fileId: null, previewUrl: null })
    setGalleryImages([])
    setSeo(defaultSeoState)
    setError(null)
    setLoading(false)
    setSaving(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const galleryIds = galleryImages
        .map((item) => item.fileId)
        .filter((id): id is number => typeof id === "number" && !Number.isNaN(id))

      const payload: Record<string, any> = {
        brand: form.brand,
        model: form.model,
        positioning: form.positioning,
        principle: form.principle,
        safetyNotes: form.safetyNotes || null,
        heroImageFileId: heroImage.fileId,
        galleryImageFileIds: galleryIds,
        seo: prepareSeoPayload(seo),
      }

      const url = deviceId ? `/api/admin/catalog/devices/${deviceId}` : `/api/admin/catalog/devices`
      const method = deviceId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      onCompleted()
      setOpen(false)
      resetState()
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  const title = deviceId ? `Редактировать аппарат #${deviceId}` : "Новый аппарат"

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next)
      if (!next) resetState()
    }}>
      <DialogTrigger asChild>
        <Button variant={deviceId ? "outline" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Заполните карточку аппарата и прикрепите фото.</DialogDescription>
        </DialogHeader>
        {loading && <div className="text-sm text-muted-foreground">Загрузка...</div>}
        {!loading && (
          <form className="space-y-4 py-4" onSubmit={submit}>
            <div className="grid gap-3">
              <Input value={form.brand} onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))} placeholder="Бренд" required />
              <Input value={form.model} onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))} placeholder="Модель" required />
              <Textarea value={form.positioning} onChange={(e) => setForm((prev) => ({ ...prev, positioning: e.target.value }))} placeholder="Позиционирование" required />
              <Textarea value={form.principle} onChange={(e) => setForm((prev) => ({ ...prev, principle: e.target.value }))} placeholder="Принцип работы" required />
              <Textarea value={form.safetyNotes} onChange={(e) => setForm((prev) => ({ ...prev, safetyNotes: e.target.value }))} placeholder="Заметки по безопасности" />
            </div>
            <ImageField
              label="Обложка аппарата"
              description="Покажите устройство целиком — это фото увидят на странице аппарата."
              value={heroImage}
              onChange={setHeroImage}
            />
            <ImageListField
              title="Галерея"
              description="Добавьте ракурсы, рабочие моменты и детали."
              items={galleryImages}
              onChange={setGalleryImages}
              emptyHint="Добавьте хотя бы один кадр"
            />
            <SeoFields value={seo} onChange={setSeo} />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Сохраняю..." : "Сохранить"}</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

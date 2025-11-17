"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"

type DeviceDetail = {
  id: number
  brand: string
  model: string
  positioning: string
  principle: string
  safetyNotes?: string | null
  heroImageFileId?: number | null
  heroImage?: { fileId?: number | null } | null
  images?: Array<{ purpose: "HERO" | "GALLERY"; file?: { id: number } }>
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
  const [heroId, setHeroId] = useState<number | null>(null)
  const [gallery, setGallery] = useState("")
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
      .then((data: DeviceDetailResponse) => {
        const heroFromImages = data.images?.find((img) => img.purpose === "HERO")?.file?.id ?? null
        const heroInline = data.heroImage?.fileId ?? null
        const galleryFromImages = (data.images
          ?.filter((img) => img.purpose === "GALLERY")
          .map((img) => img.file?.id)
          .filter(Boolean) as number[] | undefined) || []
        const galleryFromField = data.galleryImageFileIds
        const galleryIds = (galleryFromField ?? galleryFromImages).filter(Boolean)
        setForm({
          brand: data.brand ?? "",
          model: data.model ?? "",
          positioning: data.positioning ?? "",
          principle: data.principle ?? "",
          safetyNotes: data.safetyNotes ?? "",
        })
        setHeroId(data.heroImageFileId ?? heroInline ?? heroFromImages ?? null)
        setGallery((galleryIds ?? []).join(", "))
        setSeo(data.seo ?? defaultSeoState)
      })
      .catch((e: any) => setError(e.message || "Не удалось загрузить данные"))
      .finally(() => setLoading(false))
  }, [open, deviceId])

  function resetState() {
    setForm({ brand: "", model: "", positioning: "", principle: "", safetyNotes: "" })
    setHeroId(null)
    setGallery("")
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
      const galleryIds = gallery
        .split(",")
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => Number(chunk))
        .filter((n) => !Number.isNaN(n))

      const payload: Record<string, any> = {
        brand: form.brand,
        model: form.model,
        positioning: form.positioning,
        principle: form.principle,
        safetyNotes: form.safetyNotes || null,
        heroImageFileId: heroId,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Поля POST/PUT /admin/catalog/devices</DialogDescription>
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
            <div className="space-y-2">
              <div className="text-sm font-medium">HERO изображение</div>
              <div className="flex gap-2">
                <Input type="number" value={heroId ?? ""} onChange={(e) => setHeroId(e.target.value ? Number(e.target.value) : null)} placeholder="ID файла" />
                <Button type="button" variant="outline" onClick={() => setHeroId(null)}>Очистить</Button>
              </div>
              <FileUploader onUploaded={(file) => setHeroId(file.id)} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Галерея (через запятую)</div>
              <Textarea value={gallery} onChange={(e) => setGallery(e.target.value)} placeholder="401, 402" />
              <FileUploader onUploaded={(file) => setGallery((prev) => (prev ? `${prev}, ${file.id}` : String(file.id)))} />
            </div>
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

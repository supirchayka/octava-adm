"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"

const priceTypes = ["BASE", "EXTRA", "PACKAGE"]

export type CategoryOption = { id: number; name: string }
export type DeviceOption = { id: number; label: string }

type ServiceDetail = {
  id: number
  categoryId: number
  name: string
  shortOffer?: string | null
  priceFrom?: number | null
  durationMinutes?: number | null
  benefit1?: string | null
  benefit2?: string | null
  ctaText?: string | null
  ctaUrl?: string | null
  sortOrder?: number | null
  heroImageFileId?: number | null
  heroImage?: { fileId?: number | null } | null
  galleryImageFileIds?: number[] | null
  images?: Array<{ purpose: "HERO" | "GALLERY"; order: number; file?: { id: number } }>
  devices?: Array<{ deviceId?: number | null; device?: { id: number } }>
  usedDevices?: Array<{ id?: number; deviceId?: number; device?: { id: number } } | number>
  servicePricesExtended?: Array<{
    id: number
    title: string
    price: number
    durationMinutes?: number | null
    type?: string | null
    sessionsCount?: number | null
    order?: number | null
    isActive?: boolean | null
  }>
  pricesExtended?: Array<{
    id: number
    title: string
    price: number
    durationMinutes?: number | null
    type?: string | null
    sessionsCount?: number | null
    order?: number | null
    isActive?: boolean | null
  }>
  seo?: SeoState
}

type PriceRow = {
  title: string
  price: string
  durationMinutes: string
  type: string
  sessionsCount: string
  order: string
  isActive: boolean
}

interface Props {
  categoryId: number
  categories: CategoryOption[]
  devices: DeviceOption[]
  triggerLabel: string
  serviceId?: number
  serviceSlug?: string
  onCompleted: () => void
  disabled?: boolean
}

export function ServiceFormDialog({
  categoryId,
  categories,
  devices,
  triggerLabel,
  serviceId,
  serviceSlug,
  onCompleted,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    categoryId,
    name: "",
    shortOffer: "",
    priceFrom: "",
    durationMinutes: "",
    benefit1: "",
    benefit2: "",
    ctaText: "",
    ctaUrl: "",
    sortOrder: "",
  })
  const [heroId, setHeroId] = useState<number | null>(null)
  const [gallery, setGallery] = useState("")
  const [selectedDevices, setSelectedDevices] = useState<number[]>([])
  const [prices, setPrices] = useState<PriceRow[]>([])
  const [seo, setSeo] = useState<SeoState>(defaultSeoState)

  useEffect(() => {
    if (!serviceId) {
      setForm((prev) => ({ ...prev, categoryId }))
    }
  }, [categoryId, serviceId])

  useEffect(() => {
    if (!open) return
    const identifier = serviceId ? String(serviceId) : serviceSlug
    if (!identifier) return
    setLoading(true)
    fetch(`/api/admin/catalog/services/${identifier}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((data: ServiceDetail) => {
        const heroFromImages = data.images?.find((img) => img.purpose === "HERO")?.file?.id ?? null
        const heroFromInline = data.heroImage?.fileId ?? null
        const galleryFromImages = (data.images
          ?.filter((img) => img.purpose === "GALLERY")
          .map((img) => img.file?.id)
          .filter(Boolean) as number[] | undefined) || []
        const galleryFromField = data.galleryImageFileIds
        const galleryIds = (galleryFromField ?? galleryFromImages).filter(Boolean)
        const priceSource = data.servicePricesExtended ?? data.pricesExtended ?? []
        const devicesSource = data.usedDevices ?? data.devices ?? []
        setForm({
          categoryId: data.categoryId,
          name: data.name ?? "",
          shortOffer: data.shortOffer ?? "",
          priceFrom: data.priceFrom?.toString() ?? "",
          durationMinutes: data.durationMinutes?.toString() ?? "",
          benefit1: data.benefit1 ?? "",
          benefit2: data.benefit2 ?? "",
          ctaText: data.ctaText ?? "",
          ctaUrl: data.ctaUrl ?? "",
          sortOrder: data.sortOrder?.toString() ?? "",
        })
        setHeroId(data.heroImageFileId ?? heroFromInline ?? heroFromImages ?? null)
        setGallery((galleryIds ?? []).join(", "))
        setSelectedDevices(
          devicesSource
            .map((d) => {
              if (typeof d === "number") return d
              if (d?.deviceId) return d.deviceId
              if (d?.device?.id) return d.device.id
              if (d?.id && typeof d.id === "number") return d.id
              return null
            })
            .filter((id): id is number => typeof id === "number" && !Number.isNaN(id))
        )
        setPrices(
          priceSource.map((row) => ({
            title: row.title || "",
            price: row.price?.toString() || "",
            durationMinutes: row.durationMinutes?.toString() || "",
            type: row.type || "BASE",
            sessionsCount: row.sessionsCount?.toString() || "",
            order: row.order?.toString() || "",
            isActive: row.isActive ?? true,
          }))
        )
        setSeo(data.seo ?? defaultSeoState)
      })
      .catch((e: any) => setError(e.message || "Не удалось загрузить услугу"))
      .finally(() => setLoading(false))
  }, [open, serviceId, serviceSlug])

  function resetState() {
    setForm({
      categoryId,
      name: "",
      shortOffer: "",
      priceFrom: "",
      durationMinutes: "",
      benefit1: "",
      benefit2: "",
      ctaText: "",
      ctaUrl: "",
      sortOrder: "",
    })
    setHeroId(null)
    setGallery("")
    setSelectedDevices([])
    setPrices([])
    setSeo(defaultSeoState)
    setError(null)
    setLoading(false)
    setSaving(false)
  }

  function updateForm(key: keyof typeof form, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleDevice(id: number) {
    setSelectedDevices((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  function updatePriceRow(index: number, field: keyof PriceRow, value: string | boolean) {
    setPrices((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function addPriceRow() {
    setPrices((prev) => [...prev, { title: "", price: "", durationMinutes: "", type: "BASE", sessionsCount: "", order: "", isActive: true }])
  }

  function removePriceRow(index: number) {
    setPrices((prev) => prev.filter((_, i) => i !== index))
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
        categoryId: Number(form.categoryId),
        name: form.name,
        shortOffer: form.shortOffer || null,
        priceFrom: form.priceFrom ? Number(form.priceFrom) : null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        benefit1: form.benefit1 || null,
        benefit2: form.benefit2 || null,
        ctaText: form.ctaText || null,
        ctaUrl: form.ctaUrl || null,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : null,
        heroImageFileId: heroId,
        galleryImageFileIds: galleryIds,
        usedDeviceIds: selectedDevices,
        servicePricesExtended: prices
          .filter((row) => row.title && row.price)
          .map((row) => ({
            title: row.title,
            price: Number(row.price),
            durationMinutes: row.durationMinutes ? Number(row.durationMinutes) : undefined,
            type: row.type,
            sessionsCount: row.sessionsCount ? Number(row.sessionsCount) : undefined,
            order: row.order ? Number(row.order) : undefined,
            isActive: row.isActive,
          })),
        seo: prepareSeoPayload(seo),
      }

      const url = serviceId ? `/api/admin/catalog/services/${serviceId}` : `/api/admin/catalog/services`
      const method = serviceId ? "PUT" : "POST"
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

  const title = serviceId ? "Редактировать услугу" : "Новая услуга"

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next)
      if (!next) resetState()
    }}>
      <DialogTrigger asChild>
        <Button variant={serviceId ? "outline" : "default"} disabled={disabled}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Поля соответствуют /admin/catalog/services (см. ТЗ)</DialogDescription>
        </DialogHeader>
        {loading && <div className="text-sm text-muted-foreground">Загрузка...</div>}
        {!loading && (
          <form className="space-y-4 py-4" onSubmit={submit}>
            <div>
              <label className="text-sm">Категория</label>
              <Select value={String(form.categoryId)} onValueChange={(value) => updateForm("categoryId", Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="text-sm">Название*</label>
                <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} required />
              </div>
              <div>
                <label className="text-sm">Короткий оффер</label>
                <Textarea value={form.shortOffer} onChange={(e) => updateForm("shortOffer", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Цена от</label>
                  <Input type="number" value={form.priceFrom} onChange={(e) => updateForm("priceFrom", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm">Длительность (мин)</label>
                  <Input type="number" value={form.durationMinutes} onChange={(e) => updateForm("durationMinutes", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Преимущество 1</label>
                  <Input value={form.benefit1} onChange={(e) => updateForm("benefit1", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm">Преимущество 2</label>
                  <Input value={form.benefit2} onChange={(e) => updateForm("benefit2", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">CTA текст</label>
                  <Input value={form.ctaText} onChange={(e) => updateForm("ctaText", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm">CTA URL</label>
                  <Input value={form.ctaUrl} onChange={(e) => updateForm("ctaUrl", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm">Порядок сортировки</label>
                <Input type="number" value={form.sortOrder} onChange={(e) => updateForm("sortOrder", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">HERO изображение</div>
              <div className="flex gap-2">
                <Input type="number" value={heroId ?? ""} onChange={(e) => setHeroId(e.target.value ? Number(e.target.value) : null)} placeholder="ID файла" />
                <Button type="button" variant="outline" onClick={() => setHeroId(null)}>Очистить</Button>
              </div>
              <FileUploader onUploaded={(file) => setHeroId(file.id)} />
              {heroId && <div className="text-xs text-muted-foreground">Текущее HERO id={heroId}</div>}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Галерея (через запятую)</div>
              <Textarea value={gallery} onChange={(e) => setGallery(e.target.value)} placeholder="123, 456, 789" />
              <FileUploader onUploaded={(file) => setGallery((prev) => (prev ? `${prev}, ${file.id}` : String(file.id)))} />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Аппараты</div>
              <div className="grid gap-2">
                {devices.map((device) => (
                  <label key={device.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedDevices.includes(device.id)} onChange={() => toggleDevice(device.id)} />
                    {device.label}
                  </label>
                ))}
                {!devices.length && <div className="text-xs text-muted-foreground">Нет загруженных аппаратов</div>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Расширенные цены</div>
                <Button type="button" variant="outline" onClick={addPriceRow}>Добавить</Button>
              </div>
              {!prices.length && <div className="text-xs text-muted-foreground">Не добавлено ни одной строки</div>}
              {prices.map((row, index) => (
                <div key={index} className="rounded-xl border p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm">Вариант #{index + 1}</div>
                    <Button type="button" variant="ghost" onClick={() => removePriceRow(index)}>Удалить</Button>
                  </div>
                  <div className="grid gap-2">
                    <Input value={row.title} onChange={(e) => updatePriceRow(index, "title", e.target.value)} placeholder="Название" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" value={row.price} onChange={(e) => updatePriceRow(index, "price", e.target.value)} placeholder="Цена" />
                      <Input type="number" value={row.durationMinutes} onChange={(e) => updatePriceRow(index, "durationMinutes", e.target.value)} placeholder="Длительность" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={row.type} onValueChange={(value) => updatePriceRow(index, "type", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priceTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" value={row.sessionsCount} onChange={(e) => updatePriceRow(index, "sessionsCount", e.target.value)} placeholder="Кол-во сеансов" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" value={row.order} onChange={(e) => updatePriceRow(index, "order", e.target.value)} placeholder="Порядок" />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={row.isActive} onChange={(e) => updatePriceRow(index, "isActive", e.target.checked)} />
                        Активен
                      </label>
                    </div>
                  </div>
                </div>
              ))}
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

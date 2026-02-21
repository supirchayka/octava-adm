"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { ImageField, type SimpleImageValue } from "@/components/image-field"
import { ImageListField } from "@/components/image-list-field"
import { asNumber, resolveMediaFileId, resolveMediaPreviewUrl } from "@/lib/media"
import { unwrapData } from "@/lib/utils"

const priceTypes = ["BASE", "EXTRA", "PACKAGE"]

export type CategoryOption = { id: number; name: string }
export type DeviceOption = { id: number; label: string }
export type SpecialistOption = { id: number; label: string }

type ServiceDetail = {
  id: number
  categoryId: number
  name: string
  shortOffer?: string | null
  about?: string | null
  priceFrom?: number | null
  durationMinutes?: number | null
  benefit1?: string | null
  benefit2?: string | null
  ctaText?: string | null
  ctaUrl?: string | null
  sortOrder?: number | null
  heroImageFileId?: number | null
  heroImage?: {
    id?: number | null
    fileId?: number | null
    file?: { id?: number | null; path?: string | null; url?: string | null } | null
    path?: string | null
    url?: string | null
  } | null
  galleryImageFileIds?: number[] | null
  images?: Array<{
    id?: number | null
    fileId?: number | null
    purpose: "HERO" | "GALLERY"
    order: number
    file?: { id?: number | null; path?: string | null; url?: string | null } | null
    path?: string | null
    url?: string | null
  }>
  devices?: Array<{ deviceId?: number | null; device?: { id: number } }>
  usedDevices?: Array<{ id?: number; deviceId?: number; device?: { id: number } } | number>
  specialistIds?: number[] | null
  specialists?: Array<{ id?: number | null; specialistId?: number | null; specialist?: { id?: number | null } }>
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
  indications?: string[] | null
  contraindications?: string[] | null
  preparationSteps?: string[] | null
  rehabSteps?: string[] | null
  preparationChecklist?: Array<{ text?: string | null }>
  rehabChecklist?: Array<{ text?: string | null }>
  faq?: Array<{
    id?: number
    question?: string | null
    answer?: string | null
    order?: number | null
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

type FaqRow = {
  question: string
  answer: string
}

type ServicePricePayload = {
  title: string
  price: number
  durationMinutes?: number
  type?: string
  sessionsCount?: number
  order?: number
  isActive?: boolean
}

type ServicePayload = {
  categoryId: number
  name: string
  shortOffer: string | null
  about: string | null
  priceFrom: number | null
  durationMinutes: number | null
  benefit1: string | null
  benefit2: string | null
  ctaText: string | null
  ctaUrl: string | null
  sortOrder: number | null
  heroImageFileId: number | null
  galleryImageFileIds: number[]
  usedDeviceIds: number[]
  specialistIds: number[]
  servicePricesExtended: ServicePricePayload[]
  indications: string[]
  contraindications: string[]
  preparationSteps: string[]
  rehabSteps: string[]
  faq: FaqRow[]
  seo?: ReturnType<typeof prepareSeoPayload>
}

interface Props {
  categoryId: number
  categories: CategoryOption[]
  devices: DeviceOption[]
  specialists: SpecialistOption[]
  triggerLabel: string
  serviceId?: number
  onCompleted: () => void
  disabled?: boolean
}

export function ServiceFormDialog({
  categoryId,
  categories,
  devices,
  specialists,
  triggerLabel,
  serviceId,
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
    about: "",
    priceFrom: "",
    durationMinutes: "",
    benefit1: "",
    benefit2: "",
    ctaText: "",
    ctaUrl: "",
    sortOrder: "",
  })
  const [heroImage, setHeroImage] = useState<SimpleImageValue>({ id: null, fileId: null, previewUrl: null })
  const [galleryImages, setGalleryImages] = useState<SimpleImageValue[]>([])
  const [selectedDevices, setSelectedDevices] = useState<number[]>([])
  const [selectedSpecialists, setSelectedSpecialists] = useState<number[]>([])
  const [prices, setPrices] = useState<PriceRow[]>([])
  const [indications, setIndications] = useState<string[]>([])
  const [contraindications, setContraindications] = useState<string[]>([])
  const [preparationSteps, setPreparationSteps] = useState<string[]>([])
  const [rehabSteps, setRehabSteps] = useState<string[]>([])
  const [faqRows, setFaqRows] = useState<FaqRow[]>([])
  const [seo, setSeo] = useState<SeoState>(defaultSeoState)

  useEffect(() => {
    if (!serviceId) {
      setForm((prev) => ({ ...prev, categoryId }))
    }
  }, [categoryId, serviceId])

  useEffect(() => {
    if (!open) return
    if (!serviceId) return
    setLoading(true)
    fetch(`/api/admin/catalog/services/${serviceId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((payload: ServiceDetail) => {
        const data = unwrapData<ServiceDetail>(payload)
        const heroFromImages = data.images?.find((img) => img.purpose === "HERO")
        const heroFileId =
          data.heroImageFileId ??
          resolveMediaFileId(data.heroImage) ??
          resolveMediaFileId(heroFromImages) ??
          null
        const galleryFromImages = (data.images ?? [])
          .filter((img) => img.purpose === "GALLERY")
          .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
        const galleryFromField = data.galleryImageFileIds ?? []
        const priceSource = data.servicePricesExtended ?? data.pricesExtended ?? []
        const devicesSource = data.usedDevices ?? data.devices ?? []
        const specialistsSource = data.specialistIds ?? []
        const specialistsFromRelations = (data.specialists ?? [])
          .map((item) => asNumber(item?.id ?? item?.specialistId ?? item?.specialist?.id))
          .filter((id): id is number => typeof id === "number")
        setForm({
          categoryId: data.categoryId,
          name: data.name ?? "",
          shortOffer: data.shortOffer ?? "",
          about: data.about ?? "",
          priceFrom: data.priceFrom?.toString() ?? "",
          durationMinutes: data.durationMinutes?.toString() ?? "",
          benefit1: data.benefit1 ?? "",
          benefit2: data.benefit2 ?? "",
          ctaText: data.ctaText ?? "",
          ctaUrl: data.ctaUrl ?? "",
          sortOrder: data.sortOrder?.toString() ?? "",
        })
        setHeroImage({
          id: resolveMediaFileId(heroFromImages) ?? resolveMediaFileId(data.heroImage),
          fileId: heroFileId ?? null,
          previewUrl: resolveMediaPreviewUrl(heroFromImages) ?? resolveMediaPreviewUrl(data.heroImage),
        })
        if (galleryFromImages.length) {
          setGalleryImages(
            galleryFromImages.map((img) => ({
              id: resolveMediaFileId(img),
              fileId: resolveMediaFileId(img),
              previewUrl: resolveMediaPreviewUrl(img),
            }))
          )
        } else {
          setGalleryImages(
            (galleryFromField || []).map((fileId) => ({
              id: null,
              fileId: fileId ?? null,
              previewUrl: null,
            }))
          )
        }
        setSelectedDevices(
          devicesSource
            .map((d) => {
              if (typeof d === "number") return d
              if ("deviceId" in d && d.deviceId) return d.deviceId
              if ("device" in d && d.device?.id) return d.device.id
              if ("id" in d && typeof d.id === "number") return d.id
              return null
            })
            .filter((id): id is number => typeof id === "number" && !Number.isNaN(id))
        )
        setSelectedSpecialists(
          Array.from(
            new Set(
              [...specialistsSource, ...specialistsFromRelations]
                .map((id) => asNumber(id))
                .filter((id): id is number => typeof id === "number" && !Number.isNaN(id))
            )
          )
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
        setIndications((data.indications ?? []).filter((item): item is string => typeof item === "string"))
        setContraindications((data.contraindications ?? []).filter((item): item is string => typeof item === "string"))
        const prepSource = Array.isArray(data.preparationSteps)
          ? data.preparationSteps
          : (data.preparationChecklist ?? []).map((item) => item?.text ?? "")
        const rehabSource = Array.isArray(data.rehabSteps)
          ? data.rehabSteps
          : (data.rehabChecklist ?? []).map((item) => item?.text ?? "")
        setPreparationSteps(prepSource.filter((item): item is string => typeof item === "string"))
        setRehabSteps(rehabSource.filter((item): item is string => typeof item === "string"))
        setFaqRows(
          (data.faq ?? []).map((item) => ({
            question: item.question ?? "",
            answer: item.answer ?? "",
          }))
        )
        setSeo(data.seo ?? defaultSeoState)
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : "Не удалось загрузить услугу"
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [open, serviceId])

  function resetState() {
    setForm({
      categoryId,
      name: "",
      shortOffer: "",
      about: "",
      priceFrom: "",
      durationMinutes: "",
      benefit1: "",
      benefit2: "",
      ctaText: "",
      ctaUrl: "",
      sortOrder: "",
    })
    setHeroImage({ id: null, fileId: null, previewUrl: null })
    setGalleryImages([])
    setSelectedDevices([])
    setSelectedSpecialists([])
    setPrices([])
    setIndications([])
    setContraindications([])
    setPreparationSteps([])
    setRehabSteps([])
    setFaqRows([])
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

  function toggleSpecialist(id: number) {
    setSelectedSpecialists((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
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

  function addTextRow(setter: Dispatch<SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""])
  }

  function updateTextRow(setter: Dispatch<SetStateAction<string[]>>, index: number, value: string) {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function removeTextRow(setter: Dispatch<SetStateAction<string[]>>, index: number) {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  function addFaqRow() {
    setFaqRows((prev) => [...prev, { question: "", answer: "" }])
  }

  function updateFaqRow(index: number, field: keyof FaqRow, value: string) {
    setFaqRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function removeFaqRow(index: number) {
    setFaqRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const galleryIds = galleryImages
        .map((item) => item.fileId)
        .filter((id): id is number => typeof id === "number" && !Number.isNaN(id))

      const payload: ServicePayload = {
        categoryId: Number(form.categoryId),
        name: form.name,
        shortOffer: form.shortOffer || null,
        about: form.about || null,
        priceFrom: form.priceFrom ? Number(form.priceFrom) : null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        benefit1: form.benefit1 || null,
        benefit2: form.benefit2 || null,
        ctaText: form.ctaText || null,
        ctaUrl: form.ctaUrl || null,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : null,
        heroImageFileId: heroImage.fileId,
        galleryImageFileIds: galleryIds,
        usedDeviceIds: selectedDevices,
        specialistIds: selectedSpecialists,
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
        indications: indications.map((value) => value.trim()).filter(Boolean),
        contraindications: contraindications.map((value) => value.trim()).filter(Boolean),
        preparationSteps: preparationSteps.map((value) => value.trim()).filter(Boolean),
        rehabSteps: rehabSteps.map((value) => value.trim()).filter(Boolean),
        faq: faqRows
          .map((row) => ({
            question: row.question.trim(),
            answer: row.answer.trim(),
          }))
          .filter((row) => row.question.length > 0 && row.answer.length > 0),
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Ошибка сохранения"
      setError(message)
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Заполните карточку услуги: текст, визуал, аппараты и SEO.</DialogDescription>
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
              <div>
                <label className="text-sm">Описание услуги</label>
                <Textarea value={form.about} onChange={(e) => updateForm("about", e.target.value)} rows={4} />
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
                  <Textarea value={form.benefit1} onChange={(e) => updateForm("benefit1", e.target.value)} rows={3} />
                </div>
                <div>
                  <label className="text-sm">Преимущество 2</label>
                  <Textarea value={form.benefit2} onChange={(e) => updateForm("benefit2", e.target.value)} rows={3} />
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

            <ImageField
              label="Обложка услуги"
              description="Покажите процедуру крупным планом — этот кадр увидят в каталоге и на странице."
              value={heroImage}
              onChange={setHeroImage}
            />

            <ImageListField
              title="Галерея"
              description="Добавьте несколько кадров, чтобы рассказать историю процедуры. Порядок сохранится."
              items={galleryImages}
              onChange={setGalleryImages}
              emptyHint="Пока нет фотографий — добавьте первую"
            />

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

            <div className="space-y-2">
              <div className="text-sm font-medium">Специалисты</div>
              <div className="grid gap-2">
                {specialists.map((specialist) => (
                  <label key={specialist.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSpecialists.includes(specialist.id)}
                      onChange={() => toggleSpecialist(specialist.id)}
                    />
                    {specialist.label}
                  </label>
                ))}
                {!specialists.length && <div className="text-xs text-muted-foreground">Нет загруженных специалистов</div>}
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Показания</div>
                <Button type="button" variant="outline" onClick={() => addTextRow(setIndications)}>
                  Добавить показание
                </Button>
              </div>
              {!indications.length && <div className="text-xs text-muted-foreground">Не добавлено ни одного пункта</div>}
              {indications.map((value, index) => (
                <div key={`indication-${index}`} className="space-y-2 rounded-xl border p-3">
                  <Textarea value={value} onChange={(e) => updateTextRow(setIndications, index, e.target.value)} rows={3} />
                  <Button type="button" variant="ghost" onClick={() => removeTextRow(setIndications, index)}>
                    Удалить
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Противопоказания</div>
                <Button type="button" variant="outline" onClick={() => addTextRow(setContraindications)}>
                  Добавить противопоказание
                </Button>
              </div>
              {!contraindications.length && <div className="text-xs text-muted-foreground">Не добавлено ни одного пункта</div>}
              {contraindications.map((value, index) => (
                <div key={`contraindication-${index}`} className="space-y-2 rounded-xl border p-3">
                  <Textarea value={value} onChange={(e) => updateTextRow(setContraindications, index, e.target.value)} rows={3} />
                  <Button type="button" variant="ghost" onClick={() => removeTextRow(setContraindications, index)}>
                    Удалить
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Как подготовиться</div>
                <Button type="button" variant="outline" onClick={() => addTextRow(setPreparationSteps)}>
                  Добавить шаг
                </Button>
              </div>
              {!preparationSteps.length && <div className="text-xs text-muted-foreground">Не добавлено ни одного шага</div>}
              {preparationSteps.map((value, index) => (
                <div key={`prep-${index}`} className="space-y-2 rounded-xl border p-3">
                  <Textarea value={value} onChange={(e) => updateTextRow(setPreparationSteps, index, e.target.value)} rows={3} />
                  <Button type="button" variant="ghost" onClick={() => removeTextRow(setPreparationSteps, index)}>
                    Удалить
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">После процедуры</div>
                <Button type="button" variant="outline" onClick={() => addTextRow(setRehabSteps)}>
                  Добавить шаг
                </Button>
              </div>
              {!rehabSteps.length && <div className="text-xs text-muted-foreground">Не добавлено ни одного шага</div>}
              {rehabSteps.map((value, index) => (
                <div key={`rehab-${index}`} className="space-y-2 rounded-xl border p-3">
                  <Textarea value={value} onChange={(e) => updateTextRow(setRehabSteps, index, e.target.value)} rows={3} />
                  <Button type="button" variant="ghost" onClick={() => removeTextRow(setRehabSteps, index)}>
                    Удалить
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Частые вопросы</div>
                <Button type="button" variant="outline" onClick={addFaqRow}>
                  Добавить вопрос
                </Button>
              </div>
              {!faqRows.length && <div className="text-xs text-muted-foreground">Не добавлено ни одного вопроса</div>}
              {faqRows.map((row, index) => (
                <div key={`faq-${index}`} className="space-y-2 rounded-xl border p-3">
                  <div>
                    <label className="text-sm">Вопрос</label>
                    <Textarea value={row.question} onChange={(e) => updateFaqRow(index, "question", e.target.value)} rows={2} />
                  </div>
                  <div>
                    <label className="text-sm">Ответ</label>
                    <Textarea value={row.answer} onChange={(e) => updateFaqRow(index, "answer", e.target.value)} rows={3} />
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeFaqRow(index)}>
                    Удалить
                  </Button>
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

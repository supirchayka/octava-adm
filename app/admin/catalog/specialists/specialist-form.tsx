"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { ImageField, type SimpleImageValue } from "@/components/image-field"
import { asNumber, resolveMediaFileId, resolveMediaPreviewUrl } from "@/lib/media"
import { unwrapData } from "@/lib/utils"

export type ServiceOption = {
  id: number
  label: string
}

type SpecialistServiceLinkPayload = {
  serviceId: number
  sortOrder: number
}

type SpecialistDetail = {
  id: number
  firstName: string
  middleName?: string | null
  lastName: string
  specialization: string
  biography: string
  experienceYears: number
  sortOrder?: number | null
  photoFileId?: number | null
  photo?: {
    id?: number | null
    path?: string | null
    url?: string | null
    file?: { id?: number | null; path?: string | null; url?: string | null } | null
  } | null
  serviceIds?: number[] | null
  services?: Array<{
    id?: number | null
    serviceId?: number | null
    sortOrder?: number | null
    service?: { id?: number | null }
  }>
}

interface Props {
  specialistId?: number
  services: ServiceOption[]
  triggerLabel: string
  onCompleted: () => void
}

export function SpecialistFormDialog({ specialistId, services, triggerLabel, onCompleted }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    specialization: "",
    biography: "",
    experienceYears: "",
    sortOrder: "",
  })
  const [photo, setPhoto] = useState<SimpleImageValue>({ id: null, fileId: null, previewUrl: null })
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([])

  useEffect(() => {
    if (!open || !specialistId) return
    setLoading(true)
    setError(null)
    fetch(`/api/admin/catalog/specialists/${specialistId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((payload: SpecialistDetail) => {
        const data = unwrapData<SpecialistDetail>(payload)
        const serviceIds = data.serviceIds ?? []
        const serviceIdsFromRelations = [...(data.services ?? [])]
          .sort((a, b) => (a?.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b?.sortOrder ?? Number.MAX_SAFE_INTEGER))
          .map((item) => asNumber(item?.id ?? item?.serviceId ?? item?.service?.id))
          .filter((id): id is number => typeof id === "number")

        setForm({
          firstName: data.firstName ?? "",
          middleName: data.middleName ?? "",
          lastName: data.lastName ?? "",
          specialization: data.specialization ?? "",
          biography: normalizeBiographyForEditor(data.biography ?? ""),
          experienceYears: data.experienceYears?.toString() ?? "",
          sortOrder: data.sortOrder?.toString() ?? "",
        })
        setPhoto({
          id: resolveMediaFileId(data.photo),
          fileId: asNumber(data.photoFileId) ?? resolveMediaFileId(data.photo),
          previewUrl: resolveMediaPreviewUrl(data.photo),
        })
        setSelectedServiceIds(
          Array.from(
            new Set(
              [...serviceIds, ...serviceIdsFromRelations]
                .map((id) => asNumber(id))
                .filter((id): id is number => typeof id === "number" && !Number.isNaN(id))
            )
          )
        )
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : "Не удалось загрузить специалиста"
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [open, specialistId])

  function resetState() {
    setForm({
      firstName: "",
      middleName: "",
      lastName: "",
      specialization: "",
      biography: "",
      experienceYears: "",
      sortOrder: "",
    })
    setPhoto({ id: null, fileId: null, previewUrl: null })
    setSelectedServiceIds([])
    setError(null)
    setLoading(false)
    setSaving(false)
  }

  function toggleService(id: number) {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  function moveService(serviceId: number, direction: -1 | 1) {
    setSelectedServiceIds((prev) => {
      const currentIndex = prev.indexOf(serviceId)
      if (currentIndex === -1) return prev

      const nextIndex = currentIndex + direction
      if (nextIndex < 0 || nextIndex >= prev.length) return prev

      const next = [...prev]
      const [moved] = next.splice(currentIndex, 1)
      next.splice(nextIndex, 0, moved)
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const firstName = form.firstName.trim()
    const middleName = form.middleName.trim()
    const lastName = form.lastName.trim()
    const specialization = form.specialization.trim()
    const biography = normalizeBiographyForSubmit(form.biography)
    const biographyText = extractPlainTextFromHtml(biography)
    const experienceYears = Number(form.experienceYears)
    const sortOrderRaw = form.sortOrder.trim()
    const sortOrder = sortOrderRaw === "" ? null : Number(sortOrderRaw)

    if (!firstName || !lastName || !specialization || !biographyText) {
      setError("Заполните обязательные поля")
      setSaving(false)
      return
    }
    if (!Number.isFinite(experienceYears) || experienceYears < 0) {
      setError("Укажите корректный стаж")
      setSaving(false)
      return
    }
    if (sortOrder !== null && (!Number.isFinite(sortOrder) || !Number.isInteger(sortOrder))) {
      setError("Укажите корректный порядок сортировки")
      setSaving(false)
      return
    }
    if (!photo.fileId) {
      setError("Добавьте фото специалиста")
      setSaving(false)
      return
    }

    try {
      const payload = {
        firstName,
        middleName: middleName || null,
        lastName,
        specialization,
        biography,
        experienceYears,
        sortOrder,
        photoFileId: photo.fileId,
        serviceIds: selectedServiceIds,
        serviceLinks: selectedServiceIds.map<SpecialistServiceLinkPayload>((serviceId, index) => ({
          serviceId,
          sortOrder: index,
        })),
      }

      const url = specialistId ? `/api/admin/catalog/specialists/${specialistId}` : `/api/admin/catalog/specialists`
      const method = specialistId ? "PUT" : "POST"
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

  const title = specialistId ? `Редактировать специалиста #${specialistId}` : "Новый специалист"

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetState()
      }}
    >
      <DialogTrigger asChild>
        <Button variant={specialistId ? "outline" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Заполните профиль специалиста и выберите услуги, с которыми он работает.</DialogDescription>
        </DialogHeader>

        {loading && <div className="text-sm text-muted-foreground">Загрузка...</div>}
        {!loading && (
          <form className="space-y-4 py-4" onSubmit={submit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm">Имя</label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm">Фамилия</label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm">Отчество</label>
                <Input
                  value={form.middleName}
                  onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm">Специализация</label>
                <Input
                  value={form.specialization}
                  onChange={(e) => setForm((prev) => ({ ...prev, specialization: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm">Стаж (лет)</label>
                <Input
                  type="number"
                  value={form.experienceYears}
                  onChange={(e) => setForm((prev) => ({ ...prev, experienceYears: e.target.value }))}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="text-sm">Порядок сортировки</label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                  placeholder="Например, 10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm">Биография</label>
              <RichTextEditor
                value={form.biography}
                onChange={(value) => setForm((prev) => ({ ...prev, biography: value }))}
                placeholder="Опишите опыт, образование и подход специалиста."
                className="mt-1"
              />
            </div>

            <ImageField
              label="Фото специалиста"
              description="Загрузите портрет, который будет отображаться в карточке специалиста."
              value={photo}
              onChange={setPhoto}
              previewClassName="h-56 w-full rounded-lg object-cover object-top"
            />

            <div className="space-y-2">
              <div className="text-sm font-medium">Порядок услуг специалиста</div>
              {!selectedServiceIds.length && (
                <div className="text-xs text-muted-foreground">Выберите услуги ниже, затем настройте порядок.</div>
              )}
              {!!selectedServiceIds.length && (
                <div className="space-y-2">
                  {selectedServiceIds.map((serviceId, index) => (
                    <div key={serviceId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <div className="min-w-0 text-sm">
                        <span className="mr-2 text-xs text-muted-foreground">{index + 1}.</span>
                        <span className="truncate">{getServiceLabel(services, serviceId)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => moveService(serviceId, -1)} disabled={index === 0}>
                          Вверх
                        </Button>
                        <Button type="button" variant="outline" onClick={() => moveService(serviceId, 1)} disabled={index === selectedServiceIds.length - 1}>
                          Вниз
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Услуги</div>
              <div className="grid gap-2">
                {services.map((service) => (
                  <label key={service.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                    />
                    {service.label}
                  </label>
                ))}
                {!services.length && <div className="text-xs text-muted-foreground">Нет доступных услуг</div>}
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Сохраняю..." : "Сохранить"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Отмена
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function getServiceLabel(services: ServiceOption[], serviceId: number): string {
  return services.find((service) => service.id === serviceId)?.label ?? `#${serviceId}`
}

function normalizeBiographyForEditor(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (looksLikeHtml(trimmed)) return trimmed
  return plainTextToHtml(trimmed)
}

function normalizeBiographyForSubmit(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (looksLikeHtml(trimmed)) return trimmed
  return plainTextToHtml(trimmed)
}

function extractPlainTextFromHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function plainTextToHtml(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n")
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)

  return paragraphs.join("")
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

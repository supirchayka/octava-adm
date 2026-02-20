"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageField, type SimpleImageValue } from "@/components/image-field"
import { asNumber, resolveMediaFileId, resolveMediaPreviewUrl } from "@/lib/media"
import { unwrapData } from "@/lib/utils"

export type ServiceOption = {
  id: number
  label: string
}

type SpecialistDetail = {
  id: number
  firstName: string
  lastName: string
  specialization: string
  biography: string
  experienceYears: number
  photoFileId?: number | null
  photo?: {
    id?: number | null
    path?: string | null
    url?: string | null
    file?: { id?: number | null; path?: string | null; url?: string | null } | null
  } | null
  serviceIds?: number[] | null
  services?: Array<{ id?: number | null; serviceId?: number | null; service?: { id?: number | null } }>
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
    lastName: "",
    specialization: "",
    biography: "",
    experienceYears: "",
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
        const serviceIdsFromRelations = (data.services ?? [])
          .map((item) => asNumber(item?.id ?? item?.serviceId ?? item?.service?.id))
          .filter((id): id is number => typeof id === "number")

        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          specialization: data.specialization ?? "",
          biography: data.biography ?? "",
          experienceYears: data.experienceYears?.toString() ?? "",
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
      lastName: "",
      specialization: "",
      biography: "",
      experienceYears: "",
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const firstName = form.firstName.trim()
    const lastName = form.lastName.trim()
    const specialization = form.specialization.trim()
    const biography = form.biography.trim()
    const experienceYears = Number(form.experienceYears)

    if (!firstName || !lastName || !specialization || !biography) {
      setError("Заполните обязательные поля")
      setSaving(false)
      return
    }
    if (!Number.isFinite(experienceYears) || experienceYears < 0) {
      setError("Укажите корректный стаж")
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
        lastName,
        specialization,
        biography,
        experienceYears,
        photoFileId: photo.fileId,
        serviceIds: selectedServiceIds,
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
            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div>
              <label className="text-sm">Биография</label>
              <Textarea
                value={form.biography}
                onChange={(e) => setForm((prev) => ({ ...prev, biography: e.target.value }))}
                required
              />
            </div>

            <ImageField
              label="Фото специалиста"
              description="Загрузите портрет, который будет отображаться в карточке специалиста."
              value={photo}
              onChange={setPhoto}
            />

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

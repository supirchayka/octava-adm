"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { unwrapData } from "@/lib/utils"

interface Props {
  initialData: Record<string, unknown> | null
}

type ContactKeys = "phoneMain" | "email" | "telegramUrl" | "whatsappUrl" | "addressText" | "yandexMapUrl"

type WorkingHourState = {
  group: WorkingHourGroup
  open: string
  close: string
  isClosed: boolean
}

type WorkingHourGroup = "WEEKDAYS" | "SATURDAY" | "SUNDAY"

type MetroStationState = { name: string; line: string; distanceMeters: string }

const hourLabels: Record<WorkingHourGroup, string> = {
  WEEKDAYS: "Пн–Пт",
  SATURDAY: "Суббота",
  SUNDAY: "Воскресенье",
}

export function ContactsForm({ initialData }: Props) {
  const normalized = initialData ? unwrapData<Record<string, unknown>>(initialData) : null
  const getContactValue = (key: ContactKeys) => {
    const value = normalized?.[key]
    return typeof value === "string" ? value : ""
  }
  const [contacts, setContacts] = useState<Record<ContactKeys, string>>({
    phoneMain: getContactValue("phoneMain"),
    email: getContactValue("email"),
    telegramUrl: getContactValue("telegramUrl"),
    whatsappUrl: getContactValue("whatsappUrl"),
    addressText: getContactValue("addressText"),
    yandexMapUrl: getContactValue("yandexMapUrl"),
  })
  const [workingHours, setWorkingHours] = useState<WorkingHourState[]>(() => normalizeWorkingHours(normalized?.workingHours))
  const [metroStations, setMetroStations] = useState<MetroStationState[]>(() => normalizeStations(normalized?.metroStations))
  const [seo, setSeo] = useState<SeoState>(() => ((normalized?.seo as SeoState) ?? defaultSeoState))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateContact(key: ContactKeys, value: string) {
    setContacts((prev) => ({ ...prev, [key]: value }))
  }

  function updateWorkingHour(group: WorkingHourGroup, patch: Partial<WorkingHourState>) {
    setWorkingHours((prev) => prev.map((item) => (item.group === group ? { ...item, ...patch } : item)))
  }

  function updateStation(index: number, patch: Partial<MetroStationState>) {
    setMetroStations((prev) => prev.map((station, idx) => (idx === index ? { ...station, ...patch } : station)))
  }

  function addStation() {
    setMetroStations((prev) => [...prev, { name: "", line: "", distanceMeters: "" }])
  }

  function removeStation(index: number) {
    setMetroStations((prev) => prev.filter((_, idx) => idx !== index))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const hoursValid = workingHours.every((hour) => hour.isClosed || (hour.open && hour.close))
    if (!hoursValid) {
      setError("Для открытых дней нужно указать время работы")
      setSaving(false)
      return
    }

    try {
      const payload: Record<string, unknown> = {}
      ;(Object.keys(contacts) as ContactKeys[]).forEach((key) => {
        payload[key] = contacts[key] === "" ? null : contacts[key]
      })
      payload.workingHours = workingHours.map((hour) => ({
        group: hour.group,
        isClosed: hour.isClosed,
        open: hour.isClosed ? null : hour.open,
        close: hour.isClosed ? null : hour.close,
      }))
      payload.metroStations = metroStations
        .filter((station) => station.name || station.line || station.distanceMeters)
        .map((station) => ({
          name: station.name || null,
          line: station.line || null,
          distanceMeters: station.distanceMeters ? Number(station.distanceMeters) : null,
        }))
      const seoPayload = prepareSeoPayload(seo)
      if (seoPayload) payload.seo = seoPayload

      const res = await fetch(`/api/admin/pages/contacts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage("Контакты обновлены")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Не удалось сохранить страницу"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Контакты</h1>
        <p className="text-sm text-muted-foreground">Дайте гостям понятные телефоны, расписание и подсказки по метро.</p>
      </div>
      <form className="space-y-6" onSubmit={submit}>
        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Основные способы связи</h2>
            <p className="text-sm text-muted-foreground">Оставьте только актуальные каналы — остальное можно удалить.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Телефон ресепшена</label>
              <Input value={contacts.phoneMain} onChange={(e) => updateContact("phoneMain", e.target.value)} placeholder="+7 (999) 000-00-00" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={contacts.email} onChange={(e) => updateContact("email", e.target.value)} placeholder="clinic@example.ru" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Ссылка на Telegram</label>
              <Input type="url" value={contacts.telegramUrl} onChange={(e) => updateContact("telegramUrl", e.target.value)} placeholder="https://t.me/..." />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Ссылка на WhatsApp</label>
              <Input type="url" value={contacts.whatsappUrl} onChange={(e) => updateContact("whatsappUrl", e.target.value)} placeholder="https://wa.me/..." />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="text-sm font-medium">Как добраться</label>
              <Textarea value={contacts.addressText} onChange={(e) => updateContact("addressText", e.target.value)} placeholder="Укажите адрес, вход, ориентиры" />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="text-sm font-medium">Ссылка на карту (Яндекс)</label>
              <Input type="url" value={contacts.yandexMapUrl} onChange={(e) => updateContact("yandexMapUrl", e.target.value)} placeholder="https://yandex.ru/maps/..." />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Расписание</h2>
            <p className="text-sm text-muted-foreground">Отметьте, работает ли клиника в конкретный день и до скольки.</p>
          </div>
          <div className="grid gap-4">
            {workingHours.map((hour) => (
              <div key={hour.group} className="rounded-xl border p-4 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="font-medium">{hourLabels[hour.group]}</div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={hour.isClosed} onChange={(e) => updateWorkingHour(hour.group, { isClosed: e.target.checked })} />
                    Закрыто
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Открываемся</label>
                    <Input type="time" value={hour.open} disabled={hour.isClosed} onChange={(e) => updateWorkingHour(hour.group, { open: e.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Закрываемся</label>
                    <Input type="time" value={hour.close} disabled={hour.isClosed} onChange={(e) => updateWorkingHour(hour.group, { close: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Ближайшее метро</h2>
            <p className="text-sm text-muted-foreground">Добавьте станции и укажите примерное расстояние в метрах.</p>
          </div>
          <div className="space-y-4">
            {metroStations.map((station, index) => (
              <div key={index} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Станция {index + 1}</div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeStation(index)}>
                    Удалить
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Название</label>
                    <Input value={station.name} onChange={(e) => updateStation(index, { name: e.target.value })} placeholder="Например: Маяковская" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Линия</label>
                    <Input value={station.line} onChange={(e) => updateStation(index, { line: e.target.value })} placeholder="Зелёная линия" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Расстояние (м)</label>
                    <Input type="number" value={station.distanceMeters} onChange={(e) => updateStation(index, { distanceMeters: e.target.value })} placeholder="300" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addStation}>
              + Добавить станцию
            </Button>
          </div>
        </section>

        <SeoFields value={seo} onChange={setSeo} />
        {message && <div className="text-sm text-green-600">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Сохраняю..." : "Сохранить"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function normalizeWorkingHours(list: unknown): WorkingHourState[] {
  const entries: WorkingHourState[] = [
    { group: "WEEKDAYS", open: "", close: "", isClosed: false },
    { group: "SATURDAY", open: "", close: "", isClosed: false },
    { group: "SUNDAY", open: "", close: "", isClosed: true },
  ]
  if (!Array.isArray(list)) return entries
  return entries.map((entry) => {
    const found = list.find((item) => typeof item === "object" && item !== null && (item as { group?: unknown }).group === entry.group) as
      | { isClosed?: unknown; open?: unknown; close?: unknown }
      | undefined
    if (!found) return entry
    return {
      group: entry.group,
      isClosed: Boolean(found?.isClosed),
      open: found?.open ?? "",
      close: found?.close ?? "",
    }
  })
}

function normalizeStations(list: unknown): MetroStationState[] {
  if (!Array.isArray(list) || list.length === 0) {
    return [{ name: "", line: "", distanceMeters: "" }]
  }
  return list.map((item) => {
    if (typeof item !== "object" || item === null) {
      return { name: "", line: "", distanceMeters: "" }
    }
    const station = item as { name?: unknown; line?: unknown; distanceMeters?: unknown }
    return {
      name: typeof station.name === "string" ? station.name : "",
      line: typeof station.line === "string" ? station.line : "",
      distanceMeters:
        typeof station.distanceMeters === "number"
          ? String(station.distanceMeters)
          : typeof station.distanceMeters === "string"
            ? station.distanceMeters
            : "",
    }
  })
}

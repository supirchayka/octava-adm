"use client"

import { useEffect, useState } from "react"
import { backendURL } from "@/lib/utils"
import { ServiceFormDrawer, type CategoryOption, type DeviceOption } from "./service-form"

type Category = { id: number; slug: string; name: string; description: string | null }
type Service = {
  id: number; slug: string; name: string; shortOffer: string | null; priceFrom: number | null; durationMinutes: number | null
}

export default function ServicesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [slug, setSlug] = useState<string>("")
  const [services, setServices] = useState<Service[]>([])
  const [devices, setDevices] = useState<DeviceOption[]>([])

  useEffect(() => {
    fetch(`${backendURL()}/service-categories`, { cache: "no-store" as any })
      .then(r => r.json())
      .then((j: any[]) => setCats(j.map(x => ({ id: x.id, slug: x.slug, name: x.name, description: x.description }))))
  }, [])

  useEffect(() => {
    fetch(`/api/admin/catalog/devices`)
      .then(async res => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((j: any) => {
        const list = Array.isArray(j) ? j : j.items || []
        setDevices(list.map((d: any) => ({ id: d.id, label: `${d.brand} ${d.model}`.trim() })))
      })
      .catch(() => setDevices([]))
  }, [])

  async function loadServices(s: string) {
    setSlug(s)
    const res = await fetch(`${backendURL()}/service-categories/${s}`, { cache: "no-store" as any })
    if (!res.ok) { setServices([]); return }
    const j = await res.json()
    setServices(j.services || [])
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Услуги</h1>
      <div className="flex gap-2 items-end">
        <div className="grid">
          <label className="text-sm">Категория</label>
          <select className="border rounded-md h-10 px-3 min-w-[280px]" value={slug} onChange={e=>loadServices(e.target.value)}>
            <option value="">— выберите —</option>
            {cats.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <ServiceFormDrawer
          categoryId={cats.find((c) => c.slug === slug)?.id || 0}
          categories={cats as CategoryOption[]}
          devices={devices}
          triggerLabel="+ Добавить услугу"
          disabled={!slug}
          onCompleted={() => loadServices(slug)}
        />
      </div>

      {!slug && <p className="text-sm text-gray-500">Выберите категорию, чтобы увидеть список услуг.</p>}
      {slug && (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-2">Название</th>
                <th className="text-left p-2">Оффер</th>
                <th className="text-left p-2">Цена от</th>
                <th className="text-left p-2">Длительность</th>
                <th className="text-left p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.shortOffer || "—"}</td>
                  <td className="p-2">{s.priceFrom ?? "—"}</td>
                  <td className="p-2">{s.durationMinutes ?? "—"}</td>
                  <td className="p-2">
                    <ServiceFormDrawer
                      serviceId={s.id}
                      categoryId={cats.find((c) => c.slug === slug)?.id || 0}
                      categories={cats as CategoryOption[]}
                      devices={devices}
                      triggerLabel="Редактировать"
                      onCompleted={() => loadServices(slug)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-500">Создание/обновление услуг делается через POST/PUT /admin/catalog/services (см. ADMIN.md §4.2).</p>
    </div>
  )
}

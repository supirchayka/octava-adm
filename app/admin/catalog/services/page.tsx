"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ServiceFormDialog, type CategoryOption, type DeviceOption } from "./service-form"

type Category = { id: number; slug: string; name: string; description: string | null }
type Service = {
  id: number
  slug: string
  categoryId?: number
  name: string
  shortOffer: string | null
  priceFrom: number | null
  durationMinutes: number | null
}

export default function ServicesPage() {
  const searchParams = useSearchParams()
  const [cats, setCats] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [devices, setDevices] = useState<DeviceOption[]>([])
  const [servicesError, setServicesError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/catalog/categories`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((j: any) => {
        const list = Array.isArray(j) ? j : j.items || []
        setCats(list)
      })
      .catch(() => setCats([]))
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

  async function loadServices(categoryId: number | null) {
    if (!categoryId) {
      setSelectedCategoryId(null)
      setServices([])
      return
    }
    setSelectedCategoryId(categoryId)
    setServicesError(null)
    try {
      const res = await fetch(`/api/admin/catalog/services?categoryId=${categoryId}`)
      if (!res.ok) throw new Error(await res.text())
      const j = await res.json()
      const list = Array.isArray(j) ? j : j.items || j.services || []
      setServices(list)
    } catch (e: any) {
      setServices([])
      setServicesError(e.message || "Не удалось загрузить услуги")
    }
  }

  useEffect(() => {
    const param = searchParams.get("categoryId")
    if (param) {
      const numeric = Number(param)
      if (!Number.isNaN(numeric) && selectedCategoryId !== numeric) {
        loadServices(numeric)
      }
    }
  }, [searchParams, selectedCategoryId])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Услуги</h1>
      <div className="flex gap-2 items-end">
        <div className="grid">
          <label className="text-sm">Категория</label>
          <select
            className="border rounded-md h-10 px-3 min-w-[280px]"
            value={selectedCategoryId ?? ""}
            onChange={(e) => loadServices(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— выберите —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <ServiceFormDialog
          categoryId={selectedCategoryId || 0}
          categories={cats as CategoryOption[]}
          devices={devices}
          triggerLabel="+ Добавить услугу"
          disabled={!selectedCategoryId}
          onCompleted={() => loadServices(selectedCategoryId)}
        />
      </div>

      {!selectedCategoryId && <p className="text-sm text-gray-500">Выберите категорию, чтобы увидеть список услуг.</p>}
      {selectedCategoryId && servicesError && <div className="text-sm text-red-600">{servicesError}</div>}
      {selectedCategoryId && !servicesError && (
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
              {services.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.shortOffer || "—"}</td>
                  <td className="p-2">{s.priceFrom ?? "—"}</td>
                  <td className="p-2">{s.durationMinutes ?? "—"}</td>
                  <td className="p-2">
                    <ServiceFormDialog
                      serviceId={s.id}
                      categoryId={selectedCategoryId || s.categoryId || 0}
                      categories={cats as CategoryOption[]}
                      devices={devices}
                      triggerLabel="Редактировать"
                      onCompleted={() => loadServices(selectedCategoryId)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

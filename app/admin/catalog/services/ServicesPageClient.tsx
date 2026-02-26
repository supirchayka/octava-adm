"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ServiceFormDialog, type CategoryOption, type DeviceOption, type SpecialistOption } from "./service-form"

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

export default function ServicesPageClient() {
  const searchParams = useSearchParams()
  const [cats, setCats] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [devices, setDevices] = useState<DeviceOption[]>([])
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([])
  const [servicesError, setServicesError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/catalog/categories`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((payload: unknown) => {
        const list = parseList<Category>(payload)
        setCats(list)
      })
      .catch(() => setCats([]))
  }, [])

  useEffect(() => {
    fetch(`/api/admin/catalog/devices`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((payload: unknown) => {
        const list = parseList<DeviceOption & { brand?: string; model?: string }>(payload)
        setDevices(
          list
            .filter((d) => typeof d.id === "number" && (d as { brand?: string }).brand !== undefined)
            .map((d) => ({ id: d.id, label: `${(d as { brand?: string }).brand ?? ""} ${(d as { model?: string }).model ?? ""}`.trim() }))
        )
      })
      .catch(() => setDevices([]))
  }, [])

  useEffect(() => {
    fetch(`/api/admin/catalog/specialists`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((payload: unknown) => {
        const list = parseList<
          SpecialistOption & {
            firstName?: string | null
            middleName?: string | null
            lastName?: string | null
            specialization?: string | null
          }
        >(payload)
        setSpecialists(
          list
            .filter((item) => typeof item.id === "number")
            .map((item) => ({
              id: item.id,
              label:
                `${item.lastName ?? ""} ${item.firstName ?? ""} ${item.middleName ?? ""}`.trim() ||
                item.specialization ||
                `#${item.id}`,
            }))
        )
      })
      .catch(() => setSpecialists([]))
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
      const payload = await res.json()
      const list = parseList<Service>(payload, ["items", "services"])
      setServices(list)
    } catch (e: unknown) {
      setServices([])
      const message = e instanceof Error ? e.message : "Не удалось загрузить услуги"
      setServicesError(message)
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
          specialists={specialists}
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
                      specialists={specialists}
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

function parseList<T>(payload: unknown, keys: string[] = ["items"]): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    for (const key of keys) {
      const maybeList = (payload as Record<string, unknown>)[key]
      if (Array.isArray(maybeList)) return maybeList as T[]
    }
  }
  return []
}

"use client"

import { useEffect, useState } from "react"
import { DeviceFormDialog } from "./device-form"
import { DeviceFormDrawer } from "./device-form"

type Device = {
  id: number
  brand: string
  model: string
  slug: string
  updatedAt?: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDevices() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/devices`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDevices(Array.isArray(data) ? data : data.items || [])
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить аппараты")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Аппараты</h1>
          <p className="text-sm text-muted-foreground">CRUD для /admin/catalog/devices</p>
        </div>
        <DeviceFormDialog triggerLabel="+ Добавить аппарат" onCompleted={loadDevices} />
      </div>
      {loading && <div className="text-sm text-muted-foreground">Загрузка...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !devices.length && <div className="text-sm text-muted-foreground">Нет данных</div>}
      {!!devices.length && (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-2">Бренд</th>
                <th className="text-left p-2">Модель</th>
                <th className="text-left p-2">Slug</th>
                <th className="text-left p-2">Обновлено</th>
                <th className="text-left p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-t">
                  <td className="p-2">{device.brand}</td>
                  <td className="p-2">{device.model}</td>
                  <td className="p-2">{device.slug}</td>
                  <td className="p-2 text-muted-foreground">{device.updatedAt ? new Date(device.updatedAt).toLocaleString() : "—"}</td>
                  <td className="p-2">
                    <DeviceFormDialog deviceId={device.id} triggerLabel="Редактировать" onCompleted={loadDevices} />
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

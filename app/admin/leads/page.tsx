"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Lead = {
  id: number
  sourceType: "HOME" | "CONTACTS" | "SERVICE" | "DEVICE" | "OTHER"
  status: "NEW" | "IN_PROGRESS" | "DONE"
  serviceId?: number | null
  deviceId?: number | null
  name: string
  phone: string
  message?: string | null
  utmSource?: string | null
  createdAt: string
  service?: { id: number; name: string; slug: string } | null
  device?: { id: number; brand: string; model: string; slug: string } | null
}

type LeadsResponse = {
  items: Lead[]
  total: number
  page: number
  limit: number
  pages: number
}

export default function LeadsPage() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("")
  const [items, setItems] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(p))
    params.set("limit", "20")
    if (q) params.set("search", q)
    if (status) params.set("status", status)
    const res = await fetch(`/api/admin/leads?${params.toString()}`)
    const j: LeadsResponse = await res.json()
    setItems(j.items); setTotal(j.total); setPage(j.page)
    setLoading(false)
  }, [q, status])

  useEffect(() => { load(1) }, [load])

  async function setStatusFor(id: number, next: Lead["status"]) {
    await fetch(`/api/admin/leads/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next })
    })
    await load(page)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Лиды</h1>
      <div className="flex gap-2 items-end">
        <div className="grid">
          <label className="text-sm">Поиск</label>
          <input className="border rounded-md h-10 px-3" value={q} onChange={e=>setQ(e.target.value)} placeholder="Имя, телефон, UTM" />
        </div>
        <div className="grid">
          <label className="text-sm">Статус</label>
          <select className="border rounded-md h-10 px-3" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">все</option>
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
        <Button onClick={()=>load(1)}>{loading ? "Загрузка..." : "Применить"}</Button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Дата</th>
              <th className="text-left p-2">Имя</th>
              <th className="text-left p-2">Телефон</th>
              <th className="text-left p-2">Источник</th>
              <th className="text-left p-2">Связано</th>
              <th className="text-left p-2">Статус</th>
              <th className="text-left p-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map(l => (
              <tr key={l.id} className="border-t">
                <td className="p-2">{l.id}</td>
                <td className="p-2">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-2">{l.name}</td>
                <td className="p-2">{l.phone}</td>
                <td className="p-2">{l.sourceType}</td>
                <td className="p-2">
                  {l.service ? `Услуга: ${l.service.name}` : (l.device ? `Аппарат: ${l.device.brand} ${l.device.model}` : "—")}
                </td>
                <td className="p-2">{l.status}</td>
                <td className="p-2 space-x-2">
                  <Button variant="outline" onClick={()=>setStatusFor(l.id, "IN_PROGRESS")}>В работу</Button>
                  <Button variant="secondary" onClick={()=>setStatusFor(l.id, "DONE")}>Закрыт</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">Всего: {total}</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>load(Math.max(1, page-1))}>Назад</Button>
          <div className="px-3 py-2 border rounded-md">Стр. {page}</div>
          <Button variant="outline" onClick={()=>load(page+1)}>Вперёд</Button>
        </div>
      </div>
    </div>
  )
}

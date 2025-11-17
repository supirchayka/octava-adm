"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Org = {
  fullName?: string
  ogrn?: string
  inn?: string
  kpp?: string
  address?: string
  email?: string
}

export default function OrgPage() {
  const [org, setOrg] = useState<Org>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrg() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/admin/org")
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setOrg(data || {})
      } catch (e: any) {
        setError(e.message || "Не удалось получить данные организации")
      } finally {
        setLoading(false)
      }
    }
    loadOrg()
  }, [])

  function set<K extends keyof Org>(k: K, v: string) {
    setOrg({ ...org, [k]: v })
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    setError(null)
    try {
      const res = await fetch("/api/admin/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(org) })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json().catch(() => null)
      if (data) setOrg(data)
      setMsg("Сохранено")
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Организация</h1>
      {loading && <div className="text-sm text-muted-foreground">Загрузка...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {["fullName","ogrn","inn","kpp","address","email"].map((k) => (
          <div key={k}>
            <label className="text-sm">{k}</label>
            <input className="border rounded-md h-10 px-3 w-full" value={(org as any)[k] || ""} onChange={e=>set(k as any, e.target.value)} />
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving}>{saving ? "Сохраняю..." : "Сохранить"}</Button>
      {msg && <div className="text-sm text-green-600">{msg}</div>}
      <p className="text-xs text-gray-500">PUT /admin/org — частичное обновление, ответ — актуальная запись.</p>
    </div>
  )
}

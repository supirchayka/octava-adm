"use client"

import { useState } from "react"
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
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function set<K extends keyof Org>(k: K, v: string) {
    setOrg({ ...org, [k]: v })
  }

  async function save() {
    setSaving(true); setMsg(null)
    const res = await fetch("/api/admin/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(org) })
    setMsg(res.ok ? "Сохранено" : "Ошибка")
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Организация</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {["fullName","ogrn","inn","kpp","address","email"].map((k) => (
          <div key={k}>
            <label className="text-sm">{k}</label>
            <input className="border rounded-md h-10 px-3 w-full" value={(org as any)[k] || ""} onChange={e=>set(k as any, e.target.value)} />
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving}>{saving ? "Сохраняю..." : "Сохранить"}</Button>
      {msg && <div className="text-sm text-gray-500">{msg}</div>}
      <p className="text-xs text-gray-500">PUT /admin/org — частичное обновление, ответ — актуальная запись.</p>
    </div>
  )
}

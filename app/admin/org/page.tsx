"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { unwrapData } from "@/lib/utils"

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
        setOrg(unwrapData<Org>(data) || {})
      } catch (e: any) {
        setError(e.message || "Не удалось получить данные организации")
      } finally {
        setLoading(false)
      }
    }
    loadOrg()
  }, [])

  const fields: Array<{ key: keyof Org; label: string; placeholder: string; type?: string; textarea?: boolean }> = [
    { key: "fullName", label: "Юридическое название", placeholder: "ООО «Октава»" },
    { key: "ogrn", label: "ОГРН", placeholder: "1234567890123" },
    { key: "inn", label: "ИНН", placeholder: "7700000000" },
    { key: "kpp", label: "КПП", placeholder: "770001001" },
    { key: "address", label: "Юридический адрес", placeholder: "г. Москва, ул. Арбат, д. 1", textarea: true },
    { key: "email", label: "E-mail для документов", placeholder: "info@example.ru", type: "email" },
  ]

  function set<K extends keyof Org>(k: K, v: string) {
    setOrg({ ...org, [k]: v })
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    setError(null)
    try {
      const payload: Record<string, string | null> = {}
      fields.forEach(({ key }) => {
        const value = (org[key] ?? "").trim()
        payload[key] = value === "" ? null : value
      })
      const res = await fetch("/api/admin/org", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json().catch(() => null)
      if (data) setOrg(unwrapData<Org>(data) || payload)
      setMsg("Сохранено")
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Организация</h1>
        <p className="text-sm text-muted-foreground">Эти данные попадут в договоры, счета и подвал сайта.</p>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Загрузка...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <section className="rounded-2xl border p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="text-sm font-medium">{field.label}</label>
              {field.textarea ? (
                <Textarea value={org[field.key] ?? ""} onChange={(e) => set(field.key, e.target.value)} placeholder={field.placeholder} />
              ) : (
                <Input
                  type={field.type || "text"}
                  value={org[field.key] ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>
      </section>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Сохраняю..." : "Сохранить"}
        </Button>
        {msg && <div className="text-sm text-green-600">{msg}</div>}
      </div>
    </div>
  )
}

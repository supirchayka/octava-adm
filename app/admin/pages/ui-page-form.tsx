"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"

export type PageField = {
  key: string
  label: string
  type?: "textarea" | "text" | "url"
}

interface Props {
  page: string
  title: string
  description: string
  fields: PageField[]
  initialData: Record<string, any> | null
}

export function PageForm({ page, title, description, fields, initialData }: Props) {
  const initialContent = initialData && typeof initialData === "object" && "data" in initialData && typeof (initialData as any).data === "object"
    ? (initialData as any).data
    : initialData
  const content = (initialContent ?? null) as Record<string, any> | null
  const initialSeo = ((initialData as any)?.seo ?? defaultSeoState) as SeoState

  const [form, setForm] = useState(() => {
    const values: Record<string, string> = {}
    fields.forEach((field) => {
      values[field.key] = content?.[field.key] ?? ""
    })
    return values
  })
  const [seo, setSeo] = useState<SeoState>(() => initialSeo)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const payload: Record<string, any> = {}
      fields.forEach((field) => {
        const value = form[field.key]
        payload[field.key] = value === "" ? null : value
      })
      const seoPayload = prepareSeoPayload(seo)
      if (seoPayload) payload.seo = seoPayload
      const res = await fetch(`/api/admin/pages/${page}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage("Сохранено")
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <div className="grid gap-4">
          {fields.map((field) => (
            <div key={field.key} className="grid gap-1">
              <label className="text-sm">{field.label}</label>
              {field.type === "textarea" ? (
                <Textarea value={form[field.key]} onChange={(e) => updateField(field.key, e.target.value)} />
              ) : (
                <Input
                  type={field.type === "url" ? "url" : "text"}
                  value={form[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <SeoFields value={seo} onChange={setSeo} />
        {message && <div className="text-sm text-green-600">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Сохраняю..." : "Сохранить"}</Button>
        </div>
      </form>
      {initialData && (
        <div className="rounded-xl border p-4 text-sm text-muted-foreground">
          <div className="font-semibold mb-2">Текущее содержимое (публичное)</div>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(initialData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

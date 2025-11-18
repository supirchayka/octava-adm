"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { absoluteUploadUrl, unwrapData } from "@/lib/utils"

interface Props {
  initialData: Record<string, any> | null
}

type FactState = { title: string; text: string }

type AboutContentKeys = "heroTitle" | "heroDescription" | "howWeAchieveText" | "heroCtaTitle" | "heroCtaSubtitle"

export function AboutForm({ initialData }: Props) {
  const normalized = initialData ? unwrapData<Record<string, any>>(initialData) : null
  const [content, setContent] = useState<Record<AboutContentKeys, string>>({
    heroTitle: normalized?.heroTitle ?? "",
    heroDescription: normalized?.heroDescription ?? "",
    howWeAchieveText: normalized?.howWeAchieveText ?? "",
    heroCtaTitle: normalized?.heroCtaTitle ?? "",
    heroCtaSubtitle: normalized?.heroCtaSubtitle ?? "",
  })
  const [heroImage, setHeroImage] = useState<{ fileId: number | null; previewUrl: string | null }>(() => {
    const file = normalized?.heroImage
    if (file?.id) {
      return { fileId: file.id, previewUrl: file.path ? absoluteUploadUrl(file.path) : null }
    }
    return { fileId: null, previewUrl: null }
  })
  const [facts, setFacts] = useState<FactState[]>(() => normalizeFacts(normalized?.facts))
  const [seo, setSeo] = useState<SeoState>(() => ((normalized?.seo as SeoState) ?? defaultSeoState))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateContent(key: AboutContentKeys, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  function updateFact(index: number, patch: Partial<FactState>) {
    setFacts((prev) => prev.map((fact, idx) => (idx === index ? { ...fact, ...patch } : fact)))
  }

  function addFact() {
    setFacts((prev) => [...prev, { title: "", text: "" }])
  }

  function removeFact(index: number) {
    setFacts((prev) => prev.filter((_, idx) => idx !== index))
  }

  function moveFact(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= facts.length) return
    setFacts((prev) => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[target]
      next[target] = temp
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    if (!heroImage.fileId) {
      setError("Пожалуйста добавьте обложку страницы")
      setSaving(false)
      return
    }

    try {
      const payload: Record<string, any> = {
        heroImageFileId: heroImage.fileId,
        facts: facts.map((fact, index) => ({
          title: fact.title || null,
          text: fact.text || null,
          order: index + 1,
        })),
      }
      ;(Object.keys(content) as AboutContentKeys[]).forEach((key) => {
        payload[key] = content[key] === "" ? null : content[key]
      })
      const seoPayload = prepareSeoPayload(seo)
      if (seoPayload) payload.seo = seoPayload

      const res = await fetch(`/api/admin/pages/about`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage("Страница обновлена")
    } catch (err: any) {
      setError(err.message || "Не удалось сохранить страницу")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">О клинике</h1>
        <p className="text-sm text-muted-foreground">Соберите вдохновляющий рассказ о команде и фактах.</p>
      </div>
      <form className="space-y-6" onSubmit={submit}>
        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Hero-блок</h2>
            <p className="text-sm text-muted-foreground">Заголовок, описание и обложка, которая встречает посетителя.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Главный заголовок</label>
              <Input value={content.heroTitle} onChange={(e) => updateContent("heroTitle", e.target.value)} placeholder="Расскажите, кто вы" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Описание</label>
              <Textarea value={content.heroDescription} onChange={(e) => updateContent("heroDescription", e.target.value)} placeholder="Несколько тёплых предложений" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Как достигаете результат</label>
              <Textarea value={content.howWeAchieveText} onChange={(e) => updateContent("howWeAchieveText", e.target.value)} placeholder="Например: подбор экспертов, диагностика и т.д." />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Заголовок призыва</label>
              <Input value={content.heroCtaTitle} onChange={(e) => updateContent("heroCtaTitle", e.target.value)} placeholder="Например: Будем рады видеть вас" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Текст призыва</label>
              <Textarea value={content.heroCtaSubtitle} onChange={(e) => updateContent("heroCtaSubtitle", e.target.value)} placeholder="Пара фраз о заботе" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Обложка</label>
            {heroImage.previewUrl ? (
              <img src={heroImage.previewUrl} alt="Hero" className="h-48 w-full rounded-lg object-cover" />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Добавьте фото, которое лучше всего отражает атмосферу.</div>
            )}
            <FileUploader onUploaded={(uploaded) => setHeroImage({ fileId: uploaded.id, previewUrl: absoluteUploadUrl(uploaded.path) })} />
          </div>
        </section>

        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Факты о клинике</h2>
            <p className="text-sm text-muted-foreground">Добавьте карточки с достижениями, подходом или цифрами. Они будут показаны в указанном порядке.</p>
          </div>
          <div className="space-y-4">
            {facts.map((fact, index) => (
              <div key={index} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Карточка {index + 1}</div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => moveFact(index, -1)} disabled={index === 0}>
                      ↑
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => moveFact(index, 1)} disabled={index === facts.length - 1}>
                      ↓
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFact(index)}>
                      Удалить
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Заголовок</label>
                    <Input value={fact.title} onChange={(e) => updateFact(index, { title: e.target.value })} placeholder="Например: 12 лет опыта" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Текст</label>
                    <Textarea value={fact.text} onChange={(e) => updateFact(index, { text: e.target.value })} placeholder="Раскройте мысль в 1–2 предложениях" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addFact}>
              + Добавить факт
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

function normalizeFacts(list: any): FactState[] {
  if (!Array.isArray(list) || list.length === 0) {
    return [{ title: "", text: "" }]
  }
  return [...list]
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((item) => ({ title: item?.title ?? "", text: item?.text ?? "" }))
}

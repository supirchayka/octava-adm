"use client"

import Image from "next/image"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { resolveMediaFileId, resolveMediaPreviewUrl } from "@/lib/media"
import { absoluteUploadUrl, unwrapData } from "@/lib/utils"
import type { SimpleImageValue } from "@/components/image-field"

interface Props {
  initialData: Record<string, unknown> | null
}

type FactState = { title: string; text: string }
type TrustKind = "LICENSE" | "CERTIFICATE" | "AWARD" | "ATTESTATION"
type TrustItemState = {
  kind: TrustKind
  title: string
  number: string
  issuedAt: string
  issuedBy: string
  fileId: number | null
  fileUrl: string | null
  fileName: string
  fileMime: string
  fileSizeBytes: number | null
}

type HeroImagePayload = {
  id?: number | null
  fileId?: number | null
  path?: string | null
  url?: string | null
  file?: { id?: number | null; path?: string | null; url?: string | null } | null
}

type AboutContentKeys =
  | "heroTitle"
  | "heroDescription"
  | "howWeAchieveText"
  | "heroBadgeText"
  | "heroCardText"
  | "howWeAchieveTitle"
  | "howWeAchieveCardText"
  | "factsSectionTitle"
  | "trustSectionTitle"
  | "trustSectionSubtitle"
  | "heroCtaTitle"
  | "heroCtaSubtitle"

type UploadedFile = {
  id: number
  path: string
  mime: string
  sizeBytes: number
  originalName?: string
}

const trustKindOptions: Array<{ value: TrustKind; label: string }> = [
  { value: "LICENSE", label: "Лицензия" },
  { value: "CERTIFICATE", label: "Сертификат" },
  { value: "AWARD", label: "Награда" },
  { value: "ATTESTATION", label: "Аттестация" },
]

export function AboutForm({ initialData }: Props) {
  const normalized = initialData ? unwrapData<Record<string, unknown>>(initialData) : null

  const getContentValue = (key: AboutContentKeys) => {
    const value = normalized?.[key]
    return typeof value === "string" ? value : ""
  }

  const [content, setContent] = useState<Record<AboutContentKeys, string>>({
    heroTitle: getContentValue("heroTitle"),
    heroDescription: getContentValue("heroDescription"),
    howWeAchieveText: getContentValue("howWeAchieveText"),
    heroBadgeText: getContentValue("heroBadgeText"),
    heroCardText: getContentValue("heroCardText"),
    howWeAchieveTitle: getContentValue("howWeAchieveTitle"),
    howWeAchieveCardText: getContentValue("howWeAchieveCardText"),
    factsSectionTitle: getContentValue("factsSectionTitle"),
    trustSectionTitle: getContentValue("trustSectionTitle"),
    trustSectionSubtitle: getContentValue("trustSectionSubtitle"),
    heroCtaTitle: getContentValue("heroCtaTitle"),
    heroCtaSubtitle: getContentValue("heroCtaSubtitle"),
  })

  const [heroImage, setHeroImage] = useState<SimpleImageValue>(() => {
    const file = normalized?.heroImage as HeroImagePayload | undefined
    const fileId = resolveMediaFileId({ fileId: normalized?.heroImageFileId, file }) ?? resolveMediaFileId(file)
    const imageId = resolveMediaFileId(file)
    return {
      id: imageId,
      fileId,
      previewUrl: resolveMediaPreviewUrl(file),
    }
  })

  const [facts, setFacts] = useState<FactState[]>(() => normalizeFacts(normalized?.facts))
  const [trustItems, setTrustItems] = useState<TrustItemState[]>(() => normalizeTrustItems(normalized?.trustItems))
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

  function updateTrustItem(index: number, patch: Partial<TrustItemState>) {
    setTrustItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)))
  }

  function addTrustItem() {
    setTrustItems((prev) => [
      ...prev,
      {
        kind: "CERTIFICATE",
        title: "",
        number: "",
        issuedAt: "",
        issuedBy: "",
        fileId: null,
        fileUrl: null,
        fileName: "",
        fileMime: "",
        fileSizeBytes: null,
      },
    ])
  }

  function removeTrustItem(index: number) {
    setTrustItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  function moveTrustItem(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= trustItems.length) return
    setTrustItems((prev) => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[target]
      next[target] = temp
      return next
    })
  }

  function attachTrustPdf(index: number, uploaded: UploadedFile) {
    if (!isPdf(uploaded.mime, uploaded.path, uploaded.originalName)) {
      setError("Разрешены только PDF-файлы")
      return
    }

    setError(null)
    updateTrustItem(index, {
      fileId: uploaded.id,
      fileUrl: absoluteUploadUrl(uploaded.path),
      fileName: uploaded.originalName ?? `document-${uploaded.id}.pdf`,
      fileMime: uploaded.mime,
      fileSizeBytes: uploaded.sizeBytes ?? null,
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    if (!heroImage.fileId) {
      setError("Пожалуйста, добавьте обложку страницы")
      setSaving(false)
      return
    }

    try {
      const payload: Record<string, unknown> = {
        heroImageFileId: heroImage.fileId,
        facts: facts.map((fact, index) => ({
          title: fact.title || null,
          text: fact.text || null,
          order: index + 1,
        })),
        trustItems: trustItems.map((item) => ({
          kind: item.kind,
          title: item.title,
          number: item.number || null,
          issuedAt: item.issuedAt || null,
          issuedBy: item.issuedBy || null,
          fileId: item.fileId ?? null,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Не удалось сохранить страницу"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">О клинике</h1>
        <p className="text-sm text-muted-foreground">Все тексты страницы `/about` и блок документов управляются здесь.</p>
      </div>
      <form className="space-y-6" onSubmit={submit}>
        <section className="space-y-4 rounded-2xl border p-4">
          <div>
            <h2 className="text-lg font-semibold">Hero-блок</h2>
            <p className="text-sm text-muted-foreground">Заголовок, описание, карточка справа и обложка.</p>
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
              <label className="text-sm font-medium">Бейдж на карточке Hero</label>
              <Input value={content.heroBadgeText} onChange={(e) => updateContent("heroBadgeText", e.target.value)} placeholder="Например: Антивозрастная и эстетическая медицина" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Текст карточки Hero</label>
              <Textarea value={content.heroCardText} onChange={(e) => updateContent("heroCardText", e.target.value)} placeholder="Текст справа в Hero-блоке" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Заголовок призыва</label>
              <Input value={content.heroCtaTitle} onChange={(e) => updateContent("heroCtaTitle", e.target.value)} placeholder="Например: Записаться" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Подзаголовок призыва</label>
              <Textarea value={content.heroCtaSubtitle} onChange={(e) => updateContent("heroCtaSubtitle", e.target.value)} placeholder="Пара фраз о заботе" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Обложка</label>
            {heroImage.previewUrl ? (
              <Image
                src={heroImage.previewUrl}
                alt="Hero"
                width={1200}
                height={360}
                unoptimized
                className="h-48 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Добавьте фото, которое лучше всего отражает атмосферу клиники.
              </div>
            )}
            <FileUploader
              onUploaded={(uploaded) =>
                setHeroImage({ id: heroImage.id ?? null, fileId: uploaded.id, previewUrl: absoluteUploadUrl(uploaded.path) })
              }
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border p-4">
          <div>
            <h2 className="text-lg font-semibold">Секция «Как мы работаем»</h2>
            <p className="text-sm text-muted-foreground">Редактируйте заголовок, основной текст и карточку справа в этом блоке.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Заголовок секции</label>
              <Input value={content.howWeAchieveTitle} onChange={(e) => updateContent("howWeAchieveTitle", e.target.value)} placeholder="Как мы работаем" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Основной текст</label>
              <Textarea value={content.howWeAchieveText} onChange={(e) => updateContent("howWeAchieveText", e.target.value)} placeholder="Как достигаете результата" />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="text-sm font-medium">Текст карточки справа</label>
              <Textarea value={content.howWeAchieveCardText} onChange={(e) => updateContent("howWeAchieveCardText", e.target.value)} placeholder="Дополнительный текст в карточке справа" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border p-4">
          <div>
            <h2 className="text-lg font-semibold">Наш подход к работе с пациентами</h2>
            <p className="text-sm text-muted-foreground">Пункты можно добавлять, удалять и переставлять.</p>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Заголовок секции</label>
            <Input value={content.factsSectionTitle} onChange={(e) => updateContent("factsSectionTitle", e.target.value)} placeholder="Наш подход к работе с пациентами" />
          </div>
          <div className="space-y-4">
            {facts.map((fact, index) => (
              <div key={index} className="space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Пункт {index + 1}</div>
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
                    <Input value={fact.title} onChange={(e) => updateFact(index, { title: e.target.value })} placeholder="Например: Персонализированные протоколы" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Текст</label>
                    <Textarea value={fact.text} onChange={(e) => updateFact(index, { text: e.target.value })} placeholder="1–2 предложения" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addFact}>
              + Добавить пункт
            </Button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border p-4">
          <div>
            <h2 className="text-lg font-semibold">Лицензии, сертификаты и награды</h2>
            <p className="text-sm text-muted-foreground">Добавляйте любое количество документов и загружайте сканы в PDF.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Заголовок секции</label>
              <Input value={content.trustSectionTitle} onChange={(e) => updateContent("trustSectionTitle", e.target.value)} placeholder="Лицензии, сертификаты и награды" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Подзаголовок секции</label>
              <Textarea value={content.trustSectionSubtitle} onChange={(e) => updateContent("trustSectionSubtitle", e.target.value)} placeholder="Короткий поясняющий текст" />
            </div>
          </div>

          <div className="space-y-4">
            {trustItems.map((item, index) => (
              <div key={index} className="space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Документ {index + 1}</div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => moveTrustItem(index, -1)} disabled={index === 0}>
                      ↑
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => moveTrustItem(index, 1)} disabled={index === trustItems.length - 1}>
                      ↓
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeTrustItem(index)}>
                      Удалить
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Тип</label>
                    <select
                      value={item.kind}
                      onChange={(e) => updateTrustItem(index, { kind: e.target.value as TrustKind })}
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                      {trustKindOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Название</label>
                    <Input value={item.title} onChange={(e) => updateTrustItem(index, { title: e.target.value })} placeholder="Название документа" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Номер</label>
                    <Input value={item.number} onChange={(e) => updateTrustItem(index, { number: e.target.value })} placeholder="Номер лицензии/сертификата" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Кем выдан</label>
                    <Input value={item.issuedBy} onChange={(e) => updateTrustItem(index, { issuedBy: e.target.value })} placeholder="Орган/комиссия" />
                  </div>
                  <div className="grid gap-1 md:col-span-2">
                    <label className="text-sm font-medium">Дата выдачи</label>
                    <Input type="date" value={item.issuedAt} onChange={(e) => updateTrustItem(index, { issuedAt: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-dashed p-3">
                  <div className="text-sm font-medium">PDF-скан</div>
                  <FileUploader
                    accept=".pdf,application/pdf"
                    onUploaded={(uploaded) => attachTrustPdf(index, uploaded)}
                  />
                  {item.fileId && item.fileUrl ? (
                    <div className="space-y-1 rounded-md border p-2">
                      <div className="text-sm font-medium">{item.fileName || `document-${item.fileId}.pdf`}</div>
                      <div className="text-xs text-muted-foreground">
                        MIME: {item.fileMime || "application/pdf"}
                        {item.fileSizeBytes ? ` • ${formatSize(item.fileSizeBytes)}` : ""}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline-offset-2 hover:underline"
                        >
                          Открыть PDF
                        </a>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateTrustItem(index, {
                              fileId: null,
                              fileUrl: null,
                              fileName: "",
                              fileMime: "",
                              fileSizeBytes: null,
                            })
                          }
                        >
                          Удалить файл
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">PDF пока не загружен.</div>
                  )}
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addTrustItem}>
              + Добавить документ
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

function normalizeFacts(list: unknown): FactState[] {
  if (!Array.isArray(list) || list.length === 0) {
    return [{ title: "", text: "" }]
  }
  return [...list]
    .sort((a, b) => (toNumber((a as Record<string, unknown>)?.order) ?? 0) - (toNumber((b as Record<string, unknown>)?.order) ?? 0))
    .map((item) => {
      const record = asRecord(item)
      return {
        title: (pickString(record?.title) ?? ""),
        text: (pickString(record?.text) ?? ""),
      }
    })
}

function normalizeTrustItems(list: unknown): TrustItemState[] {
  if (!Array.isArray(list) || list.length === 0) {
    return [
      {
        kind: "CERTIFICATE",
        title: "",
        number: "",
        issuedAt: "",
        issuedBy: "",
        fileId: null,
        fileUrl: null,
        fileName: "",
        fileMime: "",
        fileSizeBytes: null,
      },
    ]
  }

  return list.map((item) => {
    const record = asRecord(item)
    const file = asRecord(record?.file)

    const issuedAtRaw = pickString(record?.issuedAt)
    const issuedAt = normalizeDateInput(issuedAtRaw)

    const filePath = pickString(file?.url, file?.path)
    const kind = toTrustKind(record?.kind)

    return {
      kind,
      title: pickString(record?.title) ?? "",
      number: pickString(record?.number) ?? "",
      issuedAt,
      issuedBy: pickString(record?.issuedBy) ?? "",
      fileId: toNumber(record?.fileId) ?? toNumber(file?.id),
      fileUrl: filePath ? absoluteUploadUrl(filePath) : null,
      fileName: pickString(file?.originalName, file?.name) ?? "",
      fileMime: pickString(file?.mime) ?? "",
      fileSizeBytes: toNumber(file?.sizeBytes),
    }
  })
}

function normalizeDateInput(value: string | null): string {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""

  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0")
  const day = String(parsed.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value
  }
  return null
}

function toTrustKind(value: unknown): TrustKind {
  if (value === "LICENSE" || value === "CERTIFICATE" || value === "AWARD" || value === "ATTESTATION") {
    return value
  }
  return "CERTIFICATE"
}

function isPdf(mime: string | undefined, path?: string, name?: string) {
  if (mime?.toLowerCase() === "application/pdf") return true
  const candidate = `${path ?? ""} ${name ?? ""}`.toLowerCase()
  return candidate.includes(".pdf")
}

function formatSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} Б`
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} КБ`
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} МБ`
}

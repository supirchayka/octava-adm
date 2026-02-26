"use client"

import Image from "next/image"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { absoluteUploadUrl, unwrapData } from "@/lib/utils"
import type { SimpleImageValue } from "@/components/image-field"

interface Props {
  initialData: Record<string, unknown> | null
}

type MediaState = SimpleImageValue & {
  alt: string
  caption: string
}

type MediaPayload = { fileId: number; alt?: string; caption?: string; order: number }

type HomePayload = {
  heroImages: MediaPayload[]
  interiorText: string | null
  interiorImages: MediaPayload[]
  seo?: ReturnType<typeof prepareSeoPayload>
}

const HERO_VIDEO_MAX_SIZE = 25 * 1024 * 1024

type HeroVideoState = {
  fileId: number | null
  previewUrl: string | null
  mime: string | null
  sizeBytes: number | null
  originalName: string | null
}

export function HomeForm({ initialData }: Props) {
  const normalized = initialData ? unwrapData<Record<string, unknown>>(initialData) : null
  const normalizedRecord = typeof normalized === "object" && normalized !== null ? normalized : null
  const normalizedHero = getRecord(normalizedRecord, "hero")
  const normalizedInterior = getRecord(normalizedRecord, "interior")
  const heroMediaFromApi = getArray(normalizedHero, "images")?.[0]

  const [heroVideo, setHeroVideo] = useState<HeroVideoState>(() => ({
    fileId: ensureNumber((heroMediaFromApi as { fileId?: unknown })?.fileId),
    previewUrl:
      typeof (heroMediaFromApi as { url?: unknown })?.url === "string"
        ? absoluteUploadUrl((heroMediaFromApi as { url: string }).url)
        : null,
    mime: typeof (heroMediaFromApi as { mime?: unknown })?.mime === "string" ? (heroMediaFromApi as { mime: string }).mime : null,
    sizeBytes:
      typeof (heroMediaFromApi as { sizeBytes?: unknown })?.sizeBytes === "number"
        ? ((heroMediaFromApi as { sizeBytes: number }).sizeBytes as number)
        : null,
    originalName:
      typeof (heroMediaFromApi as { originalName?: unknown })?.originalName === "string"
        ? (heroMediaFromApi as { originalName: string }).originalName
        : null,
  }))
  const [interiorText, setInteriorText] = useState<string>(getString(normalizedInterior, "text", getString(normalizedRecord, "interiorText")))
  const [interiorImages, setInteriorImages] = useState<MediaState[]>(() =>
    normalizeMedia(getArray(normalizedInterior, "images") ?? getArray(normalizedRecord, "interiorImages"))
  )
  const [seo, setSeo] = useState<SeoState>(() => ((normalized?.seo as SeoState) ?? defaultSeoState))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const heroVideoFileId = ensureNumber(heroVideo.fileId)
      if (!heroVideoFileId) {
        setError("Загрузите hero-видео для главного экрана")
        return
      }

      if (heroVideo.sizeBytes !== null && heroVideo.sizeBytes > HERO_VIDEO_MAX_SIZE) {
        setError("Размер hero-видео не должен превышать 25 МБ")
        return
      }

      const interiorMissingIndex = findMissingFileIndex(interiorImages)
      if (interiorMissingIndex !== null) {
        setError(`Загрузите изображение для кадра ${interiorMissingIndex + 1} в блоке интерьера`)
        return
      }

      const interiorPayload = buildMediaPayload(interiorImages)
      const heroPayload: MediaPayload[] = [{ fileId: heroVideoFileId, order: 0 }]
      const seoPayload = prepareSeoPayload(seo)

      const payload: HomePayload = {
        heroImages: heroPayload,
        interiorText: interiorText.trim() === "" ? null : interiorText,
        interiorImages: interiorPayload,
        ...(seoPayload ? { seo: seoPayload } : {}),
      }

      const res = await fetch(`/api/admin/pages/home`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())

      setMessage("Изменения сохранены")
    } catch (err: unknown) {
      const currentMessage = err instanceof Error ? err.message : "Не удалось сохранить страницу"
      setError(currentMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Главная страница</h1>
        <p className="text-sm text-muted-foreground">
          Управляйте hero-видео, блоком интерьера и SEO.
        </p>
      </div>

      <form className="space-y-6" onSubmit={submit}>
        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Hero-видео</h2>
            <p className="text-sm text-muted-foreground">Загрузите один видеофайл до 25 МБ для главного экрана.</p>
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            {heroVideo.previewUrl ? (
              <video
                src={heroVideo.previewUrl}
                controls
                preload="metadata"
                className="h-56 w-full rounded-lg bg-black object-cover"
              />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Видео пока не загружено
              </div>
            )}

            <FileUploader
              accept="video/*"
              maxSizeBytes={HERO_VIDEO_MAX_SIZE}
              onUploaded={(uploaded) => {
                setHeroVideo({
                  fileId: uploaded.id,
                  previewUrl: absoluteUploadUrl(uploaded.path),
                  mime: uploaded.mime ?? null,
                  sizeBytes: typeof uploaded.sizeBytes === "number" ? uploaded.sizeBytes : null,
                  originalName: uploaded.originalName ?? null,
                })
              }}
            />

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Поддерживается до 25 МБ.</span>
              {heroVideo.originalName && <span>Текущий файл: {heroVideo.originalName}</span>}
            </div>

            {heroVideo.fileId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setHeroVideo({
                    fileId: null,
                    previewUrl: null,
                    mime: null,
                    sizeBytes: null,
                    originalName: null,
                  })
                }
              >
                Очистить видео
              </Button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Интерьер клиники</h2>
            <p className="text-sm text-muted-foreground">Короткий текст и галерея для интерьерного блока на главной.</p>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Текст блока</label>
            <Textarea value={interiorText} onChange={(e) => setInteriorText(e.target.value)} placeholder="Несколько предложений про атмосферу клиники" />
          </div>
          <MediaSection
            title="Фотографии интерьера"
            description="Добавьте нужное количество фотографий. Порядок сохраняется."
            items={interiorImages}
            onChange={setInteriorImages}
            requireFileId
            orderHint="Используйте стрелки, чтобы задать порядок кадров."
          />
        </section>

        <SeoFields value={seo} onChange={setSeo} />
        {message && <div className="text-sm text-green-600">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Сохраняю..." : "Сохранить изменения"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function normalizeMedia(list: unknown): MediaState[] {
  if (!Array.isArray(list)) return []
  return [...list]
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((item) => ({
      id: typeof item?.id === "number" ? item.id : null,
      fileId: ensureNumber(item?.fileId ?? item?.file?.id),
      previewUrl: item?.file?.path
        ? absoluteUploadUrl(item.file.path)
        : item?.file?.url
          ? absoluteUploadUrl(item.file.url)
          : item?.url
            ? absoluteUploadUrl(item.url)
            : item?.path
              ? absoluteUploadUrl(item.path)
              : null,
      alt: typeof item?.alt === "string" ? item.alt : "",
      caption: typeof item?.caption === "string" ? item.caption : "",
    }))
}

function findMissingFileIndex(list: MediaState[]): number | null {
  const missingIndex = list.findIndex((item) => !ensureNumber(item.fileId))
  return missingIndex === -1 ? null : missingIndex
}

function getRecord(record: Record<string, unknown> | null, key: string): Record<string, unknown> | null {
  const value = getValue(record, key)
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function getArray(record: Record<string, unknown> | null, key: string): unknown[] | undefined {
  const value = getValue(record, key)
  return Array.isArray(value) ? value : undefined
}

function getString(record: Record<string, unknown> | null, key: string, fallback = ""): string {
  const value = getValue(record, key)
  return typeof value === "string" ? value : fallback
}

function getValue(record: Record<string, unknown> | null, key: string): unknown {
  if (!record) return undefined
  return record[key]
}

function ensureNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function buildMediaPayload(list: MediaState[]): MediaPayload[] {
  const payloads: MediaPayload[] = []

  list.forEach((item, index) => {
    const fileId = ensureNumber(item.fileId)
    if (!fileId) return

    const alt = item.alt?.trim() ?? ""
    const caption = item.caption?.trim() ?? ""

    payloads.push({
      fileId,
      alt: alt === "" ? undefined : alt,
      caption: caption === "" ? undefined : caption,
      order: index,
    })
  })

  return payloads
}

interface MediaSectionProps {
  title: string
  description: string
  items: MediaState[]
  onChange: (items: MediaState[]) => void
  allowRemove?: boolean
  requireFileId?: boolean
  orderHint?: string
}

function MediaSection({
  title,
  description,
  items,
  onChange,
  allowRemove = true,
  requireFileId = false,
  orderHint,
}: MediaSectionProps) {
  return (
    <section className="rounded-2xl border p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {orderHint && <p className="text-xs text-muted-foreground">{orderHint}</p>}
      </div>
      <div className="space-y-4">
        {items.length === 0 && <div className="text-sm text-muted-foreground">Пока нет фотографий, добавьте первый кадр.</div>}
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Кадр {index + 1}</div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => move(items, onChange, index, -1)} disabled={index === 0}>
                  ↑
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => move(items, onChange, index, 1)} disabled={index === items.length - 1}>
                  ↓
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => allowRemove && onChange(items.filter((_, idx) => idx !== index))} disabled={!allowRemove}>
                  Удалить
                </Button>
              </div>
            </div>
            {item.previewUrl ? (
              <Image
                src={item.previewUrl}
                alt="Предпросмотр"
                width={800}
                height={320}
                unoptimized
                className="h-48 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="text-sm text-muted-foreground">Пока нет изображения</div>
            )}
            <FileUploader
              accept="image/*"
              onUploaded={(uploaded) => {
                onChange(
                  items.map((img, idx) =>
                    idx === index
                      ? { ...img, fileId: uploaded.id, previewUrl: absoluteUploadUrl(uploaded.path) }
                      : img
                  )
                )
              }}
            />
            {!item.fileId && requireFileId && (
              <div className="text-sm text-amber-600">Загрузите файл, чтобы сохранить этот кадр и его порядок.</div>
            )}
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Подпись (необязательно)</label>
                <Input value={item.caption} onChange={(e) => onChange(items.map((img, idx) => (idx === index ? { ...img, caption: e.target.value } : img)))} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Alt-текст (для SEO)</label>
                <Input value={item.alt} onChange={(e) => onChange(items.map((img, idx) => (idx === index ? { ...img, alt: e.target.value } : img)))} />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...items, { id: null, fileId: null, previewUrl: null, alt: "", caption: "" }])}
        >
          + Добавить фото
        </Button>
      </div>
    </section>
  )
}

function move(items: MediaState[], setter: (next: MediaState[]) => void, index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.length) return
  const next = [...items]
  const temp = next[index]
  next[index] = next[target]
  next[target] = temp
  setter(next)
}

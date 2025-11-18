"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { absoluteUploadUrl, unwrapData } from "@/lib/utils"

interface Props {
  initialData: Record<string, any> | null
  services: { id: number; name: string }[]
}

type MediaState = {
  fileId: number | null
  previewUrl: string | null
  alt: string
  caption: string
}

type DirectionState = { serviceId: number | null }

type HomeContentKeys =
  | "heroTitle"
  | "heroSubtitle"
  | "heroCtaText"
  | "heroCtaUrl"
  | "subheroTitle"
  | "subheroSubtitle"
  | "interiorText"

export function HomeForm({ initialData, services }: Props) {
  const normalized = initialData ? unwrapData<Record<string, any>>(initialData) : null
  const [content, setContent] = useState<Record<HomeContentKeys, string>>({
    heroTitle: normalized?.heroTitle ?? "",
    heroSubtitle: normalized?.heroSubtitle ?? "",
    heroCtaText: normalized?.heroCtaText ?? "",
    heroCtaUrl: normalized?.heroCtaUrl ?? "",
    subheroTitle: normalized?.subheroTitle ?? "",
    subheroSubtitle: normalized?.subheroSubtitle ?? "",
    interiorText: normalized?.interiorText ?? "",
  })
  const [heroImages, setHeroImages] = useState<MediaState[]>(() => {
    const list = normalizeMedia(normalized?.heroImages)
    return list.length ? list : [{ fileId: null, previewUrl: null, alt: "", caption: "" }]
  })
  const [interiorImages, setInteriorImages] = useState<MediaState[]>(() => normalizeMedia(normalized?.interiorImages))
  const [directions, setDirections] = useState<DirectionState[]>(() => ensureFourDirections(normalized?.directions))
  const [seo, setSeo] = useState<SeoState>(() => ((normalized?.seo as SeoState) ?? defaultSeoState))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const serviceOptions = useMemo(() => [...services].sort((a, b) => a.name.localeCompare(b.name)), [services])

  function updateContent(key: HomeContentKeys, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  function updateDirection(index: number, serviceId: number | null) {
    setDirections((prev) => prev.map((item, idx) => (idx === index ? { serviceId } : item)))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const heroValid = heroImages.length > 0 && heroImages.every((img) => img.fileId)
    if (!heroValid) {
      setError("Добавьте хотя бы одну обложку и загрузите для неё изображение")
      setSaving(false)
      return
    }

    const directionsValid = directions.every((dir) => dir.serviceId)
    if (!directionsValid) {
      setError("Выберите четыре услуги для блока направлений")
      setSaving(false)
      return
    }

    try {
      const payload: Record<string, any> = {}
      ;(Object.keys(content) as HomeContentKeys[]).forEach((key) => {
        payload[key] = content[key] === "" ? null : content[key]
      })
      payload.heroImages = heroImages.map((img, index) => ({
        fileId: img.fileId,
        alt: img.alt || null,
        caption: img.caption || null,
        order: index + 1,
      }))
      payload.interiorImages = interiorImages
        .filter((img) => img.fileId)
        .map((img, index) => ({
          fileId: img.fileId,
          alt: img.alt || null,
          caption: img.caption || null,
          order: index + 1,
        }))
      payload.directions = directions.map((dir, index) => ({ serviceId: dir.serviceId, order: index + 1 }))
      const seoPayload = prepareSeoPayload(seo)
      if (seoPayload) payload.seo = seoPayload

      const res = await fetch(`/api/admin/pages/home`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage("Изменения сохранены")
    } catch (err: any) {
      setError(err.message || "Не удалось сохранить страницу")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Главная страница</h1>
        <p className="text-sm text-muted-foreground">Соберите главный экран, интерьер и четыре направления, чтобы посетителям было легко сориентироваться.</p>
      </div>
      <form className="space-y-6" onSubmit={submit}>
        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Текст на обложке</h2>
            <p className="text-sm text-muted-foreground">Расскажите, что за клиника и чем вы можете помочь прямо сейчас.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Главный заголовок</label>
              <Input value={content.heroTitle} onChange={(e) => updateContent("heroTitle", e.target.value)} placeholder="Например: Перезагрузите тело и разум" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Подзаголовок</label>
              <Textarea value={content.heroSubtitle} onChange={(e) => updateContent("heroSubtitle", e.target.value)} placeholder="Пара предложений о главных преимуществах" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Текст кнопки</label>
              <Input value={content.heroCtaText} onChange={(e) => updateContent("heroCtaText", e.target.value)} placeholder="Записаться" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Ссылка из кнопки</label>
              <Input type="url" value={content.heroCtaUrl} onChange={(e) => updateContent("heroCtaUrl", e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="text-sm font-medium">Поддерживающий заголовок</label>
              <Input value={content.subheroTitle} onChange={(e) => updateContent("subheroTitle", e.target.value)} placeholder="Почему стоит прийти именно к вам" />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="text-sm font-medium">Текст под заголовком</label>
              <Textarea value={content.subheroSubtitle} onChange={(e) => updateContent("subheroSubtitle", e.target.value)} placeholder="Добавьте пару тёплых фактов о сервисе" />
            </div>
          </div>
        </section>

        <MediaSection
          title="Фотографии героя"
          description="Добавьте 1–3 ярких кадра. Первый в списке станет обложкой."
          items={heroImages}
          onChange={setHeroImages}
          allowRemove={heroImages.length > 1}
        />

        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Интерьер клиники</h2>
            <p className="text-sm text-muted-foreground">Покажите атмосферу: добавьте текст и несколько фотографий в нужном порядке.</p>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Небольшой рассказ об атмосфере</label>
            <Textarea value={content.interiorText} onChange={(e) => updateContent("interiorText", e.target.value)} placeholder="Несколько тёплых предложений" />
          </div>
          <MediaSection title="Фотографии интерьера" description="Добавьте столько кадров, сколько нужно. Их порядок сохранится." items={interiorImages} onChange={setInteriorImages} />
        </section>

        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Четыре направления</h2>
            <p className="text-sm text-muted-foreground">Выберите услуги, которые лучше всего показывают спектр клиники.</p>
          </div>
          {serviceOptions.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Сначала добавьте услуги в каталоге, чтобы выбрать их здесь.
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {directions.map((dir, index) => (
              <div key={index} className="grid gap-1">
                <label className="text-sm font-medium">Направление {index + 1}</label>
                <select
                  className="h-10 rounded-md border px-3"
                  value={dir.serviceId ?? ""}
                  onChange={(e) => updateDirection(index, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— выберите услугу —</option>
                  {serviceOptions.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
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

function normalizeMedia(list: any): MediaState[] {
  if (!Array.isArray(list)) return []
  return [...list]
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((item) => ({
      fileId: item?.fileId ?? item?.file?.id ?? null,
      previewUrl: item?.file?.path ? absoluteUploadUrl(item.file.path) : item?.path ? absoluteUploadUrl(item.path) : null,
      alt: item?.alt ?? "",
      caption: item?.caption ?? "",
    }))
}

function ensureFourDirections(list: any): DirectionState[] {
  const normalized: DirectionState[] = Array.isArray(list)
    ? [...list]
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
        .map((item) => ({ serviceId: item?.serviceId ?? null }))
    : []

  while (normalized.length < 4) {
    normalized.push({ serviceId: null })
  }
  return normalized.slice(0, 4)
}

interface MediaSectionProps {
  title: string
  description: string
  items: MediaState[]
  onChange: (items: MediaState[]) => void
  allowRemove?: boolean
}

function MediaSection({ title, description, items, onChange, allowRemove = true }: MediaSectionProps) {
  return (
    <section className="rounded-2xl border p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">
        {items.length === 0 && <div className="text-sm text-muted-foreground">Пока нет фотографий — добавьте первый кадр.</div>}
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
              <img src={item.previewUrl} alt="Предпросмотр" className="h-48 w-full rounded-lg object-cover" />
            ) : (
              <div className="text-sm text-muted-foreground">Пока нет изображения</div>
            )}
            <FileUploader onUploaded={(uploaded) => onChange(items.map((img, idx) => (idx === index ? { ...img, fileId: uploaded.id, previewUrl: absoluteUploadUrl(uploaded.path) } : img)))} />
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
        <Button type="button" variant="outline" onClick={() => onChange([...items, { fileId: null, previewUrl: null, alt: "", caption: "" }])}>
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

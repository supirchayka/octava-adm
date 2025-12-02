"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { absoluteUploadUrl, unwrapData } from "@/lib/utils"
import type { SimpleImageValue } from "@/components/image-field"

interface Props {
  initialData: Record<string, unknown> | null
  categories: { id: number; name: string; slug?: string }[]
}

type MediaState = SimpleImageValue & {
  alt: string
  caption: string
}

type SubheroImageState = SimpleImageValue & { alt: string }

type DirectionState = { id?: number | null; categoryId: number | null }

type MediaIdentifier = { id: number | null; fileId: number | null; file?: { id: number } }

type SubHeroPayload = { title: string | null; subtitle: string | null; image: (MediaIdentifier & { alt: string | null }) | null }

type HomePayload = {
  heroTitle: string | null
  heroSubtitle: string | null
  heroCtaText: string | null
  heroCtaUrl: string | null
  heroImages: MediaPayload[]
  hero: {
    title: string | null
    subtitle: string | null
    ctaText: string | null
    ctaUrl: string | null
    images: MediaPayload[]
  }
  interiorText: string | null
  interiorImages: MediaPayload[]
  directions: DirectionPayload[]
  subHero: SubHeroPayload
  subheroTitle: string | null
  subheroSubtitle: string | null
  subheroImageFileId: number | null
  subheroImage: MediaIdentifier | null
  seo?: ReturnType<typeof prepareSeoPayload>
}

type HomeContentKeys =
  | "heroTitle"
  | "heroSubtitle"
  | "heroCtaText"
  | "heroCtaUrl"
  | "subheroTitle"
  | "subheroSubtitle"
  | "interiorText"

export function HomeForm({ initialData, categories }: Props) {
  const normalized = initialData ? unwrapData<Record<string, unknown>>(initialData) : null
  const normalizedRecord = typeof normalized === "object" && normalized !== null ? normalized : null
  const normalizedHero = getRecord(normalizedRecord, "hero")
  const normalizedInterior = getRecord(normalizedRecord, "interior")
  const [content, setContent] = useState<Record<HomeContentKeys, string>>({
    heroTitle: getString(normalizedHero, "title", getString(normalizedRecord, "heroTitle")),
    heroSubtitle: getString(normalizedHero, "subtitle", getString(normalizedRecord, "heroSubtitle")),
    heroCtaText: getString(normalizedHero, "ctaText", getString(normalizedRecord, "heroCtaText")),
    heroCtaUrl: getString(normalizedHero, "ctaUrl", getString(normalizedRecord, "heroCtaUrl")),
    subheroTitle: getString(getRecord(normalizedRecord, "subHero"), "title", getString(normalizedRecord, "subheroTitle")),
    subheroSubtitle: getString(
      getRecord(normalizedRecord, "subHero"),
      "subtitle",
      getString(normalizedRecord, "subheroSubtitle"),
    ),
    interiorText: getString(normalizedInterior, "text", getString(normalizedRecord, "interiorText")),
  })
  const [heroImages, setHeroImages] = useState<MediaState[]>(() => {
    const heroImagesSource = getArray(normalizedHero, "images") ?? getArray(normalizedRecord, "heroImages")
    const list = normalizeMedia(heroImagesSource)
    return list.length ? list : [{ id: null, fileId: null, previewUrl: null, alt: "", caption: "" }]
  })
  const [interiorImages, setInteriorImages] = useState<MediaState[]>(() =>
    normalizeMedia(getArray(normalizedInterior, "images") ?? getArray(normalizedRecord, "interiorImages"))
  )
  const [directions, setDirections] = useState<DirectionState[]>(() => ensureFourDirections(normalized?.directions))
  const [subheroImage, setSubheroImage] = useState<SubheroImageState>(() =>
    normalizeSubheroImage(getRecord(normalizedRecord, "subHero")?.image ?? getValue(normalizedRecord, "subheroImage"))
  )
  const [seo, setSeo] = useState<SeoState>(() => ((normalized?.seo as SeoState) ?? defaultSeoState))
  const [saving, setSaving] = useState(false)
  const [autoSaveRequested, setAutoSaveRequested] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const categoryOptions = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories])

  function updateContent(key: HomeContentKeys, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  function updateDirection(index: number, categoryId: number | null) {
    setDirections((prev) => prev.map((item, idx) => (idx === index ? { ...item, categoryId } : item)))
  }

  const scheduleAutoSave = useCallback(() => setAutoSaveRequested(true), [])

  const savePage = useCallback(
    async (mode: "manual" | "auto") => {
      setSaving(true)
      if (mode === "manual") {
        setError(null)
        setMessage(null)
      }

      const heroPayload = buildMediaPayload(heroImages)
      if (!heroPayload.length) {
        setError("Добавьте хотя бы одну обложку и загрузите для неё изображение")
        setSaving(false)
        return
      }

      const ctaUrl = content.heroCtaUrl.trim()
      if (ctaUrl !== "" && !isValidRelativeOrAbsoluteUrl(ctaUrl)) {
        setError("Укажите корректную ссылку в поле кнопки героя")
        setSaving(false)
        return
      }

      const directionsPayload = buildDirectionsPayload(directions)
      if (!directionsPayload) {
        setError("Выберите четыре категории для блока направлений")
        setSaving(false)
        return
      }

      try {
        const heroMissingIndex = findMissingFileIndex(heroImages)
        if (heroMissingIndex !== null) {
          setError(`Загрузите изображение для кадра ${heroMissingIndex + 1} в блоке героя`)
          setSaving(false)
          return
        }

        const interiorMissingIndex = findMissingFileIndex(interiorImages)
        if (interiorMissingIndex !== null) {
          setError(`Загрузите изображение для кадра ${interiorMissingIndex + 1} в блоке интерьера`)
          setSaving(false)
          return
        }

        const interiorPayload = buildMediaPayload(interiorImages)
        const subheroFileId = ensureNumber(subheroImage.fileId ?? subheroImage.id)
        const subheroId = ensureNumber(subheroImage.id)
        const subheroImagePayload: MediaIdentifier | null =
          subheroFileId !== null || subheroId !== null
            ? {
                id: subheroId,
                fileId: subheroFileId,
                file: subheroFileId !== null ? { id: subheroFileId } : subheroId !== null ? { id: subheroId } : undefined,
              }
            : null
        const subHeroPayload: SubHeroPayload = {
          title: content.subheroTitle === "" ? null : content.subheroTitle,
          subtitle: content.subheroSubtitle === "" ? null : content.subheroSubtitle,
          image: subheroImagePayload
            ? {
                ...subheroImagePayload,
                alt: subheroImage.alt.trim() === "" ? null : subheroImage.alt.trim(),
              }
            : null,
        }
        const seoPayload = prepareSeoPayload(seo)
        const payload: HomePayload = {
          heroTitle: content.heroTitle === "" ? null : content.heroTitle,
          heroSubtitle: content.heroSubtitle === "" ? null : content.heroSubtitle,
          heroCtaText: content.heroCtaText === "" ? null : content.heroCtaText,
          heroCtaUrl: ctaUrl === "" ? null : ctaUrl,
          heroImages: heroPayload,
          hero: {
            title: content.heroTitle === "" ? null : content.heroTitle,
            subtitle: content.heroSubtitle === "" ? null : content.heroSubtitle,
            ctaText: content.heroCtaText === "" ? null : content.heroCtaText,
            ctaUrl: ctaUrl === "" ? null : ctaUrl,
            images: heroPayload,
          },
          interiorText: content.interiorText === "" ? null : content.interiorText,
          interiorImages: interiorPayload,
          directions: directionsPayload,
          subHero: subHeroPayload,
          subheroTitle: subHeroPayload.title,
          subheroSubtitle: subHeroPayload.subtitle,
          subheroImageFileId: subheroImagePayload?.fileId ?? null,
          subheroImage: subheroImagePayload,
          ...(seoPayload ? { seo: seoPayload } : {}),
        }
        if (seoPayload) {
          if (heroPayload[0]?.fileId) {
            seoPayload.ogImageId = heroPayload[0].fileId
          }
          payload.seo = seoPayload
        }

        const res = await fetch(`/api/admin/pages/home`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(await res.text())
        setMessage("Изменения сохранены")
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Не удалось сохранить страницу"
        setError(message)
      } finally {
        setSaving(false)
      }
    },
    [content, directions, heroImages, interiorImages, seo, subheroImage]
  )

  function submit(e: React.FormEvent) {
    e.preventDefault()
    void savePage("manual")
  }

  useEffect(() => {
    if (!autoSaveRequested || saving) return
    setAutoSaveRequested(false)
    void savePage("auto")
  }, [autoSaveRequested, savePage, saving])

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
          </div>
        </section>

        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Поддерживающий блок (subhero)</h2>
            <p className="text-sm text-muted-foreground">Добавьте второстепенный заголовок, текст и фон для блока под героем.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1 md:col-span-2">
              <label className="text-sm font-medium">Поддерживающий заголовок</label>
              <Input value={content.subheroTitle} onChange={(e) => updateContent("subheroTitle", e.target.value)} placeholder="Почему стоит прийти именно к вам" />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="text-sm font-medium">Текст под заголовком</label>
              <Textarea value={content.subheroSubtitle} onChange={(e) => updateContent("subheroSubtitle", e.target.value)} placeholder="Добавьте пару тёплых фактов о сервисе" />
            </div>
            <div className="grid gap-3 md:col-span-2">
              <div>
                <div className="text-sm font-medium">Фон для блока subhero</div>
                <p className="text-sm text-muted-foreground">Загрузите фото, которое будет под подзаголовком.</p>
              </div>
              <div className="space-y-3 rounded-2xl border p-4">
                {subheroImage.previewUrl ? (
                  <Image
                    src={subheroImage.previewUrl}
                    alt="Фон subhero"
                    width={1200}
                    height={320}
                    unoptimized
                    className="h-48 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Пока нет изображения
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <FileUploader
                    onUploaded={(uploaded) => {
                      setSubheroImage({
                        id: subheroImage.id ?? null,
                        fileId: uploaded.id,
                        previewUrl: absoluteUploadUrl(uploaded.path),
                        alt: subheroImage.alt,
                      })
                      scheduleAutoSave()
                    }}
                  />
                  {subheroImage.fileId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSubheroImage({ id: subheroImage.id ?? null, fileId: null, previewUrl: null, alt: subheroImage.alt })
                      }
                    >
                      Очистить
                    </Button>
                  )}
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Alt-текст</label>
                  <Input
                    value={subheroImage.alt}
                    onChange={(e) => setSubheroImage((prev) => ({ ...prev, alt: e.target.value }))}
                    placeholder="Например: Комплексный подход к каждому пациенту"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <MediaSection
          title="Фотографии героя"
          description="Добавьте 1–3 ярких кадра. Первый в списке станет обложкой."
          items={heroImages}
          onChange={setHeroImages}
          onUploaded={scheduleAutoSave}
          allowRemove={heroImages.length > 1}
          requireFileId
          orderHint="Порядок сохраняется при сохранении — используйте стрелки, чтобы задать нужную последовательность."
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
          <MediaSection
            title="Фотографии интерьера"
            description="Добавьте столько кадров, сколько нужно. Их порядок сохранится."
            items={interiorImages}
            onChange={setInteriorImages}
            onUploaded={scheduleAutoSave}
            requireFileId
            orderHint="Если нужно зафиксировать сортировку, расставьте кадры стрелками — порядок уйдёт в API целиком."
          />
        </section>

        <section className="rounded-2xl border p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Четыре направления</h2>
            <p className="text-sm text-muted-foreground">Выберите категории, которые лучше всего показывают спектр клиники.</p>
          </div>
          {categoryOptions.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Сначала добавьте категории в каталоге, чтобы выбрать их здесь.
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {directions.map((dir, index) => (
              <div key={index} className="grid gap-1">
                <label className="text-sm font-medium">Направление {index + 1}</label>
                <select
                  className="h-10 rounded-md border px-3"
                  value={dir.categoryId ?? ""}
                  onChange={(e) => updateDirection(index, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— выберите категорию —</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
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

function normalizeMedia(list: unknown): MediaState[] {
  if (!Array.isArray(list)) return []
  return [...list]
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((item) => ({
      id: typeof item?.id === "number" ? item.id : null,
      fileId: ensureNumber(item?.fileId ?? item?.file?.id),
      previewUrl: item?.file?.path
        ? absoluteUploadUrl(item.file.path)
        : item?.url
          ? absoluteUploadUrl(item.url)
          : item?.path
            ? absoluteUploadUrl(item.path)
            : null,
      alt: typeof item?.alt === "string" ? item.alt : "",
      caption: typeof item?.caption === "string" ? item.caption : "",
    }))
}

function normalizeSubheroImage(value: unknown): SubheroImageState {
  const candidate = value as { fileId?: unknown; id?: unknown; file?: { id?: unknown; path?: string | null }; path?: string | null; url?: string | null; alt?: string | null }
  const fileId = ensureNumber(candidate?.fileId ?? candidate?.id ?? candidate?.file?.id)
  const previewPath = candidate?.path ?? candidate?.url ?? candidate?.file?.path ?? null
  return {
    id: ensureNumber(candidate?.id),
    fileId: fileId ?? null,
    previewUrl: previewPath ? absoluteUploadUrl(previewPath) : null,
    alt: candidate?.alt ?? "",
  }
}

function ensureFourDirections(list: unknown): DirectionState[] {
  const normalized: DirectionState[] = Array.isArray(list)
    ? [...list]
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
        .map((item) => ({
          id: typeof item?.id === "number" ? item.id : null,
          categoryId:
            ensureNumber(
              typeof item?.categoryId === "number"
                ? item.categoryId
                : typeof item?.category?.id === "number"
                  ? item.category.id
                  : null
            ),
        }))
    : []

  while (normalized.length < 4) {
    normalized.push({ id: null, categoryId: null })
  }
  return normalized.slice(0, 4)
}

type MediaPayload = { fileId: number; alt?: string; caption?: string; order: number }

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

type DirectionPayload = { categoryId: number; order: number }

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

function buildDirectionsPayload(list: DirectionState[]): DirectionPayload[] | null {
  if (list.length === 0) return null
  const payload: DirectionPayload[] = []
  for (let index = 0; index < list.length; index += 1) {
    const candidate = ensureNumber(list[index]?.categoryId)
    if (!candidate) return null
    payload.push({ categoryId: candidate, order: index + 1 })
  }
  return payload
}

function isValidRelativeOrAbsoluteUrl(value: string): boolean {
  try {
    // new URL supports both absolute and relative values with a base provided
    // eslint-disable-next-line no-new
    new URL(value, "https://example.com")
    return true
  } catch {
    return false
  }
}

function ensureNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

interface MediaSectionProps {
  title: string
  description: string
  items: MediaState[]
  onChange: (items: MediaState[]) => void
  allowRemove?: boolean
  onUploaded?: () => void
  requireFileId?: boolean
  orderHint?: string
}

function MediaSection({
  title,
  description,
  items,
  onChange,
  allowRemove = true,
  onUploaded,
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
              onUploaded={(uploaded) => {
                onChange(
                  items.map((img, idx) =>
                    idx === index
                      ? { ...img, fileId: uploaded.id, previewUrl: absoluteUploadUrl(uploaded.path) }
                      : img
                  )
                )
                onUploaded?.()
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

"use client"

import { useMemo, useState } from "react"
import { FileUploader } from "@/components/file-uploader"
import { SeoFields, defaultSeoState, prepareSeoPayload, type SeoState } from "@/components/seo-fields"
import { Button } from "@/components/ui/button"
import { absoluteUploadUrl, unwrapData } from "@/lib/utils"

type UploadedFile = {
  id: number
  path: string
  mime: string
  sizeBytes: number
  originalName?: string
}

type PriceFileState = {
  id: number
  path: string
  url: string
  mime: string
  sizeBytes: number | null
  originalName: string
}

interface Props {
  initialData: Record<string, unknown> | null
}

export function PricesForm({ initialData }: Props) {
  const normalized = initialData ? unwrapData<Record<string, unknown>>(initialData) : null
  const [priceFile, setPriceFile] = useState<PriceFileState | null>(() => normalizePriceFile(normalized?.priceListFile))
  const [seo, setSeo] = useState<SeoState>(() => ((normalized?.seo as SeoState) ?? defaultSeoState))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileSizeLabel = useMemo(() => {
    if (!priceFile?.sizeBytes) return null
    return formatSize(priceFile.sizeBytes)
  }, [priceFile])

  function onUploaded(uploaded: UploadedFile) {
    if (!isPdf(uploaded.mime, uploaded.path, uploaded.originalName)) {
      setError("Разрешен только PDF файл")
      return
    }

    setError(null)
    setPriceFile({
      id: uploaded.id,
      path: uploaded.path,
      url: absoluteUploadUrl(uploaded.path),
      mime: uploaded.mime,
      sizeBytes: uploaded.sizeBytes ?? null,
      originalName: uploaded.originalName ?? "price-list.pdf",
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        priceListFileId: priceFile?.id ?? null,
      }
      const seoPayload = prepareSeoPayload(seo)
      if (seoPayload) payload.seo = seoPayload

      const res = await fetch(`/api/admin/pages/prices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())

      setMessage("Прайс-лист сохранен")
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
        <h1 className="text-2xl font-semibold">Цены (PDF)</h1>
        <p className="text-sm text-muted-foreground">
          Загрузите один актуальный PDF-прайс. Этот файл появится на странице `/prices` на фронтенде.
        </p>
      </div>

      <form className="space-y-6" onSubmit={submit}>
        <section className="space-y-4 rounded-2xl border p-4">
          <div>
            <h2 className="text-lg font-semibold">Файл прайса</h2>
            <p className="text-sm text-muted-foreground">Допустим только `.pdf`, до 20 МБ.</p>
          </div>

          <FileUploader onUploaded={onUploaded} accept=".pdf,application/pdf" />

          {priceFile ? (
            <div className="space-y-2 rounded-xl border p-3">
              <div className="text-sm font-medium">{priceFile.originalName}</div>
              <div className="text-xs text-muted-foreground">
                MIME: {priceFile.mime}
                {fileSizeLabel ? ` • ${fileSizeLabel}` : ""}
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={priceFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline-offset-2 hover:underline"
                >
                  Открыть текущий файл
                </a>
                <Button type="button" variant="outline" size="sm" onClick={() => setPriceFile(null)}>
                  Удалить из страницы
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">PDF прайса пока не выбран.</div>
          )}
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

function normalizePriceFile(value: unknown): PriceFileState | null {
  if (!value || typeof value !== "object") return null

  const file = value as Record<string, unknown>
  const id = toNumber(file.id)
  const rawPath = pickString(file.path, file.url)
  if (!id || !rawPath) return null

  return {
    id,
    path: rawPath,
    url: absoluteUploadUrl(rawPath),
    mime: pickString(file.mime) ?? "application/pdf",
    sizeBytes: toNumber(file.sizeBytes),
    originalName: pickString(file.originalName, file.name) ?? "price-list.pdf",
  }
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

"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"

export type SeoState = {
  metaTitle?: string | null
  metaDescription?: string | null
  canonicalUrl?: string | null
  robotsIndex?: boolean
  robotsFollow?: boolean
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageId?: number | null
}

export const defaultSeoState: SeoState = {
  robotsIndex: true,
  robotsFollow: true,
}

export function prepareSeoPayload(seo?: SeoState) {
  if (!seo) return undefined
  const payload: Record<string, any> = {}
  const textKeys: Array<keyof SeoState> = [
    "metaTitle",
    "metaDescription",
    "canonicalUrl",
    "ogTitle",
    "ogDescription",
  ]
  textKeys.forEach((key) => {
    const val = seo[key]
    if (val === undefined) return
    payload[key] = val === "" ? null : val
  })
  if (seo.robotsIndex !== undefined) payload.robotsIndex = seo.robotsIndex
  if (seo.robotsFollow !== undefined) payload.robotsFollow = seo.robotsFollow
  if (seo.ogImageId !== undefined) payload.ogImageId = seo.ogImageId
  return Object.keys(payload).length ? payload : undefined
}

export function SeoFields({ value, onChange }: { value: SeoState; onChange: (next: SeoState) => void }) {
  const state = { ...defaultSeoState, ...value }

  function update(key: keyof SeoState, val: string | number | boolean | null) {
    onChange({ ...state, [key]: val })
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="font-semibold">SEO</div>
      <div className="grid gap-3">
        <div>
          <Label className="text-sm">Meta title</Label>
          <Input value={state.metaTitle ?? ""} onChange={(e) => update("metaTitle", e.target.value)} placeholder="SMAS-лифтинг в OCTAVA" />
        </div>
        <div>
          <Label className="text-sm">Meta description</Label>
          <Textarea value={state.metaDescription ?? ""} onChange={(e) => update("metaDescription", e.target.value)} placeholder="Краткое описание для поисковиков" />
        </div>
        <div>
          <Label className="text-sm">Canonical URL</Label>
          <Input value={state.canonicalUrl ?? ""} onChange={(e) => update("canonicalUrl", e.target.value)} placeholder="https://octava.ru/services/smas" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={state.robotsIndex ?? true} onChange={(e) => update("robotsIndex", e.target.checked)} />
            Индексировать
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={state.robotsFollow ?? true} onChange={(e) => update("robotsFollow", e.target.checked)} />
            Следовать ссылкам
          </label>
        </div>
        <div>
          <Label className="text-sm">OG title</Label>
          <Input value={state.ogTitle ?? ""} onChange={(e) => update("ogTitle", e.target.value)} placeholder="Заголовок для соцсетей" />
        </div>
        <div>
          <Label className="text-sm">OG description</Label>
          <Textarea value={state.ogDescription ?? ""} onChange={(e) => update("ogDescription", e.target.value)} placeholder="Описание карточки" />
        </div>
        <div className="grid gap-2">
          <Label className="text-sm">OG image file ID</Label>
          <div className="flex gap-2">
            <Input type="number" value={state.ogImageId ?? ""} onChange={(e) => update("ogImageId", e.target.value ? Number(e.target.value) : null)} placeholder="123" />
            <Button type="button" variant="outline" onClick={() => update("ogImageId", null)}>Очистить</Button>
          </div>
          <FileUploader onUploaded={(file) => update("ogImageId", file.id)} />
          {state.ogImageId && <div className="text-xs text-muted-foreground">Текущее изображение id={state.ogImageId}</div>}
        </div>
      </div>
    </div>
  )
}

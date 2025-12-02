"use client"

import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { absoluteUploadUrl } from "@/lib/utils"

export type SeoState = {
  metaTitle?: string | null
  metaDescription?: string | null
  canonicalUrl?: string | null
  robotsIndex?: boolean
  robotsFollow?: boolean
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageId?: number | null
  ogImage?: { id?: number | null; path?: string | null } | null
}

export const defaultSeoState: SeoState = {
  robotsIndex: true,
  robotsFollow: true,
  ogImage: null,
}

export function prepareSeoPayload(seo?: SeoState) {
  if (!seo) return undefined
  const payload: Record<string, string | number | boolean | null | undefined> = {}
  const textKeys: Array<"metaTitle" | "metaDescription" | "canonicalUrl" | "ogTitle" | "ogDescription"> = [
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
  const ogPreview = state.ogImage?.path ? absoluteUploadUrl(state.ogImage.path) : null

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
          <Label className="text-sm">Изображение для соцсетей</Label>
          {ogPreview ? (
            <Image
              src={ogPreview}
              alt="OG preview"
              width={800}
              height={320}
              unoptimized
              className="h-32 w-full rounded-lg object-cover"
            />
          ) : state.ogImageId ? (
            <div className="text-xs text-muted-foreground">Изображение прикреплено.</div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Пока не выбрано изображение
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <FileUploader
              onUploaded={(file) =>
                onChange({
                  ...state,
                  ogImageId: file.id,
                  ogImage: { id: file.id, path: file.path },
                })
              }
            />
            {state.ogImageId && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange({ ...state, ogImageId: null, ogImage: null })}
              >
                Очистить
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

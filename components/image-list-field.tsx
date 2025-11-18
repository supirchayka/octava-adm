"use client"

import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { absoluteUploadUrl } from "@/lib/utils"
import type { SimpleImageValue } from "@/components/image-field"

interface Props {
  title: string
  description?: string
  items: SimpleImageValue[]
  onChange: (items: SimpleImageValue[]) => void
  emptyHint?: string
}

export function ImageListField({ title, description, items, onChange, emptyHint }: Props) {
  function updateItem(index: number, patch: Partial<SimpleImageValue>) {
    onChange(items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)))
  }

  function removeItem(index: number) {
    onChange(items.filter((_, idx) => idx !== index))
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const temp = next[index]
    next[index] = next[target]
    next[target] = temp
    onChange(next)
  }

  return (
    <section className="rounded-2xl border p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {items.length === 0 && emptyHint && (
        <div className="text-sm text-muted-foreground">{emptyHint}</div>
      )}
      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Фото {index + 1}</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                ↑
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
              >
                ↓
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                Удалить
              </Button>
            </div>
          </div>
          {item.previewUrl ? (
            <img src={item.previewUrl} alt="Выбранное изображение" className="h-48 w-full rounded-lg object-cover" />
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Пока не выбрано изображение
            </div>
          )}
          <FileUploader
            onUploaded={(file) =>
              updateItem(index, { fileId: file.id, previewUrl: absoluteUploadUrl(file.path) })
            }
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, { id: null, fileId: null, previewUrl: null }])}
      >
        + Добавить фото
      </Button>
    </section>
  )
}

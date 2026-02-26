"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import { absoluteUploadUrl, cn } from "@/lib/utils"

export type SimpleImageValue = {
  id?: number | null
  fileId: number | null
  previewUrl: string | null
}

interface Props {
  label: string
  description?: string
  value: SimpleImageValue
  onChange: (next: SimpleImageValue) => void
  previewClassName?: string
}

export function ImageField({ label, description, value, onChange, previewClassName }: Props) {
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div>
        <div className="font-medium">{label}</div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {value.previewUrl ? (
        <Image
          src={value.previewUrl}
          alt="Выбранное изображение"
          width={800}
          height={320}
          unoptimized
          className={cn("h-48 w-full rounded-lg object-cover", previewClassName)}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Пока не выбрано изображение
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <FileUploader
          onUploaded={(file) =>
            onChange({ id: value.id ?? null, fileId: file.id, previewUrl: absoluteUploadUrl(file.path) })
          }
        />
        {value.fileId && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange({ id: value.id ?? null, fileId: null, previewUrl: null })}
          >
            Очистить
          </Button>
        )}
      </div>
      {value.fileId && <div className="text-xs text-muted-foreground">Фото прикреплено</div>}
    </div>
  )
}

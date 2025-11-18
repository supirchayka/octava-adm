"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { absoluteUploadUrl } from "@/lib/utils"

type UploadedFile = {
  id: number
  path: string
  mime: string
  sizeBytes: number
}

export function FileUploader({ onUploaded }: { onUploaded: (f: UploadedFile) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f))
      else setPreview(null)
      setError(null)
    }
  }

  async function upload() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.set("file", file)
      const res = await fetch("/api/admin/files/upload", { method: "POST", body: form })
      if (!res.ok) throw new Error(await res.text())
      const j = await res.json()
      const normalized: UploadedFile = {
        ...j,
        id: Number(j.id),
      }
      onUploaded(normalized)
      setFile(null)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ""
    } catch (e: any) {
      setError(e.message || "Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-2">
      <input ref={inputRef} type="file" onChange={onPick} className="text-sm" />
      {file && (
        <div className="text-xs text-muted-foreground">
          {file.name} {(file.size / 1024).toFixed(0)} КБ
        </div>
      )}
      {preview && <img src={preview} alt="preview" className="max-h-40 rounded-lg border object-contain" />}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <Button type="button" onClick={upload} disabled={!file || loading}>
        {loading ? "Загружаю..." : "Отправить файл"}
      </Button>
    </div>
  )
}

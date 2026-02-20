import { absoluteUploadUrl } from "@/lib/utils"

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function pickFirstNonEmptyString(values: unknown[]): string | null {
  for (const candidate of values) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate
    }
  }
  return null
}

export function resolveMediaFileId(value: unknown): number | null {
  if (!isRecord(value)) return null
  const file = isRecord(value.file) ? value.file : null
  return asNumber(value.fileId ?? value.id ?? file?.id)
}

export function resolveMediaPreviewUrl(value: unknown): string | null {
  if (!isRecord(value)) return null
  const file = isRecord(value.file) ? value.file : null
  const raw = pickFirstNonEmptyString([
    value.previewUrl,
    value.url,
    value.path,
    file?.url,
    file?.path,
  ])
  return raw ? absoluteUploadUrl(raw) : null
}

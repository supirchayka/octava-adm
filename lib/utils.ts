import { type ClassValue } from "clsx"
import clsx from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function backendURL() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!url) throw new Error("NEXT_PUBLIC_BACKEND_URL not set")
  return url.replace(/\/$/, "")
}

export function absoluteUploadUrl(path: string) {
  const base = backendURL()
  if (path.startsWith("uploads/")) return `${base}/${path}`
  if (path.startsWith("/uploads/")) return `${base}${path}`
  return path
}

export function unwrapData<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T

  let current: Record<string, unknown> = { ...(payload as Record<string, unknown>) }

  while ("data" in current) {
    const nestedData = current.data
    if (!nestedData || typeof nestedData !== "object" || Array.isArray(nestedData)) break
    const { data: innerData, ...rest } = current
    current = { ...rest, ...(innerData as Record<string, unknown>) }
  }

  if ("content" in current) {
    const nestedContent = current.content
    if (nestedContent && typeof nestedContent === "object" && !Array.isArray(nestedContent)) {
      const { content: innerContent, ...rest } = current
      current = { ...rest, ...(innerContent as Record<string, unknown>) }
    }
  }

  return current as T
}

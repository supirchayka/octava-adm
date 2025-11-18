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

export function unwrapData<T = any>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T

  let current: Record<string, unknown> = { ...(payload as Record<string, unknown>) }

  while ("data" in current) {
    const data = current.data
    if (!data || typeof data !== "object" || Array.isArray(data)) break
    const { data: _, ...rest } = current
    current = { ...rest, ...(data as Record<string, unknown>) }
  }

  if ("content" in current) {
    const content = current.content
    if (content && typeof content === "object" && !Array.isArray(content)) {
      const { content: _, ...rest } = current
      current = { ...rest, ...(content as Record<string, unknown>) }
    }
  }

  return current as T
}

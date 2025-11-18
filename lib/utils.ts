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
  if (!("data" in (payload as Record<string, unknown>))) return payload as T

  const { data, ...rest } = payload as Record<string, unknown>
  if (!data || typeof data !== "object") return payload as T

  const merged = { ...(data as Record<string, unknown>), ...rest }
  return merged as T
}

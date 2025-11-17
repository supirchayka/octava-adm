import { cookies } from "next/headers"
import { backendURL } from "@/lib/utils"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookies"

async function refreshTokens(oldRefresh: string | undefined) {
  if (!oldRefresh) return false
  const res = await fetch(`${backendURL()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: oldRefresh }),
    cache: "no-store"
  })
  if (!res.ok) return false
  const data = await res.json()
  const c = cookies()
  const accessExp = 60 * 15 // 15 минут
  const refreshExp = 60 * 60 * 24 * 30 // 30 дней
  c.set(ACCESS_COOKIE, data.accessToken, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: accessExp })
  c.set(REFRESH_COOKIE, data.refreshToken, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: refreshExp })
  return true
}

export async function serverApi(path: string, init: RequestInit = {}, retry = true) {
  const c = cookies()
  const access = c.get(ACCESS_COOKIE)?.value
  const url = path.startsWith("http") ? path : `${backendURL()}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": init.body instanceof FormData ? undefined as any : "application/json",
      ...(init.headers || {}),
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    } as any,
    cache: "no-store"
  })
  if (res.status === 401 && retry) {
    const ok = await refreshTokens(c.get(REFRESH_COOKIE)?.value)
    if (!ok) return res
    return serverApi(path, init, false)
  }
  return res
}

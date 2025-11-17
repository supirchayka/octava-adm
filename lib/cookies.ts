"use server"

import { cookies } from "next/headers"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookie-keys"

export async function getAccessToken() {
  const c = await cookies()
  return c.get(ACCESS_COOKIE)?.value ?? null
}

export async function getRefreshToken() {
  const c = await cookies()
  return c.get(REFRESH_COOKIE)?.value ?? null
}

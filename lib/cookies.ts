"use server"

import { cookies } from "next/headers"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookie-keys"

export async function getAccessToken() {
  return cookies().get(ACCESS_COOKIE)?.value ?? null
}

export async function getRefreshToken() {
  return cookies().get(REFRESH_COOKIE)?.value ?? null
}

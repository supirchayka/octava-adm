"use server"

import { cookies } from "next/headers"

export const ACCESS_COOKIE = "accessToken"
export const REFRESH_COOKIE = "refreshToken"

export function getAccessToken() {
  return cookies().get(ACCESS_COOKIE)?.value ?? null
}

export function getRefreshToken() {
  return cookies().get(REFRESH_COOKIE)?.value ?? null
}

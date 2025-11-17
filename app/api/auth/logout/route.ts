import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const c = cookies()
  c.set("accessToken", "", { httpOnly: true, path: "/", maxAge: 0 })
  c.set("refreshToken", "", { httpOnly: true, path: "/", maxAge: 0 })
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
}

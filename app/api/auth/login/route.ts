import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { backendURL } from "@/lib/utils"

export async function POST(req: Request) {
  const body = await req.json()
  const res = await fetch(`${backendURL()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })

  const j = await res.json().catch(() => ({}))
  if (!res.ok) {
    return NextResponse.json({ message: j?.message || "Unauthorized" }, { status: res.status })
  }

  const accessExp = 60 * 15 // 15 минут
  const refreshExp = 60 * 60 * 24 * 30 // 30 дней
  const c = await cookies()
  c.set("accessToken", j.accessToken, { httpOnly: true, sameSite: "lax", path: "/", maxAge: accessExp })
  c.set("refreshToken", j.refreshToken, { httpOnly: true, sameSite: "lax", path: "/", maxAge: refreshExp })
  //c.set("accessToken", j.accessToken, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: accessExp })
  //c.set("refreshToken", j.refreshToken, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: refreshExp })

  return NextResponse.json({ ok: true, user: j.user })
}

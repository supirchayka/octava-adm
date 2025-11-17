import { NextResponse } from "next/server"
import { serverApi } from "@/lib/server-fetch"

export async function PUT(req: Request) {
  const body = await req.json()
  const res = await serverApi("/admin/org", { method: "PUT", body: JSON.stringify(body) })
  const text = await res.text()
  try { return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } }) }
  catch { return NextResponse.json({ ok: res.ok }, { status: res.status }) }
}

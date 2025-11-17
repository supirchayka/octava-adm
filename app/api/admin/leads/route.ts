import { NextRequest, NextResponse } from "next/server"
import { serverApi } from "@/lib/server-fetch"

export async function GET(req: NextRequest) {
  const url = "/admin/leads" + (req.nextUrl.search || "")
  const res = await serverApi(url, { method: "GET" })
  const text = await res.text()
  try { return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } }) }
  catch { return NextResponse.json({ ok: res.ok }, { status: res.status }) }
}

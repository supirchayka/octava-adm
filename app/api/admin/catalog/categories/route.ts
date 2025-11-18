import { NextResponse } from "next/server"
import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function GET() {
  const res = await serverApi(`/admin/catalog/categories`)
  return forwardResponse(res)
}

export async function POST(req: Request) {
  const body = await req.json()
  const res = await serverApi(`/admin/catalog/categories`, {
    method: "POST",
    body: JSON.stringify(body)
  })
  const text = await res.text()
  try { return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } }) }
  catch { return NextResponse.json({ ok: res.ok }, { status: res.status }) }
}

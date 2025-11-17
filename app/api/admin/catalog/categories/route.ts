import { NextResponse } from "next/server"
import { serverApi } from "@/lib/server-fetch"
import { backendURL } from "@/lib/utils"

export async function GET() {
  const res = await fetch(`${backendURL()}/service-categories`, { cache: "no-store" })
  const j = await res.json()
  return NextResponse.json(j)
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

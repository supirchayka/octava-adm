import { NextRequest, NextResponse } from "next/server"
import { serverApi } from "@/lib/server-fetch"

type IdParams = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, context: IdParams) {
  const { id } = await context.params
  const body = await req.json()
  const res = await serverApi(`/admin/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body)
  })
  const text = await res.text()
  try {
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } })
  } catch {
    return NextResponse.json({ ok: res.ok }, { status: res.status })
  }
}

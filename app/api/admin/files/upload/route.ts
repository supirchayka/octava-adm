import { NextRequest, NextResponse } from "next/server"
import { serverApi } from "@/lib/server-fetch"
import { backendURL } from "@/lib/utils"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Expected 'file' in multipart/form-data" }, { status: 400 })
  }
  // forward to backend
  const backendForm = new FormData()
  backendForm.set("file", file)

  const res = await fetch(`${backendURL()}/admin/files/upload`, {
    method: "POST",
    headers: { Authorization: (await import("next/headers")).cookies().get("accessToken") ? "" : "" } as any,
    body: backendForm,
    cache: "no-store"
  })

  if (!res.ok) {
    const t = await res.text()
    return new NextResponse(t, { status: res.status })
  }
  const j = await res.json()
  return NextResponse.json(j)
}

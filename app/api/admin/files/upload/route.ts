import { NextRequest, NextResponse } from "next/server"
import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

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

  const res = await serverApi(`/admin/files/upload`, {
    method: "POST",
    body: backendForm,
  })

  return forwardResponse(res)
}

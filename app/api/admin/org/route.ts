import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function GET() {
  const res = await serverApi(`/admin/org`)
  return forwardResponse(res)
}

export async function PUT(req: Request) {
  const body = await req.text()
  const res = await serverApi(`/admin/org`, { method: "PUT", body: body || "{}" })
  return forwardResponse(res)
}

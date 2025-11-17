import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function POST(req: Request) {
  const body = await req.text()
  const res = await serverApi(`/admin/catalog/services`, {
    method: "POST",
    body: body || "{}",
  })
  return forwardResponse(res)
}

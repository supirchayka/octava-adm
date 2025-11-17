import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const search = url.search
  const res = await serverApi(`/admin/catalog/services${search}`)
  return forwardResponse(res)
}

export async function POST(req: Request) {
  const body = await req.text()
  const res = await serverApi(`/admin/catalog/services`, {
    method: "POST",
    body: body || "{}",
  })
  return forwardResponse(res)
}

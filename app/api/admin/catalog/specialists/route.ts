import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const query = url.search
  const res = await serverApi(`/admin/catalog/specialists${query}`)
  return forwardResponse(res)
}

export async function POST(req: Request) {
  const body = await req.text()
  const res = await serverApi(`/admin/catalog/specialists`, {
    method: "POST",
    body: body || "{}",
  })
  return forwardResponse(res)
}

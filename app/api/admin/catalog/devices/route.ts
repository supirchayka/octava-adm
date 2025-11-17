import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const query = url.search
  // публичный список аппаратов находится по /devices, поэтому просто проксируем его
  const res = await serverApi(`/devices${query}`)
  return forwardResponse(res)
}

export async function POST(req: Request) {
  const body = await req.text()
  const res = await serverApi(`/admin/catalog/devices`, {
    method: "POST",
    body: body || "{}",
  })
  return forwardResponse(res)
}

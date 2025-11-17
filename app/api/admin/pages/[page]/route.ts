import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function GET(_: Request, { params }: { params: { page: string } }) {
  const res = await serverApi(`/admin/pages/${params.page}`)
  return forwardResponse(res)
}

export async function PUT(req: Request, { params }: { params: { page: string } }) {
  const body = await req.text()
  const res = await serverApi(`/admin/pages/${params.page}`, {
    method: "PUT",
    body: body || "{}",
  })
  return forwardResponse(res)
}

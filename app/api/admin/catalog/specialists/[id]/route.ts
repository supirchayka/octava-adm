import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

type IdParams = { params: Promise<{ id: string }> }

export async function GET(_: Request, context: IdParams) {
  const { id } = await context.params
  const res = await serverApi(`/admin/catalog/specialists/${id}`)
  return forwardResponse(res)
}

export async function PUT(req: Request, context: IdParams) {
  const { id } = await context.params
  const body = await req.text()
  const res = await serverApi(`/admin/catalog/specialists/${id}`, {
    method: "PUT",
    body: body || "{}",
  })
  return forwardResponse(res)
}

export async function DELETE(_: Request, context: IdParams) {
  const { id } = await context.params
  const res = await serverApi(`/admin/catalog/specialists/${id}`, {
    method: "DELETE",
  })
  return forwardResponse(res)
}

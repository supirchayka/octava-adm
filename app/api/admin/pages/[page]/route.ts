import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

type PageParams = { params: Promise<{ page: string }> }

export async function GET(_: Request, context: PageParams) {
  const { page } = await context.params
  const res = await serverApi(`/admin/pages/${page}`)
  return forwardResponse(res)
}

export async function PUT(req: Request, context: PageParams) {
  const { page } = await context.params
  const body = await req.text()
  const res = await serverApi(`/admin/pages/${page}`, {
    method: "PUT",
    body: body || "{}",
  })
  return forwardResponse(res)
}

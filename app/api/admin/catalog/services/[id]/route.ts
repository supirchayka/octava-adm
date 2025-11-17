import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

type IdParams = { params: Promise<{ id: string }> }

export async function GET(_: Request, context: IdParams) {
  const { id } = await context.params
  // публичный эндпоинт возвращает услугу по slug, что позволяет открывать форму
  // редактирования, имея только slug из списка категории
  const res = await serverApi(`/services/${id}`)
  return forwardResponse(res)
}

export async function PUT(req: Request, context: IdParams) {
  const { id } = await context.params
  const body = await req.text()
  const res = await serverApi(`/admin/catalog/services/${id}`, {
    method: "PUT",
    body: body || "{}",
  })
  return forwardResponse(res)
}

export async function DELETE(_: Request, context: IdParams) {
  const { id } = await context.params
  const res = await serverApi(`/admin/catalog/services/${id}`, {
    method: "DELETE",
  })
  return forwardResponse(res)
}

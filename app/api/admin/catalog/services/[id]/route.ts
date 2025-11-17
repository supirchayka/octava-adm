import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  // публичный эндпоинт возвращает услугу по slug, что позволяет открывать форму
  // редактирования, имея только slug из списка категории
  const res = await serverApi(`/services/${params.id}`)
  return forwardResponse(res)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.text()
  const res = await serverApi(`/admin/catalog/services/${params.id}`, {
    method: "PUT",
    body: body || "{}",
  })
  return forwardResponse(res)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const res = await serverApi(`/admin/catalog/services/${params.id}`, {
    method: "DELETE",
  })
  return forwardResponse(res)
}

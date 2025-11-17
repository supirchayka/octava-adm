import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  // публичный эндпоинт возвращает карточку аппарата по slug
  const res = await serverApi(`/devices/${params.id}`)
  return forwardResponse(res)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.text()
  const res = await serverApi(`/admin/catalog/devices/${params.id}`, {
    method: "PUT",
    body: body || "{}",
  })
  return forwardResponse(res)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const res = await serverApi(`/admin/catalog/devices/${params.id}`, {
    method: "DELETE",
  })
  return forwardResponse(res)
}

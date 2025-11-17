import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const res = await serverApi(`/service-categories/${params.slug}`)
  return forwardResponse(res)
}

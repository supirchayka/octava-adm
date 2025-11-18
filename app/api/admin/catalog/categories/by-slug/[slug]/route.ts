import { serverApi } from "@/lib/server-fetch"
import { forwardResponse } from "@/lib/api-proxy"

type SlugParams = { params: Promise<{ slug: string }> }

export async function GET(_: Request, context: SlugParams) {
  const { slug } = await context.params
  const res = await serverApi(`/service-categories/${slug}`)
  return forwardResponse(res)
}

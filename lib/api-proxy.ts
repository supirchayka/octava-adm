import { NextResponse } from "next/server"

export async function forwardResponse(res: Response) {
  const body = await res.text()
  const headers: Record<string, string> = {}
  const contentType = res.headers.get("content-type")
  if (contentType) headers["Content-Type"] = contentType
  else headers["Content-Type"] = "application/json"
  return new NextResponse(body, {
    status: res.status,
    headers,
  })
}

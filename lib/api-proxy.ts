import { NextResponse } from "next/server"

export async function forwardResponse(res: Response) {
  const headers: Record<string, string> = {}
  const contentType = res.headers.get("content-type")
  if (contentType) headers["Content-Type"] = contentType
  else headers["Content-Type"] = "application/json"

  const noContent = res.status === 204 || res.status === 205
  const body = noContent ? null : await res.text()

  return new NextResponse(noContent ? null : body, {
    status: res.status,
    headers,
  })
}
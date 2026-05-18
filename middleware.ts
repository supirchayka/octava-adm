import { NextResponse, type NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/admin")) {
    const access = req.cookies.get("accessToken")?.value
    if (!access) {
      const login = new URL("/login", req.url)
      login.searchParams.set("next", pathname)
      const response = NextResponse.redirect(login)
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet")
      return response
    }
  }
  const response = NextResponse.next()
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet")
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}

import { NextResponse, type NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/admin")) {
    const access = req.cookies.get("accessToken")?.value
    if (!access) {
      const login = new URL("/login", req.url)
      login.searchParams.set("next", pathname)
      return NextResponse.redirect(login)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"]
}

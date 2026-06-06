import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes require isAdmin claim
    if (pathname.startsWith('/admin') && !token?.isAdmin) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Protected routes
        const protectedPaths = [
          '/profile',
          '/listings/new',
          '/messages',
          '/admin',
        ];

        const isProtected =
          protectedPaths.some((p) => pathname.startsWith(p)) ||
          pathname.match(/^\/listings\/[^/]+\/edit$/);

        if (isProtected) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
   '/product',
   '/customermange',
   "/employee",
   "/PurchaseMangement",
    '/sign-in',
    '/sign-up',
    '/',
    '/verify/:path*',
    '/product',         // ✅ add this line
    '/product/:path*'   // ✅ in case there are dynamic segments
  ],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  if (
    token &&
    (url.pathname.startsWith('/sign-in') ||
      url.pathname.startsWith('/sign-up') ||
      url.pathname.startsWith('/verify') ||
      
      url.pathname === '/')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!token && (
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/product')  ||
     url.pathname.startsWith('/customermange') ||
      url.pathname.startsWith('/employee') ||
       url.pathname.startsWith('/PurchaseMangement')   // ✅ check for /product if not authenticated
  )) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

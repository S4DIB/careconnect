// Middleware for authentication protection
// Note: Auth is handled client-side for OAuth compatibility
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Let all requests through - auth is handled client-side
  // This is necessary for OAuth to work properly with session detection
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Empty matcher - middleware doesn't block anything
  ],
};


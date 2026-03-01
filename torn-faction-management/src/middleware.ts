// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { redis } from './lib/redis'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 1. Check for the User Auth Token (The Login)
  const authToken = req.cookies.get('auth_token')?.value;
  
  // 2. Check for Faction ID (The Link to Torn)
  const factionId = req.cookies.get('faction_id')?.value;

  // Protect the Dashboard
  if (pathname.startsWith('/dashboard')) {
    // Kicked to login if no auth token
    if (!authToken) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Kicked to subscription/settings if no faction or expired sub
    if (factionId) {
      const sub: any = await redis.get(`faction:${factionId}:sub`);
      const now = Math.floor(Date.now() / 1000);

    //   if (!sub || sub.expiresAt < now) {
    //     // Only redirect to /subscribe if they aren't already there
    //     if (pathname !== '/dashboard/subscribe') {
    //        return NextResponse.redirect(new URL('/dashboard/subscribe', req.url));
    //     }
    //   }
    }
  }

  return NextResponse.next();
}

// This tells Next.js to only run this code for dashboard routes
export const config = {
  matcher: ['/dashboard/:path*'],
};
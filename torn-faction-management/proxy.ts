// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { redis } from './lib/redis'

export async function proxy(req: NextRequest) {
  const factionId = req.cookies.get('faction_id')?.value
  
  // If trying to access dashboard but no faction info
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!factionId) return NextResponse.redirect(new URL('/login', req.url))

    const sub: any = await redis.get(`faction:${factionId}:sub`)
    const now = Math.floor(Date.now() / 1000)

    if (!sub || sub.expiresAt < now) {
      return NextResponse.redirect(new URL('/subscribe', req.url))
    }
  }
}
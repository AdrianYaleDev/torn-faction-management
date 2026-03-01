// src/app/api/auth/reset/request/route.ts
import { NextResponse } from 'next/server';
import { redis } from '@/src/lib/redis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    
    // 1. Fetch user from Redis
    const user: any = await redis.get(`user:${username}`);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'No email associated with this account' }, { status: 400 });
    }

    // 2. Generate 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Store PIN in Redis (expires in 10 minutes)
    await redis.set(`reset_pin:${username}`, pin, { ex: 600});

    // 4. Send Email via Resend
    await resend.emails.send({
      from: 'Torn Tool <onboarding@resend.dev>', // Use this default for testing
      to: user.email,
      subject: 'Your Password Reset PIN',
      text: `Your 6-digit reset code is: ${pin}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
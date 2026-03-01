// src/app/api/auth/reset/request/route.ts
import { NextResponse } from 'next/server';
import { redis } from '@/src/lib/redis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { username } = await req.json();
  
  // 1. Fetch user to get their email (Stored during signup)
  const user: any = await redis.get(`user:${username}`);
  if (!user || !user.email) {
    return NextResponse.json({ error: 'User or email not found' }, { status: 404 });
  }

  // 2. Generate 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. Store in Redis with a 10-minute (600s) TTL
  await redis.set(`reset_pin:${username}`, pin, { ex: 600 });

  // 4. Send Email
  try {
    await resend.emails.send({
      from: 'Torn Tool <onboarding@resend.dev>', // Use a verified domain or resend's default
      to: user.email,
      subject: 'Your Password Reset PIN',
      text: `Your 6-digit reset code is: ${pin}. It expires in 10 minutes.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
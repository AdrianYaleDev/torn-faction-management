// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { UserService } from '@/src/lib/user-service';
import sign from 'jsonwebtoken'; // You'll need a JWT_SECRET in .env

export async function POST(req: Request) {
  const { username, password, email, action } = await req.json();

  try {
    let user;
    if (action === 'signup') {
      user = await UserService.createUser(username, email, password);
    } else {
      user = await UserService.validateUser(username, password);
    }

    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    // Create a simple JWT token
    const token = Buffer.from(JSON.stringify({ username: user.username })).toString('base64');

    const response = NextResponse.json({ success: true });
    
    // Set a HttpOnly cookie so the browser can't mess with it
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
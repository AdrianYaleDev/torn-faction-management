// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { UserService } from '@/src/lib/user-service';
import { SignJWT } from 'jose'; // Use jose instead of jsonwebtoken

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

    // 1. Prepare the Secret for jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    // 2. Create a SIGNED JWT token
    const token = await new SignJWT({ username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Matches your cookie maxAge
      .sign(secret);

    const response = NextResponse.json({ success: true });
    
    // 3. Set the cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
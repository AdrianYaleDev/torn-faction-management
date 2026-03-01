// src/app/api/auth/reset/route.ts
import { NextResponse } from 'next/server';
import { UserService } from '@/src/lib/user-service';

export async function POST(req: Request) {
  const { username, newPassword } = await req.json();

  try {
    const exists = await UserService.userExists(username);
    if (!exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await UserService.updatePassword(username, newPassword);
    return NextResponse.json({ success: true, message: 'Password updated' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
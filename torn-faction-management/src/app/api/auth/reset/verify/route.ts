// src/app/api/auth/reset/verify/route.ts
import { NextResponse } from 'next/server';
import { redis } from '@/src/lib/redis';
import { UserService } from '@/src/lib/user-service';

export async function POST(req: Request) {
  try {
    const { username, pin, newPassword } = await req.json();

    // 1. Check Redis for the PIN
    const storedPin = await redis.get(`reset_pin:${username}`);

    // DEBUG LOGS (Keep these until you confirm it works)
    console.log("DEBUG: Input PIN:", pin, "| Type:", typeof pin);
    console.log("DEBUG: Stored PIN:", storedPin, "| Type:", typeof storedPin);

    // Check if it exists at all
    if (!storedPin) {
      return NextResponse.json({ error: 'PIN not found or expired' }, { status: 400 });
    }

    // 2. Perform a Type-Safe comparison
    const isMatch = String(storedPin).trim() === String(pin).trim();

    if (!isMatch) {
      console.log("Mismatch detected!");
      return NextResponse.json({ error: 'PIN mismatch' }, { status: 400 });
    }

    // 3. Update the password via UserService
    await UserService.updatePassword(username, newPassword);

    // 4. Clean up Redis (Don't let the PIN be used twice)
    await redis.del(`reset_pin:${username}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
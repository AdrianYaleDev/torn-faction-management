// src/app/api/faction/link/route.ts
import { NextResponse } from 'next/server';
import { redis } from '@/src/lib/redis';
import { UserService } from '@/src/lib/user-service';
import { cookies } from 'next/headers';
import { encrypt } from '@/src/lib/encryption';

export async function POST(req: Request) {
  try {
    const { apiKey, username } = await req.json();

    if (!apiKey || !username) {
      return NextResponse.json({ error: 'Missing API Key or Username' }, { status: 400 });
    }

    // 1. Call Torn to validate key and get Faction ID FIRST
    // We use the raw apiKey here just for the fetch
    const tornRes = await fetch(`https://api.torn.com/faction/?selections=basic&key=${apiKey}`);
    const data = await tornRes.json();

    // Check for Torn API specific errors
    if (data.error) {
      return NextResponse.json({ error: `Torn API Error: ${data.error.error}` }, { status: 400 });
    }

    const factionId = data.ID?.toString();
    if (!factionId) {
      return NextResponse.json({ error: 'This key is valid, but you are not currently in a faction.' }, { status: 400 });
    }

    // 2. NOW Encrypt the key for storage
    const encryptedKey = encrypt(apiKey);

    // 3. Save the Encrypted Key and Faction ID to Redis
    await UserService.linkFaction(username, encryptedKey, factionId);

    // 4. Set a cookie for the faction_id for frontend/middleware use
    const cookieStore = await cookies();
    cookieStore.set('faction_id', factionId, { 
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Set to false if you need to read it via JS on the client
    });

    return NextResponse.json({ 
      success: true, 
      factionId,
      factionName: data.name 
    });

  } catch (error: any) {
    console.error("Link Faction Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
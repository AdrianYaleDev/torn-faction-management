import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redis } from '@/src/lib/redis';
import { decrypt } from '@/src/lib/encryption';
import { syncGlobalItemCatalog } from '@/src/lib/item-catalog';

function parseAdminUsernames() {
  const raw = process.env.ADMIN_USERNAMES || '';
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const username = typeof payload.username === 'string' ? payload.username : '';
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admins = parseAdminUsernames();
    if (admins.length > 0 && !admins.includes(username)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = (await redis.get(`user:${username}`)) as { apiKey?: string } | null;
    const encryptedApiKey = user?.apiKey;
    if (!encryptedApiKey) {
      return NextResponse.json({ error: 'No saved API key found for this user' }, { status: 400 });
    }

    const apiKey = decrypt(encryptedApiKey);
    const categories = await syncGlobalItemCatalog(apiKey);

    return NextResponse.json({ success: true, categories: categories.size });
  } catch (error) {
    console.error('Admin catalog refresh failed:', error);
    return NextResponse.json({ error: 'Failed to refresh item catalog' }, { status: 500 });
  }
}

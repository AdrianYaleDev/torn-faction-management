import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { backfillItemPriceCategoriesFromCatalog } from '@/src/lib/item-catalog';

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

    const result = await backfillItemPriceCategoriesFromCatalog();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Admin catalog backfill failed:', error);
    return NextResponse.json({ error: 'Failed to backfill categories' }, { status: 500 });
  }
}

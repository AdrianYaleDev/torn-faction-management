// src/app/api/cron/sync/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { decrypt } from '@/src/lib/encryption';
import { runMasterSync } from '@/src/lib/sync-engine';

export async function GET(request: Request) {
  // Security Check: Ensure only authorized requests can trigger a full sync
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const factions = await prisma.faction.findMany();
  
  for (const faction of factions) {
    try {
      const key = decrypt(faction.syncApiKey);
      await runMasterSync(faction.id, key);
    } catch (e) {
      console.error(`Sync failed for faction ${faction.id}`, e);
    }
  }

  return NextResponse.json({ ok: true });
}
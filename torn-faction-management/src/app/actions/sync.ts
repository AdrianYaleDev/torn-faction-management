// src/app/actions/sync.ts
'use server';

import { prisma } from '@/src/lib/prisma';
import { parseArmoryNews } from '@/src/lib/utils/logParser';
import { runMasterSync } from '@/src/lib/sync-engine';
import { redis } from '@/src/lib/redis';
import { decrypt } from '@/src/lib/encryption';

function toMarketValueNumber(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.trunc(numeric);
}

export async function syncFactionData(factionId: string, apiKey: string) {
  // 1. Update Global Item Prices First
  const priceRes = await fetch(`https://api.torn.com/torn/?selections=items&key=${apiKey}`);
  const priceData = await priceRes.json();
  
  if (priceData.items) {
    const priceUpdates = Object.values(priceData.items).map((item: any) => ({
      name: item.name,
      marketValue: toMarketValueNumber(item.market_value),
    }));

    // Batch update prices in Aiven
    for (const p of priceUpdates) {
      await prisma.itemPrice.upsert({
        where: { name: p.name },
        update: { marketValue: p.marketValue },
        create: { name: p.name, marketValue: p.marketValue },
      });
    }
  }

  // 2. Fetch Armory News (Recursive Pagination)
  let allLogs: any[] = [];
  const twoWeeksAgo = Math.floor(Date.now() / 1000) - (14 * 24 * 60 * 60);
  
  // Find the most recent log we have to avoid re-fetching the whole 2 weeks
  const latestLocalLog = await prisma.armoryLog.findFirst({
    where: { factionId },
    orderBy: { timestamp: 'desc' }
  });

  let fromTs = latestLocalLog 
    ? Math.floor(latestLocalLog.timestamp.getTime() / 1000) + 1 
    : twoWeeksAgo;

  let currentTo = Math.floor(Date.now() / 1000);
  let keepFetching = true;

  while (keepFetching) {
    const url = `https://api.torn.com/faction/${factionId}?selections=armorynews&from=${fromTs}&to=${currentTo}&key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    const batch = Object.entries(data.armorynews || {});

    if (batch.length === 0) {
      keepFetching = false;
    } else {
      const parsedBatch = batch.map(([logId, log]: [string, any]) => {
        const parsed = parseArmoryNews(log.news);
        if (!parsed) return null;
        return {
          tornLogId: logId,
          factionId,
          timestamp: new Date(log.timestamp * 1000),
          userName: parsed.userName,
          itemName: parsed.itemName,
          qty: parsed.qty,
          type: parsed.type,
          rawNews: log.news
        };
      }).filter(Boolean);

      // Save this batch immediately
      await prisma.armoryLog.createMany({
        data: parsedBatch as any,
        skipDuplicates: true // Critical: prevents crashes on overlapping logs
      });

      const oldestInBatch = Math.min(...batch.map(([_, l]: any) => l.timestamp));
      
      // If we got a full 100 logs, there's likely more history to grab
      if (batch.length >= 100 && oldestInBatch > fromTs) {
        currentTo = oldestInBatch - 1;
      } else {
        keepFetching = false;
      }
    }
  }

  // 3. Update Faction Metadata - SAVE THE ACTUAL API KEY
  await prisma.faction.upsert({
    where: { id: factionId },
    update: {
      lastSync: new Date(),
      syncApiKey: apiKey,
    },
    create: {
      id: factionId,
      syncApiKey: apiKey,
      lastSync: new Date(),
    }
  });

  return { success: true, message: "Sync complete" };
}

export async function triggerManualSync(factionId: string, userId: string) {
  const user = await redis.get(`user:${userId}`) as { apiKey?: string } | null;
  const encryptedApiKey = user?.apiKey;

  if (!encryptedApiKey) {
    throw new Error('No API Key found in your settings. Please save one in the Settings page first.');
  }

  const apiKey = decrypt(encryptedApiKey);

  return await runMasterSync(factionId, apiKey);
}
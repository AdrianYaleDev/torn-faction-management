// src/lib/sync-engine.ts
import { prisma } from '@/src/lib/prisma';
import { parseArmoryNews } from '@/src/lib/utils/logParser';
import { getLocalItemCategoryMap, syncItemPrices } from '@/src/lib/item-catalog';

function hasUnknownArgument(error: unknown, field: string) {
  return error instanceof Error && error.message.includes(`Unknown argument \`${field}\``);
}

export async function runMasterSync(factionId: string, apiKey: string) {
  console.log(`Starting Master Sync for Faction ${factionId}...`);

  await prisma.faction.upsert({
    where: { id: factionId },
    update: { syncApiKey: apiKey },
    create: {
      id: factionId,
      lastSync: new Date(),
      syncApiKey: apiKey,
    }
  });

  // 1. Update prices and use locally managed categories
  await syncItemPrices(apiKey);
  const categoryByName = await getLocalItemCategoryMap();

  // 2. Fetch Armory News (Existing Logic)
  const twoWeeksAgo = Math.floor(Date.now() / 1000) - (14 * 24 * 60 * 60);
  const latestLocal = await prisma.armoryLog.findFirst({
    where: { factionId },
    orderBy: { timestamp: 'desc' }
  });

  let fromTs = latestLocal ? Math.floor(latestLocal.timestamp.getTime() / 1000) + 1 : twoWeeksAgo;
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
          itemCategory: categoryByName.get(parsed.itemName) || null,
          qty: parsed.qty,
          type: parsed.type,
          loanDirection: parsed.loanDirection,
          loanCounterparty: parsed.loanCounterparty,
          rawNews: log.news
        };
      }).filter(Boolean);

      if (parsedBatch.length > 0) {
        try {
          await prisma.armoryLog.createMany({ data: parsedBatch as any, skipDuplicates: true });
        } catch (error) {
          const isCompatIssue = hasUnknownArgument(error, 'itemCategory') || hasUnknownArgument(error, 'loanDirection') || hasUnknownArgument(error, 'loanCounterparty');
          if (!isCompatIssue) throw error;

          const legacyBatch = parsedBatch.map((row: any) => ({
            tornLogId: row.tornLogId,
            factionId: row.factionId,
            timestamp: row.timestamp,
            userName: row.userName,
            itemName: row.itemName,
            qty: row.qty,
            type: row.type,
            rawNews: row.rawNews,
          }));

          await prisma.armoryLog.createMany({ data: legacyBatch as any, skipDuplicates: true });
        }
      }

      const oldestBatchTs = Math.min(...batch.map(([_, l]: any) => l.timestamp));
      if (batch.length >= 100 && oldestBatchTs > fromTs) {
        currentTo = oldestBatchTs - 1;
      } else {
        keepFetching = false;
      }
    }
  }

  // 3. Update Faction Metadata (Using UPSERT to avoid "Record not found" errors)
  await prisma.faction.upsert({
    where: { id: factionId },
    update: { lastSync: new Date() },
    create: { 
      id: factionId, 
      lastSync: new Date(),
      syncApiKey: apiKey // Store the key you used as the master key
    }
  });

  return { success: true, timestamp: new Date() };
}
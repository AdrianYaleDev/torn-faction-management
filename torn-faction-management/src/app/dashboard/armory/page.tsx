// src/app/dashboard/armory/page.tsx
import { prisma } from '@/src/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import ArmoryTable from './ArmoryTable';
import DateFilter from './DateFilter';
import SyncButton from '@/src/components/SyncButton';

type ArmorySearchParams = {
  from?: string | string[];
  to?: string | string[];
};

function readUnixParam(value?: string | string[]): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

export default async function ArmoryPage({ searchParams }: { searchParams: Promise<ArmorySearchParams> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  const factionId = cookieStore.get('faction_id')?.value || '46805';

  let userId = '';
  if (authToken && process.env.JWT_SECRET) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(authToken, secret);
      userId = typeof payload.username === 'string' ? payload.username : '';
    } catch {
      userId = '';
    }
  }
  
  // 1. Handle Dates (Default 7 days)
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 7);
  defaultFrom.setHours(0, 0, 0, 0);

  const defaultTo = new Date(now);
  defaultTo.setHours(23, 59, 59, 999);

  const fromTs = readUnixParam(params.from);
  const toTs = readUnixParam(params.to);

  const from = fromTs ? new Date(fromTs * 1000) : defaultFrom;
  const to = toTs ? new Date(toTs * 1000) : defaultTo;

  // 2. Fetch Data from Aiven (Super Fast!)
  const logs = await prisma.armoryLog.findMany({
    where: {
      factionId,
      timestamp: { gte: from, lte: to }
    }
  });

  // 3. Aggregate Logs into the Ledger format (matching your Python logic)
  const ledger: Record<string, any> = {};
  logs.forEach(log => {
    if (!ledger[log.itemName]) {
      ledger[log.itemName] = { name: log.itemName, in: 0, out: 0, used: 0, net: 0, users: {} };
    }
    
    const type = log.type.toLowerCase() as 'in' | 'out' | 'used';
    ledger[log.itemName][type] += log.qty;
    
    if (!ledger[log.itemName].users[log.userName]) {
        ledger[log.itemName].users[log.userName] = { in: 0, out: 0, used: 0 };
    }
    ledger[log.itemName].users[log.userName][type] += log.qty;
  });

  const itemNames = Object.keys(ledger);
  const prices = itemNames.length
    ? await prisma.itemPrice.findMany({
        where: { name: { in: itemNames } },
        select: { name: true, marketValue: true },
      })
    : [];

  const priceByName = new Map(prices.map((price) => [price.name, Number(price.marketValue)]));

  const finalData = Object.values(ledger).map(item => {
    const net = item.in - (item.out + item.used);
    const unitPrice = priceByName.get(item.name) ?? 0;

    return {
      ...item,
      net,
      unitPrice,
      marketValue: net * unitPrice,
    };
  });

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Faction Ledger (Database)</h1>
        <div className="flex gap-4">
           <DateFilter defaultFrom={Math.floor(from.getTime()/1000)} defaultTo={Math.floor(to.getTime()/1000)} />
    		   {userId ? <SyncButton factionId={factionId} userId={userId} /> : null}
           {/* Add a Sync Button Component here */}
        </div>
      </header>

      <ArmoryTable initialData={finalData} />
    </div>
  );
}
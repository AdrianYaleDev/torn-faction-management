import { prisma } from '@/src/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import DateFilter from '../DateFilter';
import SyncButton from '@/src/components/SyncButton';
import UsersTable from './UsersTable';

type ArmorySearchParams = {
  from?: string | string[];
  to?: string | string[];
};

type ItemAggregate = {
  in: number;
  out: number;
  used: number;
  loanTo: number;
  loanFrom: number;
  category: string | null;
};

function readUnixParam(value?: string | string[]): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

export default async function ArmoryUsersPage({ searchParams }: { searchParams: Promise<ArmorySearchParams> }) {
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

  const logs = await prisma.armoryLog.findMany({
    where: {
      factionId,
      timestamp: { gte: from, lte: to },
    },
    orderBy: {
      userName: 'asc',
    },
  }) as any[];

  const itemNames = Array.from(new Set(logs.map((log) => log.itemName)));
  const prices = itemNames.length
    ? await prisma.itemPrice.findMany({
        where: { name: { in: itemNames } },
      }) as any[]
    : [];

  const priceByName = new Map(prices.map((price) => [price.name, Number(price.marketValue)]));
  const categoryByName = new Map(prices.map((price) => [price.name, price.category]));

  const usersLedger: Record<string, { name: string; items: Record<string, ItemAggregate> }> = {};

  logs.forEach((log) => {
    if (!usersLedger[log.userName]) {
      usersLedger[log.userName] = { name: log.userName, items: {} };
    }

    if (!usersLedger[log.userName].items[log.itemName]) {
      usersLedger[log.userName].items[log.itemName] = {
        in: 0,
        out: 0,
        used: 0,
        loanTo: 0,
        loanFrom: 0,
        category: log.itemCategory || null,
      };
    }

    const type = log.type.toLowerCase() as 'in' | 'out' | 'used';
    usersLedger[log.userName].items[log.itemName][type] += log.qty;

    if (!usersLedger[log.userName].items[log.itemName].category && log.itemCategory) {
      usersLedger[log.userName].items[log.itemName].category = log.itemCategory;
    }

    if (log.loanDirection === 'TO') usersLedger[log.userName].items[log.itemName].loanTo += log.qty;
    if (log.loanDirection === 'FROM') usersLedger[log.userName].items[log.itemName].loanFrom += log.qty;
  });

  const finalData = Object.values(usersLedger)
    .map((user) => {
      const items = Object.entries(user.items)
        .map(([itemName, totals]) => {
          const net = totals.in - (totals.out + totals.used);
          const unitPrice = priceByName.get(itemName) ?? 0;
          return {
            name: itemName,
            category: totals.category || categoryByName.get(itemName) || 'Uncategorized',
            in: totals.in,
            out: totals.out,
            used: totals.used,
            loanTo: totals.loanTo,
            loanFrom: totals.loanFrom,
            net,
            marketValue: net * unitPrice,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      const inTotal = items.reduce((sum, item) => sum + item.in, 0);
      const outTotal = items.reduce((sum, item) => sum + item.out, 0);
      const usedTotal = items.reduce((sum, item) => sum + item.used, 0);
      const netTotal = inTotal - (outTotal + usedTotal);
      const valueTotal = items.reduce((sum, item) => sum + item.marketValue, 0);

      return {
        name: user.name,
        in: inTotal,
        out: outTotal,
        used: usedTotal,
        net: netTotal,
        marketValue: valueTotal,
        items,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between items-start gap-3">
        <h1 className="text-2xl font-bold text-white">Faction User Ledger</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <DateFilter defaultFrom={Math.floor(from.getTime() / 1000)} defaultTo={Math.floor(to.getTime() / 1000)} />
          {userId ? <SyncButton factionId={factionId} userId={userId} /> : null}
        </div>
      </header>

      <UsersTable initialData={finalData} />
    </div>
  );
}

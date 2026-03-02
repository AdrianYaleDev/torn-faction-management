import { prisma } from '@/src/lib/prisma';

function toOptionalBigInt(value: unknown): bigint | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return BigInt(Math.trunc(numeric));
}

function toBigInt(value: unknown): bigint {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0n;
  return BigInt(Math.trunc(numeric));
}

function hasUnknownArgument(error: unknown, field: string) {
  return error instanceof Error && error.message.includes(`Unknown argument \`${field}\``);
}

function expectsIntForField(error: unknown, field: string) {
  if (!(error instanceof Error)) return false;
  return error.message.includes(`Argument \`${field}\`: Invalid value provided. Expected Int or Null, provided BigInt.`);
}

async function fetchTornItems(apiKey: string): Promise<Record<string, any>> {
  const res = await fetch(`https://api.torn.com/torn/?selections=items&key=${apiKey}`, { cache: 'no-store' });
  const data = await res.json();

  if (data?.error) {
    const code = data.error.code ?? 'unknown';
    const message = data.error.error ?? 'Unknown Torn API error';
    throw new Error(`Torn items API error (${code}): ${message}`);
  }

  return (data.items as Record<string, any>) || {};
}

async function upsertItemPrice(name: string, marketValue: bigint, category?: string | null) {
  const shouldUpdateCategory = typeof category === 'string' && category.length > 0;
  const updateData: Record<string, unknown> = { marketValue };
  if (shouldUpdateCategory) {
    updateData.category = category;
  }

  const createData: Record<string, unknown> = { name, marketValue };
  if (shouldUpdateCategory) {
    createData.category = category;
  }

  try {
    await prisma.itemPrice.upsert({
      where: { name },
      update: updateData as any,
      create: createData as any,
    });
  } catch (error) {
    if (!hasUnknownArgument(error, 'category')) throw error;
    await prisma.itemPrice.upsert({
      where: { name },
      update: { marketValue },
      create: { name, marketValue },
    });
  }
}

export async function getLocalItemCategoryMap(): Promise<Map<string, string>> {
  const categoryByName = new Map<string, string>();

  const itemCatalogDelegate = (prisma as any).itemCatalog;
  const canReadItemCatalog = Boolean(itemCatalogDelegate && typeof itemCatalogDelegate.findMany === 'function');

  if (canReadItemCatalog) {
    const catalogRows = await itemCatalogDelegate.findMany({
      where: { category: { not: null } },
      select: { name: true, category: true },
    });

    for (const row of catalogRows as Array<{ name: string; category: string | null }>) {
      if (row.category) categoryByName.set(row.name, row.category);
    }
  }

  const priceRows = await prisma.itemPrice.findMany({
    where: { category: { not: null } },
    select: { name: true, category: true },
  });

  for (const row of priceRows) {
    if (!categoryByName.has(row.name) && row.category) {
      categoryByName.set(row.name, row.category);
    }
  }

  return categoryByName;
}

export async function syncItemPrices(apiKey: string): Promise<void> {
  const items = await fetchTornItems(apiKey);

  for (const item of Object.values(items)) {
    const name = typeof item.name === 'string' ? item.name : null;
    if (!name) continue;

    const marketValue = toBigInt(item.market_value);
    await upsertItemPrice(name, marketValue);
  }
}

export async function syncGlobalItemCatalog(apiKey: string): Promise<Map<string, string>> {
  const items = await fetchTornItems(apiKey);

  const categoryByName = new Map<string, string>();

  const itemCatalogDelegate = (prisma as any).itemCatalog;
  const canWriteItemCatalog = Boolean(itemCatalogDelegate && typeof itemCatalogDelegate.upsert === 'function');

  for (const [itemIdRaw, item] of Object.entries(items)) {
    const itemId = Number(itemIdRaw);
    if (!Number.isFinite(itemId)) continue;

    const name = typeof item.name === 'string' ? item.name : null;
    if (!name) continue;

    const category = item.type || item.category || null;
    if (category) categoryByName.set(name, category);

    const marketValue = toBigInt(item.market_value);

    if (canWriteItemCatalog) {
      const baseUpdate = {
        category,
        weaponType: item.weapon_type || null,
        description: item.description || null,
        effect: item.effect || null,
        requirement: item.requirement || null,
        marketValue,
        circulation: item.circulation == null ? null : toBigInt(item.circulation),
        image: item.image || null,
        tradeable: Boolean(item.tradeable),
      };

      const baseCreate = {
        id: itemId,
        name,
        ...baseUpdate,
      };

      try {
        await itemCatalogDelegate.upsert({
          where: { name },
          update: {
            ...baseUpdate,
            buyPrice: toOptionalBigInt(item.buy_price),
            sellPrice: toOptionalBigInt(item.sell_price),
          },
          create: {
            ...baseCreate,
            buyPrice: toOptionalBigInt(item.buy_price),
            sellPrice: toOptionalBigInt(item.sell_price),
          },
        });
      } catch (error) {
        const intCompatIssue = expectsIntForField(error, 'buyPrice') || expectsIntForField(error, 'sellPrice');
        if (!intCompatIssue) throw error;

        await itemCatalogDelegate.upsert({
          where: { name },
          update: baseUpdate,
          create: baseCreate,
        });
      }
    }

    await upsertItemPrice(name, marketValue, category);
  }

  return categoryByName;
}

export async function backfillItemPriceCategoriesFromCatalog(): Promise<{ scanned: number; updated: number }> {
  const itemCatalogDelegate = (prisma as any).itemCatalog;
  const canReadItemCatalog = Boolean(itemCatalogDelegate && typeof itemCatalogDelegate.findMany === 'function');

  if (!canReadItemCatalog) {
    return { scanned: 0, updated: 0 };
  }

  const catalogRows = (await itemCatalogDelegate.findMany({
    where: { category: { not: null } },
    select: { name: true, category: true },
  })) as Array<{ name: string; category: string | null }>;

  let updated = 0;
  for (const row of catalogRows) {
    if (!row.category) continue;

    const result = await prisma.itemPrice.updateMany({
      where: {
        name: row.name,
        OR: [{ category: null }, { category: '' }],
      },
      data: { category: row.category },
    });

    updated += result.count;
  }

  return { scanned: catalogRows.length, updated };
}

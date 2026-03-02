// src/app/actions/armory.ts

export async function getArmoryStats(key: string, factionId: string, from: number, to: number) {
  let allLogs: any[] = [];
  let currentTo = to;
  let keepFetching = true;
  const MAX_PAGES = 5; // Safety cap: fetches up to 500 logs

  while (keepFetching && (allLogs.length < MAX_PAGES * 100)) {
    const url = `https://api.torn.com/faction/${factionId}?selections=armorynews&key=${key}&from=${from}&to=${currentTo}`;
    
    // const res = await fetch(url, { next: { revalidate: 60 } });
	const res = await fetch(url, { cache: 'no-store' });
    const raw = await res.json();
    const logs = Object.values(raw.armorynews || {}) as any[];

    if (logs.length === 0) {
      keepFetching = false;
    } else {
      allLogs = [...allLogs, ...logs];
      
      // Get the oldest timestamp from this batch
      const oldestTimestamp = Math.min(...logs.map(l => l.timestamp));
      
      // If we got 100 logs, there's likely more. 
      // Shift our 'to' window to just before the oldest log we found.
      if (logs.length >= 100 && oldestTimestamp > from) {
        currentTo = oldestTimestamp - 1;
      } else {
        keepFetching = false;
      }
    }
  }

  // --- PARSING LOGIC (Keep your existing regex logic here) ---
  const stats: Record<string, any> = {};

  allLogs.forEach((log: any) => {
    const msg = log.news || "";
    const userMatch = msg.match(/>([^<]+)<\/a>/);
    const itemMatch = msg.match(/faction's (.*?) items/);
    const user = userMatch ? userMatch[1] : "Unknown User";
    const item = itemMatch ? itemMatch[1] : null;

    if (!item) return;

    const qty = log.quantity || 1;
    let type: 'in' | 'out' | 'used' = 'out';
    const lowerMsg = msg.toLowerCase();

    if (lowerMsg.includes('filled') || lowerMsg.includes('deposited') || lowerMsg.includes('returned')) {
      type = 'in';
    } else if (lowerMsg.includes('used')) {
      type = 'used';
    }

    if (!stats[item]) {
      stats[item] = { name: item, in: 0, out: 0, used: 0, net: 0, marketValue: 0, users: {} };
    }

    stats[item][type] += qty;
    if (!stats[item].users[user]) stats[item].users[user] = { in: 0, out: 0, used: 0 };
    stats[item].users[user][type] += qty;
  });

  return Object.values(stats).map(item => ({
    ...item,
    net: item.in - (item.out + item.used),
    marketValue: (item.in - (item.out + item.used)) * 15000 
  }));
}
// src/app/actions/armory.ts
import { TornApi } from '@/src/lib/torn-api';

export async function getArmoryStats(apiKey: string, factionId: string) {
  // Pass factionId to the API calls to ensure context
  const prices = await TornApi.getItemPrices(apiKey);
  const logData = await TornApi.getArmoryNews(apiKey, factionId);
  
  const ledger: Record<string, any> = {};

  if (!logData || !logData.armorynews) return [];

  Object.values(logData.armorynews).forEach((entry: any) => {
    const text = TornApi.cleanLog(entry.news);
    
    // Regex mapping (Your Python logic ported to JS)
    const bulk = text.match(/(deposited|returned|withdrew|loaned)\s+(\d+)\s?x\s+(.+)/i);
    const gave = text.match(/gave\s+(\d+)\s?x\s+(.+?)\s+to/i);
    const used = text.match(/(used|filled) one of the faction's (.+?) items?/i);

    let qty = 0, item = "", type = "";

    if (bulk) {
      type = ['deposited', 'returned'].includes(bulk[1].toLowerCase()) ? 'IN' : 'OUT';
      qty = parseInt(bulk[2]);
      // Cleaning trailing "from/to" names
      item = bulk[3].split(/\s(to|from)\s/i)[0].trim();
    } else if (gave) {
      type = 'OUT';
      qty = parseInt(gave[1]);
      item = gave[2].trim();
    } else if (used) {
      type = 'USED';
      qty = 1;
      item = used[2].trim();
    }

    if (item) {
      // Initialize item if not seen yet
      if (!ledger[item]) {
        ledger[item] = { name: item, in: 0, out: 0, used: 0, net: 0 };
      }
      
      if (type === 'IN') { 
        ledger[item].in += qty; 
        ledger[item].net += qty; 
      }
      else if (type === 'OUT') { 
        ledger[item].out += qty; 
        ledger[item].net -= qty; 
      }
      else if (type === 'USED') { 
        ledger[item].used += qty; 
        ledger[item].net -= qty; 
      }
    }
  });

  // Attach market values and sort by absolute market impact
  return Object.values(ledger)
    .map(item => ({
      ...item,
      marketValue: (item.net * (prices[item.name] || 0))
    }))
    .sort((a, b) => Math.abs(b.marketValue) - Math.abs(a.marketValue));
}
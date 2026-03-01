// src/lib/torn-api.ts

const BASE_URL = 'https://api.torn.com';

export interface TornItem {
  name: string;
  market_value: number;
}

export const TornApi = {
  /**
   * Fetches global item market prices for value calculations
   */
  async getItemPrices(apiKey: string): Promise<Record<string, number>> {
    const res = await fetch(`${BASE_URL}/torn/?selections=items&key=${apiKey}`, {
      next: { revalidate: 3600 } // Cache for 1 hour in Next.js
    });
    const data = await res.json();
    
    const prices: Record<string, number> = {};
    if (data.items) {
      Object.values(data.items).forEach((item: any) => {
        prices[item.name] = item.market_value || 0;
      });
    }
    return prices;
  },

  /**
   * Fetches and parses Armory News logs
   */
  async getArmoryNews(apiKey: string, from?: number, to?: number) {
    const url = `${BASE_URL}/faction/?selections=armorynews${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}&key=${apiKey}`;
    const res = await fetch(url);
    return res.json();
  },

  /**
   * Utility to strip HTML tags from Torn news strings
   */
  cleanLog(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  }
};
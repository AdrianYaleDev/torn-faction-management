import { decode } from 'html-entities';

export function parseArmoryNews(rawNews: string) {
  const clean = decode(rawNews.replace(/<[^>]*>/g, '').trim());
  const userMatch = rawNews.match(/>([^<]+)<\/a>/);
  const userName = userMatch ? userMatch[1] : "Unknown";

  let qty = 0;
  let itemName = "";
  let type: 'IN' | 'OUT' | 'USED' = 'OUT';
  let loanDirection: 'TO' | 'FROM' | null = null;
  let loanCounterparty: string | null = null;

  const bulk = / (deposited|returned|withdrew|loaned)\s+(\d+)\s?x\s+(.+)/i;
  const gave = /gave\s+(\d+)\s?x\s+(.+?)\s+to\s+(.+?)(?:\.|$)/i;
  const retrieved = /retrieved\s+(\d+)\s?x\s+(.+?)\s+from\s+(.+?)(?:\.|$)/i;
  const singleUse = /used one of the faction's (.+?) items?/i;
  const singleFill = /filled one of the faction's (.+?) items?/i;

  const mBulk = clean.match(bulk);
  const mGave = clean.match(gave);
  const mRetrieved = clean.match(retrieved);
  const mSingleUse = clean.match(singleUse);
  const mSingleFill = clean.match(singleFill);

  if (mBulk) {
    qty = parseInt(mBulk[2]);
    itemName = mBulk[3].split(" to ")[0].split(" from ")[0].trim();
    type = ['deposited', 'returned'].includes(mBulk[1].toLowerCase()) ? 'IN' : 'OUT';

    if (mBulk[1].toLowerCase() === 'loaned') {
      const toMatch = mBulk[3].match(/\s+to\s+(.+?)(?:\.|$)/i);
      const fromMatch = mBulk[3].match(/\s+from\s+(.+?)(?:\.|$)/i);

      if (toMatch) {
        loanDirection = 'TO';
        loanCounterparty = toMatch[1].trim();
      } else if (fromMatch) {
        loanDirection = 'FROM';
        loanCounterparty = fromMatch[1].trim();
      }
    }
  } else if (mGave) {
    qty = parseInt(mGave[1]);
    itemName = mGave[2].trim();
    type = 'OUT';
    loanDirection = 'TO';
    loanCounterparty = mGave[3].trim();
  } else if (mRetrieved) {
    qty = parseInt(mRetrieved[1]);
    itemName = mRetrieved[2].trim();
    type = 'IN';
    loanDirection = 'FROM';
    loanCounterparty = mRetrieved[3].trim();
  } else if (mSingleUse || mSingleFill) {
    qty = 1;
    itemName = (mSingleUse ? mSingleUse[1] : mSingleFill![1]).trim();
    type = mSingleUse ? 'USED' : 'IN';
  }

  return itemName ? { userName, itemName, qty, type, loanDirection, loanCounterparty } : null;
}
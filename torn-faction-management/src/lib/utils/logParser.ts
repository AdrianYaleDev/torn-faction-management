import { decode } from 'html-entities';

export function parseArmoryNews(rawNews: string) {
  const clean = decode(rawNews.replace(/<[^>]*>/g, '').trim());
  const userMatch = rawNews.match(/>([^<]+)<\/a>/);
  const userName = userMatch ? userMatch[1] : "Unknown";

  let qty = 0;
  let itemName = "";
  let type: 'IN' | 'OUT' | 'USED' = 'OUT';

  const bulk = / (deposited|returned|withdrew|loaned)\s+(\d+)\s?x\s+(.+)/i;
  const gave = /gave\s+(\d+)\s?x\s+(.+?)\s+to/i;
  const retrieved = /retrieved\s+(\d+)\s?x\s+(.+?)\s+from/i;
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
  } else if (mGave) {
    qty = parseInt(mGave[1]);
    itemName = mGave[2].trim();
    type = 'OUT';
  } else if (mRetrieved) {
    qty = parseInt(mRetrieved[1]);
    itemName = mRetrieved[2].trim();
    type = 'IN';
  } else if (mSingleUse || mSingleFill) {
    qty = 1;
    itemName = (mSingleUse ? mSingleUse[1] : mSingleFill![1]).trim();
    type = mSingleUse ? 'USED' : 'IN';
  }

  return itemName ? { userName, itemName, qty, type } : null;
}
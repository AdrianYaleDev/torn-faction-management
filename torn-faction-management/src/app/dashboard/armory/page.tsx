// src/app/dashboard/armory/page.tsx
import { getArmoryStats } from '../../actions/armory';
import ArmoryTable from './ArmoryTable';
import DateFilter from './DateFilter';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redis } from '@/src/lib/redis';
import { Key } from 'lucide-react';
import { decrypt } from '@/src/lib/encryption';
import { jwtVerify } from 'jose';

export default async function ArmoryPage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const factionId = cookieStore.get('faction_id')?.value;
  const token = cookieStore.get('auth_token')?.value;

  // 1. JWT Verification
  let username = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      username = payload.username as string;
    } catch (e) {
      console.error("Auth error:", e);
    }
  }

  const user: any = username ? await redis.get(`user:${username}`) : null;

  // 2. Guard Clause
  if (!user || !user.apiKey || !factionId) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <Key className="text-blue-500 mb-6" size={40} />
        <h2 className="text-2xl font-bold text-white mb-2">Faction Integration Required</h2>
        <Link href="/dashboard/settings" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold">
          Go to Settings
        </Link>
      </div>
    );
  }

  // 3. Decrypt Key
  let decryptedKey: string;
  try {
    decryptedKey = decrypt(user.apiKey);
  } catch (err) {
    return <div className="p-8 text-red-400">Error: Key Decryption Failed.</div>;
  }

  // 4. Date Logic
  const now = Math.floor(Date.now() / 1000);
  const oneWeekAgo = now - (7 * 24 * 60 * 60);
  const from = params.from ? parseInt(params.from) : oneWeekAgo;
  const to = params.to ? parseInt(params.to) : now;

  const data = await getArmoryStats(decryptedKey, factionId, from, to);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Armory Ledger</h1>
          <p className="text-slate-400 text-sm">Faction #{factionId} | Logged in as {username}</p>
        </div>
        <DateFilter defaultFrom={from} defaultTo={to} />
      </header>

      {data.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-xl text-slate-400">
          No logs found for this date range.
        </div>
      ) : (
        <ArmoryTable initialData={data} />
      )}
    </div>
  );
}
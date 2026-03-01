// src/app/dashboard/armory/page.tsx
import { getArmoryStats } from '@/src/app/actions/armory'; 
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redis } from '@/src/lib/redis';
import { Key } from 'lucide-react';
import { decrypt } from '@/src/lib/encryption';
import { jwtVerify } from 'jose';

export default async function ArmoryPage() {
  const cookieStore = await cookies();
  const factionId = cookieStore.get('faction_id')?.value;
  const token = cookieStore.get('auth_token')?.value;

  let username = null;

  // 1. Verify and Decode the Signed JWT
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      // This verifies the signature AND extracts the payload
      const { payload } = await jwtVerify(token, secret);
      username = payload.username as string;
    } catch (e) {
      console.error("JWT Verification failed. Token may be tempered or expired:", e);
      // If verification fails, username stays null, triggering the redirect UI below
    }
  }

  // 2. Fetch User Data from Redis using the secure username
  const user: any = username ? await redis.get(`user:${username}`) : null;

  // 3. Guard: Check if we have everything we need
  if (!user || !user.apiKey || !factionId) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-500/10 p-4 rounded-full mb-6">
          <Key className="text-blue-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Faction Integration Required</h2>
        <p className="text-slate-400 mb-8 max-w-sm">
          To track armory movement and market values, you need to provide a Full Access API key in your settings.
        </p>
        <Link 
          href="/dashboard/settings" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  // 4. Decrypt the API key
  let decryptedKey: string;
  try {
    decryptedKey = decrypt(user.apiKey);
  } catch (err) {
    console.error("Decryption failed:", err);
    return (
      <div className="p-8 text-center border border-red-900/50 bg-red-900/10 rounded-xl">
        <p className="text-red-400 font-bold">Security Error</p>
        <p className="text-slate-400 text-sm">Your API key could not be decrypted. Please re-save it in settings.</p>
      </div>
    );
  }

  // 5. Fetch Armory Data
  const data = await getArmoryStats(decryptedKey, factionId);

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Armory Ledger</h1>
          <p className="text-slate-400 text-sm mt-1">
            Live tracking for Faction <span className="text-blue-400 font-mono font-bold">#{factionId}</span>
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Logged in as</p>
          <p className="text-sm text-slate-200 font-medium">{username}</p>
        </div>
      </header>

      {data.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center border-dashed">
          <p className="text-slate-400">No recent armory activity found in the logs.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">
                  <th className="p-4">Item Name</th>
                  <th className="p-4">In</th>
                  <th className="p-4">Out</th>
                  <th className="p-4">Used</th>
                  <th className="p-4">Net Qty</th>
                  <th className="p-4 text-right">Market Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.map((item: any) => (
                  <tr key={item.name} className="hover:bg-blue-500/[0.02] transition-colors group">
                    <td className="p-4 font-medium text-slate-200 group-hover:text-white transition-colors">
                      {item.name}
                    </td>
                    <td className="p-4 text-green-400 font-mono">+{item.in}</td>
                    <td className="p-4 text-red-400 font-mono">-{item.out}</td>
                    <td className="p-4 text-orange-400 font-mono">{item.used}</td>
                    <td className={`p-4 font-bold font-mono ${item.net >= 0 ? 'text-slate-100' : 'text-red-500'}`}>
                      {item.net > 0 ? `+${item.net}` : item.net}
                    </td>
                    <td className={`p-4 text-right font-mono text-sm ${item.marketValue >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD',
                        maximumFractionDigits: 0 
                      }).format(item.marketValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
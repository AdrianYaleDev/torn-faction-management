// src/app/dashboard/page.tsx
import { Wallet, Package, TrendingUp } from 'lucide-react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redis } from '@/src/lib/redis';
import Link from 'next/link';

export default async function DashboardHome() {
  // Decode the JWT to get the username
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;

  let username = '';
  if (authToken && process.env.JWT_SECRET) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(authToken, secret);
      username = typeof payload.username === 'string' ? payload.username : '';
    } catch {
      username = '';
    }
  }

  // Check if the user has already linked an API key
  const user: any = username ? await redis.get(`user:${username}`) : null;
  const hasApiKey = !!(user?.apiKey);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Faction Overview</h1>
        <p className="text-slate-400">Welcome back. Here is what's happening in the armory.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Vault Balance" value="$0.00" icon={<Wallet className="text-green-500" />} />
        <StatCard title="Armory Items" value="0" icon={<Package className="text-blue-500" />} />
        <StatCard title="Net Growth" value="+$0" icon={<TrendingUp className="text-purple-500" />} />
      </div>

      {!hasApiKey && (
        <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <p className="text-slate-400 mb-4">You haven't linked a Torn API key yet.</p>
          <Link
            href="/dashboard/settings"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition"
          >
            Go to Settings
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400 font-medium uppercase">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="p-3 bg-slate-800 rounded-lg">{icon}</div>
    </div>
  );
}

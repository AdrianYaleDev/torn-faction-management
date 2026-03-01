// src/app/dashboard/page.tsx
import { Wallet, Package, TrendingUp } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Faction Overview</h1>
        <p className="text-slate-400">Welcome back. Here is what’s happening in the armory.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Vault Balance" value="$0.00" icon={<Wallet className="text-green-500" />} />
        <StatCard title="Armory Items" value="0" icon={<Package className="text-blue-500" />} />
        <StatCard title="Net Growth" value="+$0" icon={<TrendingUp className="text-purple-500" />} />
      </div>
      
      <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <p className="text-slate-400 mb-4">You haven't linked a Torn API key yet.</p>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition">
          Go to Settings
        </button>
      </div>
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
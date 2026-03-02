'use client';
import { useState } from 'react';
import { Key, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [adminRefreshing, setAdminRefreshing] = useState(false);
  const [adminBackfilling, setAdminBackfilling] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // In a real session, you'd get the username from a provider/cookie
      // For now, we'll assume the user is logged in
      const res = await fetch('/api/faction/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, username: 'BarnaclesUK' }), 
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', msg: `Successfully linked to Faction #${data.factionId}!` });
        setApiKey(''); // Clear input
      } else {
        setStatus({ type: 'error', msg: data.error || 'Failed to link faction' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'A network error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCatalogRefresh = async () => {
    setAdminRefreshing(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/catalog/refresh', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', msg: data.error || 'Failed to refresh item catalog' });
      } else {
        setStatus({ type: 'success', msg: `Catalog refreshed (${data.categories} categories mapped).` });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Failed to refresh item catalog' });
    } finally {
      setAdminRefreshing(false);
    }
  };

  const handleAdminCategoryBackfill = async () => {
    setAdminBackfilling(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/catalog/backfill', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', msg: data.error || 'Failed to backfill categories' });
      } else {
        setStatus({ type: 'success', msg: `Backfill complete (${data.updated} rows updated from ${data.scanned} catalog items).` });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Failed to backfill categories' });
    } finally {
      setAdminBackfilling(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <p className="text-slate-400">Manage your Torn API integrations and faction connectivity.</p>
      </header>

      <div className="space-y-6">
        {/* API Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Key className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Torn API Integration</h2>
              <p className="text-sm text-slate-500">Requires a "Full Access" key for Armory News.</p>
            </div>
          </div>

          <form onSubmit={handleLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">API Key</label>
              <input 
                type="password" 
                placeholder="Enter your 16-character key"
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>

            {status && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {status.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-medium">{status.msg}</p>
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all transform active:scale-[0.98]"
            >
              {loading ? 'Validating with Torn...' : 'Update API Connection'}
            </button>
          </form>
        </section>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleAdminCategoryBackfill}
            disabled={adminBackfilling}
            className="text-xs px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition disabled:opacity-50"
          >
            {adminBackfilling ? 'Backfilling...' : 'Admin: Backfill Categories'}
          </button>
          <button
            type="button"
            onClick={handleAdminCatalogRefresh}
            disabled={adminRefreshing}
            className="text-xs px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition disabled:opacity-50"
          >
            {adminRefreshing ? 'Refreshing Catalog...' : 'Admin: Refresh Item Catalog'}
          </button>
        </div>

        {/* Security Info */}
        <div className="bg-blue-900/10 border border-blue-800/20 p-4 rounded-xl flex gap-4">
          <ShieldCheck className="text-blue-500 shrink-0" size={24} />
          <p className="text-xs text-slate-400 leading-relaxed">
            Your API key is encrypted using AES-256-GCM before being stored. 
            We only use this key to fetch Armory logs and market prices for your faction ledger.
          </p>
        </div>
      </div>
    </div>
  );
}
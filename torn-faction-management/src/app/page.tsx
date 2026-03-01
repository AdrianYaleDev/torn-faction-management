// src/app/page.tsx (Updated)
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = view === 'forgot' ? '/api/auth/reset' : '/api/auth';
    const payload = view === 'forgot' 
      ? { username: form.username, newPassword: form.password }
      : { ...form, action: view };

    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (res.ok) {
      if (view === 'forgot') {
        alert('Password updated! Please login.');
        setView('login');
      } else {
        router.push('/dashboard');
      }
    } else {
      const data = await res.json();
      alert(data.error || 'Operation failed');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-500">Torn Faction</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          {view === 'login' && 'Sign in to manage your faction'}
          {view === 'signup' && 'Create an account to get started'}
          {view === 'forgot' && 'Reset your account password'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" placeholder="Username" required
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setForm({...form, username: e.target.value})}
          />
          <input 
            type="password" 
            placeholder={view === 'forgot' ? "New Password" : "Password"} 
            required
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setForm({...form, password: e.target.value})}
          />
          <button 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : view === 'login' ? 'Login' : view === 'signup' ? 'Sign Up' : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center space-y-2 text-sm text-slate-400">
          {view === 'login' && (
            <>
              <button onClick={() => setView('signup')} className="hover:text-white transition">Don't have an account? Sign up</button>
              <button onClick={() => setView('forgot')} className="hover:text-white transition">Forgot password?</button>
            </>
          )}
          {(view === 'signup' || view === 'forgot') && (
            <button onClick={() => setView('login')} className="hover:text-white transition">Back to Login</button>
          )}
        </div>
      </div>
    </main>
  );
}
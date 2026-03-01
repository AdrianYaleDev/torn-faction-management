// src/app/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '' });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ ...form, action: isLogin ? 'login' : 'signup' }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      alert('Authentication failed');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
        <h1 className="text-3xl font-bold mb-6 text-center">Torn Faction Tool</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" placeholder="Username" 
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setForm({...form, username: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" 
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setForm({...form, password: e.target.value})}
          />
          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-sm text-slate-400 hover:text-white"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </main>
  );
}
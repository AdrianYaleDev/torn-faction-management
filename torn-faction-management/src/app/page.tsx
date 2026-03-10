'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [form, setForm] = useState({ username: '', password: '', email: '', pin: '' });
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Unified submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Handle Forgot Password Flow
    if (view === 'forgot') {
      if (step === 'request') {
        await handleRequestPin();
      } else {
        await handleVerifyPin();
      }
      setLoading(false);
      return; 
    }

    // 2. Handle standard Login/Signup Flow
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ ...form, action: view }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      alert(data.error || 'Authentication failed');
    }
  };

  const handleRequestPin = async () => {
    try {
      const res = await fetch('/api/auth/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username }),
      });
      
      if (res.ok) {
        alert("PIN sent to your email!");
        setStep('verify');
      } else {
        const data = await res.json();
        alert(data.error || "Could not send PIN");
      }
    } catch (err) {
      alert("An error occurred.");
    }
  };

  const handleVerifyPin = async () => {
    try {
      const res = await fetch('/api/auth/reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: form.username, 
          pin: form.pin, 
          newPassword: form.password 
        }),
      });

      if (res.ok) {
        alert("Password reset successfully! Please log in.");
        setView('login');
        setStep('request'); // Reset step for next time
      } else {
        const data = await res.json();
        alert(data.error || "Invalid PIN");
      }
    } catch (err) {
      alert("An error occurred.");
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
          {/* Always show Username */}
          <input 
            type="text" placeholder="Username" required
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 outline-none"
            value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
          />

          {/* Signup specific: Email */}
          {view === 'signup' && (
            <input 
              type="email" placeholder="Email Address" required
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 outline-none animate-in fade-in duration-300"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          )}

          {/* Forgot specific: PIN input only shows on verify step */}
          {view === 'forgot' && step === 'verify' && (
            <input 
              type="text" placeholder="6-Digit PIN" required
              maxLength={6}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 outline-none text-center tracking-[1em] font-bold"
              value={form.pin}
              onChange={e => setForm({...form, pin: e.target.value})}
            />
          )}

          {/* Password field: Hidden if we are just requesting a PIN */}
          {(view !== 'forgot' || step === 'verify') && (
            <input 
              type="password" 
              placeholder={view === 'forgot' ? "New Password" : "Password"} 
              required
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 outline-none"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 
             view === 'login' ? 'Login' : 
             view === 'signup' ? 'Sign Up' : 
             step === 'request' ? 'Send Reset PIN' : 'Update Password'}
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
            <button
              onClick={() => {
                setView('login');
                setStep('request');
              }}
              className="hover:text-white transition"
            >
              Back to Login
            </button>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <a href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition">
            Terms of Service
          </a>
        </div>
      </div>
    </main>
  );
}
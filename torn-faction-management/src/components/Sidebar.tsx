// src/components/Sidebar.tsx
'use client'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut, ShieldCheck, Settings, Users, Menu, X, FileText } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Armory', href: '/dashboard/armory', icon: ShieldCheck },
    // { name: 'Users', href: '/dashboard/armory/users', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const currentItem = menuItems.find(item => item.href === pathname);

  return (
    <>
      {/* DESKTOP SIDEBAR: Visible on medium screens and up */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-slate-900 border-r border-slate-800 h-screen sticky top-0">
        <div className="p-6">
          <h2 className="text-xl font-bold text-blue-500">Torn Faction</h2>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 w-full p-3 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
          <div className="mt-3 text-center">
            <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM BAR & OVERLAY */}
      <div className="md:hidden">
        {/* Mobile menu overlay that expands upwards */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[9998] bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <div 
              className="absolute bottom-16 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-white">Menu</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-xl transition aspect-square ${
                        isActive 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-slate-800/50 text-slate-400 active:bg-slate-700 border border-slate-700/50'
                      }`}
                    >
                      <Icon size={28} strokeWidth={1.5} />
                      <span className="text-sm font-medium text-center">{item.name}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/terms"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-xl transition aspect-square ${
                    pathname === '/terms' 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                      : 'bg-slate-800/50 text-slate-400 active:bg-slate-700 border border-slate-700/50'
                  }`}
                >
                  <FileText size={28} strokeWidth={1.5} />
                  <span className="text-sm font-medium text-center">Terms</span>
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center space-x-3 w-full p-3 bg-red-900/20 text-red-400 rounded-xl transition active:bg-red-900/40"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed bottom bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 py-3 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Torn Faction</span>
            <span className="text-sm font-semibold text-white">{currentItem?.name || 'Menu'}</span>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-3 rounded-full transition-colors ${isMobileMenuOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 active:bg-slate-700'}`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>
    </>
  );
}
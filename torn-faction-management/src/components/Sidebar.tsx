// src/components/Sidebar.tsx
'use client'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut, ShieldCheck, Settings, Users } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Armory', href: '/dashboard/armory', icon: ShieldCheck },
    { name: 'Users', href: '/dashboard/armory/users', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

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
        </div>
      </aside>

      {/* MOBILE BOTTOM BAR: Fixed to bottom, hidden on medium screens and up */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-all ${
                isActive ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className={`text-[10px] mt-1 ${isActive ? 'block' : 'hidden'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-red-400"
        >
          <LogOut size={24} strokeWidth={1.75} />
          <span className="text-[10px] mt-1 hidden">Exit</span>
        </button>
      </nav>
    </>
  );
}
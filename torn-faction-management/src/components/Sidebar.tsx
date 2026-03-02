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
    // We'll just call our logout API or clear the cookie
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
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
  );
}
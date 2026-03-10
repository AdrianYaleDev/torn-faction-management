// src/app/dashboard/layout.tsx
import Sidebar from '@/src/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
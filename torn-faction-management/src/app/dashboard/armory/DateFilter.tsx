'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

export default function DateFilter({ defaultFrom, defaultTo }: { defaultFrom: number, defaultTo: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateDates = (e: any) => {
    const form = e.currentTarget.form;
    const from = Math.floor(new Date(form.from.value).getTime() / 1000);
    const toDate = new Date(form.to.value);
    toDate.setHours(23, 59, 59, 999);
    const to = Math.floor(toDate.getTime() / 1000);
    
    // startTransition tells Next.js to treat this as a background refresh
    startTransition(() => {
      router.push(`/dashboard/armory?from=${from}&to=${to}`);
    });
  };

  return (
    <div className="flex items-center gap-3">
      {isPending && <Loader2 size={16} className="text-blue-500 animate-spin" />}
      <form className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
        <input 
          name="from" 
          type="date" 
          defaultValue={new Date(defaultFrom * 1000).toISOString().split('T')[0]} 
          onChange={updateDates}
          className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
        />
        <span className="text-slate-600">→</span>
        <input 
          name="to" 
          type="date" 
          defaultValue={new Date(defaultTo * 1000).toISOString().split('T')[0]} 
          onChange={updateDates}
          className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
        />
      </form>
    </div>
  );
}
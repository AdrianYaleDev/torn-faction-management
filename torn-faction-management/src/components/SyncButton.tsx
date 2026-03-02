'use client';
import { useState, useTransition } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { triggerManualSync } from '@/src/app/actions/sync';

export default function SyncButton({ factionId, userId }: { factionId: string, userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSync = () => {
    startTransition(async () => {
      const result = await triggerManualSync(factionId, userId);
      if (result.success) {
        setShowSuccess(true);
        router.refresh(); // Tells Next.js to re-fetch data from Aiven
        setTimeout(() => setShowSuccess(false), 3000);
      }
    });
  };

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        showSuccess 
          ? 'bg-green-500/10 text-green-400 border border-green-500/50' 
          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
      } disabled:opacity-50`}
    >
      {showSuccess ? (
        <CheckCircle2 size={18} />
      ) : (
        <RefreshCw size={18} className={isPending ? 'animate-spin' : ''} />
      )}
      {isPending ? 'Syncing...' : showSuccess ? 'Updated' : 'Sync Now'}
    </button>
  );
}
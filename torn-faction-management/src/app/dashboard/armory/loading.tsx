// src/app/dashboard/armory/loading.tsx
import { Loader2 } from "lucide-react";

export default function ArmoryLoading() {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-800/50 rounded animate-pulse" />
        </div>
        <div className="h-10 w-64 bg-slate-800 rounded animate-pulse" />
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-8 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="text-blue-500 animate-spin" size={40} />
          <p className="text-slate-400 font-medium animate-pulse">
            Analyzing Armory Logs...
          </p>
          <div className="w-full max-w-xs bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-1/3 animate-progress" />
          </div>
        </div>
        
        {/* Skeleton Table Rows */}
        <div className="border-t border-slate-800 divide-y divide-slate-800/50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex justify-between">
              <div className="h-4 w-1/4 bg-slate-800/50 rounded" />
              <div className="h-4 w-1/6 bg-slate-800/50 rounded" />
              <div className="h-4 w-1/6 bg-slate-800/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
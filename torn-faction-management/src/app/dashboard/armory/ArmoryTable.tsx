'use client';
import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, User } from 'lucide-react';

export default function ArmoryTable({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setData(initialData);
    setExpandedRows({});
  }, [initialData]);

  const getRowKey = (item: any) => item.name;

  const toggleRow = (rowKey: string) => {
    setExpandedRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const handleSort = (key: string) => {
    const dir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    const sorted = [...data].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    setData(sorted);
    setSortKey(key);
    setSortDir(dir);
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredData = normalizedSearch
    ? data.filter((item) => {
        const itemMatch = item.name.toLowerCase().includes(normalizedSearch);
        if (itemMatch) return true;
        return Object.keys(item.users || {}).some((user) => user.toLowerCase().includes(normalizedSearch));
      })
    : data;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-3 border-b border-slate-800 bg-slate-900">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search item or user..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none"
        />
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">
            <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
              Item Name <ArrowUpDown size={12} className="inline ml-1" />
            </th>
            <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('in')}>In</th>
            <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('out')}>Out</th>
            <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('used')}>Used</th>
            <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('net')}>Net Qty</th>
            <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('marketValue')}>Market Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {filteredData.map((item) => {
            const rowKey = getRowKey(item);

            return (
            <React.Fragment key={rowKey}>
              <tr 
                onClick={() => toggleRow(rowKey)}
                className="hover:bg-blue-500/[0.04] transition-colors group cursor-pointer"
              >
                <td className="p-4 flex items-center gap-3 text-sm">
                  {expandedRows[rowKey] ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  <span className="font-medium text-slate-200 group-hover:text-white">{item.name}</span>
                </td>
                <td className="p-4 text-green-400 font-mono text-sm">+{item.in}</td>
                <td className="p-4 text-red-400 font-mono text-sm">-{item.out}</td>
                <td className="p-4 text-orange-400 font-mono text-sm">{item.used}</td>
                <td className={`p-4 font-bold font-mono text-sm ${item.net >= 0 ? 'text-slate-100' : 'text-red-500'}`}>
                  {item.net > 0 ? `+${item.net}` : item.net}
                </td>
                <td className="p-4 text-right font-mono text-sm text-green-500">
                  ${item.marketValue.toLocaleString()}
                </td>
              </tr>
              
              {/* DROPDOWN USER LIST */}
              {expandedRows[rowKey] && (
                <tr className="bg-black/20 border-l-4 border-blue-600/50">
                  <td colSpan={6} className="p-0">
                    <div className="overflow-hidden">
                      <table className="w-full text-left border-collapse bg-slate-800/20">
                        <tbody>
                          {Object.entries(item.users).map(([user, val]: any) => (
                            <tr key={user} className="border-b border-slate-800/30 last:border-0 hover:bg-white/[0.02]">
                              {/* Align with Item Name */}
                              <td className="p-3 pl-12 w-[25%] md:w-[35%]">
                                <div className="flex items-center gap-2">
                                  <User size={12} className="text-slate-500" />
                                  <span className="text-xs text-slate-400 font-medium">{user}</span>
                                </div>
                              </td>
                              {/* Align with IN */}
                              <td className="p-3 text-xs font-mono text-green-500/70 w-[10%]">
                                {val.in > 0 ? `+${val.in}` : ''}
                              </td>
                              {/* Align with OUT */}
                              <td className="p-3 text-xs font-mono text-red-500/70 w-[10%]">
                                {val.out > 0 ? `-${val.out}` : ''}
                              </td>
                              {/* Align with USED */}
                              <td className="p-3 text-xs font-mono text-orange-500/70 w-[10%]">
                                {val.used > 0 ? val.used : ''}
                              </td>
                              {/* Empty space for Net/Market Value to keep alignment clean */}
                              <td colSpan={2}></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          )})}
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-sm text-slate-400">
                No matching ledger rows.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
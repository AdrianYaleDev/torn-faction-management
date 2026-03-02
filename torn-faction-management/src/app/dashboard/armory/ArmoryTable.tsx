'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, User } from 'lucide-react';

export default function ArmoryTable({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  const itemOptions = useMemo(() => {
    return data
      .map((item) => ({ name: item.name, category: item.category || 'Uncategorized' }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(itemOptions.map((item) => item.category))).sort((a, b) => a.localeCompare(b));
  }, [itemOptions]);

  const selectedLabel = selectedItems.length ? `${selectedItems.length} selected` : 'All Items';

  const toggleItemSelection = (itemName: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemName)) {
        return prev.filter((item) => item !== itemName);
      }
      return [...prev, itemName];
    });
    setExpandedRows({});
  };

  const normalizedSearch = search.trim().toLowerCase();
  const baseFilteredData = selectedItems.length
    ? data.filter((item) => selectedItems.includes(item.name))
    : data;

  const filteredData = normalizedSearch
    ? baseFilteredData.filter((item) => {
        const itemMatch = item.name.toLowerCase().includes(normalizedSearch);
        if (itemMatch) return true;
        return Object.keys(item.users || {}).some((user) => user.toLowerCase().includes(normalizedSearch));
      })
    : baseFilteredData;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-3 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center gap-3">
        <select
          value={selectedCategory}
          onChange={(e) => {
            const category = e.target.value;
            setSelectedCategory(category);
            if (!category) {
              setSelectedItems([]);
            } else {
              setSelectedItems(itemOptions.filter((item) => item.category === category).map((item) => item.name));
            }
            setExpandedRows({});
          }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
        >
          <option value="">All Categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <div className="relative w-full sm:w-auto sm:min-w-[260px]">
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="w-full sm:min-w-[260px] flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute z-20 mt-2 w-full sm:w-[340px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl">
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {itemOptions.map((item) => {
                  const checked = selectedItems.includes(item.name);
                  return (
                    <label key={item.name} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItemSelection(item.name)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                      />
                      <span className="truncate">{item.name}</span>
                    </label>
                  );
                })}
              </div>
              <div className="p-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItems([]);
                    setSelectedCategory('');
                    setExpandedRows({});
                  }}
                  className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="text-xs px-2 py-1 rounded border border-blue-600/60 text-blue-300 hover:text-white hover:border-blue-500 transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search item or user..."
          className="w-full sm:flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none"
        />
      </div>
      <table className="w-full text-left border-collapse table-fixed">
        <colgroup>
          <col className="w-[40%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
        </colgroup>
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
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-200 group-hover:text-white">{item.name}</span>
                    <span className="text-[11px] text-slate-500">{item.category || 'Uncategorized'} • Loans To: {item.loanTo || 0} • Loans From: {item.loanFrom || 0}</span>
                  </div>
                </td>
                <td className="p-4 text-green-400 font-mono text-sm">+{item.in}</td>
                <td className="p-4 text-red-400 font-mono text-sm">-{item.out}</td>
                <td className="p-4 text-orange-400 font-mono text-sm">{item.used}</td>
                <td className={`p-4 font-bold font-mono text-sm ${item.net >= 0 ? 'text-slate-100' : 'text-red-500'}`}>
                  {item.net > 0 ? `+${item.net}` : item.net}
                </td>
                <td className={`p-4 text-right font-mono text-sm ${item.marketValue >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {item.marketValue > 0 ? '+' : item.marketValue < 0 ? '-' : ''}${Math.abs(item.marketValue).toLocaleString()}
                </td>
              </tr>
              
              {/* DROPDOWN USER LIST */}
              {expandedRows[rowKey] && (
                <tr className="bg-black/20 border-l-4 border-blue-600/50">
                  <td colSpan={6} className="p-0">
                    <div className="overflow-hidden">
                      <table className="w-full text-left border-collapse bg-slate-800/20 table-fixed">
                        <colgroup>
                          <col className="w-[40%]" />
                          <col className="w-[12%]" />
                          <col className="w-[12%]" />
                          <col className="w-[12%]" />
                          <col className="w-[12%]" />
                          <col className="w-[12%]" />
                        </colgroup>
                        <tbody>
                          {Object.entries(item.users).map(([user, val]: any) => (
                            <tr key={user} className="border-b border-slate-800/30 last:border-0 hover:bg-white/[0.02]">
                              <td className="p-3 pl-12">
                                <div className="flex items-center gap-2">
                                  <User size={12} className="text-slate-500" />
                                  <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-medium">{user}</span>
                                    <span className="text-[10px] text-slate-500">Loans To: {val.loanTo || 0} • Loans From: {val.loanFrom || 0}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-xs font-mono text-green-500/70">
                                {val.in > 0 ? `+${val.in}` : ''}
                              </td>
                              <td className="p-3 text-xs font-mono text-red-500/70">
                                {val.out > 0 ? `-${val.out}` : ''}
                              </td>
                              <td className="p-3 text-xs font-mono text-orange-500/70">
                                {val.used > 0 ? val.used : ''}
                              </td>
                              <td className={`p-3 text-xs font-mono ${val.in - (val.out + val.used) >= 0 ? 'text-slate-300' : 'text-red-400'}`}>
                                {val.in - (val.out + val.used) > 0 ? `+${val.in - (val.out + val.used)}` : val.in - (val.out + val.used)}
                              </td>
                              <td className={`p-3 text-xs font-mono text-right ${(val.in - (val.out + val.used)) * item.unitPrice >= 0 ? 'text-green-500/80' : 'text-red-400/80'}`}>
                                {(val.in - (val.out + val.used)) * item.unitPrice > 0 ? '+' : (val.in - (val.out + val.used)) * item.unitPrice < 0 ? '-' : ''}${Math.abs((val.in - (val.out + val.used)) * item.unitPrice).toLocaleString()}
                              </td>
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
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, User, Package, ArrowUpDown } from 'lucide-react';

type ItemBreakdown = {
  name: string;
  category: string;
  in: number;
  out: number;
  used: number;
  loanTo: number;
  loanFrom: number;
  net: number;
  marketValue: number;
};

type UserRow = {
  name: string;
  in: number;
  out: number;
  used: number;
  net: number;
  marketValue: number;
  items: ItemBreakdown[];
};

export default function UsersTable({ initialData }: { initialData: UserRow[] }) {
  const [data, setData] = useState(initialData);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<'name' | 'in' | 'out' | 'used' | 'net' | 'marketValue'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    setData(initialData);
    setExpandedRows({});
  }, [initialData]);

  const toggleRow = (rowKey: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const handleSort = (key: 'name' | 'in' | 'out' | 'used' | 'net' | 'marketValue') => {
    const nextDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(nextDir);
  };

  const itemOptions = useMemo(() => {
    const items = new Map<string, string>();
    data.forEach((user) => {
      user.items.forEach((item) => items.set(item.name, item.category || 'Uncategorized'));
    });
    return Array.from(items.entries())
      .map(([name, category]) => ({ name, category }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(itemOptions.map((item) => item.category))).sort((a, b) => a.localeCompare(b));
  }, [itemOptions]);

  const hasItemFilter = selectedItems.length > 0;
  const selectedLabel = hasItemFilter ? `${selectedItems.length} selected` : 'All Items';

  const filteredUsers = data
    .map((user) => {
      const items = hasItemFilter
        ? user.items.filter((item) => selectedItems.includes(item.name))
        : user.items;

      const inTotal = items.reduce((sum, item) => sum + item.in, 0);
      const outTotal = items.reduce((sum, item) => sum + item.out, 0);
      const usedTotal = items.reduce((sum, item) => sum + item.used, 0);
      const netTotal = inTotal - (outTotal + usedTotal);
      const valueTotal = items.reduce((sum, item) => sum + item.marketValue, 0);

      return {
        ...user,
        items,
        in: inTotal,
        out: outTotal,
        used: usedTotal,
        net: netTotal,
        marketValue: valueTotal,
      };
    })
    .filter((user) => user.items.length > 0);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];

      if (left < right) return sortDir === 'asc' ? -1 : 1;
      if (left > right) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredUsers, sortDir, sortKey]);

  const toggleItemSelection = (itemName: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemName)) {
        return prev.filter((item) => item !== itemName);
      }
      return [...prev, itemName];
    });
    setExpandedRows({});
  };

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

        <span className="text-xs text-slate-400 uppercase tracking-[0.12em]">
          Filter Items
        </span>
        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="w-full sm:min-w-[300px] flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute z-20 mt-2 w-full sm:w-[360px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl">
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {itemOptions.map((item) => {
                  const checked = selectedItems.includes(item.name);
                  return (
                    <label
                      key={item.name}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 text-sm text-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItemSelection(item.name)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-500 truncate">{item.category}</span>
                      </div>
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
        <button
          type="button"
          onClick={() => {
            setSelectedItems([]);
            setExpandedRows({});
          }}
          className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition"
        >
          Clear
        </button>
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
              User Name <ArrowUpDown size={12} className="inline ml-1" />
            </th>
            <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('in')}>
              In <ArrowUpDown size={12} className="inline ml-1" />
            </th>
            <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('out')}>
              Out <ArrowUpDown size={12} className="inline ml-1" />
            </th>
            <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('used')}>
              Used <ArrowUpDown size={12} className="inline ml-1" />
            </th>
            <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('net')}>
              Net Qty <ArrowUpDown size={12} className="inline ml-1" />
            </th>
            <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('marketValue')}>
              Market Value <ArrowUpDown size={12} className="inline ml-1" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {sortedUsers.map((user) => {
            const rowKey = user.name;

            return (
              <React.Fragment key={rowKey}>
                <tr
                  onClick={() => toggleRow(rowKey)}
                  className="hover:bg-blue-500/[0.04] transition-colors group cursor-pointer"
                >
                  <td className="p-4 flex items-center gap-3 text-sm">
                    {expandedRows[rowKey] ? (
                      <ChevronUp size={16} className="text-blue-500" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-500" />
                    )}
                    <span className="font-medium text-slate-200 group-hover:text-white">{user.name}</span>
                  </td>
                  <td className="p-4 text-green-400 font-mono text-sm">+{user.in}</td>
                  <td className="p-4 text-red-400 font-mono text-sm">-{user.out}</td>
                  <td className="p-4 text-orange-400 font-mono text-sm">{user.used}</td>
                  <td className={`p-4 font-bold font-mono text-sm ${user.net >= 0 ? 'text-slate-100' : 'text-red-500'}`}>
                    {user.net > 0 ? `+${user.net}` : user.net}
                  </td>
                  <td className={`p-4 text-right font-mono text-sm ${user.marketValue >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {user.marketValue > 0 ? '+' : user.marketValue < 0 ? '-' : ''}${Math.abs(user.marketValue).toLocaleString()}
                  </td>
                </tr>

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
                            {user.items.map((item) => (
                              <tr key={`${user.name}-${item.name}`} className="border-b border-slate-800/30 last:border-0 hover:bg-white/[0.02]">
                                <td className="p-3 pl-12">
                                  <div className="flex items-center gap-2">
                                    <Package size={12} className="text-slate-500" />
                                    <div className="flex flex-col">
                                      <span className="text-xs text-slate-400 font-medium">{item.name}</span>
                                      <span className="text-[10px] text-slate-500">{item.category} • To: {item.loanTo} • From: {item.loanFrom}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-xs font-mono text-green-500/70">
                                  {item.in > 0 ? `+${item.in}` : ''}
                                </td>
                                <td className="p-3 text-xs font-mono text-red-500/70">
                                  {item.out > 0 ? `-${item.out}` : ''}
                                </td>
                                <td className="p-3 text-xs font-mono text-orange-500/70">
                                  {item.used > 0 ? item.used : ''}
                                </td>
                                <td className={`p-3 text-xs font-mono ${item.net >= 0 ? 'text-slate-300' : 'text-red-400'}`}>
                                  {item.net > 0 ? `+${item.net}` : item.net}
                                </td>
                                <td className={`p-3 text-xs font-mono text-right ${item.marketValue >= 0 ? 'text-green-500/80' : 'text-red-400/80'}`}>
                                  {item.marketValue > 0 ? '+' : item.marketValue < 0 ? '-' : ''}${Math.abs(item.marketValue).toLocaleString()}
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
            );
          })}
          {sortedUsers.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-sm text-slate-400">
                No users match the selected item filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

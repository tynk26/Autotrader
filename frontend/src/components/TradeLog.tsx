// FILE: web/src/components/TradeLog.tsx
import React, { useEffect, useMemo, useState } from 'react';

type Trade = {
  id: string;
  ts: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  pnl?: number;
  tag?: 'paper' | 'live' | 'sim';
  strategy?: string;
};

export default function TradeLog() {
  const [rows, setRows] = useState<Trade[]>([]);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<'all' | 'paper' | 'live' | 'sim'>('all');

  const fetchTrades = async () => {
    const res = await fetch('http://localhost:8000/api/trades');
    const j = await res.json();
    setRows(j?.trades ?? []);
  };

  useEffect(() => { fetchTrades(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const ok1 = !q || r.symbol.toLowerCase().includes(q.toLowerCase());
      const ok2 = tag === 'all' || r.tag === tag;
      return ok1 && ok2;
    });
  }, [rows, q, tag]);

  const exportCSV = () => {
    const header = 'ts,symbol,side,qty,price,pnl,tag,strategy\n';
    const body = filtered.map(r =>
      [new Date(r.ts*1000).toISOString(), r.symbol, r.side, r.qty, r.price, r.pnl ?? '', r.tag ?? '', r.strategy ?? ''].join(',')
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'trades.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-[#0f1115] border border-neutral-800 rounded">
      <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-200">Trade Log</span>
        <input
          className="ml-auto bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm"
          placeholder="Filter symbol…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value as any)}
          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm"
        >
          <option value="all">All</option>
          <option value="paper">Paper</option>
          <option value="live">Live</option>
          <option value="sim">Sim</option>
        </select>
        <button onClick={exportCSV} className="px-2 py-1 bg-sky-600 rounded text-sm">Export CSV</button>
      </div>

      <div className="flex-1 overflow-auto text-sm">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] text-xs text-[#9ca3af] px-3 py-1">
          <div>Time</div><div>Symbol</div><div>Side</div><div>Qty</div><div>Price</div><div>PnL</div>
        </div>
        {filtered.map(r => (
          <div key={r.id} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] px-3 py-1 border-t border-neutral-900">
            <div className="text-xs text-slate-400">{new Date(r.ts*1000).toLocaleString()}</div>
            <div>{r.symbol}</div>
            <div className={r.side==='BUY'?'text-green-400':'text-red-400'}>{r.side}</div>
            <div>{r.qty}</div>
            <div>{r.price.toFixed(2)}</div>
            <div className={(r.pnl??0) >= 0 ? 'text-green-400' : 'text-red-400'}>{r.pnl?.toFixed(2) ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

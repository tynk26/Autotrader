// FILE: web/src/components/AlertManager.tsx
import React, { useEffect, useState } from 'react';

type Alert = { id: string; symbol: string; type: 'vwap'|'fib'|'breakout'; enabled: boolean; params?: Record<string, any>; };

export default function AlertManager() {
  const [list, setList] = useState<Alert[]>([]);
  const [symbol, setSymbol] = useState('AAPL');
  const [type, setType] = useState<Alert['type']>('vwap');

  const load = async () => {
    const res = await fetch('http://localhost:8000/api/alerts');
    const j = await res.json(); setList(j?.alerts ?? []);
  };

  useEffect(() => { load(); }, []);

  const upsert = async () => {
    const res = await fetch('http://localhost:8000/api/alerts/upsert', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ symbol, type }),
    });
    if (res.ok) load();
  };

  const toggle = async (id: string, enabled: boolean) => {
    const res = await fetch('http://localhost:8000/api/alerts/toggle', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id, enabled }),
    });
    if (res.ok) load();
  };

  return (
    <div className="h-full flex flex-col bg-[#0f1115] border border-neutral-800 rounded">
      <div className="px-3 py-2 border-b border-neutral-800 text-sm font-semibold text-slate-200">Alerts</div>
      <div className="p-3 flex items-center gap-2 text-sm">
        <input className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1" value={symbol} onChange={(e)=>setSymbol(e.target.value.toUpperCase())}/>
        <select className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1" value={type} onChange={(e)=>setType(e.target.value as any)}>
          <option value="vwap">VWAP Cross</option>
          <option value="fib">Fib Confluence</option>
          <option value="breakout">Breakout</option>
        </select>
        <button onClick={upsert} className="px-2 py-1 bg-sky-600 rounded">Add</button>
      </div>
      <div className="flex-1 overflow-auto text-sm">
        {list.map(a => (
          <div key={a.id} className="px-3 py-2 border-t border-neutral-900 flex items-center">
            <div className="font-semibold">{a.symbol}</div>
            <div className="ml-2 text-xs text-slate-400">{a.type}</div>
            <div className="ml-auto">
              <label className="text-xs text-slate-400 mr-2">{a.enabled ? 'On' : 'Off'}</label>
              <input type="checkbox" checked={a.enabled} onChange={(e)=>toggle(a.id, e.target.checked)}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

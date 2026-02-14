// FILE: web/src/components/DepthL2.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

type L2Row = { px: number; sz: number; side: 'bid'|'ask' };

export default function DepthL2({ symbol }: { symbol: string }) {
  const [rows, setRows] = useState<L2Row[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = `ws://localhost:8000/ws/depth?symbol=${encodeURIComponent(symbol)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try { setRows(JSON.parse(ev.data) as L2Row[]); } catch {}
    };
    return () => ws.close();
  }, [symbol]);

  const bids = useMemo(() => rows.filter(r=>r.side==='bid').sort((a,b)=>b.px-a.px).slice(0,10), [rows]);
  const asks = useMemo(() => rows.filter(r=>r.side==='ask').sort((a,b)=>a.px-b.px).slice(0,10), [rows]);

  return (
    <div className="h-full bg-[#0f1115] border border-neutral-800 rounded flex">
      <div className="flex-1 p-2">
        <div className="text-xs text-slate-400 mb-1">Bids</div>
        <div className="text-sm">
          {bids.map((r,i)=>(
            <div key={i} className="flex items-center gap-2">
              <div className="w-20">{r.px.toFixed(2)}</div>
              <div className="text-green-400">{r.sz}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-2 border-l border-neutral-800">
        <div className="text-xs text-slate-400 mb-1">Asks</div>
        <div className="text-sm">
          {asks.map((r,i)=>(
            <div key={i} className="flex items-center gap-2">
              <div className="w-20">{r.px.toFixed(2)}</div>
              <div className="text-red-400">{r.sz}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

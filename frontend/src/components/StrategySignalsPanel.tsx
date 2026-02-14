// FILE: web/src/components/StrategySignalsPanel.tsx
import React, { useEffect, useRef, useState } from 'react';

type Signal = {
  id: string;
  ts: number;         // epoch seconds
  symbol: string;
  tf: string;         // e.g. 1m / 5m
  kind: string;       // e.g. vwap_cross, fib_confluence
  side?: 'long' | 'short';
  note?: string;
  score?: number;     // confidence
};

type Props = {
  onJumpTo?: (s: Signal) => void;
};

export default function StrategySignalsPanel({ onJumpTo }: Props) {
  const [items, setItems] = useState<Signal[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/signals');
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const s = JSON.parse(ev.data) as Signal;
        setItems((prev) => [s, ...prev].slice(0, 200));
      } catch {}
    };
    return () => ws.close();
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0f1115] border border-neutral-800 rounded">
      <div className="px-3 py-2 border-b border-neutral-800 text-sm font-semibold text-slate-200">
        Strategy Signals
      </div>
      <div className="flex-1 overflow-auto text-sm">
        {items.map((s) => (
          <button
            key={s.id}
            onClick={() => onJumpTo?.(s)}
            className="w-full text-left px-3 py-2 hover:bg-[#121521] border-b border-neutral-900"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{new Date(s.ts * 1000).toLocaleTimeString()}</span>
              <span className="font-semibold">{s.symbol}</span>
              <span className="text-xs bg-neutral-800 border border-neutral-700 rounded px-1">{s.tf}</span>
              <span className="text-xs bg-neutral-800 border border-neutral-700 rounded px-1">{s.kind}</span>
              {s.side && (
                <span className={`text-xs px-1 rounded ${s.side === 'long' ? 'bg-green-700' : 'bg-red-700'}`}>
                  {s.side.toUpperCase()}
                </span>
              )}
              {typeof s.score === 'number' && <span className="text-xs text-slate-400">score {s.score.toFixed(2)}</span>}
            </div>
            {s.note && <div className="text-xs text-slate-400 mt-1">{s.note}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

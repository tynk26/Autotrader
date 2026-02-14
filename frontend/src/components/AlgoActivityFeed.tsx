// FILE: web/src/components/AlgoActivityFeed.tsx
import React, { useEffect, useRef, useState } from 'react';

type LogLine = { ts: number; level: 'INFO'|'WARN'|'ERROR'|'DEBUG'; msg: string; ctx?: Record<string, any>; };

export default function AlgoActivityFeed() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/logs');
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const l = JSON.parse(ev.data) as LogLine;
        setLines(prev => [l, ...prev].slice(0, 500));
      } catch {}
    };
    return () => ws.close();
  }, []);

  const color = (lvl: LogLine['level']) =>
    lvl === 'ERROR' ? 'text-red-400' : lvl === 'WARN' ? 'text-yellow-400' : lvl === 'DEBUG' ? 'text-sky-400' : 'text-slate-300';

  return (
    <div className="h-full flex flex-col bg-[#0f1115] border border-neutral-800 rounded">
      <div className="px-3 py-2 border-b border-neutral-800 text-sm font-semibold text-slate-200">Algo Activity</div>
      <div className="flex-1 overflow-auto text-xs">
        {lines.map((l, i) => (
          <div key={i} className="px-3 py-1 border-b border-neutral-900">
            <span className="text-slate-500">{new Date(l.ts*1000).toLocaleTimeString()}</span>
            <span className={`ml-2 ${color(l.level)}`}>{l.level}</span>
            <span className="ml-2">{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

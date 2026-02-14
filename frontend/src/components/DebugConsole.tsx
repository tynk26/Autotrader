// FILE: web/src/components/DebugConsole.tsx
import React, { useEffect, useRef, useState } from "react";

export default function DebugConsole() {
  const [lines, setLines] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/stream"); // reuse tick stream for heartbeats/errors
    ws.onopen = () => setLines((p) => [`[open] connected`, ...p]);
    ws.onclose = () => setLines((p) => [`[close] disconnected`, ...p]);
    ws.onerror = (e) => setLines((p) => [`[error] ${String(e)}`, ...p]);
    ws.onmessage = (ev) => {
      try {
        const obj = JSON.parse(ev.data);
        if (obj?.type === "heartbeat")
          setLines((p) => [`[hb] ${new Date().toLocaleTimeString()}`, ...p]);
      } catch {}
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    ref.current?.scrollTo(0, 0);
  }, [lines]);

  return (
    <div className="h-full bg-[#0f1115] border border-neutral-800 rounded flex flex-col">
      <div className="px-3 py-2 border-b border-neutral-800 text-sm font-semibold text-slate-200">
        Debugging Console
      </div>
      <div ref={ref} className="flex-1 overflow-auto text-xs">
        {lines.map((l, i) => (
          <div key={i} className="px-3 py-1 border-b border-neutral-900">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

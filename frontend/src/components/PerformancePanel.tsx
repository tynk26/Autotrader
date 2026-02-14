// FILE: web/src/components/PerformancePanel.tsx
import React, { useEffect, useState } from 'react';

type Metrics = {
  pnl_day: number;
  pnl_week: number;
  pnl_month: number;
  winrate: number;    // 0..1
  avg_win: number;
  avg_loss: number;
  max_dd: number;
  equity?: { ts: number; eq: number }[];
};

export default function PerformancePanel() {
  const [m, setM] = useState<Metrics | null>(null);

  const fetchMetrics = async () => {
    const res = await fetch('http://localhost:8000/api/metrics');
    const j = await res.json();
    setM(j);
  };

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, []);

  const pos = 'text-green-400', neg = 'text-red-400';

  return (
    <div className="bg-[#0f1115] border border-neutral-800 rounded p-3">
      <div className="text-sm font-semibold text-slate-200 mb-2">Performance</div>
      {!m ? (
        <div className="text-xs text-slate-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <K label="PnL (Day)" value={m.pnl_day} cls={m.pnl_day>=0?pos:neg} />
          <K label="PnL (Week)" value={m.pnl_week} cls={m.pnl_week>=0?pos:neg} />
          <K label="PnL (Month)" value={m.pnl_month} cls={m.pnl_month>=0?pos:neg} />
          <K label="Win rate" value={`${(m.winrate*100).toFixed(1)}%`} />
          <K label="Avg Win" value={m.avg_win} cls={m.avg_win>=0?pos:neg} />
          <K label="Avg Loss" value={m.avg_loss} cls={m.avg_loss>=0?pos:neg} />
          <K label="Max DD" value={m.max_dd} cls={m.max_dd<=0?neg:pos} />
        </div>
      )}
    </div>
  );
}

function K({ label, value, cls }:{label:string; value:any; cls?:string}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded p-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-base font-semibold ${cls??''}`}>{typeof value==='number' ? value.toFixed(2) : value}</div>
    </div>
  );
}

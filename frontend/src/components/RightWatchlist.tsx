import { useEffect, useState } from 'react';
import { Snp5 } from '../data/snp5';
import type { Candle } from '../types/indicatorTypes';
import type { Timeframe } from '../lib/timeframes';

type Props = {
  active: string;
  timeframe: Timeframe;
  candles?: Candle[];
  onPick: (sym: string) => void;
};

export default function RightWatchlist({ active, timeframe, candles, onPick }: Props) {
  const [snapshots, setSnapshots] = useState<Record<string, { price: number; chg: number; chgp: number }>>({});

  useEffect(() => {
    if (!candles || candles.length < 2) return;
    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    const chg = last - first;
    const chgp = first ? (chg / first) * 100 : 0;
    setSnapshots((s) => ({ ...s, [active]: { price: last, chg, chgp } }));
  }, [candles, active, timeframe]);

  return (
  <div className="w-full h-full bg-[#0f1115] overflow-auto text-white text-sm">
    <div className="p-3 font-semibold text-base">Watchlist</div>

    {/* Header */}
    <div className="px-3 pb-2 grid grid-cols-[2.5fr_1fr_1fr_1fr] text-xs text-[#9ca3af]">
      <div className="text-center">Symbol</div>
      <div>Price</div>
      <div>Chg</div>
      <div>Chg%</div>
    </div>

    {/* Rows */}
    {Snp5.map((s) => {
      const snap = snapshots[s.symbol];
      const px = snap?.price;
      const chg = snap?.chg ?? 0;
      const chgp = snap?.chgp ?? 0;
      const color = chg >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]';

      return (
      <button
        key={s.symbol}
        onClick={() => onPick(s.symbol)}
        className={`w-full px-3 py-2 hover:bg-[#121521] ${
          active === s.symbol ? 'bg-[#121521]' : ''
        }`}
      >
        <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr] items-start">
          {/* Column 1: Symbol + Name */}
          <div className="flex flex-col">
            <div className="text-sm truncate">{s.symbol}</div>
            <div className="text-[11px] text-[#9ca3af] leading-tight truncate">{s.name}</div>
          </div>

          {/* Column 2: Price */}
          <div className="text-left text-sm">
            {px !== undefined ? px.toFixed(2) : '—'}
          </div>

          {/* Column 3: Chg */}
          <div className={`text-left text-sm ${color}`}>
            {px !== undefined ? chg.toFixed(2) : '—'}
          </div>

          {/* Column 4: Chg% */}
          <div className={`text-left text-sm ${color}`}>
            {px !== undefined ? chgp.toFixed(2) + '%' : '—'}
          </div>
        </div>
      </button>
    );
  })}
</div>
);

}

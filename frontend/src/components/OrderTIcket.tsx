// FILE: web/src/components/OrderTicket.tsx
import React, { useEffect, useMemo, useState } from "react";

type TIF = "DAY" | "GTC";
type OrderType = "MKT" | "LMT";

type Props = {
  symbol: string;
  last?: number;
  onPlaced?: (ok: boolean, msg?: string) => void;
};

export default function OrderTicket({ symbol, last, onPlaced }: Props) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState<number>(100);
  const [otype, setOtype] = useState<OrderType>("MKT");
  const [limit, setLimit] = useState<number | "">("");
  const [tif, setTif] = useState<TIF>("DAY");
  const [placing, setPlacing] = useState(false);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (last && otype === "LMT" && limit === "")
      setLimit(Number(last.toFixed(2)));
  }, [last, otype]);

  const valid = useMemo(() => {
    if (!symbol || !qty || qty <= 0) return false;
    if (otype === "LMT" && (limit === "" || Number(limit) <= 0)) return false;
    return true;
  }, [symbol, qty, otype, limit]);

  const place = async () => {
    if (!valid) return;
    setPlacing(true);
    setMsg("");
    try {
      const res = await fetch("http://localhost:8000/api/order/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side,
          qty: Number(qty),
          orderType: otype,
          limitPrice: limit === "" ? undefined : Number(limit),
          tif,
        }),
      });
      const j = await res.json();
      const ok = res.ok;
      setMsg(ok ? "✅ Order sent" : `❌ ${j?.detail || "Order failed"}`);
      onPlaced?.(ok, j?.detail);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || e}`);
      onPlaced?.(false, e?.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="p-3 bg-[#0f1115] border border-neutral-800 rounded">
      <div className="mb-2 text-sm text-slate-200 font-semibold">
        Order Ticket
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="col-span-2">
          <label className="text-xs text-slate-400">Symbol</label>
          <input
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
            value={symbol}
            disabled
            readOnly
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Side</label>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as any)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
          >
            <option>BUY</option>
            <option>SELL</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Qty</label>
          <input
            type="number"
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            min={1}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Type</label>
          <select
            value={otype}
            onChange={(e) => setOtype(e.target.value as OrderType)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
          >
            <option value="MKT">Market</option>
            <option value="LMT">Limit</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Limit</label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
            value={limit}
            onChange={(e) =>
              setLimit(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={otype !== "LMT"}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">TIF</label>
          <select
            value={tif}
            onChange={(e) => setTif(e.target.value as TIF)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
          >
            <option>DAY</option>
            <option>GTC</option>
          </select>
        </div>

        {/* 🔥 Move "Place Order" button to right of TIF */}
        <div className="flex items-end">
          <button
            onClick={place}
            disabled={!valid || placing}
            className="ml-2 px-3 py-1 bg-sky-600 disabled:bg-sky-900 rounded text-sm"
          >
            {placing ? "Placing…" : "Place Order"}
          </button>
        </div>

        {msg && <span className="text-xs ml-auto">{msg}</span>}
      </div>
    </div>
  );
}

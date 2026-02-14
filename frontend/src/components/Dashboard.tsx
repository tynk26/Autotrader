import React, {
  useState,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
} from "react";
import RGL, { Layout } from "react-grid-layout";
import { X, Maximize2, RotateCcw, Save, Edit3 } from "react-feather";
import TVChart from "./TVChart";
import RightWatchlist from "./RightWatchlist";
import OrderPanel from "./OrderPanel";
import { TopBar } from "./TopBar";
import { IBKRFeed } from "../lib/ibkrFeed";
import type { Candle } from "../types/indicatorTypes";
import type { Timeframe } from "../lib/timeframes";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import OrderTicket from "./OrderTIcket";

const WidthProvider = RGL.WidthProvider;
const GridLayout = WidthProvider(RGL) as React.ComponentType<any>;

const DEFAULT_LAYOUT: Layout[] = [
  { i: "chart_primary", x: 0, y: 0, w: 8, h: 18 },
  { i: "chart_secondary", x: 0, y: 18, w: 8, h: 12 },
  { i: "watchlist", x: 8, y: 0, w: 4, h: 16 },
  // ✅ new:
  { i: "order_ticket", x: 8, y: 16, w: 4, h: 8 },
];

const LAYOUT_KEY = "algo_dashboard_layout_v1";
const HIDDEN_KEY = "algo_dashboard_hidden_v1";

const HIGHER_TF_MAP: Partial<Record<Timeframe, Timeframe>> = {
  "1s": "5s",
  "5s": "15s",
  "15s": "30s",
  "30s": "1m",
  "1m": "5m",
  "5m": "15m",
  "15m": "30m",
  "30m": "1h",
  "1h": "4h",
  "4h": "1D",
  "1D": "1W",
  "1W": "1M",
  "1M": "1M",
};

function getNextHigherTF(tf: Timeframe): Timeframe {
  return HIGHER_TF_MAP[tf] ?? tf;
}

const Widget: React.FC<{
  title: string;
  onClose: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
  children: React.ReactNode;
}> = ({ title, onClose, onMaximize, isMaximized, children }) => {
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded h-full flex flex-col overflow-hidden">
      <div className="drag-handle flex justify-between items-center px-3 py-2 border-b border-neutral-700 cursor-move bg-neutral-800">
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMaximize}
            className="text-slate-300 hover:text-white"
            title="Maximize"
          >
            <Maximize2 size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-red-500"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default function Dashboard() {
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [secondaryTF, setSecondaryTF] = useState<Timeframe>(
    getNextHigherTF("1m"),
  );
  const [chartType, setChartType] = useState<"ohlc" | "candles">("ohlc");
  const [showVolume, setShowVolume] = useState(true);
  const [layout, setLayout] = useState<Layout[]>(() => {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || "null") as
      | Layout[]
      | null;
    const base = saved ?? DEFAULT_LAYOUT;
    const need = new Set(base.map((i) => i.i));
    const out = [...base];

    // ✅ auto-add if missing (so users don’t need to Reset layout)
    if (!need.has("order_ticket"))
      out.push({ i: "order_ticket", x: 8, y: 16, w: 4, h: 8 });

    return out;
  });

  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(
    () => JSON.parse(localStorage.getItem(HIDDEN_KEY) || "null") || [],
  );
  const [editMode, setEditMode] = useState(false);
  const [maximized, setMaximized] = useState<string | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [lastTick, setLastTick] = useState<any>(null);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerH, setHeaderH] = useState<number>(48);

  useLayoutEffect(() => {
    const compute = () => setHeaderH(headerRef.current?.clientHeight ?? 48);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const feed = useMemo(() => new IBKRFeed("ws://localhost:8000/ws/stream"), []);

  useEffect(() => {
    feed.connect((ticks) => {
      const t = ticks.find((x) => x.symbol === symbol);
      if (t) setLastTick(t);
    });
    return () => feed.close();
  }, [feed, symbol]);

  useEffect(() => {
    feed.subscribe(symbol);
    return () => feed.unsubscribe(symbol);
  }, [symbol, feed]);

  const handleLayoutChange = (l: Layout[]) => {
    setLayout(l);
  };

  const handleSymbolSelect = (s: string) => {
    setSymbol(s);
  };

  const handleClose = (id: string) => {
    setHiddenWidgets((prev) => {
      const updated = [...prev, id];
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleMaximize = (id: string) => {
    if (maximized === id) {
      window.location.reload();
      return;
    }
    setMaximized(id);
  };

  const handleSaveLayout = () => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenWidgets));
    alert("✅ Layout saved!");
  };

  const visible = (id: string) => !hiddenWidgets.includes(id);

  return (
    <div className="h-screen w-screen bg-neutral-950 text-white relative">
      {/* Toolbar Props */}
      <div
        ref={headerRef}
        className="px-4 py-2 border-b border-neutral-800 flex items-center gap-4 bg-neutral-900 z-10 relative"
      >
        <TopBar
          onSymbolSelect={setSymbol}
          timeframe={timeframe}
          chartType={chartType}
          showVolume={showVolume}
          onTimeframeChange={(tf) => {
            setTimeframe(tf as Timeframe);
            setSecondaryTF(getNextHigherTF(tf as Timeframe));
          }}
          onChartTypeChange={(t) => setChartType(t as any)}
          onVolumeToggle={() => setShowVolume((v) => !v)}
        />
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className="ml-auto px-3 py-1 text-sm bg-slate-700 rounded"
        >
          <Edit3 size={14} className="inline mr-1" />
          {editMode ? "Editing…" : "Edit"}
        </button>
        <button
          type="button"
          onClick={handleSaveLayout}
          className="px-3 py-1 text-sm bg-sky-600 rounded"
        >
          <Save size={14} className="inline mr-1" />
          Save Layout
        </button>
        <button
          type="button"
          onClick={() => {
            setLayout(DEFAULT_LAYOUT);
            setHiddenWidgets([]);
            localStorage.removeItem(LAYOUT_KEY);
            localStorage.removeItem(HIDDEN_KEY);
          }}
          className="px-3 py-1 text-sm bg-red-600 rounded"
        >
          <RotateCcw size={14} className="inline mr-1" />
          Reset
        </button>
      </div>

      {/* Fullscreen overlay */}
      {maximized && (
        <div
          className="absolute left-0 w-full z-50 bg-neutral-950"
          style={{ top: headerH, height: `calc(100vh - ${headerH}px)` }}
        >
          <Widget
            title={
              maximized === "chart_primary"
                ? `Chart • ${symbol} (${timeframe})`
                : maximized === "chart_secondary"
                  ? `Higher TF • ${symbol} (${secondaryTF})`
                  : maximized === "watchlist"
                    ? "Watchlist"
                    : maximized === "order_ticket"
                      ? "Order Ticket"
                      : "Widget"
            }
            onClose={() => handleClose(maximized)}
            onMaximize={() => handleMaximize(maximized)}
            isMaximized
          >
            {maximized === "chart_primary" && (
              <TVChart
                symbol={symbol}
                timeframe={timeframe}
                chartType={chartType}
                showVolume={showVolume}
                liveTick={lastTick}
                onCandles={setCandles}
              />
            )}

            {maximized === "chart_secondary" && (
              <TVChart
                symbol={symbol}
                timeframe={secondaryTF}
                chartType={chartType}
                showVolume={showVolume}
                liveTick={lastTick}
                onCandles={() => {}}
              />
            )}

            {maximized === "watchlist" && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-auto">
                  <RightWatchlist
                    active={symbol}
                    timeframe={timeframe}
                    candles={candles}
                    onPick={setSymbol}
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto border-t border-neutral-800">
                  <OrderPanel />
                </div>
              </div>
            )}

            {/* ✅ new: OrderTicket in overlay */}
            {maximized === "order_ticket" && (
              <div className="h-full overflow-auto p-3">
                <OrderTicket symbol={symbol} last={lastTick?.last} />
              </div>
            )}
          </Widget>
        </div>
      )}

      {/* Main layout */}
      <div className="p-3">
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={30}
          width={typeof window !== "undefined" ? window.innerWidth - 24 : 1200}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
          resizeHandles={["n", "s", "e", "w", "ne", "nw", "se", "sw"]}
        >
          {visible("chart_primary") && maximized !== "chart_primary" && (
            <div key="chart_primary">
              <Widget
                title={`Chart • ${symbol} (${timeframe})`}
                onClose={() => handleClose("chart_primary")}
                onMaximize={() => handleMaximize("chart_primary")}
                isMaximized={false}
              >
                <TVChart
                  symbol={symbol}
                  timeframe={timeframe}
                  chartType={chartType}
                  showVolume={showVolume}
                  liveTick={lastTick}
                  onCandles={setCandles}
                />
              </Widget>
            </div>
          )}

          {visible("chart_secondary") && maximized !== "chart_secondary" && (
            <div key="chart_secondary">
              <Widget
                title={`Higher TF • ${symbol} (${secondaryTF})`}
                onClose={() => handleClose("chart_secondary")}
                onMaximize={() => handleMaximize("chart_secondary")}
                isMaximized={false}
              >
                <TVChart
                  symbol={symbol}
                  timeframe={secondaryTF}
                  chartType={chartType}
                  showVolume={showVolume}
                  liveTick={lastTick}
                  onCandles={() => {}}
                />
              </Widget>
            </div>
          )}

          {visible("watchlist") && maximized !== "watchlist" && (
            <div key="watchlist">
              <Widget
                title="Watchlist"
                onClose={() => handleClose("watchlist")}
                onMaximize={() => handleMaximize("watchlist")}
                isMaximized={false}
              >
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="basis-[65%] min-h-[120px] overflow-auto">
                    <RightWatchlist
                      active={symbol}
                      timeframe={timeframe}
                      candles={candles}
                      onPick={setSymbol}
                    />
                  </div>
                  <div className="basis-[35%] min-h-[150px] overflow-y-auto border-t border-neutral-800">
                    <OrderPanel />
                  </div>
                </div>
              </Widget>
            </div>
          )}

          {visible("order_ticket") && maximized !== "order_ticket" && (
            <div key="order_ticket">
              <Widget
                title="Order Ticket"
                onClose={() => handleClose("order_ticket")}
                onMaximize={() => handleMaximize("order_ticket")}
                isMaximized={false}
              >
                {/* Last price comes from your IBKR tick stream */}
                <OrderTicket symbol={symbol} last={lastTick?.last} />
              </Widget>
            </div>
          )}
        </GridLayout>
      </div>
    </div>
  );
}

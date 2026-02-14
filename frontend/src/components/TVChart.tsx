import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  BarData,
  HistogramData,
} from 'lightweight-charts';
import type { Candle } from '../types/indicatorTypes';
import type { Timeframe } from '../lib/timeframes';
import { DrawingManager, Tool } from '../lib/drawingManager';

type ChartType = 'candles' | 'ohlc' | 'volume_candles' | 'volume_ohlc';
type CachedPayload = {
  candles: Candle[];
  volume: HistogramData[];
  stats: { firstClose?: number; last?: Candle };
};

const candleCache: Record<string, CachedPayload> = {};

type Props = {
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  showVolume: boolean;
  tool?: Tool;
  liveTick?: { symbol: string; last?: number; volume?: number; time?: number };
  onStats?: (stats: { last?: Candle; firstClose?: number }) => void;
  onCandles?: (arr: Candle[]) => void;
};

export default function TVChart({
  symbol,
  timeframe: tf,
  chartType,
  showVolume,
  tool,
  liveTick,
  onStats,
  onCandles,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement | null>(null);
  const drawingMgrRef = useRef<DrawingManager | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const barSeriesRef = useRef<ISeriesApi<'Bar'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    const key = `${symbol}_${tf}`;
    const barSizeMap: Record<string, string> = {
      '1s': '1 secs', '5s': '5 secs', '10s': '10 secs', '15s': '15 secs', '30s': '30 secs',
      '1m': '1 min', '2m': '2 mins', '3m': '3 mins', '5m': '5 mins', '10m': '10 mins',
      '15m': '15 mins', '30m': '30 mins',
      '1h': '1 hour', '2h': '2 hours', '3h': '3 hours', '4h': '4 hours',
      '1d': '1 day', '1w': '1 week', '1M': '1 month',
    };
    const durationMap: Record<string, string> = {
      '1s': '1 D', '5s': '1 D', '10s': '1 D', '15s': '1 D', '30s': '1 D',
      '1m': '1 D', '2m': '1 D', '3m': '1 D', '5m': '5 D', '10m': '5 D', '15m': '5 D', '30m': '5 D',
      '1h': '1 M', '2h': '2 M', '3h': '2 M', '4h': '2 M',
      '1d': '1 Y', '1w': '2 Y', '1M': '3 Y',
    };
    const barSize = barSizeMap[tf];
    const durationStr = durationMap[tf] || '1 D';
    if (!barSize) return;

    if (candleCache[key]) {
      const { candles, volume, stats } = candleCache[key];
      setCandles(candles);
      volumeSeriesRef.current?.setData(volume);
      onStats?.(stats);
      onCandles?.(candles);
      return;
    }

    const fetchCandles = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, durationStr, barSize, whatToShow: 'TRADES', useRTH: false }),
        });
        const json = await res.json();
        const bars = json?.bars || [];
        const mapped: Candle[] = bars.map((b: any) => ({
          time: Math.floor(new Date(b.time).getTime() / 1000),
          open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume,
        }));
        const volumeData: HistogramData[] = mapped.map((c) => ({
          time: c.time as any,
          value: c.volume,
          color: c.close >= c.open ? '#22c55e' : '#ef4444',
        }));
        const stats = { firstClose: mapped[0]?.close, last: mapped[mapped.length - 1] };

        candleCache[key] = { candles: mapped, volume: volumeData, stats };
        setCandles(mapped);
        volumeSeriesRef.current?.setData(volumeData);
        onStats?.(stats);
        onCandles?.(mapped);
      } catch (err) {
        console.error('[❌] Candle fetch failed:', err);
      }
    };

    fetchCandles();
  }, [symbol, tf]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0f1115' }, textColor: '#e5e7eb' },
      grid: { vertLines: { color: '#1f2430' }, horzLines: { color: '#1f2430' } },
      rightPriceScale: { borderColor: '#1f2430', scaleMargins: { top: 0.05, bottom: 0.25 } },
      timeScale: { borderColor: '#1f2430', timeVisible: true, secondsVisible: true },
      crosshair: { mode: CrosshairMode.Normal },
    });
    chartRef.current = chart;

    const volSeries = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'volume' });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeriesRef.current = volSeries;

    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      chartRef.current.applyOptions({ width: clientWidth, height: clientHeight });
      chartRef.current.timeScale().fitContent();
      if (overlayRef.current) {
        overlayRef.current.setAttribute('width', String(clientWidth));
        overlayRef.current.setAttribute('height', String(clientHeight));
      }
    });
    ro.observe(containerRef.current);

    if (overlayRef.current) drawingMgrRef.current = new DrawingManager(chart, overlayRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      barSeriesRef.current = null;
      volumeSeriesRef.current = null;
      drawingMgrRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const removeIf = (s: ISeriesApi<any> | null) => { if (s) chartRef.current?.removeSeries(s); };
    if (chartType === 'candles' || chartType === 'volume_candles') {
      if (!candleSeriesRef.current) {
        candleSeriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: '#22c55e', downColor: '#ef4444',
          borderUpColor: '#22c55e', borderDownColor: '#ef4444',
          wickUpColor: '#22c55e', wickDownColor: '#ef4444',
        });
      }
      if (barSeriesRef.current) { removeIf(barSeriesRef.current); barSeriesRef.current = null; }
    } else {
      if (!barSeriesRef.current) {
        barSeriesRef.current = chartRef.current.addBarSeries({ thinBars: true });
      }
      if (candleSeriesRef.current) { removeIf(candleSeriesRef.current); candleSeriesRef.current = null; }
    }
  }, [chartType]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (candleSeriesRef.current) candleSeriesRef.current.setData(candles as unknown as BarData[]);
    if (barSeriesRef.current) barSeriesRef.current.setData(candles as unknown as BarData[]);
    if (volumeSeriesRef.current) {
      if (!showVolume) {
        volumeSeriesRef.current.setData([]);
      } else {
        const key = `${symbol}_${tf}`;
        const cached = candleCache[key];
        if (cached?.volume) volumeSeriesRef.current.setData(cached.volume);
      }
    }
    chartRef.current.timeScale().fitContent();
    // onStats is called during fetch; optional here if you want live recompute
  }, [candles, showVolume]);

  useEffect(() => {
    if (!liveTick || liveTick.symbol !== symbol) return;
    const series = candleSeriesRef.current || barSeriesRef.current;
    if (!series || !candles.length || !liveTick.last) return;
    const last = candles[candles.length - 1];
    const u = { ...last, close: liveTick.last, high: Math.max(last.high, liveTick.last), low: Math.min(last.low, liveTick.last) };
    series.update(u as any);
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.update({
        time: u.time,
        value: u.volume,
        color: u.close >= u.open ? '#22c55e' : '#ef4444',
      } as any);
    }
    onStats?.({ firstClose: candles[0]?.close, last: u });
  }, [liveTick]);

  return (
    <div
      className="w-full h-full bg-[#0f1115] relative"
      onPointerDown={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        drawingMgrRef.current?.onPointerDown(e.clientX - rect.left, e.clientY - rect.top);
      }}
      onPointerMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        drawingMgrRef.current?.onPointerMove(e.clientX - rect.left, e.clientY - rect.top);
      }}
      onPointerUp={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        drawingMgrRef.current?.onPointerUp(e.clientX - rect.left, e.clientY - rect.top);
      }}
      ref={containerRef}
    >
      <svg ref={overlayRef} className="absolute inset-0 pointer-events-none" />
      {candles.length < 100 && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            background: '#facc15',
            color: '#111',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 20,
          }}
        >
          ⚠️ Incomplete intraday data
        </div>
      )}
    </div>
  );
}

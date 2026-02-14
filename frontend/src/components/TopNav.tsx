
import { useMemo } from 'react'
import type { Candle } from '../types/indicatorTypes'
import type { Timeframe } from '../lib/timeframes'
import { Snp5 } from '../data/snp5'
import { SearchIcon, BeakerIcon, BellIcon, ReplayIcon } from '../icons'

type Props = {
  symbol: string
  timeframe: Timeframe
  last?: Candle
  firstClose?: number
  chartType: 'candles'|'ohlc'|'volume_candles'|'volume_ohlc'
  showVolume: boolean
  onTimeframe: (tf: Timeframe) => void
  onChartType: (t: 'candles'|'ohlc'|'volume_candles'|'volume_ohlc') => void
  onVolume: (v: boolean) => void
  onSearch: () => void
  onIndicators: () => void
  onAlert: () => void
  onReplay: () => void
}

const ALL_TFS: Timeframe[] = [
  '1s','5s','15s','30s',
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','12h',
  '1D','1W','1M'
]

export default function TopNav(props: Props) {
  const {
    symbol, timeframe, last, firstClose, chartType, showVolume,
    onTimeframe, onChartType, onVolume, onSearch, onIndicators, onAlert, onReplay
  } = props

  const name = useMemo(() => Snp5.find(s=>s.symbol===symbol)?.name ?? symbol, [symbol])
  const title = `${name}  --  ${timeframe}`
  const ohlc = last ? `O ${last.open.toFixed(2)}  H ${last.high.toFixed(2)}  L ${last.low.toFixed(2)}  C ${last.close.toFixed(2)}` : ''
  const pnl = (last && firstClose) ? ((last.close - firstClose) / firstClose * 100) : undefined
  const pnlStr = pnl!==undefined ? `${(last!.close - firstClose!).toFixed(2)} (${pnl.toFixed(2)}%)` : ''

  return (
    <div className="w-full bg-[#0f1115] border-b border-[#1f2430] text-white">
      <div className="h-[56px] px-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-[15px] font-semibold">{title}</div>
          <div className="text-xs text-[#9ca3af]">{ohlc}</div>
          {pnl!==undefined && (
            <div className={`text-xs ${pnl>=0?'text-[#22c55e]':'text-[#ef4444]'}`}>{pnlStr}</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select className="bg-[#121521] px-2 py-1 rounded" value={timeframe} onChange={e=>onTimeframe(e.target.value as Timeframe)}>
            {ALL_TFS.map(tf => <option key={tf} value={tf}>{tf}</option>)}
          </select>
          <select className="bg-[#121521] px-2 py-1 rounded" value={chartType} onChange={e=>onChartType(e.target.value as any)}>
            <option value="candles">Candles</option>
            <option value="ohlc">OHLC Bars</option>
            <option value="volume_candles">Volume Candles</option>
            <option value="volume_ohlc">Volume OHLC</option>
          </select>
          <label className="text-xs flex items-center gap-2 bg-[#121521] px-2 py-1 rounded">
            <input type="checkbox" checked={showVolume} onChange={e=>onVolume(e.target.checked)} />
            Volume
          </label>
        </div>

        <div className="flex items-center gap-4 text-[#9ca3af]">
          <button onClick={onSearch} title="Search"><SearchIcon /></button>
          <button onClick={onIndicators} title="Indicators"><BeakerIcon /></button>
          <button onClick={onAlert} title="Alerts"><BellIcon /></button>
          <button onClick={onReplay} title="Bar Replay"><ReplayIcon /></button>
        </div>
      </div>
    </div>
  )
}
